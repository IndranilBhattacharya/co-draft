// Server-Sent Events: a one-way stream from server to browser over plain HTTP.
// The browser's EventSource reconnects on its own and sends cookies like any request.
import { EventEmitter } from "node:events";
import type { RequestHandler } from "express";

import { summarize } from "./text.ts";
import { Doc, findAccessibleDoc } from "./models.ts";

type SummaryEvent = "summary" | "ended";

// A tiny in-memory message bus: one channel per document id. When a summary changes,
// we publish to that channel and every open stream for the document hears it.
// This only works while there is one server. With several servers you'd use Redis pub/sub.
const bus = new EventEmitter().setMaxListeners(0);
export const publish = (docId: string, event: SummaryEvent, data: object = {}) => bus.emit(docId, event, data);

const MIN_LENGTH = 80; // shorter than this, a summary would just repeat the text

/** Runs after each save of the document (collab.ts), then pushes the new summary to everyone watching. */
export async function updateSummary(docId: string, text: string) {
  const summary = text.trim().length < MIN_LENGTH ? "" : summarize(text);
  await Doc.updateOne({ _id: docId }, { summary }, { timestamps: false });
  publish(docId, "summary", { summary });
}

// GET /api/documents/:id/summary
// Keeps the HTTP response open and writes an event into it whenever the summary changes.
export const summaryStream: RequestHandler<{ id: string }> = async (req, res) => {
  const doc = await findAccessibleDoc(req.params.id, req.userId);
  if (!doc) {
    res.status(404).end();
    return;
  }
  const isOwner = doc.owner.equals(req.userId);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Each SSE message is plain text: "event: <name>\ndata: <json>\n\n" (the blank line ends it).
  const send = (event: SummaryEvent, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (event === "ended" && !isOwner) res.end(); // guest's access is gone
  };
  send("summary", { summary: doc.summary });

  // Lines starting with ":" are comments. Sending one now and then stops proxies
  // from closing a connection that looks idle.
  const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
  bus.on(doc.id, send);
  req.on("close", () => {
    clearInterval(ping);
    bus.off(doc.id, send);
  });
};
