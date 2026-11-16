// Sign up, "who am I" and sign out (REST), plus the helpers that check the session cookie.
// There is no password: signing up creates a user and gives this browser a signed cookie.
// Later requests prove who they are by sending that cookie back.
import { Router, type CookieOptions, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { env, isProd } from "./env.ts";
import { User } from "./models.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string; // set by requireAuth
    }
  }
}

const COOKIE_NAME = "codraft_session";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// The session is a signed JWT inside an httpOnly cookie:
// - httpOnly: page JavaScript (and any XSS) can't read it
// - secure:   only sent over HTTPS (browsers allow http://localhost in dev)
// - sameSite: "lax": not sent on cross-SITE requests. codraft.indranildev.in and
//   codraft-backend.indranildev.in are the same site, so our own calls still carry it.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: THIRTY_DAYS,
  path: "/",
};

/** Reads the user id from a raw Cookie header. Shared by REST, SSE, gRPC and Socket.IO. */
export function userIdFromCookies(cookieHeader: string | undefined): string | null {
  const token = cookieHeader ? parseCookie(cookieHeader)[COOKIE_NAME] : undefined;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    return sub ?? null;
  } catch {
    return null; // expired or tampered
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const userId = userIdFromCookies(req.headers.cookie);
  if (!userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  req.userId = userId;
  next();
};

const registerBody = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(32),
  avatar: z.string().regex(/^[\w-]{1,64}$/, "Invalid avatar"),
});

const toUserDto = (user: { id: string; name: string; avatar: string }) => ({
  id: user.id,
  name: user.name,
  avatar: user.avatar,
});

export const authRouter = Router();

authRouter.post("/register", rateLimit({ windowMs: 60 * 60 * 1000, limit: 20 }), async (req, res) => {
  const user = await User.create(registerBody.parse(req.body));
  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: "30d" });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json(toUserDto(user));
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.json(toUserDto(user));
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).end();
});
