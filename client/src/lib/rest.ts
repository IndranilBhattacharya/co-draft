// REST client for sign up, "who am I" and sign out.
// REST basics: each URL is a thing (/api/auth/me), the HTTP method says what to do
// (GET reads, POST creates or acts), and the status code says how it went (201, 401, ...).
// Auth lives here because the server sets and clears the session cookie in normal HTTP responses.
import { queryOptions } from "@tanstack/react-query";

export const API_URL = import.meta.env.VITE_API_URL;

export type User = { id: string; name: string; avatar: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: "include", // send the httpOnly session cookie to the API's origin
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const auth = {
  register: (body: { name: string; avatar: string }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
};

// TanStack Query keeps a cache of data that lives on the server. queryOptions bundles
// a cache key with the function that fetches it, so route loaders and components
// share the same cached result instead of fetching twice.
export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => request<User>("/auth/me"),
  staleTime: Infinity, // who you are doesn't change while the tab is open
  retry: false,
});
