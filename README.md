# CoDraft

Instant collaborative drafting. No clutter, no passwords: pick an avatar and a name, write alone or share a link and write together in real time.

A small MERN-style app built to learn how a modern React + Node project is put together, and to use the five main ways a browser talks to a backend.

## Stack (one tool per job)

| Job | Choice | Why this one |
| --- | --- | --- |
| UI | React 19 + Vite + TypeScript | The default React setup today |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility classes; copy-in components you own |
| Routing | TanStack Router (file-based) | Type-safe links/params, loaders, search params validated with zod |
| Server state | TanStack Query | Caching, refetching and mutations for anything that lives in the DB |
| Client state | Zustand | Tiny global store for live room state (people, pointers, status) |
| Forms | react-hook-form + zod | Uncontrolled inputs, schema validation |
| Editor | Tiptap + Yjs | Rich text on ProseMirror; Yjs CRDT merges everyone's edits without conflicts |
| API | Express 5 on Node 24+ | Runs `.ts` directly (type stripping), no build step |
| Database | MongoDB + Mongoose | The "M" in MERN; free Atlas tier |
| Security | helmet, cors, httpOnly JWT cookie, express-rate-limit, zod | See "Auth and security" |
| Titles and summaries | Plain TypeScript ([server/src/text.ts](server/src/text.ts)) | Extractive: free, offline, instant, no model to host |

## The five ways the browser talks to the server

| Protocol | Used for | Server | Client |
| --- | --- | --- | --- |
| **REST** (one URL per resource, HTTP verbs, status codes) | Auth: sign up, who am I, sign out | [server/src/auth.ts](server/src/auth.ts) | [client/src/lib/rest.ts](client/src/lib/rest.ts) |
| **GraphQL** (one endpoint, typed schema, client picks the fields) | Documents: list, open, create, delete, share, join | [server/src/graphql.ts](server/src/graphql.ts) | [client/src/lib/graphql.ts](client/src/lib/graphql.ts) |
| **gRPC** (typed RPC from a `.proto` contract) | "Suggest title" | [proto/codraft/v1/title.proto](proto/codraft/v1/title.proto), [server/src/rpc.ts](server/src/rpc.ts) | [client/src/lib/rpc.ts](client/src/lib/rpc.ts) |
| **WebSocket** (two-way, live) | Document sync, carets, mouse pointers, who's here | [server/src/collab.ts](server/src/collab.ts) | [client/src/hooks/useCollab.ts](client/src/hooks/useCollab.ts) |
| **Server-Sent Events** (server → browser stream) | Live summary | [server/src/summary.ts](server/src/summary.ts) | [client/src/hooks/useSummary.ts](client/src/hooks/useSummary.ts) |

When to reach for which:

