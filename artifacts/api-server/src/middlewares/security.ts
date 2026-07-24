import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Helmet-style security headers, dependency-free. */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (IS_PRODUCTION) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

// ---------------------------------------------------------------------------
// Application firewall: request screening + global rate limiting.
// A network firewall / CDN WAF still belongs in front in deployment; this is
// the in-process layer that survives misconfiguration of the outer one.
// ---------------------------------------------------------------------------

const SUSPICIOUS_PATH = /(\.\.\/|\.\.\\|\/etc\/passwd|\/proc\/self|\x00)/i;
const SUSPICIOUS_QUERY = /(\bunion\s+select\b|\bdrop\s+table\b|<script\b|javascript:|\bexec\s*\()/i;

const denylist = new Set(
  (process.env.IP_DENYLIST ?? "").split(",").map((ip) => ip.trim()).filter(Boolean),
);

interface Bucket { count: number; resetAt: number }
const globalBuckets = new Map<string, Bucket>();
const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX = parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? "300", 10);

// Periodically drop expired buckets so the map cannot grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of globalBuckets) {
    if (now > bucket.resetAt) globalBuckets.delete(key);
  }
}, GLOBAL_WINDOW_MS).unref();

export function requestFirewall(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "unknown";

  if (denylist.has(ip)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const url = req.originalUrl ?? req.url;
  if (SUSPICIOUS_PATH.test(url) || SUSPICIOUS_QUERY.test(decodeURIComponent(url))) {
    logger.warn({ ip, url: url.slice(0, 200) }, "firewall: blocked suspicious request");
    res.status(400).json({ error: "Bad request" });
    return;
  }

  const now = Date.now();
  const bucket = globalBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    globalBuckets.set(ip, { count: 1, resetAt: now + GLOBAL_WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > GLOBAL_MAX) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// Anti-bot screening for auth endpoints
// ---------------------------------------------------------------------------

const BOT_UA = /(curl|wget|python-requests|scrapy|httpclient|libwww|bot\b|spider|crawler)/i;

/**
 * Bot screening for account creation:
 * - honeypot: the `website` field is invisible in the real UI; bots fill it.
 * - obvious scripted user agents are rejected on auth mutations.
 * - if TURNSTILE_SECRET_KEY is set, a Cloudflare Turnstile token is required
 *   and verified server-side (`captchaToken` in the body).
 */
export async function botScreen(req: Request, res: Response, next: NextFunction): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (typeof body.website === "string" && body.website.trim() !== "") {
    logger.warn({ ip: req.ip }, "antibot: honeypot triggered");
    // Indistinguishable-from-success to avoid teaching the bot.
    res.status(201).json({ ok: true });
    return;
  }

  const ua = req.headers["user-agent"] ?? "";
  if (IS_PRODUCTION && BOT_UA.test(String(ua))) {
    res.status(403).json({ error: "Automated clients may not use this endpoint" });
    return;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const token = typeof body.captchaToken === "string" ? body.captchaToken : "";
    if (!token) {
      res.status(400).json({ error: "Captcha required" });
      return;
    }
    try {
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token, remoteip: req.ip }),
      });
      const outcome = (await verify.json()) as { success?: boolean };
      if (!outcome.success) {
        res.status(403).json({ error: "Captcha verification failed" });
        return;
      }
    } catch (error) {
      logger.error({ err: error }, "antibot: captcha verification errored");
      res.status(503).json({ error: "Captcha verification unavailable — try again" });
      return;
    }
  }

  next();
}
