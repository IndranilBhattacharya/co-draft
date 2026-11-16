// WebSocket (Socket.IO): the always-open, two-way connection used for live editing.
//
// The document content is a Yjs document. Every browser keeps its own copy, and each
// edit is sent as a small binary "update". Yjs is built so updates can arrive in any
// order and still end up with the same result on every screen, so two people typing
// at once never overwrite each other. The server keeps one copy per open document
// (a "room"), forwards updates to everyone else in the room, and saves to MongoDB.
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";

import { userIdFromCookies } from "./auth.ts";
import { env } from "./env.ts";
import { Doc, User, canAccess, findAccessibleDoc } from "./models.ts";
import { publish, updateSummary } from "./summary.ts";

// Typed events. The client mirrors these in client/src/hooks/useCollab.ts.
type Point = { x: number; y: number };
type Person = { id: string; name: string; avatar: string; color: string };
interface ClientToServer {
  "doc:update": (update: Uint8Array) => void;
  awareness: (update: Uint8Array) => void;
  pointer: (pos: Point | null) => void;
}
interface ServerToClient {
  init: (data: { update: Uint8Array; stateVector: Uint8Array; awareness: Uint8Array; color: string }) => void;
  "doc:update": (update: Uint8Array) => void;
  awareness: (update: Uint8Array) => void;
  presence: (people: Person[]) => void;
  pointer: (pointer: { id: string; name: string; color: string; pos: Point | null }) => void;
  "session:ended": () => void;
}
interface SocketData {
  user: Omit<Person, "color">;
  docId: string;
  clientId: number; // the client's Yjs id, so its caret can be removed on disconnect
  color: string;
}

type Room = { ydoc: Y.Doc; awareness: Awareness; text: string; saveTimer?: NodeJS.Timeout };

const COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6"];
// We store the loading Promise, not the room itself, so two people opening the same
// document at the same moment wait for one database load instead of starting two.
const rooms = new Map<string, Promise<Room>>();
let io: Server<ClientToServer, ServerToClient, object, SocketData>;

/** Plain text out of the Yjs XML tree that Tiptap writes into. */
function plainText(node: Y.XmlFragment | Y.XmlElement): string {
  return node
    .toArray()
    .map((child) =>
      child instanceof Y.XmlText
        ? child
            .toDelta()
            .map((op: { insert: unknown }) => (typeof op.insert === "string" ? op.insert : ""))
            .join("")
        : plainText(child as Y.XmlElement),
    )
    .join("\n");
}

const contentText = (room: Room) => plainText(room.ydoc.getXmlFragment("content"));

function getRoom(docId: string) {
  let room = rooms.get(docId);
  if (!room) {
    room = loadRoom(docId);
    rooms.set(docId, room);
  }
  return room;
}

async function loadRoom(docId: string): Promise<Room> {
  const doc = await Doc.findById(docId);
  const ydoc = new Y.Doc();
  if (doc?.ydoc) Y.applyUpdate(ydoc, doc.ydoc);
  const meta = ydoc.getMap<string>("meta");
  if (!meta.has("title")) meta.set("title", doc?.title ?? "Untitled");

  const awareness = new Awareness(ydoc);
  awareness.setLocalState(null); // the server is not a participant
  const room: Room = { ydoc, awareness, text: doc?.text ?? "" };

  // "origin" is the id of the socket that made the change. Send it to everyone else in the room.
  const roomExcept = (origin: unknown) =>
    typeof origin === "string" ? io.to(docId).except(origin) : io.to(docId);

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    roomExcept(origin).emit("doc:update", update);
    clearTimeout(room.saveTimer);
    room.saveTimer = setTimeout(() => saveRoom(docId, room).catch(console.error), 2000);
  });
  awareness.on("update", ({ added, updated, removed }: Record<string, number[]>, origin: unknown) => {
    roomExcept(origin).emit("awareness", encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed]));
  });
  return room;
}

async function saveRoom(docId: string, room: Room) {
  clearTimeout(room.saveTimer);
  const text = contentText(room);
  await Doc.updateOne(
    { _id: docId },
    {
      ydoc: Buffer.from(Y.encodeStateAsUpdate(room.ydoc)),
      text,
      title: room.ydoc.getMap<string>("meta").get("title")?.trim() || "Untitled",
    },
  );
  if (text !== room.text) {
    room.text = text;
    await updateSummary(docId, text);
  }
}

