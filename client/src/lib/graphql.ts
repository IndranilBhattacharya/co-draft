// GraphQL client for everything about documents.
// Every call is a POST of { query, variables } to one URL (/graphql), and the answer
// comes back in exactly the shape the query asked for. Reading is a "query",
// changing something is a "mutation". Plain fetch is enough here; libraries like
// Apollo add a shared cache and code generation that this app doesn't need.
import { queryOptions } from "@tanstack/react-query";

import { API_URL } from "@/lib/rest";

async function graphql<T>(query: string, variables: object = {}): Promise<T> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  // GraphQL puts its errors in an `errors` array, usually with status 200.
  // If we never reached GraphQL (for example 401, not signed in) the body has `error` instead.
  if (!res.ok || body.errors) throw new Error(body.errors?.[0]?.message ?? body.error ?? res.statusText);
  return body.data;
}

// Types written by hand to match each query below.
type Role = "OWNER" | "GUEST";
type Person = { name: string; avatar: string };
export type DocumentItem = { id: string; title: string; preview: string; updatedAt: string; role: Role; owner: Person };
export type DocumentDetail = {
  id: string;
  title: string;
  role: Role;
  createdAt: string;
  owner: Person;
  share: { token: string | null; expiresAt: string } | null;
};

// Home page: only the fields a card shows.
export const documentsQuery = queryOptions({
  queryKey: ["documents"],
  queryFn: async () => {
    const data = await graphql<{ documents: DocumentItem[] }>(/* GraphQL */ `
      query Documents {
        documents { id title preview updatedAt role owner { name avatar } }
      }
    `);
    return data.documents;
  },
});

// Editor page: different fields of the same Document type, still one request.
export const documentQuery = (id: string) =>
  queryOptions({
    queryKey: ["documents", id],
    queryFn: async () => {
      const data = await graphql<{ document: DocumentDetail | null }>(
        /* GraphQL */ `
          query Document($id: ID!) {
            document(id: $id) { id title role createdAt owner { name avatar } share { token expiresAt } }
          }
        `,
        { id },
      );
      if (!data.document) throw new Error("Document not found");
      return data.document;
    },
    retry: false,
  });

export const documents = {
  create: async (title: string) => {
    const data = await graphql<{ createDocument: { id: string } }>(
      `mutation CreateDocument($title: String) { createDocument(title: $title) { id } }`,
      { title },
    );
    return data.createDocument;
  },
  remove: (id: string) => graphql(`mutation DeleteDocument($id: ID!) { deleteDocument(id: $id) }`, { id }),
  startShare: async (id: string) => {
    const data = await graphql<{ startShare: { token: string } }>(
      `mutation StartShare($id: ID!) { startShare(id: $id) { token } }`,
      { id },
    );
    return data.startShare;
  },
  endShare: (id: string) => graphql(`mutation EndShare($id: ID!) { endShare(id: $id) }`, { id }),
  join: async (token: string) => {
    const data = await graphql<{ joinDocument: { id: string } }>(
      `mutation JoinDocument($token: String!) { joinDocument(token: $token) { id } }`,
      { token },
    );
    return data.joinDocument;
  },
};
