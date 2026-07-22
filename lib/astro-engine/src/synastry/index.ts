import type { Body } from "../core/ephemeris";
import { midpoint, round, clamp } from "../core/math";
import { houseOf } from "../core/houses";
import { computeNatalChart, type NatalChart } from "../natal/chart";
import { findAspects, type Aspect, type BodyLongitude } from "../natal/aspects";
import { signOf, type Sign } from "../natal/zodiac";
import { dateFromJulianDay, type BirthMoment } from "../core/julian";

export interface SynastryAspect extends Aspect {
  /** a = person A's planet, b = person B's planet. */
  direction: "A->B";
}

export interface HouseOverlay {
  body: Body;
  owner: "A" | "B";
  fallsInHouse: number;
  meaning: string;
}

export interface CompositePlacement {
  body: Body;
  longitude: number;
  sign: Sign;
}

export interface SynastryScores {
  chemistry: number;
  communication: number;
  emotional: number;
  longTermStability: number;
  sharedPurpose: number;
  passion: number;
  friendship: number;
  business: number;
  conflictRisk: number;
  growth: number;
  overall: number;
}

export interface SynastryResult {
  aspects: SynastryAspect[];
  overlays: HouseOverlay[];
  composite: CompositePlacement[];
  davisonDate: string;
  scores: SynastryScores;
  greenFlags: string[];
  redFlags: string[];
  keyContacts: string[];
}

const OVERLAY_MEANINGS: Record<number, string> = {
  1: "affects the other's identity and confidence — an impossible-to-ignore presence",
  2: "activates money and security themes between you",
  3: "sparks conversation and mental rapport",
  4: "touches home and family — this person feels like family",
  5: "lights up romance, play and creativity",
  6: "shows up in daily routines and acts of service",
  7: "lands in the partnership house — 'significant other' energy",
  8: "activates deep intimacy, shared resources and transformation",
  9: "expands beliefs and horizons — a travel and growth companion",
  10: "influences career and public standing",
  11: "feels like a true friend and ally in your larger vision",
  12: "stirs the unconscious — karmic, private, sometimes confusing",
};

function scorePair(
  aspects: SynastryAspect[],
  pairs: [Body, Body][],
  base = 55,
): number {
  let score = base;
  for (const asp of aspects) {
    const match = pairs.some(
      ([p1, p2]) =>
        (asp.a === p1 && asp.b === p2) || (asp.a === p2 && asp.b === p1),
    );
    if (!match) continue;
    score += (asp.harmonyScore / 100) * (asp.intensity / 100) * 25;
    if (asp.type === "conjunction") score += (asp.intensity / 100) * 8;
  }
  return round(clamp(score, 5, 98), 0);
}

export function computeSynastry(momentA: BirthMoment, momentB: BirthMoment): SynastryResult {
  const chartA = computeNatalChart(momentA);
  const chartB = computeNatalChart(momentB);
  return synastryFromCharts(chartA, chartB, momentA, momentB);
}