async function pickColor(docId: string) {
  const used = new Set((await io.in(docId).fetchSockets()).map((s) => s.data.color));
  return COLORS.find((color) => !used.has(color)) ?? COLORS[Math.floor(Math.random() * COLORS.length)];
}

async function broadcastPresence(docId: string) {
  const sockets = await io.in(docId).fetchSockets();
  // Keyed by user id: the same person in two tabs shows up once.
  const people = new Map(sockets.map((s) => [s.data.user.id, { ...s.data.user, color: s.data.color }]));
  io.to(docId).emit("presence", [...people.values()]);
}

const isBinary = (value: unknown): value is Uint8Array => value instanceof Uint8Array;
const isPoint = (value: unknown): value is Point =>
  typeof value === "object" &&
  value !== null &&
  Number.isFinite((value as Point).x) &&
  Number.isFinite((value as Point).y);

export function attachCollab(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
    // CORS doesn't apply to WebSocket upgrades, so check the Origin ourselves.
    allowRequest: (req, callback) => callback(null, req.headers.origin === env.CLIENT_ORIGIN),
  });

  // Handshake middleware: authenticate once per connection, using the same session cookie.
  io.use(async (socket, next) => {
    const userId = userIdFromCookies(socket.handshake.headers.cookie);
    const { docId, clientId } = socket.handshake.auth;
    if (!userId || !Number.isInteger(clientId)) return next(new Error("unauthorized"));

    const [user, doc] = await Promise.all([User.findById(userId), findAccessibleDoc(String(docId), userId)]);
    if (!user || !doc) return next(new Error("forbidden"));

    socket.data = { user: { id: user.id, name: user.name, avatar: user.avatar }, docId: doc.id, clientId, color: "" };
    next();
  });

  io.on("connection", async (socket) => {
    const { docId, clientId, user } = socket.data;
    const room = await getRoom(docId);
    socket.data.color = await pickColor(docId);
    await socket.join(docId);

    socket.on("doc:update", (update) => {
      if (!isBinary(update)) return;
      try {
        Y.applyUpdate(room.ydoc, update, socket.id);
      } catch {
        socket.disconnect(true); // malformed update
      }
    });

    socket.on("awareness", (update) => {
      if (!isBinary(update)) return;
      try {
        applyAwarenessUpdate(room.awareness, update, socket.id);
      } catch {
        socket.disconnect(true);
      }
    });

    // volatile: if the connection is busy, drop this mouse position instead of queueing it.
    // A newer one is coming a few milliseconds later anyway.
    socket.on("pointer", (pos) => {
      if (pos !== null && !isPoint(pos)) return;
      socket.volatile.to(docId).emit("pointer", { id: socket.id, name: user.name, color: socket.data.color, pos });
    });

    socket.on("disconnect", async () => {
      removeAwarenessStates(room.awareness, [clientId], "server");
      io.to(docId).emit("pointer", { id: socket.id, name: user.name, color: socket.data.color, pos: null });
      await broadcastPresence(docId);

      // Last one out saves and frees the memory.
      if (io.sockets.adapter.rooms.get(docId)?.size) return;
      await saveRoom(docId, room);
      if (!io.sockets.adapter.rooms.get(docId)?.size) {
        rooms.delete(docId);
        room.ydoc.destroy();
      }
    });

    // First sync: send the full document plus a "state vector" (a summary of what we have).
    // The client replies with any edits we don't have yet, e.g. typed while it was offline.
    socket.emit("init", {
      update: Y.encodeStateAsUpdate(room.ydoc),
      stateVector: Y.encodeStateVector(room.ydoc),
      awareness: encodeAwarenessUpdate(room.awareness, [...room.awareness.getStates().keys()]),
      color: socket.data.color,
    });
    await broadcastPresence(docId);
  });
}

/** Disconnects everyone who lost access: share link ended or expired, or the doc was deleted. */
export async function endSession(docId: string) {
  const doc = await Doc.findById(docId);
  for (const socket of await io.in(docId).fetchSockets()) {
    if (doc && canAccess(doc, socket.data.user.id)) continue;
    socket.emit("session:ended");
    socket.disconnect(true);
  }
  publish(docId, "ended");
}

/** Live text if someone has the doc open (fresher than the last save). */
export async function readLiveText(docId: string) {
  const room = await rooms.get(docId);
  return room && contentText(room);
}

/** Writes the title into the live doc so every open editor updates instantly. */
export async function writeTitle(docId: string, title: string) {
  const room = await rooms.get(docId);
  if (room) room.ydoc.getMap<string>("meta").set("title", title);
  else await Doc.updateOne({ _id: docId }, { title });
}
