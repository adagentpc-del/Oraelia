const MASTER_NUMBERS = [11, 22, 33];
const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19];

/** Reduce to a single digit, preserving master numbers. */
export function reduceNumber(n: number, keepMasters = true): number {
  let value = Math.abs(Math.round(n));
  while (value > 9) {
    if (keepMasters && MASTER_NUMBERS.includes(value)) return value;
    value = String(value)
      .split("")
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return value;
}

const LETTER_VALUES: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function lettersOf(name: string): string[] {
  return name.toLowerCase().replace(/[^a-z]/g, "").split("");
}

function sumLetters(letters: string[]): number {
  return letters.reduce((sum, l) => sum + (LETTER_VALUES[l] ?? 0), 0);
}

export interface CoreNumbers {
  lifePath: number;
  lifePathKarmicDebt: number | null;
  expression: number;
  soulUrge: number;
  personality: number;
  birthday: number;
  maturity: number;
  isMasterLifePath: boolean;
}

function parseBirthDate(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  return { year: y ?? 2000, month: m ?? 1, day: d ?? 1 };
}

/** Life Path via the standard three-group reduction, detecting karmic debt. */
export function lifePathNumber(birthDate: string): { value: number; karmicDebt: number | null } {
  const { year, month, day } = parseBirthDate(birthDate);
  const reducedMonth = reduceNumber(month);
  const reducedDay = reduceNumber(day);
  const reducedYear = reduceNumber(year);
  const total = reducedMonth + reducedDay + reducedYear;
  const karmicDebt = KARMIC_DEBT_NUMBERS.includes(total)
    ? total
    : KARMIC_DEBT_NUMBERS.includes(day)
      ? day
      : null;
  return { value: reduceNumber(total), karmicDebt };
}

export function coreNumbers(fullName: string, birthDate: string): CoreNumbers {
  const { day } = parseBirthDate(birthDate);
  const letters = lettersOf(fullName);
  const lp = lifePathNumber(birthDate);
  const expression = reduceNumber(sumLetters(letters));
  const soulUrge = reduceNumber(sumLetters(letters.filter((l) => VOWELS.has(l))));
  const personality = reduceNumber(sumLetters(letters.filter((l) => !VOWELS.has(l))));
  return {
    lifePath: lp.value,
    lifePathKarmicDebt: lp.karmicDebt,
    expression,
    soulUrge,
    personality,
    birthday: reduceNumber(day),
    maturity: reduceNumber(lp.value + expression),
    isMasterLifePath: MASTER_NUMBERS.includes(lp.value),
  };
}

export interface ChallengeAndPinnacles {
  challenges: number[];
  pinnacles: { number: number; fromAge: number; toAge: number | null }[];
  cycles: { number: number; phase: string; fromAge: number; toAge: number | null }[];
}

export function challengesAndPinnacles(birthDate: string): ChallengeAndPinnacles {
  const { year, month, day } = parseBirthDate(birthDate);
  const m = reduceNumber(month, false);
  const d = reduceNumber(day, false);
  const y = reduceNumber(year, false);

  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  const challenges = [
    reduceNumber(c1, false),
    reduceNumber(c2, false),
    reduceNumber(Math.abs(c1 - c2), false),
    reduceNumber(Math.abs(m - y), false),
  ];

  const lp = lifePathNumber(birthDate).value;
  const firstPinnacleEnd = 36 - reduceNumber(lp, false);
  const p1 = reduceNumber(m + d);
  const p2 = reduceNumber(d + y);
  const p3 = reduceNumber(p1 + p2);
  const p4 = reduceNumber(m + y);
  const pinnacles = [
    { number: p1, fromAge: 0, toAge: firstPinnacleEnd },
    { number: p2, fromAge: firstPinnacleEnd + 1, toAge: firstPinnacleEnd + 9 },
    { number: p3, fromAge: firstPinnacleEnd + 10, toAge: firstPinnacleEnd + 18 },
    { number: p4, fromAge: firstPinnacleEnd + 19, toAge: null },
  ];

  const cycles = [
    { number: reduceNumber(month), phase: "Formative", fromAge: 0, toAge: firstPinnacleEnd },
    { number: reduceNumber(day), phase: "Productive", fromAge: firstPinnacleEnd + 1, toAge: firstPinnacleEnd + 27 },
    { number: reduceNumber(year), phase: "Harvest", fromAge: firstPinnacleEnd + 28, toAge: null },
  ];

  return { challenges, pinnacles, cycles };
}

export interface PersonalCycles {
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}

export function personalCycles(birthDate: string, onDate: string): PersonalCycles {
  const { month, day } = parseBirthDate(birthDate);
  const target = parseBirthDate(onDate);
  const personalYear = reduceNumber(
    reduceNumber(month, false) + reduceNumber(day, false) + reduceNumber(target.year, false),
  );
  const personalMonth = reduceNumber(personalYear + target.month);
  const personalDay = reduceNumber(personalMonth + target.day);
  return { personalYear, personalMonth, personalDay };
}

export interface NameScore {
  value: number;
  isMaster: boolean;
  karmicDebt: boolean;
  rating: number; // 0-100
  notes: string;
}

const FAVORABLE_BUSINESS = [1, 3, 5, 8, 22, 33];

/** Score any name (business, brand, baby) numerologically. */
export function scoreName(name: string, purpose: "business" | "brand" | "personal" = "business"): NameScore {
  const raw = sumLetters(lettersOf(name));
  const value = reduceNumber(raw);
  const isMaster = MASTER_NUMBERS.includes(value);
  const karmicDebt = KARMIC_DEBT_NUMBERS.includes(raw);
  let rating = 50;
  if (purpose === "business" || purpose === "brand") {
    if (FAVORABLE_BUSINESS.includes(value)) rating += 30;
    if (value === 8) rating += 10; // material mastery
    if (value === 7 || value === 9) rating -= 5; // inward / completion energies
  } else {
    if ([1, 2, 3, 6, 9, 11].includes(value)) rating += 25;
  }
  if (isMaster) rating += 10;
  if (karmicDebt) rating -= 20;
  rating = Math.max(0, Math.min(100, rating));
  const notes = karmicDebt
    ? `Carries karmic debt ${raw}: expect extra lessons around ${raw === 13 ? "discipline" : raw === 14 ? "freedom vs excess" : raw === 16 ? "ego and rebuilding" : "self-reliance"}.`
    : isMaster
      ? `Master number ${value}: high potential, high voltage — demands living up to it.`
      : `Reduces to ${value}.`;
  return { value, isMaster, karmicDebt, rating, notes };
}

/** Numerological compatibility between two names or numbers (0-100). */
export function nameCompatibility(nameA: string, nameB: string): { score: number; notes: string } {
  const a = reduceNumber(sumLetters(lettersOf(nameA)), false);
  const b = reduceNumber(sumLetters(lettersOf(nameB)), false);
  const harmonious: Record<number, number[]> = {
    1: [1, 3, 5, 9],
    2: [2, 4, 6, 8],
    3: [1, 3, 5, 6, 9],
    4: [2, 4, 7, 8],
    5: [1, 3, 5, 7, 9],
    6: [2, 3, 6, 9],
    7: [4, 5, 7],
    8: [2, 4, 8],
    9: [1, 3, 5, 6, 9],
  };
  const compatible = harmonious[a]?.includes(b) ?? false;
  const complementary = Math.abs(a - b) === 0 || (a + b) % 9 === 0;
  const score = compatible ? 80 + (complementary ? 10 : 0) : complementary ? 65 : 45;
  return {
    score,
    notes: compatible
      ? `${a} and ${b} share a natural rhythm — cooperation flows without forcing.`
      : `${a} and ${b} run on different frequencies — workable, but requires conscious translation of each other's priorities.`,
  };
}

/** Address / phone / plate scoring: digits only. */
export function scoreDigits(input: string, context: "address" | "phone" | "plate" = "address"): NameScore {
  const digits = input.replace(/\D/g, "");
  const lettersPart = sumLetters(lettersOf(input));
  const raw = digits.split("").reduce((s, d) => s + parseInt(d, 10), 0) + lettersPart;
  const value = reduceNumber(raw);
  const isMaster = MASTER_NUMBERS.includes(value);
  const karmicDebt = KARMIC_DEBT_NUMBERS.includes(raw);
  const homeFriendly = [1, 2, 3, 6, 8, 9];
  let rating = homeFriendly.includes(value) ? 75 : 55;
  if (context === "phone" && [5, 1, 8].includes(value)) rating += 10;
  if (karmicDebt) rating -= 15;
  if (isMaster) rating += 10;
  return {
    value,
    isMaster,
    karmicDebt,
    rating: Math.max(0, Math.min(100, rating)),
    notes: `Vibration ${value}${isMaster ? " (master)" : ""}${karmicDebt ? `, karmic debt ${raw}` : ""}.`,
  };
}

export interface LaunchDateScore {
  date: string;
  universalDay: number;
  personalDay: number;
  score: number;
  reasons: string[];
}

/** Rank candidate launch dates within a window for a given purpose. */
export function optimizeLaunchDate(
  birthDate: string,
  startDate: string,
  days: number,
  purpose: "business" | "creative" | "relationship" | "financial" = "business",
): LaunchDateScore[] {
  const results: LaunchDateScore[] = [];
  const start = new Date(`${startDate}T12:00:00Z`);
  const favored: Record<string, number[]> = {
    business: [1, 8, 22],
    creative: [3, 5, 11],
    relationship: [2, 6, 33],
    financial: [8, 4, 22],
  };
  for (let i = 0; i < Math.min(days, 120); i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const parts = iso.split("-").map((s) => parseInt(s, 10));
    const universalDay = reduceNumber(
      reduceNumber(parts[0]!, false) + (parts[1] ?? 1) + (parts[2] ?? 1),
    );
    const pc = personalCycles(birthDate, iso);
    let score = 50;
    const reasons: string[] = [];
    if (favored[purpose]!.includes(universalDay)) {
      score += 20;
      reasons.push(`Universal day ${universalDay} favors ${purpose} initiatives.`);
    }
    if (favored[purpose]!.includes(pc.personalDay)) {
      score += 20;
      reasons.push(`Your personal day ${pc.personalDay} aligns with this launch.`);
    }
    if (pc.personalDay === 1) {
      score += 10;
      reasons.push("Personal day 1: strongest day to begin anything new.");
    }
    if ([4, 7].includes(pc.personalDay) && purpose !== "financial") {
      score -= 10;
      reasons.push(`Personal day ${pc.personalDay} favors preparation over public moves.`);
    }
    if (KARMIC_DEBT_NUMBERS.includes(parts[2]! + parts[1]! + reduceNumber(parts[0]!, false))) {
      score -= 5;
    }
    results.push({ date: iso, universalDay, personalDay: pc.personalDay, score: Math.max(0, Math.min(100, score)), reasons });
  }
  return results.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Extended name analysis (v3): karmic lessons, hidden passion, cornerstone,
// balance, subconscious self, rational thought, Chaldean comparison, essences.
// ---------------------------------------------------------------------------

/** Chaldean letter values (no letter maps to 9, which is held sacred). */
const CHALDEAN_VALUES: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
};

export type YTreatment = "auto" | "vowel" | "consonant";

function isVowelLetter(letter: string, word: string, treatment: YTreatment): boolean {
  if (letter !== "y") return VOWELS.has(letter);
  if (treatment === "vowel") return true;
  if (treatment === "consonant") return false;
  // auto: treat y as a vowel when the word has no other vowel.
  return !word.split("").some((l) => VOWELS.has(l));
}

export interface ExtendedNameAnalysis {
  /** Digits 1-9 absent from the name — lessons the life keeps re-teaching. */
  karmicLessons: number[];
  /** Most frequent letter value — an intense, driving talent. */
  hiddenPassion: number;
  /** Sum of the initials of each name part. */
  balance: number;
  /** 9 minus the count of karmic lessons — resilience under crisis. */
  subconsciousSelf: number;
  /** First name total plus birth day — habitual thinking style. */
  rationalThought: number;
  cornerstone: string;
  capstone: string;
  firstVowel: string;
  /** Pythagorean vs Chaldean expression numbers for comparison. */
  pythagoreanExpression: number;
  chaldeanExpression: number;
  /** Letter-by-letter arithmetic so users can verify by hand. */
  workings: { letter: string; value: number }[];
}

export function extendedNameAnalysis(
  fullName: string,
  birthDate: string,
  yTreatment: YTreatment = "auto",
): ExtendedNameAnalysis {
  const words = fullName.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const letters = lettersOf(fullName);
  const values = letters.map((l) => LETTER_VALUES[l] ?? 0);

  const present = new Set(values);
  const karmicLessons = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !present.has(n));

  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const hiddenPassion = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? 0;

  const initials = words.map((w) => LETTER_VALUES[w[0]!] ?? 0);
  const balance = reduceNumber(initials.reduce((s, v) => s + v, 0), false);

  const subconsciousSelf = 9 - karmicLessons.length;

  const { day } = (() => {
    const [y, m, d] = birthDate.split("-").map((s) => parseInt(s, 10));
    void y; void m;
    return { day: d ?? 1 };
  })();
  const firstName = words[0] ?? "";
  const firstNameSum = firstName.split("").reduce((s, l) => s + (LETTER_VALUES[l] ?? 0), 0);
  const rationalThought = reduceNumber(firstNameSum + day);

  let firstVowelChar = "";
  outer: for (const word of words) {
    for (const letter of word) {
      if (isVowelLetter(letter, word, yTreatment)) {
        firstVowelChar = letter;
        break outer;
      }
    }
  }

  const chaldeanSum = letters.reduce((s, l) => s + (CHALDEAN_VALUES[l] ?? 0), 0);

  return {
    karmicLessons,
    hiddenPassion,
    balance,
    subconsciousSelf,
    rationalThought,
    cornerstone: (firstName[0] ?? "").toUpperCase(),
    capstone: (firstName[firstName.length - 1] ?? "").toUpperCase(),
    firstVowel: firstVowelChar.toUpperCase(),
    pythagoreanExpression: reduceNumber(values.reduce((s, v) => s + v, 0)),
    chaldeanExpression: reduceNumber(chaldeanSum),
    workings: letters.map((l) => ({ letter: l.toUpperCase(), value: LETTER_VALUES[l] ?? 0 })),
  };
}