- **REST** by default. Simple, cacheable, every tool understands it. Auth lives here because cookies are set and cleared by plain HTTP responses.
- **GraphQL** when several screens need different shapes of the same connected data. Here the home page asks for `documents { title preview owner { avatar } }` and the editor asks for `document(id) { createdAt owner { name } share { token } }`: two shapes, one schema, no new endpoint per screen. Concepts shown: schema, queries vs mutations, field resolvers, per-request context, `GraphQLError`, and a DataLoader that fixes the N+1 problem. Costs: a schema to maintain, and no free HTTP caching.
- A real app this size would usually pick just one of REST or GraphQL. Both are here so you can compare them side by side.
- **gRPC** when both sides should share a strict, versioned contract. Common between backend services; here it runs in the browser through [Connect](https://connectrpc.com), because browsers can't speak raw gRPC (it needs HTTP/2 trailers). After editing the `.proto`, run `npm run gen:proto`.
- **WebSocket** when both sides talk constantly.
- **SSE** when only the server talks. Plain HTTP, and the browser reconnects by itself.

[server/test/e2e.test.ts](server/test/e2e.test.ts) drives all five from Node and is the quickest way to see each one used end to end.

## How a share session works

1. The owner clicks **Share**: the server creates a random token valid for 1 hour and clears the previous guest list.
2. A guest opens `/join/<token>`. If they're not signed in, they sign up first and come straight back.
3. Everyone in the room gets their own color for caret and mouse pointer; presence, carets and pointers stream over the socket.
4. **End session**, or the hour running out, kills the link. The server disconnects every guest's socket and closes their summary stream. Guests lose access; the owner keeps the draft.

## Auth and security

How sign-up works, step by step:

1. The browser posts `{ name, avatar }` to `POST /api/auth/register`.
2. The server validates it with zod, creates a `User` in MongoDB, and signs a JWT whose `sub` (subject) is that user's id.
3. The JWT goes back in a `Set-Cookie` header as `codraft_session`. The browser stores it and sends it with every later request.
4. Every protected route runs `requireAuth`: verify the JWT's signature with `JWT_SECRET`, read the user id, carry on. A forged or expired token fails verification.

This is the same session layer every web app has. A password, Google sign-in or magic link only changes step 2 (how you prove who you are before the cookie is issued). Here there is nothing to prove, so the account belongs to whichever browser holds the cookie.

- **Cookie flags**: `httpOnly` (JavaScript can't read it, so XSS can't steal it), `secure` (HTTPS only in production), `SameSite=Lax`.
- **Why Lax works across subdomains**: `codraft.indranildev.in` and `codraft-backend.indranildev.in` are different *origins* but the same *site* (`indranildev.in`). Lax cookies are sent on same-site requests, so `fetch(..., { credentials: "include" })` from the frontend carries the cookie, while other websites can't.
- **CORS** allows exactly `CLIENT_ORIGIN` with credentials. **Origin check** blocks state-changing requests from any other origin, including sibling subdomains. Socket.IO checks the origin too, because CORS doesn't cover WebSocket upgrades.
- **One auth function** (`userIdFromCookies`) is reused by REST, GraphQL, SSE, gRPC and the socket handshake.
- **Injection**: there is no SQL. For MongoDB, every input is validated by zod or typed by the GraphQL schema, and Express 5's query parser can't build objects, so nobody can sneak `{ "$gt": "" }` into a query. React escapes all text it renders, and avatars are rendered as `<img>` rather than injected SVG.
- **Also in place**: owner-only GraphQL mutations (`{ _id, owner: userId }` filters), helmet headers, a rate limit per IP on everything (plus a stricter one on sign-up), GraphQL error masking (no stack traces leak), `npm audit` clean.
- **No passwords** means signing out (or clearing cookies) loses that account. That's the trade-off for zero-friction onboarding.

## Run locally

Requires Node 24+ and a MongoDB database. Easiest: create the free Atlas cluster from the deploy section now and use it for both (a different database name keeps dev data apart).

```bash
npm install
cp server/.env.example server/.env        # fill in MONGO_URI and JWT_SECRET (see comments inside)
cp client/.env.example client/.env.local
npm run dev:server                        # http://localhost:4000
npm run dev:client                        # http://localhost:5173 (second terminal)
```

For the local `MONGO_URI`, use the Atlas string with `/codraft-dev` as the database name, or `mongodb://127.0.0.1:27017/codraft` if you run MongoDB yourself (for example `docker run -p 27017:27017 mongo`).

To try collaboration alone: open the app in a normal window and a private window (two separate cookies, so two users), share from one, paste the link into the other.

Checks: `npm run typecheck`, `npm run lint`, `npm test` (the e2e test starts its own in-memory MongoDB).

## Deploy (free tiers)

| Piece | Host | Settings |
| --- | --- | --- |
| Database | MongoDB Atlas M0 | Database user + password; Network Access `0.0.0.0/0` (Render's free tier has no fixed IP) |
| API | Render web service | Repo root; build `npm ci --omit=dev`, start `npm start -w server`; env from `server/.env.example` with `NODE_ENV=production`, `CLIENT_ORIGIN=https://codraft.indranildev.in`, `NODE_VERSION=24`, a fresh `JWT_SECRET`; custom domain `codraft-backend.indranildev.in` |
| Frontend | Cloudflare Pages | Build `npm ci && npm run build`, output `client/dist`, env `VITE_API_URL=https://codraft-backend.indranildev.in`, `NODE_VERSION=24`, `MONGOMS_DISABLE_POSTINSTALL=1` (skips the test-only MongoDB download); custom domain `codraft.indranildev.in` |

DNS: one CNAME per subdomain, pointing at the host each platform gives you. Both platforms issue HTTPS certificates automatically. Pages serves `index.html` for unknown paths, so deep links like `/documents/…` work.

Free-tier limits worth knowing: Render's instance sleeps after 15 idle minutes (the first request after that takes ~30-60s) and has 512 MB RAM; Atlas M0 holds 512 MB of data.

## Layout

```
proto/       .proto contract (source of truth for gRPC)
server/src/  index.ts (app wiring) · auth.ts (REST) · graphql.ts · rpc.ts (gRPC)
             collab.ts (WebSocket) · summary.ts (SSE) · text.ts · models.ts · env.ts
client/src/  routes/ (pages, file-based) · components/ · hooks/ (useCollab = WebSocket, useSummary = SSE)
             lib/ (rest, graphql, rpc = gRPC, utils) · store/ (zustand)
```
