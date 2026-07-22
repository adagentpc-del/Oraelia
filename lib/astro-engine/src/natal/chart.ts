import {
  ALL_BODIES,
  allPositions,
  isOutOfBounds,
  moonPhase,
  type Body,
  type EclipticPosition,
} from "../core/ephemeris";
import { julianDayFromMoment, type BirthMoment } from "../core/julian";
import { angularSeparation, norm360, round } from "../core/math";
import { computeHouses, houseOf, type HouseData, type HouseSystem } from "../core/houses";
import {
  EXALTATIONS,
  SIGN_ELEMENTS,
  SIGN_MODALITIES,
  SIGN_RULERS,
  TRADITIONAL_RULERS,
  degreeInSign,
  formatDegree,
  isAnaretic,
  isCriticalDegree,
  signOf,
  type Element,
  type Modality,
  type Sign,
} from "./zodiac";
import {
  chartShape,
  findAspects,
  findPatterns,
  type Aspect,
  type AspectPattern,
  type BodyLongitude,
  type ChartShape,
} from "./aspects";

export type Dignity = "domicile" | "exaltation" | "detriment" | "fall" | "peregrine";

export interface PlacedBody {
  body: Body;
  longitude: number;
  latitude: number;
  speed: number;
  declination: number;
  retrograde: boolean;
  outOfBounds: boolean;
  sign: Sign;
  degreeInSign: number;
  formatted: string;
  house: number;
  dignity: Dignity;
  angular: boolean;
  anaretic: boolean;
  criticalDegree: boolean;
  /** 0-100 composite strength from dignity, angularity, speed, aspects. */
  strength: number;
}

export interface ArabicParts {
  fortune: number;
  spirit: number;
  eros: number;
  marriage: number;
}

export interface ChartBalance {
  elements: Record<Element, number>;
  modalities: Record<Modality, number>;
  hemispheres: { eastern: number; western: number; northern: number; southern: number };
  quadrants: { first: number; second: number; third: number; fourth: number };
  dominantElement: Element;
  dominantModality: Modality;
  missingElements: Element[];
}

export interface DispositorInfo {
  chains: Record<string, Body>;
  finalDispositor: Body | null;
  mutualReceptions: [Body, Body][];
}

export interface NatalChart {
  julianDay: number;
  isDayChart: boolean;
  houseSystem: HouseSystem;
  houses: HouseData;
  bodies: PlacedBody[];
  aspects: Aspect[];
  patterns: AspectPattern[];
  shape: { shape: ChartShape; description: string };
  balance: ChartBalance;
  dispositors: DispositorInfo;
  chartRuler: Body;
  ascendantSign: Sign;
  sunSign: Sign;
  moonSign: Sign;
  signature: { sign: Sign; element: Element; modality: Modality };
  dominantPlanets: { body: Body; score: number }[];
  arabicParts: ArabicParts;
  moonPhase: { angle: number; name: string; illumination: number };
}

const CHART_BODIES: Body[] = ALL_BODIES;

function dignityOf(body: Body, sign: Sign): Dignity {
  if (TRADITIONAL_RULERS[sign] === body || SIGN_RULERS[sign] === body) return "domicile";
  if (EXALTATIONS[body] === sign) return "exaltation";
  const opposite = ((idx: number) => (idx + 6) % 12)(
    ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].indexOf(sign),
  );
  const oppSign = (
    ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"] as Sign[]
  )[opposite]!;
  if (TRADITIONAL_RULERS[oppSign] === body || SIGN_RULERS[oppSign] === body) return "detriment";
  if (EXALTATIONS[body] === oppSign) return "fall";
  return "peregrine";
}

function isAngularHouse(house: number): boolean {
  return house === 1 || house === 4 || house === 7 || house === 10;
}

const AVERAGE_SPEED: Partial<Record<Body, number>> = {
  Sun: 0.9856,
  Moon: 13.176,
  Mercury: 1.383,
  Venus: 1.2,
  Mars: 0.524,
  Jupiter: 0.083,
  Saturn: 0.033,
  Uranus: 0.012,
  Neptune: 0.006,
  Pluto: 0.004,
};

