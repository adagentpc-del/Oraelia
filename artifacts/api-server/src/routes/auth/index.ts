import { Router, type IRouter } from "express";
import { eq, and, isNull } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireUserId,
  rateLimit,
  issueToken,
  consumeToken,
} from "../../lib/auth";
import { sendEmail } from "../../lib/email";
import { botScreen } from "../../middlewares/security";

const router: IRouter = Router();

const authLimiter = rateLimit(10, 15 * 60 * 1000);
const resetLimiter = rateLimit(5, 15 * 60 * 1000);

router.post("/auth/register", authLimiter, botScreen, async (req, res): Promise<void> => {
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

  // Fire-and-forget email verification (dev adapter logs instead of sending).
  const verifyToken = await issueToken(user!.id, "email_verify");
  void sendEmail({
    to: user!.email,
    subject: "Verify your Oralia account",
    text: `Welcome to Oralia. Verify your email by opening:\n\n${process.env.APP_BASE_URL ?? "http://localhost:5000"}/api/auth/verify-email?token=${verifyToken}\n\nThis link expires in 24 hours.`,
  });

  setSessionCookie(res, user!.id);
  res.status(201).json({ id: user!.id, name: user!.name, email: user!.email, emailVerified: false });
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
  res.json({ id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerifiedAt !== null });
});

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/** Always responds 200 to avoid revealing which emails exist. */
router.post("/auth/forgot-password", resetLimiter, async (req, res): Promise<void> => {
  const email = typeof (req.body as Record<string, unknown>)?.email === "string"
    ? String((req.body as Record<string, unknown>).email).trim().toLowerCase()
    : "";
  if (email) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (user) {
      const token = await issueToken(user.id, "password_reset");
      void sendEmail({
        to: user.email,
        subject: "Reset your Oralia password",
        text: `A password reset was requested for this account.\n\nReset token (expires in 1 hour):\n${token}\n\nUse it at ${process.env.APP_BASE_URL ?? "http://localhost:5000"}/auth (Reset Password), or ignore this email if you didn't request it.`,
      });
    }
  }
  res.json({ message: "If that email is registered, a reset link has been sent." });
});

router.post("/auth/reset-password", resetLimiter, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!token || newPassword.length < 8) {
    res.status(400).json({ error: "Provide { token, newPassword } with at least 8 characters" });
    return;
  }
  const userId = await consumeToken(token, "password_reset");
  if (userId === null) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  await db.update(usersTable)
    .set({ password: hashPassword(newPassword) })
    .where(eq(usersTable.id, userId));
  // A password reset also proves control of the email inbox.
  await db.update(usersTable)
    .set({ emailVerifiedAt: new Date() })
    .where(and(eq(usersTable.id, userId), isNull(usersTable.emailVerifiedAt)));
  setSessionCookie(res, userId);
  res.json({ message: "Password updated" });
});

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

router.post("/auth/send-verification", authLimiter, async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (user.emailVerifiedAt) {
    res.json({ message: "Email already verified" });
    return;
  }
  const token = await issueToken(user.id, "email_verify");
  void sendEmail({
    to: user.email,
    subject: "Verify your Oralia account",
    text: `Verify your email by opening:\n\n${process.env.APP_BASE_URL ?? "http://localhost:5000"}/api/auth/verify-email?token=${token}\n\nThis link expires in 24 hours.`,
  });
  res.json({ message: "Verification email sent" });
});

router.get("/auth/verify-email", async (req, res): Promise<void> => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const userId = await consumeToken(token, "email_verify");
  if (userId === null) {
    res.status(400).json({ error: "Invalid or expired verification link" });
    return;
  }
  await db.update(usersTable)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(usersTable.id, userId));
  res.json({ message: "Email verified — welcome to Oralia" });
});

export default router;
