import { Router, type IRouter } from "express";
import {
  computeNatalChart,
  draconicPositions,
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

const HOUSE_SYSTEMS: HouseSystem[] = ["placidus", "whole-sign", "equal", "porphyry"];

router.get("/natal/chart", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const system: HouseSystem = HOUSE_SYSTEMS.includes(req.query.houses as HouseSystem)
    ? (req.query.houses as HouseSystem)
    : "placidus";
  const zodiac = req.query.zodiac === "sidereal" ? ("sidereal" as const) : ("tropical" as const);
  const chart = computeNatalChart(birth.moment, { houseSystem: system, zodiac });
  res.json({
    chart,
    approximateLocation: birth.approximateLocation,
    dataQuality: birth.dataQuality,
    calculatedAt: new Date().toISOString(),
  });
});

/** Draconic chart: the natal chart rotated so the North Node = 0° Aries. */
router.get("/natal/draconic", async (_req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  res.json({
    draconic: draconicPositions(chart),
    note: "Draconic positions overlay the tropical chart: conjunctions between a draconic and natal point (within 2°) mark soul-level emphasis.",
  });
});

/** Compare house systems / zodiacs: which conclusions shift, which are stable. */
router.get("/natal/compare", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const a = HOUSE_SYSTEMS.includes(req.query.a as HouseSystem) ? (req.query.a as HouseSystem) : "placidus";
  const b = HOUSE_SYSTEMS.includes(req.query.b as HouseSystem) ? (req.query.b as HouseSystem) : "whole-sign";
  const chartA = computeNatalChart(birth.moment, a);
  const chartB = computeNatalChart(birth.moment, b);
  const changes = chartA.bodies
    .map((bodyA) => {
      const bodyB = chartB.bodies.find((x) => x.body === bodyA.body)!;
      return bodyA.house !== bodyB.house
        ? { body: bodyA.body, [a]: bodyA.house, [b]: bodyB.house }
        : null;
    })
    .filter(Boolean);
  res.json({
    systems: [a, b],
    houseChanges: changes,
    stable: chartA.bodies.filter((bodyA) => chartB.bodies.find((x) => x.body === bodyA.body)!.house === bodyA.house).map((x) => x.body),
    note: changes.length
      ? `${changes.length} planet(s) change houses between ${a} and ${b} — conclusions about those houses' topics depend on the system; everything sign- and aspect-based is unchanged.`
      : "No planets change houses between these systems — the chart's house conclusions are system-stable.",
  });
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
