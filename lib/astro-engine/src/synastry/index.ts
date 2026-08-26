import type { Body } from "../core/ephemeris";
import { midpoint, round, clamp } from "../core/math";
import { houseOf } from "../core/houses";
import { computeNatalChart, type NatalChart } from "../natal/chart";
import {
  findAspects,
  findDeclinationAspects,
  type Aspect,
  type BodyLongitude,
  type DeclinationAspect,
} from "../natal/aspects";
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

export interface SynastryDataQuality {
  timeKnownA: boolean;
  timeKnownB: boolean;
  limitations: string[];
}

export interface SynastryOptions {
  /** Set false when a birth time is unknown — disables house/angle claims. */
  timeKnownA?: boolean;
  timeKnownB?: boolean;
}

export interface SynastryResult {
  aspects: SynastryAspect[];
  overlays: HouseOverlay[];
  declinationParallels: DeclinationAspect[];
  composite: CompositePlacement[];
  davisonDate: string;
  scores: SynastryScores;
  greenFlags: string[];
  redFlags: string[];
  keyContacts: string[];
  dataQuality: SynastryDataQuality;
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

export function computeSynastry(
  momentA: BirthMoment,
  momentB: BirthMoment,
  options?: SynastryOptions,
): SynastryResult {
  const chartA = computeNatalChart(momentA);
  const chartB = computeNatalChart(momentB);
  return synastryFromCharts(chartA, chartB, momentA, momentB, {
    timeKnownA: options?.timeKnownA ?? Boolean(momentA.time),
    timeKnownB: options?.timeKnownB ?? Boolean(momentB.time),
  });
}

export function synastryFromCharts(
  chartA: NatalChart,
  chartB: NatalChart,
  momentA: BirthMoment,
  momentB: BirthMoment,
  options?: SynastryOptions,
): SynastryResult {
  const timeKnownA = options?.timeKnownA ?? true;
  const timeKnownB = options?.timeKnownB ?? true;
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
  // Skipped for a person whose birth time (and therefore houses) is unknown.
  const keyBodies: Body[] = ["Sun", "Moon", "Venus", "Mars", "Jupiter", "Saturn"];
  const overlays: HouseOverlay[] = [];
  for (const b of keyBodies) {
    if (timeKnownB) {
      const pa = chartA.bodies.find((x) => x.body === b)!;
      const houseInB = houseOf(pa.longitude, chartB.houses.cusps);
      overlays.push({
        body: b,
        owner: "A",
        fallsInHouse: houseInB,
        meaning: `A's ${b} in B's house ${houseInB}: ${OVERLAY_MEANINGS[houseInB]}.`,
      });
    }
    if (timeKnownA) {
      const pb = chartB.bodies.find((x) => x.body === b)!;
      const houseInA = houseOf(pb.longitude, chartA.houses.cusps);
      overlays.push({
        body: b,
        owner: "B",
        fallsInHouse: houseInA,
        meaning: `B's ${b} in A's house ${houseInA}: ${OVERLAY_MEANINGS[houseInA]}.`,
      });
    }
  }

  // Declination parallels between the two charts.
  const declBodies: Body[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const declinationParallels: DeclinationAspect[] = [];
  for (const ba of declBodies) {
    for (const bb of declBodies) {
      const pa = chartA.bodies.find((x) => x.body === ba)!;
      const pb = chartB.bodies.find((x) => x.body === bb)!;
      const found = findDeclinationAspects(
        [
          { body: ba, declination: pa.declination },
          { body: bb, declination: pb.declination },
        ],
        1.0,
      );
      declinationParallels.push(...found);
    }
  }
  const uniqueParallels = declinationParallels
    .filter((d, i, arr) => arr.findIndex((x) => x.a === d.a && x.b === d.b && x.type === d.type) === i)
    .slice(0, 10);

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

  const limitations: string[] = [];
  if (!timeKnownA) {
    limitations.push("Person A's birth time is unknown: their houses, angles, and house overlays are excluded; Moon position is approximate (±6°).");
  }
  if (!timeKnownB) {
    limitations.push("Person B's birth time is unknown: their houses, angles, and house overlays are excluded; Moon position is approximate (±6°).");
  }

  return {
    aspects: aspects.slice(0, 40),
    overlays,
    declinationParallels: uniqueParallels,
    composite,
    davisonDate,
    scores,
    greenFlags,
    redFlags,
    keyContacts,
    dataQuality: { timeKnownA, timeKnownB, limitations },
  };
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

// ---------------------------------------------------------------------------
// Relationship report modes (spec §12)
// ---------------------------------------------------------------------------

export type RelationshipReportMode = "romantic" | "business" | "breakup";

export interface RelationshipReport {
  mode: RelationshipReportMode;
  thesis: string;
  sections: { heading: string; content: string }[];
  disclaimer: string;
}

function band(score: number): "strong" | "solid" | "mixed" | "strained" {
  if (score >= 75) return "strong";
  if (score >= 60) return "solid";
  if (score >= 45) return "mixed";
  return "strained";
}

export function relationshipReport(result: SynastryResult, mode: RelationshipReportMode): RelationshipReport {
  const s = result.scores;
  const sections: { heading: string; content: string }[] = [];

  if (mode === "romantic") {
    sections.push(
      {
        heading: "Emotional bond",
        content: `Emotional attunement scores ${s.emotional}/100 (${band(s.emotional)}). ${s.emotional >= 60 ? "You read each other's inner weather with relatively little translation." : "Your emotional languages differ — feelings need to be said out loud, not assumed to be obvious."}`,
      },
      {
        heading: "Attraction and chemistry",
        content: `Chemistry ${s.chemistry}/100, passion ${s.passion}/100. ${s.chemistry >= 70 ? "The pull is real and mechanical — it will survive ordinary life if you protect novelty." : "Attraction here builds through familiarity rather than lightning; slow-burn bonds of this shape often outlast flashier ones."}`,
      },
      {
        heading: "Communication",
        content: `Communication scores ${s.communication}/100 (${band(s.communication)}). ${s.communication < 55 ? "Agree on a repair protocol now, while calm: what each of you needs mid-conflict, in one sentence each." : "Conversation is a genuine channel of intimacy for you two — use it as the repair tool it is."}`,
      },
      {
        heading: "Commitment and longevity",
        content: `Long-term stability ${s.longTermStability}/100; shared purpose ${s.sharedPurpose}/100. ${s.longTermStability >= 60 ? "There is structural glue here — the kind that makes staying easier than leaving in hard seasons." : "Longevity will rest on chosen commitment more than automatic glue; rituals and explicit agreements matter extra."}`,
      },
      {
        heading: "Conflict cycle",
        content: `Conflict risk ${s.conflictRisk}/100. ${s.conflictRisk >= 60 ? `The friction contacts (${result.keyContacts.slice(0, 2).join("; ") || "see key contacts"}) describe your repeating fight. Learn its opening move and interrupt it early.` : "Friction is moderate — disagreements are workable when neither of you imports outside stress into them."}`,
      },
      {
        heading: "Growth potential",
        content: `Growth ${s.growth}/100. ${result.greenFlags[0] ?? "The strongest contacts support mutual development."} ${result.redFlags[0] ? `Watch: ${result.redFlags[0]}` : ""}`,
      },
    );
    return {
      mode,
      thesis: `Overall compatibility ${s.overall}/100 — ${band(s.overall)}. ${s.chemistry >= 70 && s.longTermStability < 50 ? "High-chemistry, lower-glue: thrilling, and it needs deliberate structure to last." : s.longTermStability >= 70 && s.chemistry < 50 ? "High-glue, quieter-spark: durable, and it needs deliberate play to stay alive." : "Chemistry and stability are broadly in proportion."}`,
      sections,
      disclaimer: "Compatibility analysis describes dynamics and tendencies, not certainties about another person's feelings or the outcome of a relationship.",
    };
  }

  if (mode === "business") {
    sections.push(
      {
        heading: "Vision compatibility",
        content: `Shared purpose ${s.sharedPurpose}/100. ${s.sharedPurpose >= 60 ? "You are pointed at compatible horizons — strategy debates will be about route, not destination." : "Confirm you actually want the same endgame before structuring anything; misaligned exits sink more partnerships than misaligned skills."}`,
      },
      {
        heading: "Communication and decisions",
        content: `Communication ${s.communication}/100. ${s.communication >= 60 ? "Information flows well — keep decision rights explicit anyway." : "Put decision rights, veto areas, and escalation paths in writing early; your natural styles will otherwise talk past each other under pressure."}`,
      },
      {
        heading: "Money and execution",
        content: `Business compatibility ${s.business}/100 (${band(s.business)}). Split roles by temperament: one of you should own commitments to the outside world, the other the internal machine — decide which is which from your charts' strengths, not politeness.`,
      },
      {
        heading: "Conflict and power",
        content: `Conflict risk ${s.conflictRisk}/100. ${s.conflictRisk >= 60 ? "Expect real power friction. Pre-agree on a tiebreaker mechanism (odd advisor, rotating final call) before the first big disagreement." : "Friction is manageable; quarterly retros will keep it that way."}`,
      },
      {
        heading: "Contract safeguards",
        content: "Whatever the synastry says: vesting schedules, IP assignment, exit terms, and deadlock resolution belong in signed documents. Astrology informs the working relationship; it never replaces legal agreements.",
      },
    );
    return {
      mode,
      thesis: `Business partnership potential ${s.business}/100 with conflict risk ${s.conflictRisk}/100 — ${band(s.business)} foundation${s.conflictRisk >= 60 ? ", requiring explicit governance" : ""}.`,
      sections,
      disclaimer: "This analysis is a working-style lens, not legal, financial, or hiring advice. Contract safeguards are required regardless of compatibility scores.",
    };
  }

  // Breakup integration mode.
  sections.push(
    {
      heading: "Why the bond felt significant",
      content: `${result.keyContacts.length ? `The contacts that wired you together — ${result.keyContacts.slice(0, 3).join("; ")} — are real mechanics, not imagination.` : "The intensity you felt has chart mechanics behind it."} Significance was genuine; that is precisely why the loss registers in the body, not just the mind.`,
    },
    {
      heading: "Intensity vs. compatibility",
      content: `Chemistry scored ${s.chemistry}/100 while long-term stability scored ${s.longTermStability}/100. ${s.chemistry > s.longTermStability + 15 ? "That gap is the story: the connection generated more voltage than structure. Missing the voltage is not evidence the structure could have worked." : "The bond had real structural elements — grief here includes mourning a plausible future, which deserves acknowledgment."}`,
    },
    {
      heading: "Attachment mechanisms",
      content: `${result.overlays.some((o) => [8, 12].includes(o.fallsInHouse)) ? "Deep-house overlays (8th/12th) explain why this person reached subterranean layers — those bonds release slowly; be patient with the timeline." : "The overlays were largely daylight houses — the attachment can integrate faster than it currently feels."}`,
    },
    {
      heading: "Boundaries and integration",
      content: "Contact structured around your healing, not their news. The lesson inventory: what did this bond teach you to require, to offer, and to never again abandon in yourself? Write those three lists — they are the relationship's inheritance.",
    },
    {
      heading: "What this is not",
      content: "This analysis cannot tell you what they feel now, whether they will return, or who was right. Symbolic systems read dynamics, not other people's minds — and healing does not require those answers.",
    },
  );
  return {
    mode,
    thesis: "Integration reading: honoring what was real, separating intensity from fit, and converting the bond into usable self-knowledge.",
    sections,
    disclaimer: "This reading supports reflection after a relationship ends. It makes no claims about the other person's current feelings or future actions, and it is not a substitute for professional support in acute distress.",
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
