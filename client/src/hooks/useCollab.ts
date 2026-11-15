// WebSocket (Socket.IO) + Yjs: keeps this tab's copy of the document in sync with the room.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import * as Y from "yjs";

import { API_URL } from "@/lib/api";
import { initialRoom, useRoom, type Person } from "@/store/room";

// Mirrors the typed events in server/src/collab.ts.
type Point = { x: number; y: number };
interface ServerToClient {
  init: (data: { update: ArrayBuffer; stateVector: ArrayBuffer; awareness: ArrayBuffer; color: string }) => void;
  "doc:update": (update: ArrayBuffer) => void;
  awareness: (update: ArrayBuffer) => void;
  presence: (people: Person[]) => void;
  pointer: (pointer: { id: string; name: string; color: string; pos: Point | null }) => void;
  "session:ended": () => void;
}
interface ClientToServer {
  "doc:update": (update: Uint8Array) => void;
  awareness: (update: Uint8Array) => void;
  pointer: (pos: Point | null) => void;
}

const REMOTE = "remote"; // origin tag for changes that arrived over the network, so we don't echo them back

export function useCollab(docId: string, userName: string) {
  const [ydoc] = useState(() => new Y.Doc());
  const [awareness] = useState(() => new Awareness(ydoc)); // carets and selections of others
  const socketRef = useRef<Socket<ServerToClient, ClientToServer>>(null);

  useEffect(() => {
    useRoom.setState(initialRoom);
    const socket: Socket<ServerToClient, ClientToServer> = io(API_URL, {
      withCredentials: true, // send the session cookie with the handshake
      auth: { docId, clientId: ydoc.clientID },
    });
    socketRef.current = socket;
    let synced = false;

    socket.on("init", ({ update, stateVector, awareness: peers, color }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), REMOTE);
      applyAwarenessUpdate(awareness, new Uint8Array(peers), REMOTE);
      // Send back whatever the server is missing (edits made while we were offline).
      socket.emit("doc:update", Y.encodeStateAsUpdate(ydoc, new Uint8Array(stateVector)));
      synced = true;
      awareness.setLocalStateField("user", { name: userName, color });
      useRoom.setState({ status: "live", color });
    });
    socket.on("doc:update", (update) => Y.applyUpdate(ydoc, new Uint8Array(update), REMOTE));
    socket.on("awareness", (update) => applyAwarenessUpdate(awareness, new Uint8Array(update), REMOTE));
    socket.on("presence", (people) => useRoom.setState({ people }));
    socket.on("pointer", ({ id, name, color, pos }) =>
      useRoom.setState(({ pointers }) => {
        const next = { ...pointers };
        if (pos) next[id] = { id, name, color, ...pos };
        else delete next[id];
        return { pointers: next };
      }),
    );
    socket.on("session:ended", () => useRoom.setState({ status: "ended" }));
    socket.on("disconnect", () => {
      synced = false;
      useRoom.setState(({ status }) => ({ status: status === "ended" ? status : "offline", pointers: {} }));
    });
    // The handshake is re-checked on every reconnect; "forbidden" means access is gone.
    socket.on("connect_error", (error) =>
      useRoom.setState({ status: error.message === "forbidden" ? "ended" : "offline" }),
    );

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (synced && origin !== REMOTE) socket.emit("doc:update", update);
    };
    type Changes = { added: number[]; updated: number[]; removed: number[] };
    const onAwarenessUpdate = ({ added, updated, removed }: Changes, origin: unknown) => {
      if (synced && origin === "local") {
        socket.emit("awareness", encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed]));
      }
    };
    ydoc.on("update", onDocUpdate);
    awareness.on("update", onAwarenessUpdate);

    return () => {
      ydoc.off("update", onDocUpdate);
      awareness.off("update", onAwarenessUpdate);
      socket.disconnect();
    };
  }, [docId, userName, ydoc, awareness]);

  // volatile: if the connection is busy, skip this mouse position instead of queueing it.
  const sendPointer = useCallback((pos: Point | null) => socketRef.current?.volatile.emit("pointer", pos), []);

  return { ydoc, awareness, sendPointer };
}

/** The title lives in the shared Yjs doc too, so every editor sees it change as it's typed. */
export function useSharedTitle(ydoc: Y.Doc) {
  const meta = ydoc.getMap<string>("meta");
  const subscribe = useCallback(
    (onChange: () => void) => {
      meta.observe(onChange);
      return () => meta.unobserve(onChange);
    },
    [meta],
  );
  const title = useSyncExternalStore(subscribe, () => meta.get("title") ?? "");
  const setTitle = useCallback((value: string) => meta.set("title", value), [meta]);
  return [title, setTitle] as const;
}
