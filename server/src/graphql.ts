// GraphQL API for documents: list, open, create, delete, share and join.
// There is one URL (POST /graphql) and one schema that describes every type and field.
// Each screen asks for only the fields it needs, for example:
//   home page:   documents { title preview updatedAt owner { avatar } }
//   editor page: document(id) { title createdAt owner { name } share { token expiresAt } }
// Reading is a "query", changing something is a "mutation".
import { randomBytes } from "node:crypto";
import DataLoader from "dataloader";
import type { Request } from "express";
import { GraphQLError } from "graphql";
import { createSchema, createYoga } from "graphql-yoga";
import { isValidObjectId } from "mongoose";

import { endSession } from "./collab.ts";
import { Doc, User, findAccessibleDoc, isShareActive, type DocRecord } from "./models.ts";

const SHARE_TTL = 60 * 60 * 1000; // a share link (and the session it opens) lives one hour

const typeDefs = /* GraphQL */ `
  type Query {
    "My drafts + drafts shared with me whose session is still live, newest first"
    documents: [Document!]!
    "null when the document doesn't exist or you have no access"
    document(id: ID!): Document
  }

  type Mutation {
    createDocument(title: String): Document!
    deleteDocument(id: ID!): Boolean!
    "Opens a share session: new link, fresh guest list, one-hour clock"
    startShare(id: ID!): Share!
    "Ends the session now: the link dies and guests are disconnected"
    endShare(id: ID!): Boolean!
    "Join through a share link"
    joinDocument(token: String!): Document!
  }

  type Document {
    id: ID!
    title: String!
    preview: String!
    role: Role!
    owner: Person!
    createdAt: String!
    updatedAt: String!
    "null when the document isn't shared right now"
    share: Share
  }

  type Person {
    name: String!
    avatar: String!
  }

  type Share {
    "only the owner sees the token"
    token: String
    expiresAt: String!
  }

  enum Role {
    OWNER
    GUEST
  }
`;

type Context = {
  userId: string;
  users: DataLoader<string, InstanceType<typeof User> | null>;
};

// GraphQLError messages reach the client; any other thrown error is masked as "Unexpected error."
const notFound = (message = "Document not found") => new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });

/** Filter for "this document, and only if I own it". */
function owned(id: string, userId: string) {
  if (!isValidObjectId(id)) throw notFound();
  return { _id: id, owner: userId };
}

// Resolvers are the functions that produce each field's value.
// Fields that already exist on the Mongo document (id, title) need no resolver.
// A resolver only runs when the query asks for that field.
const resolvers = {
  Query: {
    documents: (_: unknown, __: unknown, { userId }: Context) =>
      Doc.find({ $or: [{ owner: userId }, { members: userId, shareExpiresAt: { $gt: new Date() } }] })
        .select("-ydoc") // the binary content isn't needed for a list
        .sort({ updatedAt: -1 }),

    document: (_: unknown, { id }: { id: string }, { userId }: Context) => findAccessibleDoc(id, userId),
  },

  Mutation: {
    createDocument: (_: unknown, { title }: { title?: string }, { userId }: Context) =>
      Doc.create({ title: title?.trim().slice(0, 120) || "Untitled", owner: userId }),

    async deleteDocument(_: unknown, { id }: { id: string }, { userId }: Context) {
      const { deletedCount } = await Doc.deleteOne(owned(id, userId));
      if (!deletedCount) throw notFound();
      await endSession(id); // anyone still in the room is kicked out
      return true;
    },

    async startShare(_: unknown, { id }: { id: string }, { userId }: Context) {
      const doc = await Doc.findOneAndUpdate(
        owned(id, userId),
        { shareToken: randomBytes(24).toString("base64url"), shareExpiresAt: new Date(Date.now() + SHARE_TTL), members: [] },
        { returnDocument: "after", timestamps: false },
      );
      if (!doc?.shareExpiresAt) throw notFound();
      await endSession(id); // guests from the previous link are out
      setTimeout(() => endSession(id).catch(console.error), SHARE_TTL);
      return { token: doc.shareToken, expiresAt: doc.shareExpiresAt.toISOString() };
    },

    async endShare(_: unknown, { id }: { id: string }, { userId }: Context) {
      const doc = await Doc.findOneAndUpdate(
        owned(id, userId),
        { $unset: { shareToken: 1, shareExpiresAt: 1 }, members: [] },
        { timestamps: false },
      );
      if (!doc) throw notFound();
      await endSession(id);
      return true;
    },

    async joinDocument(_: unknown, { token }: { token: string }, { userId }: Context) {
      const doc = await Doc.findOne({ shareToken: token, shareExpiresAt: { $gt: new Date() } });
      if (!doc) throw notFound("This link has expired or the session has ended");
      if (!doc.owner.equals(userId)) await doc.updateOne({ $addToSet: { members: userId } });
      return doc;
    },
  },

  Document: {
    preview: (doc: DocRecord) => doc.text.slice(0, 400),
    role: (doc: DocRecord, _: unknown, { userId }: Context) => (doc.owner.equals(userId) ? "OWNER" : "GUEST"),
    // Without the DataLoader, 20 cards would mean 20 separate user lookups (the "N+1 problem").
    // With it, all 20 ids are collected and fetched in one query.
    owner: (doc: DocRecord, _: unknown, { users }: Context) => users.load(doc.owner.toString()),
    createdAt: (doc: DocRecord) => doc.createdAt.toISOString(),
    updatedAt: (doc: DocRecord) => doc.updatedAt.toISOString(),
    share: (doc: DocRecord, _: unknown, { userId }: Context) =>
      isShareActive(doc)
        ? { token: doc.owner.equals(userId) ? doc.shareToken : null, expiresAt: doc.shareExpiresAt?.toISOString() }
        : null,
  },
};

type ServerContext = { req: Request }; // what Express hands to Yoga

export const yoga = createYoga<ServerContext, Context>({
  schema: createSchema<ServerContext & Context>({ typeDefs, resolvers }),
  // A new context is made for every request. requireAuth has already put the user id on req.
  // The DataLoader collects every users.load(id) made during this request, then runs one query.
  context: ({ req }) => ({
    userId: req.userId,
    users: new DataLoader(async (ids: readonly string[]) => {
      const found = await User.find({ _id: { $in: ids } });
      return ids.map((id) => found.find((user) => user.id === id) ?? null);
    }),
  }),
  cors: false, // the app-wide cors() middleware already handles it
  graphiql: false, // its CDN scripts are blocked by helmet's CSP; the e2e test shows example queries
});
