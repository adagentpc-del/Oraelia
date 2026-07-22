import { julianDayFromDate, type BirthMoment } from "../core/julian";
import { round, clamp } from "../core/math";
import type { NatalChart } from "../natal/chart";
import {
  ageAt,
  annualProfection,
  currentRetrogrades,
  scoreDay,
  upcomingLunations,
} from "../timing";
import { personalCycles } from "../numerology";

export type DecisionCategory =
  | "move"
  | "start-company"
  | "marry"
  | "leave-job"
  | "hire"
  | "launch"
  | "invest"
  | "travel"
  | "surgery"
  | "buy-home"
  | "sell-company"
  | "date-person"
  | "accept-offer"
  | "other";

export interface DecisionEvaluation {
  question: string;
  category: DecisionCategory;
  opportunityScore: number;
  riskScore: number;
  confidence: number;
  recommendation: "proceed" | "proceed-with-care" | "wait" | "avoid-for-now";
  bestWindows: { date: string; score: number; reason: string }[];
  factors: { factor: string; impact: number; explanation: string }[];
}

const CATEGORY_HOUSES: Record<DecisionCategory, number[]> = {
  move: [4, 9],
  "start-company": [10, 1, 2],
  marry: [7],
  "leave-job": [10, 6],
  hire: [6, 10],
  launch: [10, 1, 5],
  invest: [2, 8],
  travel: [9, 3],
  surgery: [1, 6, 8],
  "buy-home": [4, 2],
  "sell-company": [10, 2, 8],
  "date-person": [5, 7],
  "accept-offer": [10, 2],
  other: [1],
};

const CATEGORY_SCORE_KEY: Record<DecisionCategory, "career" | "relationships" | "money" | "health" | "overall"> = {
  move: "overall",
  "start-company": "career",
  marry: "relationships",
  "leave-job": "career",
  hire: "career",
  launch: "career",
  invest: "money",
  travel: "overall",
  surgery: "health",
  "buy-home": "money",
  "sell-company": "money",
  "date-person": "relationships",
  "accept-offer": "career",
  other: "overall",
};

