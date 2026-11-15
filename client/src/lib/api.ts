// REST + GraphQL clients and the TanStack Query definitions that use them.
// Server state (anything that lives in the database) goes through TanStack Query,
// which caches it, dedupes requests and refetches when it goes stale.
import { queryOptions } from "@tanstack/react-query";

export const API_URL = import.meta.env.VITE_API_URL;

export type User = { id: string; name: string; avatar: string };
export type DocumentItem = { id: string; title: string; preview: string; updatedAt: string; role: "owner" | "guest" };

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

const post = <T>(path: string, body?: object) =>
  request<T>(path, { method: "POST", body: body && JSON.stringify(body) });

export const api = {
  register: (body: { name: string; avatar: string }) => post<User>("/auth/register", body),
  logout: () => post<void>("/auth/logout"),
  createDocument: (title?: string) => post<{ id: string }>("/documents", { title }),
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  startShare: (id: string) => post<{ token: string; expiresAt: string }>(`/documents/${id}/share`),
  endShare: (id: string) => request<void>(`/documents/${id}/share`, { method: "DELETE" }),
  join: (token: string) => post<{ id: string }>(`/documents/join/${token}`),
};

// queryOptions = key + fetcher in one object, shared by route loaders and components.
export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => request<User>("/auth/me"),
  staleTime: Infinity, // who you are doesn't change while the tab is open
  retry: false,
});

export const documentsQuery = queryOptions({
  queryKey: ["documents"],
  queryFn: () => request<DocumentItem[]>("/documents"),
});

// GraphQL: always a POST of { query, variables } to one endpoint. The response mirrors the query.
// ponytail: plain fetch, no Apollo/urql; add one if you need a normalized cache or codegen.
async function graphql<T>(query: string, variables: object): Promise<T> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(body.errors?.[0]?.message ?? body.error ?? res.statusText);
  return body.data;
}

const DOCUMENT_QUERY = /* GraphQL */ `
  query Document($id: ID!) {
    document(id: $id) {
      id
      title
      role
      createdAt
      owner { name avatar }
      share { token expiresAt }
    }
  }
`;

// Typed by hand to match the query above.
export type DocumentDetail = {
  id: string;
  title: string;
  role: "OWNER" | "GUEST";
  createdAt: string;
  owner: { name: string; avatar: string };
  share: { token: string | null; expiresAt: string } | null;
};

export const documentQuery = (id: string) =>
  queryOptions({
    queryKey: ["documents", id],
    queryFn: async () => {
      const { document } = await graphql<{ document: DocumentDetail | null }>(DOCUMENT_QUERY, { id });
      if (!document) throw new Error("Document not found");
      return document;
    },
    retry: false,
  });