function computeStrength(placed: Omit<PlacedBody, "strength">, aspects: Aspect[]): number {
  let score = 40;
  switch (placed.dignity) {
    case "domicile":
      score += 25;
      break;
    case "exaltation":
      score += 20;
      break;
    case "detriment":
      score -= 12;
      break;
    case "fall":
      score -= 15;
      break;
    default:
      break;
  }
  if (placed.angular) score += 15;
  if (placed.house === 10 || placed.house === 1) score += 5;
  if (placed.retrograde) score -= 5;
  const avg = AVERAGE_SPEED[placed.body];
  if (avg && Math.abs(placed.speed) > avg * 1.1) score += 5;
  const aspectCount = aspects.filter((a) => a.a === placed.body || a.b === placed.body).length;
  score += Math.min(10, aspectCount * 1.5);
  if (placed.outOfBounds) score += 5;
  return round(Math.max(0, Math.min(100, score)), 0);
}

export function computeNatalChart(
  moment: BirthMoment,
  houseSystem: HouseSystem = "placidus",
): NatalChart {
  const jd = julianDayFromMoment(moment);
  const positions = allPositions(jd, CHART_BODIES);
  const houses = computeHouses(jd, moment.latitude, moment.longitude, houseSystem);

  const sun = positions.Sun!;
  const sunHouse = houseOf(sun.longitude, houses.cusps);
  const isDayChart = sunHouse >= 7; // Sun above the horizon (houses 7-12)

  const longitudesForAspects: BodyLongitude[] = CHART_BODIES.map((b) => ({
    body: b,
    longitude: positions[b]!.longitude,
    speed: positions[b]!.speed,
  }));
  const aspects = findAspects(longitudesForAspects);
  const patterns = findPatterns(longitudesForAspects, aspects);
  const shape = chartShape(longitudesForAspects);

  const bodies: PlacedBody[] = CHART_BODIES.map((b) => {
    const pos: EclipticPosition = positions[b]!;
    const sign = signOf(pos.longitude);
    const house = houseOf(pos.longitude, houses.cusps);
    const partial = {
      body: b,
      longitude: round(pos.longitude, 4),
      latitude: round(pos.latitude, 4),
      speed: round(pos.speed, 4),
      declination: round(pos.declination, 3),
      retrograde: pos.retrograde && b !== "Sun" && b !== "Moon",
      outOfBounds: isOutOfBounds(pos.declination, jd),
      sign,
      degreeInSign: round(degreeInSign(pos.longitude), 2),
      formatted: formatDegree(pos.longitude),
      house,
      dignity: dignityOf(b, sign),
      angular: isAngularHouse(house),
      anaretic: isAnaretic(pos.longitude),
      criticalDegree: isCriticalDegree(pos.longitude),
    };
    return { ...partial, strength: computeStrength(partial, aspects) };
  });

  const balance = computeBalance(bodies, houses);
  const dispositors = computeDispositors(bodies);
  const ascendantSign = signOf(houses.angles.ascendant);
  const chartRuler = SIGN_RULERS[ascendantSign];
  const dominantPlanets = bodies
    .filter((b) => AVERAGE_SPEED[b.body] !== undefined)
    .map((b) => ({ body: b.body, score: b.strength }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const asc = houses.angles.ascendant;
  const moon = positions.Moon!;
  const venus = positions.Venus!;
  const arabicParts: ArabicParts = {
    fortune: round(
      norm360(isDayChart ? asc + moon.longitude - sun.longitude : asc + sun.longitude - moon.longitude),
      2,
    ),
    spirit: round(
      norm360(isDayChart ? asc + sun.longitude - moon.longitude : asc + moon.longitude - sun.longitude),
      2,
    ),
    eros: round(norm360(asc + venus.longitude - sun.longitude), 2),
    marriage: round(norm360(asc + houses.cusps[6]! - venus.longitude), 2),
  };

  return {
    julianDay: jd,
    isDayChart,
    houseSystem,
    houses,
    bodies,
    aspects,
    patterns,
    shape,
    balance,
    dispositors,
    chartRuler,
    ascendantSign,
    sunSign: signOf(sun.longitude),
    moonSign: signOf(moon.longitude),
    signature: computeSignature(balance),
    dominantPlanets,
    arabicParts,
    moonPhase: moonPhase(jd),
  };
}

const ELEMENT_TO_SIGNS: Record<Element, Sign[]> = {
  Fire: ["Aries", "Leo", "Sagittarius"],
  Earth: ["Taurus", "Virgo", "Capricorn"],
  Air: ["Gemini", "Libra", "Aquarius"],
  Water: ["Cancer", "Scorpio", "Pisces"],
};

function computeSignature(balance: ChartBalance): { sign: Sign; element: Element; modality: Modality } {
  const element = balance.dominantElement;
  const modality = balance.dominantModality;
  const sign =
    ELEMENT_TO_SIGNS[element].find((s) => SIGN_MODALITIES[s] === modality) ?? "Aries";
  return { sign, element, modality };
}

const WEIGHTED_BODIES: Body[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

function computeBalance(bodies: PlacedBody[], houses: HouseData): ChartBalance {
  const elements: Record<Element, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalities: Record<Modality, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  const hemispheres = { eastern: 0, western: 0, northern: 0, southern: 0 };
  const quadrants = { first: 0, second: 0, third: 0, fourth: 0 };

  for (const b of bodies) {
    if (!WEIGHTED_BODIES.includes(b.body)) continue;
    const weight = b.body === "Sun" || b.body === "Moon" ? 2 : 1;
    elements[SIGN_ELEMENTS[b.sign]] += weight;
    modalities[SIGN_MODALITIES[b.sign]] += weight;
    // Hemisphere by house: eastern = 10-12 + 1-3, southern = 7-12 (above horizon).
    const h = b.house;
    if (h >= 10 || h <= 3) hemispheres.eastern += 1;
    else hemispheres.western += 1;
    if (h >= 7) hemispheres.southern += 1;
    else hemispheres.northern += 1;
    if (h <= 3) quadrants.first += 1;
    else if (h <= 6) quadrants.second += 1;
    else if (h <= 9) quadrants.third += 1;
    else quadrants.fourth += 1;
  }
  void houses;

  const dominantElement = (Object.entries(elements) as [Element, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0]![0];
  const dominantModality = (Object.entries(modalities) as [Modality, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0]![0];
  const missingElements = (Object.entries(elements) as [Element, number][])
    .filter(([, count]) => count === 0)
    .map(([el]) => el);

  return { elements, modalities, hemispheres, quadrants, dominantElement, dominantModality, missingElements };
}

function computeDispositors(bodies: PlacedBody[]): DispositorInfo {
  const chains: Record<string, Body> = {};
  const placedBy = new Map<Body, Sign>();
  for (const b of bodies) {
    if (WEIGHTED_BODIES.includes(b.body)) placedBy.set(b.body, b.sign);
  }
  for (const [body, sign] of placedBy) {
    chains[body] = SIGN_RULERS[sign];
  }

  // Mutual receptions: A in B's sign while B is in A's sign.
  const mutualReceptions: [Body, Body][] = [];
  const entries = [...placedBy.entries()];
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const [bodyA, signA] = entries[i]!;
      const [bodyB, signB] = entries[j]!;
      if (SIGN_RULERS[signA] === bodyB && SIGN_RULERS[signB] === bodyA) {
        mutualReceptions.push([bodyA, bodyB]);
      }
    }

  // Final dispositor: a planet in its own sign that everything chains to.
  let finalDispositor: Body | null = null;
  const selfRuled = entries.filter(([body, sign]) => SIGN_RULERS[sign] === body).map(([b]) => b);
  if (selfRuled.length === 1) {
    const candidate = selfRuled[0]!;
    const reaches = (start: Body, seen: Set<Body>): boolean => {
      if (start === candidate) return true;
      if (seen.has(start)) return false;
      seen.add(start);
      const next = chains[start];
      return next ? reaches(next, seen) : false;
    };
    if (entries.every(([b]) => reaches(b, new Set()))) finalDispositor = candidate;
  }

  return { chains, finalDispositor, mutualReceptions };
}

export { angularSeparation };
