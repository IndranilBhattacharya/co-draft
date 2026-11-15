// One end-to-end walk through all five protocols: REST, GraphQL, WebSocket, gRPC, SSE.
// Runs the real server against an in-memory MongoDB. `npm test` from the repo root.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { MongoMemoryServer } from "mongodb-memory-server";
import { io } from "socket.io-client";
import * as Y from "yjs";

import { TitleService } from "../src/gen/codraft/v1/title_pb.ts";

const ORIGIN = "http://localhost:5173";
const PORT = 4555;
const API = `http://localhost:${PORT}`;

let mongo: MongoMemoryServer;
let server: ReturnType<typeof spawn>;

before(async () => {
  mongo = await MongoMemoryServer.create();
  server = spawn(process.execPath, [fileURLToPath(new URL("../src/index.ts", import.meta.url))], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGO_URI: mongo.getUri(),
      JWT_SECRET: "test-secret-test-secret-test-secret!",
      CLIENT_ORIGIN: ORIGIN,
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise<void>((resolve, reject) => {
    server.stdout?.on("data", (d) => String(d).includes("listening") && resolve());
    server.on("exit", (code) => reject(new Error(`Server exited early (code ${code})`)));
  });
});

after(async () => {
  server.kill();
  await mongo.stop();
});

async function waitFor(condition: () => boolean, ms = 15_000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > ms) throw new Error("Timed out waiting");
    await sleep(50);
  }
}

// --- REST helpers ---------------------------------------------------------
const rest = (cookie: string, path: string, init: RequestInit = {}) =>
  fetch(`${API}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: cookie },
  });

async function register(name: string) {
  const res = await rest("", "/auth/register", { method: "POST", body: JSON.stringify({ name, avatar: "seed-1" }) });
  assert.equal(res.status, 201);
  return res.headers.getSetCookie()[0].split(";")[0]; // "codraft_session=..."
}

// --- WebSocket helper: the same wiring the browser does in useCollab ------
function joinRoom(cookie: string, docId: string) {
  const ydoc = new Y.Doc();
  const socket = io(API, {
    transports: ["websocket"],
    auth: { docId, clientId: ydoc.clientID },
    extraHeaders: { cookie, origin: ORIGIN },
  });
  const state = { people: [] as { name: string }[], ended: false };
  socket.on("init", ({ update, stateVector }) => {
    Y.applyUpdate(ydoc, new Uint8Array(update), "server");
    socket.emit("doc:update", Y.encodeStateAsUpdate(ydoc, new Uint8Array(stateVector)));
  });
  socket.on("doc:update", (update) => Y.applyUpdate(ydoc, new Uint8Array(update), "server"));
  socket.on("presence", (people) => (state.people = people));
  socket.on("session:ended", () => (state.ended = true));
  ydoc.on("update", (update, origin) => origin !== "server" && socket.emit("doc:update", update));
  return { ydoc, socket, state };
}

// --- GraphQL helper: one POST, the query says which fields come back -----
async function documentById(cookie: string, id: string) {
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: cookie },
    body: JSON.stringify({
      query: "query ($id: ID!) { document(id: $id) { role owner { name } share { token } } }",
      variables: { id },
    }),
  });
  return (await res.json()).data.document;
}

const textOf = (ydoc: Y.Doc) => ydoc.getXmlFragment("content").toString();

test("REST + GraphQL + WebSocket + gRPC + SSE", async () => {
  const alice = await register("Alice");
  const bob = await register("Bob");

  // REST: auth and CSRF guards
  assert.equal((await rest("", "/auth/me")).status, 401);
  assert.equal((await rest(alice, "/auth/me")).status, 200);
  const badOrigin = await fetch(`${API}/api/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil.example", Cookie: alice },
  });
  assert.equal(badOrigin.status, 403);

  // REST: create, then share with Bob
  const { id } = await (await rest(alice, "/documents", { method: "POST", body: "{}" })).json();
  assert.equal(await documentById(bob, id), null, "not shared yet");
  const { token } = await (await rest(alice, `/documents/${id}/share`, { method: "POST" })).json();
  assert.equal((await (await rest(bob, `/documents/join/${token}`, { method: "POST" })).json()).id, id);

  // GraphQL: nested owner resolved; the token is hidden from guests
  assert.deepEqual(await documentById(bob, id), { role: "GUEST", owner: { name: "Alice" }, share: { token: null } });
  assert.equal((await documentById(alice, id)).share.token, token);

  // SSE: Alice listens for summaries
  const sse = await fetch(`${API}/api/documents/${id}/summary`, { headers: { Cookie: alice } });
  const reader = sse.body!.pipeThrough(new TextDecoderStream()).getReader();
  let events = "";
  void (async () => {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) events += chunk.value;
  })();

  // WebSocket: both join; Alice types, Bob sees it
  const a = joinRoom(alice, id);
  const b = joinRoom(bob, id);
  await waitFor(() => a.state.people.length === 2 && b.state.people.length === 2);

  const paragraph = new Y.XmlElement("paragraph");
  paragraph.insert(0, [new Y.XmlText("Weekly sync notes. We agreed to ship the collaborative editor first, then share links, then live summaries.")]);
  a.ydoc.getXmlFragment("content").insert(0, [paragraph]);
  await waitFor(() => textOf(b.ydoc).includes("Weekly sync notes"));

  // gRPC: Alice asks for a title; it lands in Bob's live doc too
  const titles = createClient(TitleService, createConnectTransport({ baseUrl: API, httpVersion: "1.1", useBinaryFormat: true }));
  const { title } = await titles.suggestTitle({ documentId: id }, { headers: { cookie: alice, origin: ORIGIN } });
  assert.match(title, /^Weekly sync notes/);
  await waitFor(() => b.ydoc.getMap("meta").get("title") === title);

  // SSE: the summary arrives after the next save (2s debounce)
  await waitFor(() => events.includes("event: summary") && events.includes("Weekly sync"), 20_000);

  // Ending the session kicks the guest and revokes access
  assert.equal((await rest(alice, `/documents/${id}/share`, { method: "DELETE" })).status, 204);
  await waitFor(() => b.state.ended);
  assert.equal(await documentById(bob, id), null);
  assert.equal(a.socket.connected, true, "owner stays");

  a.socket.disconnect();
  b.socket.disconnect();
  await reader.cancel();
});
