import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins Tailwind class names and lets later classes win over earlier ones. */
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

/** Turns a date into "5 minutes ago" or "yesterday" using the browser's built-in Intl API. */
export function timeAgo(date: string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const match = UNITS.find(([, size]) => Math.abs(seconds) >= size);
  return match ? relative.format(Math.round(seconds / match[1]), match[0]) : "just now";
}

export const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
