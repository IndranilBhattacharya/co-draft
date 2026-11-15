import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "5 minutes ago", "yesterday" — no date library needed. */
export function timeAgo(date: string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const match = UNITS.find(([, size]) => Math.abs(seconds) >= size);
  return match ? relative.format(Math.round(seconds / match[1]), match[0]) : "just now";
}

export const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