export function evaluateDecision(
  chart: NatalChart,
  moment: BirthMoment,
  birthDate: string,
  question: string,
  category: DecisionCategory,
  onDate: Date = new Date(),
): DecisionEvaluation {
  const jd = julianDayFromDate(onDate);
  const factors: DecisionEvaluation["factors"] = [];

  const { scores, transits } = scoreDay(chart, jd);
  const key = CATEGORY_SCORE_KEY[category];
  const categoryScore = scores[key];
  factors.push({
    factor: "Current transits",
    impact: round((categoryScore - 55) / 2, 0),
    explanation: `Today's ${key} climate scores ${categoryScore}/100 against your natal chart.`,
  });

  // Profection year relevance.
  const age = ageAt(moment, jd);
  const profection = annualProfection(chart, age);
  const relevantHouses = CATEGORY_HOUSES[category];
  const profectionAligned = relevantHouses.includes(profection.profectedHouse);
  factors.push({
    factor: "Annual profection",
    impact: profectionAligned ? 12 : -3,
    explanation: profectionAligned
      ? `You are in a ${profection.profectedHouse}th-house profection year — this is exactly the year for this kind of decision. ${profection.theme}`
      : `Your ${profection.profectedHouse}th-house profection year emphasizes other themes (${profection.theme}) — still possible, just not the year's headline.`,
  });

  // Retrogrades.
  const retro = currentRetrogrades(jd);
  const mercuryRx = retro.find((r) => r.body === "Mercury")?.retrograde ?? false;
  const venusRx = retro.find((r) => r.body === "Venus")?.retrograde ?? false;
  const marsRx = retro.find((r) => r.body === "Mars")?.retrograde ?? false;
  const contractual = ["start-company", "launch", "accept-offer", "buy-home", "sell-company", "hire", "invest", "marry"].includes(category);
  if (mercuryRx && contractual) {
    factors.push({
      factor: "Mercury retrograde",
      impact: -12,
      explanation: "Mercury is retrograde: contracts, launches and agreements signed now tend to need renegotiation. Use this window for due diligence, sign after it stations direct.",
    });
  }
  if (venusRx && ["marry", "date-person"].includes(category)) {
    factors.push({
      factor: "Venus retrograde",
      impact: -10,
      explanation: "Venus retrograde revises relationships and values — a poor window to formalize love; a good one to re-evaluate it.",
    });
  }
  if (marsRx && ["surgery", "launch", "start-company"].includes(category)) {
    factors.push({
      factor: "Mars retrograde",
      impact: -8,
      explanation: "Mars retrograde saps forward drive — initiatives started now often need re-launching.",
    });
  }

  // Eclipse proximity: avoid launching within ~5 days of an eclipse.
  const lunations = upcomingLunations(jd - 6, 3, chart);
  const nearEclipse = lunations.some(
    (l) => l.isEclipse && Math.abs(l.date.getTime() - onDate.getTime()) < 5 * 86400000,
  );
  if (nearEclipse) {
    factors.push({
      factor: "Eclipse window",
      impact: -8,
      explanation: "An eclipse falls within days of this date. Eclipses accelerate fate but distort judgment — let the dust settle before committing.",
    });
  }

  // Numerology personal day/year.
  const iso = onDate.toISOString().slice(0, 10);
  const cycles = personalCycles(birthDate, iso);
  const initiating = ["start-company", "launch", "move", "accept-offer"].includes(category);
  if (initiating && [1, 8].includes(cycles.personalDay)) {
    factors.push({
      factor: "Numerology",
      impact: 8,
      explanation: `Personal day ${cycles.personalDay} strongly favors initiating; the numbers are pushing the same direction.`,
    });
  } else if ([7, 9].includes(cycles.personalDay) && initiating) {
    factors.push({
      factor: "Numerology",
      impact: -5,
      explanation: `Personal day ${cycles.personalDay} favors reflection or completion over new starts.`,
    });
  } else {
    factors.push({
      factor: "Numerology",
      impact: 2,
      explanation: `Personal year ${cycles.personalYear}, month ${cycles.personalMonth}, day ${cycles.personalDay} — a workable numerological backdrop.`,
    });
  }

  // Hard transit count against relevant planets.
  const hardHits = transits.filter((t) => t.harmonyScore < -30 && t.intensity > 45).length;
  if (hardHits > 2) {
    factors.push({
      factor: "Transit pressure",
      impact: -8,
      explanation: `${hardHits} strong challenging transits are active — friction is elevated; build extra margin into anything you commit to.`,
    });
  }

  const totalImpact = factors.reduce((s, f) => s + f.impact, 0);
  const opportunityScore = round(clamp(55 + totalImpact, 10, 98), 0);
  const riskScore = round(clamp(45 - totalImpact * 0.8 + Math.min(hardHits, 5) * 3, 8, 90), 0);
  const spread = Math.abs(opportunityScore - riskScore);
  const confidence = round(clamp(50 + spread * 0.7, 30, 92), 0);

  let recommendation: DecisionEvaluation["recommendation"];
  if (opportunityScore >= 70 && riskScore <= 40) recommendation = "proceed";
  else if (opportunityScore >= 55) recommendation = "proceed-with-care";
  else if (opportunityScore >= 40) recommendation = "wait";
  else recommendation = "avoid-for-now";

  // Scan the next 30 days for better windows.
  const bestWindows: DecisionEvaluation["bestWindows"] = [];
  for (let i = 1; i <= 30; i += 3) {
    const future = new Date(onDate.getTime() + i * 86400000);
    const fjd = julianDayFromDate(future);
    const fScores = scoreDay(chart, fjd).scores;
    const fIso = future.toISOString().slice(0, 10);
    const fCycles = personalCycles(birthDate, fIso);
    let score = fScores[key];
    if (initiating && fCycles.personalDay === 1) score += 6;
    bestWindows.push({
      date: fIso,
      score: round(clamp(score, 5, 98), 0),
      reason: `${key} climate ${fScores[key]}/100, personal day ${fCycles.personalDay}`,
    });
  }
  bestWindows.sort((a, b) => b.score - a.score);

  return {
    question,
    category,
    opportunityScore,
    riskScore,
    confidence,
    recommendation,
    bestWindows: bestWindows.slice(0, 3),
    factors,
  };
}
