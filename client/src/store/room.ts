// Zustand store for the live room: who is here, where their mouse is, and whether
// we are connected. None of this is saved in the database, so it doesn't belong in
// TanStack Query. It changes many times a second and is read by the header, the
// editor and the side panel, so a small global store is simpler than passing props down.
import { create } from "zustand";

export type Person = { id: string; name: string; avatar: string; color: string };
type Pointer = { id: string; name: string; color: string; x: number; y: number };
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
