// Zustand: client state that isn't in the database. Here it's the live room —
// who's here, where their mouse is, connection status. It changes many times a
// second and is read by components far apart (header, editor, side panel), so a
// tiny global store with selectors beats prop drilling or React context re-renders.
import { create } from "zustand";

export type Person = { id: string; name: string; avatar: string; color: string };
export type Pointer = { id: string; name: string; color: string; x: number; y: number };
export type Status = "connecting" | "live" | "offline" | "ended";

type RoomState = {
  status: Status;
  color: string; // my caret color, assigned by the server
  people: Person[];
  pointers: Record<string, Pointer>;
};

export const initialRoom: RoomState = { status: "connecting", color: "", people: [], pointers: {} };

// Components subscribe to slices: useRoom((s) => s.people) re-renders only when people change.
export const useRoom = create<RoomState>()(() => initialRoom);
