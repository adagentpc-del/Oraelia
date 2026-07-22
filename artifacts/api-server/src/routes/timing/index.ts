import { Router, type IRouter } from "express";
import {
  computeNatalChart,
  transitEvents,
  solarReturnChart,
  lunarReturnChart,
  julianDayFromDate,
  WORLD_CITIES,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

/**
 * Exact transit hits (with retrograde revisit passes) for the slow planets
 * over a forward window. ?days=365 (max 730), ?from=YYYY-MM-DD.
 */
router.get("/timing/transit-events", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const days = Math.min(Math.max(parseInt(String(req.query.days ?? "365"), 10) || 365, 30), 730);
  const from = typeof req.query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)
    ? new Date(`${req.query.from}T00:00:00Z`)
    : new Date();
  const chart = computeNatalChart(birth.moment);
  const events = transitEvents(chart, julianDayFromDate(from), days);
  res.json({
    from: from.toISOString().slice(0, 10),
    days,
    events,
    note: "Multiple passes of the same contact (direct → retrograde → direct) form one transit arc: first contact, revisit, final pass.",
  });
});

function resolveLocation(req: { query: Record<string, unknown> }, fallback: { latitude: number; longitude: number }) {
  const cityName = typeof req.query.city === "string" ? req.query.city : "";
  const known = WORLD_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
  if (known) return { latitude: known.latitude, longitude: known.longitude };
  const lat = Number(req.query.latitude);
  const lon = Number(req.query.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { latitude: lat, longitude: lon };
  return fallback;
}

/**
 * Full solar return chart for a year, optionally relocated:
 * ?year=2026&city=Lisbon or ?latitude=&longitude= (defaults to birth location).
 */
router.get("/returns/solar", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const year = parseInt(String(req.query.year ?? new Date().getUTCFullYear()), 10);
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    res.status(400).json({ error: "Provide ?year between 1900 and 2100" });
    return;
  }
  const location = resolveLocation(req as never, {
    latitude: birth.moment.latitude,
    longitude: birth.moment.longitude,
  });
  const natal = computeNatalChart(birth.moment);
  const result = solarReturnChart(natal, year, location.latitude, location.longitude);
  res.json({ ...result, location, dataQuality: birth.dataQuality });
});

/** Next lunar return from a date, optionally relocated. */
router.get("/returns/lunar", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const from = typeof req.query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)
    ? new Date(`${req.query.from}T00:00:00Z`)
    : new Date();
  const location = resolveLocation(req as never, {
    latitude: birth.moment.latitude,
    longitude: birth.moment.longitude,
  });
  const natal = computeNatalChart(birth.moment);
  const result = lunarReturnChart(natal, julianDayFromDate(from), location.latitude, location.longitude);
  res.json({ ...result, location, dataQuality: birth.dataQuality });
});

export default router;