export function synastryFromCharts(
  chartA: NatalChart,
  chartB: NatalChart,
  momentA: BirthMoment,
  momentB: BirthMoment,
): SynastryResult {
  // Cross-aspects: treat A's bodies against B's bodies.
  const aspects: SynastryAspect[] = [];
  for (const pa of chartA.bodies) {
    for (const pb of chartB.bodies) {
      const pair: BodyLongitude[] = [
        { body: pa.body, longitude: pa.longitude, speed: 0 },
        { body: pb.body, longitude: pb.longitude, speed: 0 },
      ];
      if (pa.body === pb.body) {
        // findAspects skips i==j only via indices; same body name is fine here.
      }
      const found = findAspects(pair, { orbMultiplier: 0.8 });
      for (const f of found) {
        aspects.push({ ...f, a: pa.body, b: pb.body, direction: "A->B" });
      }
    }
  }
  aspects.sort((x, y) => y.intensity - x.intensity);

  // House overlays: where each person's key planets fall in the other's houses.
  const keyBodies: Body[] = ["Sun", "Moon", "Venus", "Mars", "Jupiter", "Saturn"];
  const overlays: HouseOverlay[] = [];
  for (const b of keyBodies) {
    const pa = chartA.bodies.find((x) => x.body === b)!;
    const houseInB = houseOf(pa.longitude, chartB.houses.cusps);
    overlays.push({
      body: b,
      owner: "A",
      fallsInHouse: houseInB,
      meaning: `A's ${b} in B's house ${houseInB}: ${OVERLAY_MEANINGS[houseInB]}.`,
    });
    const pb = chartB.bodies.find((x) => x.body === b)!;
    const houseInA = houseOf(pb.longitude, chartA.houses.cusps);
    overlays.push({
      body: b,
      owner: "B",
      fallsInHouse: houseInA,
      meaning: `B's ${b} in A's house ${houseInA}: ${OVERLAY_MEANINGS[houseInA]}.`,
    });
  }

  // Composite: midpoint chart.
  const composite: CompositePlacement[] = chartA.bodies
    .filter((b) => chartB.bodies.some((x) => x.body === b.body))
    .map((b) => {
      const other = chartB.bodies.find((x) => x.body === b.body)!;
      const lon = midpoint(b.longitude, other.longitude);
      return { body: b.body, longitude: round(lon, 2), sign: signOf(lon) };
    });

  // Davison: chart cast for the midpoint in time and space.
  const davisonJd = (chartA.julianDay + chartB.julianDay) / 2;
  const davisonDate = dateFromJulianDay(davisonJd).toISOString().slice(0, 10);
  void momentA;
  void momentB;

  const scores = computeScores(aspects);
  const { greenFlags, redFlags, keyContacts } = flags(aspects);

  return { aspects: aspects.slice(0, 40), overlays, composite, davisonDate, scores, greenFlags, redFlags, keyContacts };
}

function computeScores(aspects: SynastryAspect[]): SynastryScores {
  const chemistry = scorePair(aspects, [
    ["Venus", "Mars"],
    ["Mars", "Venus"],
    ["Sun", "Moon"],
    ["Venus", "Pluto"],
    ["Moon", "Mars"],
    ["Venus", "Uranus"],
  ]);
  const communication = scorePair(aspects, [
    ["Mercury", "Mercury"],
    ["Mercury", "Moon"],
    ["Mercury", "Sun"],
    ["Mercury", "Jupiter"],
  ]);
  const emotional = scorePair(aspects, [
    ["Moon", "Moon"],
    ["Moon", "Venus"],
    ["Moon", "Neptune"],
    ["Sun", "Moon"],
  ]);
  const longTermStability = scorePair(aspects, [
    ["Saturn", "Sun"],
    ["Saturn", "Moon"],
    ["Saturn", "Venus"],
    ["Saturn", "Ascendant" as Body],
    ["Sun", "Sun"],
  ]);
  const sharedPurpose = scorePair(aspects, [
    ["NorthNode", "Sun"],
    ["NorthNode", "Moon"],
    ["NorthNode", "Venus"],
    ["Jupiter", "Sun"],
    ["Jupiter", "Moon"],
  ]);
  const passion = scorePair(aspects, [
    ["Mars", "Pluto"],
    ["Venus", "Mars"],
    ["Mars", "Mars"],
    ["Venus", "Pluto"],
    ["Lilith", "Sun"],
    ["Lilith", "Mars"],
  ]);
  const friendship = scorePair(aspects, [
    ["Sun", "Jupiter"],
    ["Moon", "Mercury"],
    ["Venus", "Jupiter"],
    ["Sun", "Sun"],
    ["Moon", "Moon"],
  ]);
  const business = scorePair(aspects, [
    ["Saturn", "Jupiter"],
    ["Sun", "Saturn"],
    ["Mercury", "Saturn"],
    ["Mars", "Jupiter"],
    ["Mercury", "Mars"],
  ]);

  // Conflict risk from hard Mars/Saturn/Pluto contacts.
  let conflict = 30;
  for (const asp of aspects) {
    const heavy = ["Mars", "Saturn", "Pluto", "Uranus"];
    if (
      (heavy.includes(asp.a) || heavy.includes(asp.b)) &&
      asp.harmonyScore < -20 &&
      asp.intensity > 30
    ) {
      conflict += (asp.intensity / 100) * 12;
    }
  }
  const conflictRisk = round(clamp(conflict, 5, 95), 0);
  const growth = scorePair(aspects, [
    ["Chiron", "Moon"],
    ["Chiron", "Venus"],
    ["Pluto", "Sun"],
    ["Uranus", "Sun"],
    ["Jupiter", "Saturn"],
  ]);

  const overall = round(
    clamp(
      chemistry * 0.18 + communication * 0.13 + emotional * 0.16 + longTermStability * 0.16 +
        sharedPurpose * 0.1 + passion * 0.09 + friendship * 0.1 + growth * 0.08 -
        (conflictRisk - 50) * 0.15,
      5,
      98,
    ),
    0,
  );

  return {
    chemistry,
    communication,
    emotional,
    longTermStability,
    sharedPurpose,
    passion,
    friendship,
    business,
    conflictRisk,
    growth,
    overall,
  };
}

