import { Router, type IRouter } from "express";
import {
  computeNatalChart,
  allReports,
  loveReport,
  careerReport,
  moneyReport,
  fameReport,
  familyReport,
  healthReport,
  spiritualityReport,
  HOUSE_DEEP_DIVES,
  PLANET_DEEP_DIVES,
  SIGN_DEEP_DIVES,
  type HouseSystem,
  type NatalChart,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

router.get("/natal/chart", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const system: HouseSystem = req.query.houses === "whole-sign" ? "whole-sign" : "placidus";
  const chart = computeNatalChart(birth.moment, system);
  res.json({ chart, approximateLocation: birth.approximateLocation });
});

const REPORT_BUILDERS: Record<string, (chart: NatalChart) => unknown> = {
  love: loveReport,
  career: careerReport,
  money: moneyReport,
  fame: fameReport,
  family: familyReport,
  health: healthReport,
  spirituality: spiritualityReport,
};

router.get("/natal/reports", async (_req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  res.json({ reports: allReports(chart), approximateLocation: birth.approximateLocation });
});

router.get("/natal/reports/:category", async (req, res): Promise<void> => {
  const builder = REPORT_BUILDERS[req.params.category ?? ""];
  if (!builder) {
    res.status(400).json({ error: `Unknown category. Use: ${Object.keys(REPORT_BUILDERS).join(", ")}` });
    return;
  }
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  res.json({ report: builder(chart) });
});

/** Personalized deep dives: static wisdom keyed to this chart's actual placements. */
router.get("/natal/deep-dives", async (_req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  const houses = Object.values(HOUSE_DEEP_DIVES).map((dive) => ({
    ...dive,
    cuspSign: chart.houses.cusps[dive.house - 1] !== undefined
      ? chart.bodies.length
        ? signAt(chart, dive.house)
        : null
      : null,
    planetsHere: chart.bodies.filter((b) => b.house === dive.house).map((b) => b.body),
  }));
  const planets = chart.bodies
    .filter((b) => PLANET_DEEP_DIVES[b.body])
    .map((b) => ({
      ...PLANET_DEEP_DIVES[b.body]!,
      sign: b.sign,
      house: b.house,
      dignity: b.dignity,
      retrograde: b.retrograde,
      strength: b.strength,
      signProfile: SIGN_DEEP_DIVES[b.sign],
    }));
  res.json({ houses, planets, signs: SIGN_DEEP_DIVES });
});

function signAt(chart: NatalChart, house: number): string {
  const cusp = chart.houses.cusps[house - 1]!;
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[Math.floor((((cusp % 360) + 360) % 360) / 30)]!;
}

export default router;
