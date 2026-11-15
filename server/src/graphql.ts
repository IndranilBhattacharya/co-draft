// GraphQL: one endpoint, a typed schema, and the client picks the fields it needs.
// Shines when a screen needs related data in one shape: here, the editor asks for a
// document plus its owner and share session in a single round trip.
import type { Request } from "express";
import { createSchema, createYoga } from "graphql-yoga";

import { findAccessibleDoc, isShareActive, User, type DocRecord } from "./models.ts";

type Context = { req: Request }; // Yoga passes Express's req through; requireAuth set req.userId

const typeDefs = /* GraphQL */ `
  type Query {
    "null when the document doesn't exist or you have no access"
    document(id: ID!): Document
  }

  type Document {
    id: ID!
    title: String!
    role: Role!
    owner: Person!
    createdAt: String!
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

// Resolvers: one function per field that isn't a plain property of the parent object.
// A field only runs if the query asks for it, so `owner` costs a DB call only when requested.
const resolvers = {
  Query: {
    document: (_: unknown, { id }: { id: string }, { req }: Context) => findAccessibleDoc(id, req.userId),
  },
  Document: {
    role: (doc: DocRecord, _: unknown, { req }: Context) => (doc.owner.equals(req.userId) ? "OWNER" : "GUEST"),
    owner: (doc: DocRecord) => User.findById(doc.owner),
    createdAt: (doc: DocRecord) => doc.createdAt.toISOString(),
    share: (doc: DocRecord, _: unknown, { req }: Context) =>
      isShareActive(doc)
        ? { token: doc.owner.equals(req.userId) ? doc.shareToken : null, expiresAt: doc.shareExpiresAt?.toISOString() }
        : null,
  },
};

// Yoga masks errors by default: a crash in a resolver reaches the client as "Unexpected error."
export const yoga = createYoga<Context>({
  schema: createSchema<Context>({ typeDefs, resolvers }),
  cors: false, // the app-wide cors() middleware already handles it
  graphiql: false, // its CDN scripts are blocked by helmet's CSP; try queries with curl or the e2e test
});
