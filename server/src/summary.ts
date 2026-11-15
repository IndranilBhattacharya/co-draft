// Server-Sent Events: a one-way stream from server to browser over plain HTTP.
// The browser's EventSource reconnects on its own and sends cookies like any request.
import { EventEmitter } from "node:events";
import type { RequestHandler } from "express";

import { summarize } from "./text.ts";
import { Doc, findAccessibleDoc } from "./models.ts";

type SummaryEvent = "summary" | "ended";

// In-process pub/sub: one channel per document id.
// ponytail: single server instance; use Redis pub/sub if you ever run several.
const bus = new EventEmitter().setMaxListeners(0);
export const publish = (docId: string, event: SummaryEvent, data: object = {}) => bus.emit(docId, event, data);

const MIN_LENGTH = 80; // shorter than this, a summary would just repeat the text

/** Called after each save (already debounced by collab.ts), then pushed to every open stream. */
export async function updateSummary(docId: string, text: string) {
  const summary = text.trim().length < MIN_LENGTH ? "" : summarize(text);
  await Doc.updateOne({ _id: docId }, { summary }, { timestamps: false });
  publish(docId, "summary", { summary });
}

// GET /api/documents/:id/summary
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

  // Wire format: "event: <name>\ndata: <text>\n\n"
  const send = (event: SummaryEvent, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (event === "ended" && !isOwner) res.end(); // guest's access is gone
  };
  send("summary", { summary: doc.summary });

  // Comment lines keep proxies from closing an idle connection.
  const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
  bus.on(doc.id, send);
  req.on("close", () => {
    clearInterval(ping);
    bus.off(doc.id, send);
  });
};
