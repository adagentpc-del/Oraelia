import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import {
  computeNatalChart,
  transitEvents,
  solarReturnChart,
  lunarReturnChart,
  julianDayFromDate,
  WORLD_CITIES,
  planningTimeline,
  quarterlyForecast,
  ageAt,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

/**
 * Exact transit hits (with retrograde revisit passes) for the slow planets
 * over a forward window. ?days=365 (max 730), ?from=YYYY-MM-DD.
 */
router.get("/timing/transit-events", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
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
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
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
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
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

/** Multi-year planning timeline: ?years=10 (max 30), starting at current age. */
router.get("/timing/timeline", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const years = Math.min(Math.max(parseInt(String(req.query.years ?? "10"), 10) || 10, 1), 30);
  const chart = computeNatalChart(birth.moment);
  const currentAge = ageAt(birth.moment, julianDayFromDate(new Date()));
  const fromAge = Math.max(0, parseInt(String(req.query.fromAge ?? currentAge), 10) || currentAge);
  res.json({
    fromAge,
    years,
    timeline: planningTimeline(chart, birth.moment, fromAge, years),
    note: "Probability and theme language, not guarantees: profection houses and planetary cycle windows describe emphasis, not fixed events.",
  });
});

/** Quarterly strategic synthesis: profections + lunations + exact transits over ~92 days. */
router.get("/forecast/quarterly", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const from = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
    ? new Date(`${req.query.date}T00:00:00Z`)
    : new Date();
  const chart = computeNatalChart(birth.moment);
  res.json(quarterlyForecast(chart, birth.moment, julianDayFromDate(from)));
});

export default router;