export interface EssencePeriod {
  age: number;
  essence: number;
  activeLetters: string[];
}

/**
 * Essence cycles: each letter of each name part is active for as many years
 * as its value; the essence at an age is the sum of the active letters.
 */
export function essenceAtAge(fullName: string, age: number): EssencePeriod {
  const words = fullName.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const activeLetters: string[] = [];
  let essence = 0;
  for (const word of words) {
    const letters = word.split("").filter((l) => LETTER_VALUES[l]);
    if (!letters.length) continue;
    let cursor = 0;
    let remaining = age;
    for (let guard = 0; guard < 200; guard++) {
      const value = LETTER_VALUES[letters[cursor % letters.length]!]!;
      if (remaining < value) break;
      remaining -= value;
      cursor++;
    }
    const active = letters[cursor % letters.length]!;
    activeLetters.push(active.toUpperCase());
    essence += LETTER_VALUES[active]!;
  }
  return { age, essence: reduceNumber(essence), activeLetters };
}

export const NUMBER_MEANINGS: Record<number, { title: string; strengths: string; shadow: string; career: string }> = {
  1: {
    title: "The Pioneer",
    strengths: "Independent, original, self-starting; built to initiate and lead.",
    shadow: "Ego battles, isolation, refusing help even when it would multiply results.",
    career: "Founder, executive, solo practitioner, anything requiring first-mover courage.",
  },
  2: {
    title: "The Diplomat",
    strengths: "Partnership intelligence, timing, mediation, emotional attunement.",
    shadow: "Over-accommodation, indecision, absorbing others' moods as your own.",
    career: "Partnerships, negotiation, HR, counseling, high-trust client work.",
  },
  3: {
    title: "The Communicator",
    strengths: "Creative expression, charisma, wordcraft, natural marketing instinct.",
    shadow: "Scattered focus, performing instead of feeling, unfinished projects.",
    career: "Media, content, entertainment, sales, brand building, teaching.",
  },
  4: {
    title: "The Builder",
    strengths: "Systems, discipline, reliability; converts vision into infrastructure.",
    shadow: "Rigidity, overwork, mistaking the process for the purpose.",
    career: "Operations, engineering, finance, real estate, project management.",
  },
  5: {
    title: "The Freedom Agent",
    strengths: "Adaptability, persuasion, appetite for experience, quick learning.",
    shadow: "Restlessness, overindulgence, escaping commitment right before payoff.",
    career: "Sales, travel, media, entrepreneurship, anything with variety and motion.",
  },
  6: {
    title: "The Guardian",
    strengths: "Responsibility, aesthetic sense, service, magnetic warmth.",
    shadow: "Martyrdom, control disguised as care, perfectionism about others.",
    career: "Healthcare, education, design, hospitality, family business, community leadership.",
  },
  7: {
    title: "The Seeker",
    strengths: "Analysis, depth, research instinct, spiritual intelligence.",
    shadow: "Isolation, cynicism, analysis-paralysis, distrust of the material world.",
    career: "Research, science, strategy, psychology, technical mastery, writing.",
  },
  8: {
    title: "The Executive",
    strengths: "Material mastery, authority, scale; understands money and power as tools.",
    shadow: "Workaholism, control, measuring self-worth in net worth.",
    career: "Business leadership, finance, law, real estate, large organizations.",
  },
  9: {
    title: "The Humanitarian",
    strengths: "Compassion at scale, artistic breadth, wisdom from completed cycles.",
    shadow: "Drama in letting go, savior complex, diffusing energy across too many causes.",
    career: "Nonprofits, arts, medicine, teaching, international work, philanthropy.",
  },
  11: {
    title: "The Illuminator (Master)",
    strengths: "Visionary intuition, inspiration, magnetism; a channel for ideas ahead of their time.",
    shadow: "Nervous intensity, self-doubt, oscillating between brilliance and paralysis.",
    career: "Thought leadership, spiritual teaching, invention, art that moves culture.",
  },
  22: {
    title: "The Master Builder",
    strengths: "Turns visions into institutions; practical genius at civilization scale.",
    shadow: "Crushing self-pressure, or shrinking to an ordinary 4 to avoid the mission.",
    career: "Large-scale enterprise, infrastructure, movements, systems that outlive you.",
  },
  33: {
    title: "The Master Teacher",
    strengths: "Healing through uplift; service fused with creative mastery.",
    shadow: "Self-sacrifice to depletion; carrying everyone at the cost of the self.",
    career: "Teaching, healing arts, humanitarian leadership, transformational media.",
  },
};

export function numberMeaning(n: number) {
  return NUMBER_MEANINGS[n] ?? NUMBER_MEANINGS[reduceNumber(n, false)]!;
}
