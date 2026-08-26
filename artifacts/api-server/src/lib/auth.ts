import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

const SESSION_COOKIE = "oralia_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const SECRET = (() => {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (IS_PRODUCTION) {
    throw new Error("SESSION_SECRET (min 16 chars) is required in production");
  }
  logger.warn("SESSION_SECRET not set — using an ephemeral dev secret; sessions reset on restart");
  return randomBytes(32).toString("hex");
})();

// ---------------------------------------------------------------------------
// Password hashing (scrypt, node built-in — no external dependency)
// ---------------------------------------------------------------------------

const SCRYPT_N = 16384;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: SCRYPT_N }).toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

/**
 * Verifies a password against a stored hash. Legacy plaintext rows (from the
 * placeholder-auth era) compare directly and should be re-hashed on success.
 */
export function verifyPassword(password: string, stored: string): { valid: boolean; needsRehash: boolean } {
  if (stored.startsWith("scrypt$")) {
    const [, nStr, salt, expected] = stored.split("$");
    if (!nStr || !salt || !expected) return { valid: false, needsRehash: false };
    const actual = scryptSync(password, salt, 64, { N: parseInt(nStr, 10) }).toString("hex");
    const valid =
      actual.length === expected.length &&
      timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
    return { valid, needsRehash: false };
  }
  // Legacy plaintext row.
  const valid =
    stored.length === password.length &&
    timingSafeEqual(Buffer.from(stored), Buffer.from(password));
  return { valid, needsRehash: valid };
}

// ---------------------------------------------------------------------------
// Stateless signed sessions
// ---------------------------------------------------------------------------

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(userId: number): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  const [userIdStr, expiresStr] = payload.split(".");
  const userId = parseInt(userIdStr ?? "", 10);
  const expiresAt = parseInt(expiresStr ?? "", 10);
  if (!Number.isFinite(userId) || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  return userId;
}

export function setSessionCookie(res: Response, userId: number): void {
  res.cookie(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

// ---------------------------------------------------------------------------
// Middleware & user resolution
// ---------------------------------------------------------------------------

/** Populates res.locals.userId from the session cookie when present. */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const userId = verifySessionToken(cookies[SESSION_COOKIE]);
  if (userId !== null) res.locals.userId = userId;
  next();
}

/**
 * Resolves the authenticated user id. Outside production, falls back to the
 * first (seeded demo) user so local development keeps working without login.
 * Sends 401 and returns null when unauthenticated.
 */
export async function requireUserId(_req: Request, res: Response): Promise<number | null> {
  const fromSession = res.locals.userId as number | undefined;
  if (typeof fromSession === "number") return fromSession;
  if (!IS_PRODUCTION) {
    const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
    if (user) return user.id;
  }
  res.status(401).json({ error: "Not authenticated" });
  return null;
}

// ---------------------------------------------------------------------------
// One-time tokens (password reset, email verification)
// ---------------------------------------------------------------------------

import { createHash } from "node:crypto";
import { authTokensTable } from "@workspace/db";
import { and, eq, isNull, gt } from "drizzle-orm";

export type OneTimeTokenType = "password_reset" | "email_verify";

const TOKEN_TTL: Record<OneTimeTokenType, number> = {
  password_reset: 60 * 60 * 1000, // 1 hour
  email_verify: 24 * 60 * 60 * 1000, // 24 hours
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Issues a one-time token; only its hash is persisted. */
export async function issueToken(userId: number, type: OneTimeTokenType): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(authTokensTable).values({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TOKEN_TTL[type]),
  });
  return raw;
}

/** Consumes a token exactly once; returns the owning userId or null. */
export async function consumeToken(raw: string, type: OneTimeTokenType): Promise<number | null> {
  if (!raw || raw.length > 128) return null;
  const [row] = await db
    .update(authTokensTable)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokensTable.tokenHash, hashToken(raw)),
        eq(authTokensTable.type, type),
        isNull(authTokensTable.usedAt),
        gt(authTokensTable.expiresAt, new Date()),
      ),
    )
    .returning();
  return row?.userId ?? null;
}

// ---------------------------------------------------------------------------
// Minimal in-memory rate limiter (per-IP, for auth endpoints)
// ---------------------------------------------------------------------------

const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.path}:${req.ip ?? "unknown"}`;
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now > entry.resetAt) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (entry.count >= maxAttempts) {
      res.status(429).json({ error: "Too many attempts — try again later" });
      return;
    }
    entry.count += 1;
    next();
  };
}