function flags(aspects: SynastryAspect[]): { greenFlags: string[]; redFlags: string[]; keyContacts: string[] } {
  const greenFlags: string[] = [];
  const redFlags: string[] = [];
  const keyContacts: string[] = [];

  for (const asp of aspects.slice(0, 25)) {
    const label = `${asp.a} ${asp.type} ${asp.b} (orb ${asp.orb}°)`;
    const pair = [asp.a, asp.b];
    const soft = asp.harmonyScore > 20 || (asp.type === "conjunction" && !["Saturn", "Pluto", "Mars"].some((h) => pair.includes(h as Body)));
    const hard = asp.harmonyScore < -20;

    if (pair.includes("Sun") && pair.includes("Moon") && soft) {
      greenFlags.push(`Sun–Moon harmony: the classic marriage aspect — identity and emotion feed each other.`);
      keyContacts.push(label);
    }
    if (pair.includes("Venus") && pair.includes("Mars")) {
      keyContacts.push(label);
      if (soft) greenFlags.push("Venus–Mars contact: durable physical chemistry.");
    }
    if (pair.includes("Saturn") && soft && (pair.includes("Sun") || pair.includes("Moon") || pair.includes("Venus"))) {
      greenFlags.push("Supportive Saturn contact: glue for the long haul — loyalty and staying power.");
      keyContacts.push(label);
    }
    if (pair.includes("Saturn") && hard && (pair.includes("Moon") || pair.includes("Venus"))) {
      redFlags.push("Hard Saturn to Moon/Venus: criticism and emotional withholding can calcify — needs conscious warmth.");
      keyContacts.push(label);
    }
    if (pair.includes("Pluto") && hard && (pair.includes("Venus") || pair.includes("Moon") || pair.includes("Sun"))) {
      redFlags.push("Hard Pluto contact: obsession and control themes — magnetic but must be handled with full honesty.");
      keyContacts.push(label);
    }
    if (pair.includes("Neptune") && hard && (pair.includes("Sun") || pair.includes("Venus") || pair.includes("Moon"))) {
      redFlags.push("Hard Neptune contact: idealization risk — verify, don't assume; keep agreements explicit.");
    }
    if (pair.includes("Uranus") && hard && (pair.includes("Venus") || pair.includes("Moon"))) {
      redFlags.push("Hard Uranus contact: on-off instability — thrives only with unusual amounts of freedom.");
    }
    if (pair.includes("NorthNode") && asp.type === "conjunction") {
      greenFlags.push("Node conjunction: a fated-feeling bond tied to each other's growth path.");
      keyContacts.push(label);
    }
  }

  return {
    greenFlags: [...new Set(greenFlags)].slice(0, 6),
    redFlags: [...new Set(redFlags)].slice(0, 6),
    keyContacts: [...new Set(keyContacts)].slice(0, 8),
  };
}
