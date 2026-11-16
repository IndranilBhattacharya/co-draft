<div align="center">

# CoDraft

**Instant collaboration. No clutter. Just draft and go.**

A high-performance, real-time collaborative document editor engineered with modern full-stack web standards. Write alone or share a 1-click link to draft together in real time with live presence, conflict-free CRDT synchronization, markdown syntax, and vector PDF export.

[![Live App](https://img.shields.io/badge/Live_App-codraft.indranildev.in-09090b?style=for-the-badge&logo=cloudflarepages&logoColor=white)](https://codraft.indranildev.in)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

<img src="client/public/og-image.png" alt="CoDraft Preview" width="100%" style="border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);" />

</div>

---

## ✨ Highlights & Capabilities

- **⚡ Real-Time Collaborative CRDTs**: Powered by [Yjs](https://yjs.dev) and [Tiptap](https://tiptap.dev) on ProseMirror. Merges simultaneous edits deterministically with zero conflict resolution prompts.
- **🎯 Live Presence & Caret Awareness**: Colored remote cursors, mouse pointers, and active facepile avatars display real-time collaborator focus.
- **🎨 Modern Dark Mode Figma Design System**: Framed in a sleek obsidian aesthetic with translucent glass surfaces, subtle hover scrollbars, and deterministic animated background beams.
- **⌨️ Comprehensive Markdown Syntax**: Type natural markdown shortcuts (`#`, `##`, `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `> quote`, `- list`, `---`) or format with the embedded top toolbar. Includes a built-in formatting cheat sheet.
- **📄 1-Click Vector PDF Export**: Built on the native browser vector print pipeline with dedicated `@media print` typography. Zero external dependencies, zero memory leaks, and 100% vulnerability-free.
- **📱 100% Responsive Experience**: Fluid responsive layout featuring a slide-over drawer on mobile and persistent sidebar on desktop. No horizontal scrollbars.
- **🔒 Zero-Friction Authentication**: No passwords or forced oauth gates: personal sessions persist securely in `httpOnly`, `SameSite=Lax` cookies with MongoDB Atlas persistence.

---

## 🏛️ The Five Web Protocols in One Architecture

CoDraft serves as a real-world reference implementation showcasing the **five primary communication protocols** between modern browsers and Node.js backends:

| Protocol | Purpose in CoDraft | Client Layer | Server Layer |
| :--- | :--- | :--- | :--- |
| **REST** | Session registration, profile resolution (`/api/auth/register`, `/api/auth/me`), sign-out | [client/src/lib/rest.ts](client/src/lib/rest.ts) | [server/src/auth.ts](server/src/auth.ts) |
| **GraphQL** | Document lifecycle: listings, detail queries, owner share mutations, delete operations | [client/src/lib/graphql.ts](client/src/lib/graphql.ts) | [server/src/graphql.ts](server/src/graphql.ts) |
| **gRPC / Connect** | Strict schema-contracted RPC: Algorithmic draft title generation from document content | [client/src/lib/rpc.ts](client/src/lib/rpc.ts) | [server/src/rpc.ts](server/src/rpc.ts) |
| **WebSocket** | High-frequency bidirectional streaming: Yjs document updates, live caret presence, mouse pointers | [client/src/hooks/useCollab.ts](client/src/hooks/useCollab.ts) | [server/src/collab.ts](server/src/collab.ts) |
| **Server-Sent Events (SSE)** | One-way streaming: Live document summary extraction as the draft evolves | [client/src/hooks/useSummary.ts](client/src/hooks/useSummary.ts) | [server/src/summary.ts](server/src/summary.ts) |

### Protocol Design Decisions
- **REST**: Chosen for authentication where HTTP response headers natively issue and clear secure `Set-Cookie` tokens.
- **GraphQL**: Eliminates over-fetching. The dashboard fetches shallow cards (`{ title, preview, owner }`), while the workspace fetches comprehensive metadata (`{ createdAt, shareToken, role }`) using a unified schema backed by DataLoaders to prevent $N+1$ query bottlenecks.
- **gRPC (Connect-Web)**: Delivers type-safe contracts generated from Protobuf definitions ([proto/codraft/v1/title.proto](proto/codraft/v1/title.proto)).
- **WebSocket (Socket.IO)**: Low-latency full-duplex communication essential for fluid remote caret tracking and CRDT delta synchronization.
- **SSE (EventSource)**: Ideal for unidirectional server-to-client updates. Built-in browser reconnection mechanisms handle network interruptions automatically.

---

## 🛠️ Technology Stack

```
co-draft/
├── client/              # React 19 Frontend (Vite, TypeScript, Tailwind CSS v4)
│   ├── public/          # Favicon, Web App Manifest, Open Graph assets
│   ├── src/
│   │   ├── components/  # Editor, SidePanel, Header, UI widgets
│   │   ├── hooks/       # useCollab (WebSocket), useSummary (SSE)
│   │   ├── routes/      # TanStack Router file-based route tree
│   │   ├── store/       # Zustand live room state
│   │   └── lib/         # GraphQL, REST, Connect-RPC clients
├── server/              # Node.js 24+ Backend (Express 5, MongoDB, Socket.IO)
│   ├── src/
│   │   ├── auth.ts      # REST session controller
│   │   ├── collab.ts    # WebSocket Yjs & presence synchronization
│   │   ├── graphql.ts   # GraphQL schema, resolvers & DataLoader
│   │   ├── rpc.ts       # Connect-RPC implementation
│   │   └── summary.ts   # SSE live summary pipeline
└── proto/               # Protobuf service contracts
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v24.0.0 or higher
- **MongoDB**: Local instance (e.g. `mongodb://127.0.0.1:27017/codraft`) or free [MongoDB Atlas M0](https://www.mongodb.com/atlas) cluster

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/IndranilBhattacharya/co-draft.git
   cd co-draft
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # Server environment
   cp server/.env.example server/.env
   # Edit server/.env with your MONGO_URI and a random JWT_SECRET

   # Client environment
   cp client/.env.example client/.env.local
   ```

4. **Start the local development servers**:
   ```bash
   # Terminal 1: Backend API (runs on http://localhost:4000)
   npm run dev:server

   # Terminal 2: Frontend Client (runs on http://localhost:5173)
   npm run dev:client
   ```

5. **Test collaboration locally**:
   Open [http://localhost:5173](http://localhost:5173) in your primary browser and an Incognito/Private window. Create a draft, click **Share**, and paste the link into the private window to watch live simultaneous editing with custom carets!

### Validation & Quality Checks

```bash
# Typecheck both workspaces
npm run typecheck

# Lint client code
npm run lint

# Execute End-to-End integration test suite (in-memory MongoDB)
npm test
```

---

## ☁️ Deployment Architecture

CoDraft is configured for zero-cost deployment across modern cloud platforms:

| Component | Platform | Configuration | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Cloudflare Pages](https://pages.cloudflare.com) | Build: `npm ci && npm run build`<br/>Output: `client/dist`<br/>Env: `VITE_API_URL=https://codraft-backend.indranildev.in` | Edge-cached static assets with automated SPA fallback routing |
| **Backend API** | [Render](https://render.com) | Build: `npm ci --omit=dev`<br/>Start: `npm start -w server`<br/>Env: `CLIENT_ORIGIN=https://codraft.indranildev.in` | Node.js 24 web service with persistent WebSocket & SSE connections |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Tier: M0 Sandbox<br/>Network: `0.0.0.0/0` | Managed cloud document store |

### Domain & Cross-Origin Security
- Both subdomains (`codraft.indranildev.in` and `codraft-backend.indranildev.in`) share the same root site, enabling secure `SameSite=Lax` cookie transmission without third-party cookie restrictions.
- Strict CORS rules enforce credentials, while explicit origin verification safeguards WebSocket handshakes against cross-site hijacking.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">
  <sub>Crafted with precision by <strong>Indranil Bhattacharya</strong></sub>
</div>
