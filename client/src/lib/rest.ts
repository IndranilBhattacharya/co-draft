// REST client for sign up, "who am I" and sign out.
// REST basics: each URL is a thing (/api/auth/me), the HTTP method says what to do
// (GET reads, POST creates or acts), and the status code says how it went (201, 401, ...).
// Auth lives here because the server sets and clears the session cookie in normal HTTP responses.
import { queryOptions } from "@tanstack/react-query";

export const API_URL = import.meta.env.VITE_API_URL;

export type User = { id: string; name: string; avatar: string };

const AUTH_STORAGE_KEY = "codraft_auth";

/** Checks if this device/browser has a record of logging in. Fast 0ms local check. */
export function isLocallyAuthenticated(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Updates local session flag for instantaneous first-visit routing. */
export function setLocallyAuthenticated(status: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (status) {
      localStorage.setItem(AUTH_STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Graceful fallback for sandboxed/restricted iframe environments
  }
}

/**
 * Silently pings the backend service to wake up cold-start serverless/free tiers (e.g., Render)
 * in the background while the user selects an avatar or types their name on the registration page.
 */
let warmupInitiated = false;
export function warmupBackend(): void {
  if (warmupInitiated || typeof window === "undefined" || !API_URL) return;
  warmupInitiated = true;
  fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {
    // Silent catch — warmup is best-effort background initialization
  });
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      signal: init.signal ?? controller.signal,
      credentials: "include", // send the httpOnly session cookie to the API's origin
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        setLocallyAuthenticated(false);
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? res.statusText);
    }
    return res.status === 204 ? (undefined as T) : res.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection or try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const auth = {
  register: async (body: { name: string; avatar: string }) => {
    const user = await request<User>("/auth/register", { method: "POST", body: JSON.stringify(body) }, 15000);
    setLocallyAuthenticated(true);
    return user;
  },
  logout: async () => {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      setLocallyAuthenticated(false);
    }
  },
};

// TanStack Query keeps a cache of data that lives on the server. queryOptions bundles
// a cache key with the function that fetches it, so route loaders and components
// share the same cached result instead of fetching twice.
export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    try {
      const user = await request<User>("/auth/me");
      setLocallyAuthenticated(true);
      return user;
    } catch (err) {
      setLocallyAuthenticated(false);
      throw err;
    }
  },
  staleTime: Infinity, // who you are doesn't change while the tab is open
  retry: false,
});
