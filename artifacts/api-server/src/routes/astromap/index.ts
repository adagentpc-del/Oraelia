import { Router, type IRouter } from "express";
import { computeNatalChart, computeAstroMap, scoreCity, WORLD_CITIES, localSpaceLines } from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

router.get("/astromap", async (_req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  const map = computeAstroMap(chart);
  res.json({
    lines: map.lines,
    cities: map.cityScores,
    bestFor: map.bestFor,
    localSpace: localSpaceLines(chart, birth.moment.latitude, birth.moment.longitude),
    approximateLocation: birth.approximateLocation,
  });
});

router.get("/astromap/city", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const name = String(req.query.name ?? "");
  const lat = Number(req.query.latitude);
  const lon = Number(req.query.longitude);
  const known = WORLD_CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
  const city = known ?? (Number.isFinite(lat) && Number.isFinite(lon)
    ? { name: name || "Custom location", country: "", latitude: lat, longitude: lon, utcOffset: 0 }
    : null);
  if (!city) {
    res.status(400).json({ error: "Provide a known city name or latitude/longitude" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  res.json({ city: scoreCity(chart, city) });
});

export default router;
