// MongoDB collections, defined with Mongoose schemas, plus the one rule for who can open a document.
import { Schema, model, isValidObjectId, type HydratedDocument, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, required: true }, // seed for the multiavatar image
  },
  { timestamps: true },
);

export const User = model("User", userSchema);

const docSchema = new Schema(
  {
    title: { type: String, default: "Untitled" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Guests who joined through the current share link. Reset on every new link.
    members: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], index: true },
    ydoc: Buffer, // Yjs binary state: the source of truth for the content
    text: { type: String, default: "" }, // plain-text copy for previews, titles and summaries
    summary: { type: String, default: "" },
    shareToken: { type: String, unique: true, sparse: true },
    shareExpiresAt: Date,
  },
  { timestamps: true },
);

export const Doc = model("Doc", docSchema);
export type DocRecord = HydratedDocument<InferSchemaType<typeof docSchema>>;

export const isShareActive = (doc: DocRecord) => !!doc.shareExpiresAt && doc.shareExpiresAt > new Date();

// The single access rule: owners always; guests only while the share link is alive.
export function canAccess(doc: DocRecord, userId: string) {
  if (doc.owner.equals(userId)) return true;
  return isShareActive(doc) && doc.members.some((member) => member.equals(userId));
}

export async function findAccessibleDoc(id: string, userId: string) {
  if (!isValidObjectId(id)) return null;
  const doc = await Doc.findById(id);
  return doc && canAccess(doc, userId) ? doc : null;
}
