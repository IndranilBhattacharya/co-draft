import { createServer } from "node:http";
import { expressConnectMiddleware } from "@connectrpc/connect-express";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { ZodError } from "zod";

import { authRouter, requireAuth } from "./auth.ts";
import { attachCollab } from "./collab.ts";
import { documentsRouter } from "./documents.ts";
import { env } from "./env.ts";
import { yoga } from "./graphql.ts";
import rpcRoutes from "./rpc.ts";

const app = express();

app.set("trust proxy", 1); // TLS ends at the host's proxy (Render); trust its X-Forwarded-* headers
app.use(helmet()); // secure response headers
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true })); // only our frontend may read responses, with cookies

// CSRF defense in depth: SameSite=Lax already blocks other *sites*; this also
// blocks sibling subdomains from sending state-changing requests.
app.use((req, res, next) => {
  const safe = ["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (safe || req.headers.origin === env.CLIENT_ORIGIN) return next();
  res.status(403).json({ error: "Origin not allowed" });
});

app.get("/health", (_req, res) => {
  res.send("ok");
});
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300 })); // per IP; stops floods and brute force

// gRPC (Connect) and GraphQL (Yoga) read the raw request body themselves,
// so they are mounted before express.json().
app.use(expressConnectMiddleware({ routes: rpcRoutes }));
app.use(yoga.graphqlEndpoint, requireAuth, (req, res) => yoga(req, res)); // POST /graphql

app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", authRouter);
app.use("/api/documents", requireAuth, documentsRouter);

// Express 5 forwards errors thrown in async handlers here.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? "Invalid input" });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
app.use(errorHandler);

const server = createServer(app);
attachCollab(server); // Socket.IO shares the same port and HTTP server

await mongoose.connect(env.MONGO_URI);
server.listen(env.PORT, () => console.log(`CoDraft API listening on :${env.PORT}`));
