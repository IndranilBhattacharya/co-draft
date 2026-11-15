import { z } from "zod";

// Validate env once at startup: a missing secret should crash on boot, not on the first request.
export const env = z
  .object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGO_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    CLIENT_ORIGIN: z.url(),
  })
  .parse(process.env);

export const isProd = env.NODE_ENV === "production";
