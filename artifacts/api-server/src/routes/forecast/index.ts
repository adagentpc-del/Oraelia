import { Router, type IRouter } from "express";
import {
  computeNatalChart,
  scoreDay,
  planetaryHours,
  currentRetrogrades,
  upcomingLunations,
  annualProfection,
  monthlyProfection,
  secondaryProgressions,
  solarArcDirections,
  solarReturnDate,
  nextLunarReturn,
  ageAt,
  monthsSinceBirthday,
  julianDayFromDate,
  personalCycles,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

function parseDate(input: unknown): Date {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    return new Date(`${input.slice(0, 10)}T12:00:00Z`);
  }
  return new Date();
}

router.get("/forecast/daily", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const date = parseDate(req.query.date);
  const jd = julianDayFromDate(date);
  const chart = computeNatalChart(birth.moment);
  const { scores, transits } = scoreDay(chart, jd);
  const retrogrades = currentRetrogrades(jd);
  const hours = planetaryHours(date);
  const cycles = personalCycles(birth.birthDate, date.toISOString().slice(0, 10));

  const topSupport = transits.filter((t) => t.harmonyScore > 20).slice(0, 3);
  const topFriction = transits.filter((t) => t.harmonyScore < -20).slice(0, 3);

  res.json({
    date: date.toISOString().slice(0, 10),
    scores,
    powerHours: hours,
    personalDay: cycles.personalDay,
    retrogrades: retrogrades.filter((r) => r.retrograde),
    opportunities: topSupport.map(
      (t) => `${t.transiting} ${t.type} your natal ${t.natal} — lean into this contact (intensity ${t.intensity}).`,
    ),
    risks: topFriction.map(
      (t) => `${t.transiting} ${t.type} your natal ${t.natal} — friction likely here (intensity ${t.intensity}); slow down before reacting.`,
    ),
    recommendedActions: [
      scores.productivity >= 60 ? "Front-load your hardest deep work today." : "Keep the to-do list short; today favors maintenance over heroics.",
      scores.communication >= 60 ? "Send the pitch, have the conversation — words land well today." : "Draft today, send tomorrow; double-check anything in writing.",
      scores.relationships >= 60 ? "Schedule quality time — connection flows easily." : "Give relationships breathing room; don't force resolution today.",
    ],
    avoid: topFriction.length
      ? [`Decisions involving ${topFriction.map((t) => String(t.natal)).join(", ")} themes while these transits are exact.`]
      : ["Nothing major to avoid — a clean sky day."],
    transits: transits.slice(0, 12),
  });
});

router.get("/forecast/weekly", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const start = parseDate(req.query.date);
  const chart = computeNatalChart(birth.moment);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400000);
    const { scores } = scoreDay(chart, julianDayFromDate(d));
    return { date: d.toISOString().slice(0, 10), scores };
  });
  const best = (key: keyof (typeof days)[0]["scores"]) =>
    [...days].sort((a, b) => b.scores[key] - a.scores[key])[0]!.date;
  res.json({
    days,
    bestDays: {
      meetings: best("communication"),
      money: best("money"),
      launch: best("decisionScore"),
      fitness: best("health"),
      romance: best("relationships"),
      creative: best("creativity"),
    },
    momentum: days.reduce((s, d) => s + d.scores.overall, 0) / 7 >= 55
      ? "Building — a week to advance projects and make asks."
      : "Consolidating — a week to finish, fix, and prepare rather than launch.",
  });
});

router.get("/forecast/monthly", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const start = parseDate(req.query.date);
  const jd = julianDayFromDate(start);
  const chart = computeNatalChart(birth.moment);
  const age = ageAt(birth.moment, jd);
  const months = monthsSinceBirthday(birth.moment, jd);
  const annual = annualProfection(chart, age);
  const monthly = monthlyProfection(chart, age, months);
  const lunations = upcomingLunations(jd, 3, chart);
  const retro = currentRetrogrades(jd).filter((r) => r.retrograde);

  res.json({
    annualProfection: annual,
    monthlyProfection: monthly,
    lunations: lunations.map((l) => ({
      ...l,
      date: l.date.toISOString().slice(0, 10),
      guidance: l.type === "New Moon"
        ? `Set intentions in your ${l.natalHouse}th house: ${l.isEclipse ? "an eclipse — expect accelerated, fated shifts here; don't force manifestation, observe" : "a clean slate for this life area"}.`
        : `Culmination in your ${l.natalHouse}th house: ${l.isEclipse ? "an eclipse — releases here are non-negotiable; let go gracefully" : "harvest and release in this life area"}.`,
    })),
    retrogrades: retro,
    bestFor: {
      launches: retro.some((r) => r.body === "Mercury") ? "Avoid launches until Mercury stations direct." : "Launch after the New Moon, before the Full Moon.",
      contracts: retro.some((r) => r.body === "Mercury") ? "Defer signings if possible; if unavoidable, triple-check terms." : "Favorable — sign with normal diligence.",
      travel: "Book around lunations; avoid departure on eclipse days.",
    },
  });
});

router.get("/forecast/yearly", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const date = parseDate(req.query.date);
  const jd = julianDayFromDate(date);
  const chart = computeNatalChart(birth.moment);
  const age = ageAt(birth.moment, jd);
  const annual = annualProfection(chart, age);
  const progressions = secondaryProgressions(chart, age);
  const solarArc = solarArcDirections(chart, age).filter((p) => p.changedSign);
  const sr = solarReturnDate(chart, date.getUTCFullYear());
  const lr = nextLunarReturn(chart, jd);
  const cycles = personalCycles(birth.birthDate, date.toISOString().slice(0, 10));

  res.json({
    age,
    profection: annual,
    personalYear: cycles.personalYear,
    solarReturn: sr.toISOString(),
    nextLunarReturn: lr.toISOString(),
    progressions,
    solarArcSignChanges: solarArc,
    majorLessons: [
      annual.theme,
      `Year lord ${annual.yearLord}: its natal condition (${chart.bodies.find((b) => b.body === annual.yearLord)?.dignity ?? "unknown"}, house ${chart.bodies.find((b) => b.body === annual.yearLord)?.house ?? "?"}) colors the whole year.`,
      ...progressions.filter((p) => p.changedSign).map((p) => `Progressed ${p.body} has entered ${p.sign} — a multi-year re-tuning of this function.`),
    ],
  });
});

export default router;
