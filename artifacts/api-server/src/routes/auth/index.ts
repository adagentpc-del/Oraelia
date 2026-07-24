import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireUserId,
  rateLimit,
} from "../../lib/auth";

const router: IRouter = Router();

const authLimiter = rateLimit(10, 15 * 60 * 1000);

router.post("/auth/register", authLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name: parsed.data.name,
    email: parsed.data.email,
    password: hashPassword(parsed.data.password),
  }).returning();

  setSessionCookie(res, user!.id);
  res.status(201).json({ id: user!.id, name: user!.name, email: user!.email });
});

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const check = verifyPassword(parsed.data.password, user.password);
  if (!check.valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  // Transparently upgrade legacy plaintext rows to scrypt on successful login.
  if (check.needsRehash) {
    await db.update(usersTable)
      .set({ password: hashPassword(parsed.data.password) })
      .where(eq(usersTable.id, user.id));
  }

  setSessionCookie(res, user.id);
  res.json({ id: user.id, name: user.name, email: user.email });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

export default router;
