export type BirthTimeConfidence =
  | "exact_documented"
  | "exact_recalled"
  | "approximate_within_15_minutes"
  | "approximate_within_1_hour"
  | "unknown"
  | "rectified";

export const BIRTH_TIME_CONFIDENCE_VALUES: BirthTimeConfidence[] = [
  "exact_documented",
  "exact_recalled",
  "approximate_within_15_minutes",
  "approximate_within_1_hour",
  "unknown",
  "rectified",
];

export interface DataQuality {
  /** 0-100 composite score. */
  score: number;
  birthTimeConfidence: BirthTimeConfidence;
  hasCoordinates: boolean;
  /** Whether houses, angles, and time-sensitive outputs are reliable. */
  timeDependentSafe: boolean;
  /** Whether the Moon's degree is precise (it moves ~13°/day). */
  moonDegreePrecise: boolean;
  limitations: string[];
}

const CONFIDENCE_SCORES: Record<BirthTimeConfidence, number> = {
  exact_documented: 100,
  exact_recalled: 90,
  approximate_within_15_minutes: 78,
  approximate_within_1_hour: 60,
  rectified: 82,
  unknown: 30,
};

export function assessDataQuality(input: {
  birthTimeConfidence?: string | null;
  hasTime: boolean;
  hasCoordinates: boolean;
}): DataQuality {
  const confidence: BirthTimeConfidence = BIRTH_TIME_CONFIDENCE_VALUES.includes(
    input.birthTimeConfidence as BirthTimeConfidence,
  )
    ? (input.birthTimeConfidence as BirthTimeConfidence)
    : input.hasTime
      ? "exact_recalled"
      : "unknown";

  let score = CONFIDENCE_SCORES[confidence];
  if (!input.hasCoordinates) score -= 15;
  score = Math.max(0, Math.min(100, score));

  const timeDependentSafe =
    confidence !== "unknown" && confidence !== "approximate_within_1_hour" && input.hasCoordinates;
  const moonDegreePrecise = confidence !== "unknown";

  const limitations: string[] = [];
  if (confidence === "unknown") {
    limitations.push(
      "Birth time unknown: houses, Ascendant, Midheaven, angles, and Human Design profile/variables are computed for noon and should not be relied on. Sign placements and aspects (except the Moon within ±6°) remain valid.",
    );
  } else if (confidence === "approximate_within_1_hour") {
    limitations.push(
      "Birth time approximate (±1h): house cusps may shift by up to two houses' worth of degrees; the Ascendant can change sign. Treat house-based claims as provisional.",
    );
  } else if (confidence === "approximate_within_15_minutes") {
    limitations.push(
      "Birth time approximate (±15m): the Ascendant may shift a few degrees; late/early-degree angles could change sign.",
    );
  } else if (confidence === "rectified") {
    limitations.push("Birth time is rectified, not documented — house-based conclusions carry the rectification's assumptions.");
  }
  if (!input.hasCoordinates) {
    limitations.push("No birth coordinates stored: houses computed for a default location. Set exact coordinates for precise angles.");
  }

  return {
    score,
    birthTimeConfidence: confidence,
    hasCoordinates: input.hasCoordinates,
    timeDependentSafe,
    moonDegreePrecise,
    limitations,
  };
}

/** Standard disclaimers required by the interpretation standard. */
export const DISCLAIMERS = {
  general:
    "Oralia's interpretations describe tendencies and timing conditions from symbolic systems, not proven causal facts or fixed fate. Use them as structured reflection, alongside your own judgment.",
  health:
    "This section is reflective and educational, not medical advice or diagnosis. Consult qualified professionals for health decisions.",
  financial:
    "This section describes psychological and timing tendencies, not regulated financial advice. Consult qualified professionals for investment decisions.",
  relationship:
    "Compatibility analysis describes dynamics and tendencies, not certainties about another person's feelings or behavior.",
  decision:
    "Symbolic timing cannot answer questions of fact, legality, safety, or another person's intent. Do practical due diligence regardless of the score.",
};
