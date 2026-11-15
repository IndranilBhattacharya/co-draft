// REST: plain request/response over HTTP. One URL per resource, the HTTP verb says what to do.
// (Reading a single document with its owner goes through GraphQL instead, see graphql.ts.)
import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";

import { endSession } from "./collab.ts";
import { Doc } from "./models.ts";
import { summaryStream } from "./summary.ts";

const SHARE_TTL = 60 * 60 * 1000; // a share link (and the session it opens) lives one hour

export const documentsRouter = Router();

// List: my drafts + drafts shared with me whose session is still live.
documentsRouter.get("/", async (req, res) => {
  const docs = await Doc.find({
    $or: [{ owner: req.userId }, { members: req.userId, shareExpiresAt: { $gt: new Date() } }],
  })
    .sort({ updatedAt: -1 })
    .select("title text owner updatedAt");

  res.json(
    docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      preview: doc.text.slice(0, 400),
      updatedAt: doc.updatedAt,
      role: doc.owner.equals(req.userId) ? "owner" : "guest",
    })),
  );
});

const createBody = z.object({ title: z.string().trim().max(120).optional() });

documentsRouter.post("/", async (req, res) => {
  const { title } = createBody.parse(req.body ?? {});
  const doc = await Doc.create({ title: title || "Untitled", owner: req.userId });
  res.status(201).json({ id: doc.id });
});

// Join through a share link. Declared before "/:id" routes so "join" is never read as an id.
documentsRouter.post("/join/:token", async (req, res) => {
  const doc = await Doc.findOne({ shareToken: req.params.token, shareExpiresAt: { $gt: new Date() } });
  if (!doc) {
    res.status(404).json({ error: "This link has expired or the session has ended" });
    return;
  }
  if (!doc.owner.equals(req.userId)) await doc.updateOne({ $addToSet: { members: req.userId } });
  res.json({ id: doc.id });
});

documentsRouter.get("/:id/summary", summaryStream); // Server-Sent Events, see summary.ts

documentsRouter.delete("/:id", async (req, res) => {
  const { deletedCount } = await Doc.deleteOne({ _id: req.params.id, owner: req.userId });
  if (deletedCount) await endSession(req.params.id);
  res.status(deletedCount ? 204 : 404).end();
});

// Start a session: new link, fresh guest list, one-hour clock.
documentsRouter.post("/:id/share", async (req, res) => {
  const shareExpiresAt = new Date(Date.now() + SHARE_TTL);
  const doc = await Doc.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { shareToken: randomBytes(24).toString("base64url"), shareExpiresAt, members: [] },
    { returnDocument: "after", timestamps: false },
  );
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  await endSession(doc.id); // guests from the previous link are out
  setTimeout(() => endSession(doc.id).catch(console.error), SHARE_TTL);
  res.status(201).json({ token: doc.shareToken, expiresAt: shareExpiresAt });
});

// End the session now: the link dies and guests are disconnected.
documentsRouter.delete("/:id/share", async (req, res) => {
  const doc = await Doc.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $unset: { shareToken: 1, shareExpiresAt: 1 }, members: [] },
    { timestamps: false },
  );
  if (doc) await endSession(doc.id);
  res.status(doc ? 204 : 404).end();
});
