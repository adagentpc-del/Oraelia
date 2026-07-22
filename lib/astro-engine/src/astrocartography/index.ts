import { allPositions, PLANETARY_BODIES, type Body } from "../core/ephemeris";
import { gmst, meanObliquity } from "../core/julian";
import { atan2Deg, cosDeg, norm180, norm360, round, sinDeg, tanDeg, clamp } from "../core/math";
import { computeAngles } from "../core/houses";
import type { NatalChart } from "../natal/chart";
import { WORLD_CITIES, type City } from "./cities";

export type LineKind = "ASC" | "DSC" | "MC" | "IC";

export interface AstroLine {
  body: Body;
  kind: LineKind;
  /** For MC/IC: constant geographic longitude of the line. */
  longitude?: number;
  /** For ASC/DSC: sampled polyline of [latitude, longitude] pairs. */
  points?: [number, number][];
}

interface EquatorialCoords {
  ra: number;
  decl: number;
}

function equatorialOf(longitude: number, latitude: number, jd: number): EquatorialCoords {
  const eps = meanObliquity(jd);
  const ra = atan2Deg(
    sinDeg(longitude) * cosDeg(eps) - tanDeg(latitude) * sinDeg(eps),
    cosDeg(longitude),
  );
  const decl =
    Math.asin(
      sinDeg(latitude) * cosDeg(eps) + cosDeg(latitude) * sinDeg(eps) * sinDeg(longitude),
    ) *
    (180 / Math.PI);
  return { ra: norm360(ra), decl };
}

/**
 * Astrocartography lines for a natal chart.
 * MC line: geographic longitude where the planet culminates (RA = LST).
 * ASC line: for each latitude, longitude where the planet rises.
 */
export function computeAstroLines(chart: NatalChart): AstroLine[] {
  const jd = chart.julianDay;
  const gst = gmst(jd);
  const lines: AstroLine[] = [];

  for (const placed of chart.bodies) {
    if (!PLANETARY_BODIES.includes(placed.body)) continue;
    const eq = equatorialOf(placed.longitude, placed.latitude, jd);

    const mcLongitude = norm180(eq.ra - gst);
    lines.push({ body: placed.body, kind: "MC", longitude: round(mcLongitude, 2) });
    lines.push({ body: placed.body, kind: "IC", longitude: round(norm180(mcLongitude + 180), 2) });

    const ascPoints: [number, number][] = [];
    const dscPoints: [number, number][] = [];
    for (let lat = -66; lat <= 66; lat += 2) {
      const x = -tanDeg(lat) * tanDeg(eq.decl);
      if (Math.abs(x) > 1) continue;
      const h0 = Math.acos(x) * (180 / Math.PI); // semi-diurnal arc in hour angle
      // Rising: hour angle = -H0 → LST = RA - H0 → geographic lon = LST - GST.
      const risingLon = norm180(eq.ra - h0 - gst);
      const settingLon = norm180(eq.ra + h0 - gst);
      ascPoints.push([lat, round(risingLon, 2)]);
      dscPoints.push([lat, round(settingLon, 2)]);
    }
    lines.push({ body: placed.body, kind: "ASC", points: ascPoints });
    lines.push({ body: placed.body, kind: "DSC", points: dscPoints });
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Relocation & city scoring
// ---------------------------------------------------------------------------

export interface LineInfluence {
  body: Body;
  kind: LineKind;
  /** Distance from the line in degrees of longitude (approx). */
  orb: number;
  strength: number; // 0-100
}

export interface CityScore {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  influences: LineInfluence[];
  scores: {
    career: number;
    love: number;
    money: number;
    creativity: number;
    family: number;
    health: number;
    visibility: number;
    spirituality: number;
    adventure: number;
    business: number;
    overall: number;
  };
  relocatedAscendant: string;
  relocatedMidheaven: string;
  summary: string;
}

/** Angularity influence of each planet at a location (within ~8° orb of an angle line). */
function influencesAt(chart: NatalChart, city: City): LineInfluence[] {
  const jd = chart.julianDay;
  const gst = gmst(jd);
  const out: LineInfluence[] = [];
  const ORB = 8;

  for (const placed of chart.bodies) {
    if (!PLANETARY_BODIES.includes(placed.body)) continue;
    const eq = equatorialOf(placed.longitude, placed.latitude, jd);

    const mcLon = norm180(eq.ra - gst);
    const icLon = norm180(mcLon + 180);
    const dMc = Math.abs(norm180(city.longitude - mcLon));
    const dIc = Math.abs(norm180(city.longitude - icLon));
    if (dMc <= ORB) out.push({ body: placed.body, kind: "MC", orb: round(dMc, 1), strength: round((1 - dMc / ORB) * 100, 0) });
    if (dIc <= ORB) out.push({ body: placed.body, kind: "IC", orb: round(dIc, 1), strength: round((1 - dIc / ORB) * 100, 0) });

    const x = -tanDeg(city.latitude) * tanDeg(eq.decl);
    if (Math.abs(x) <= 1) {
      const h0 = Math.acos(x) * (180 / Math.PI);
      const ascLon = norm180(eq.ra - h0 - gst);
      const dscLon = norm180(eq.ra + h0 - gst);
      const dAsc = Math.abs(norm180(city.longitude - ascLon));
      const dDsc = Math.abs(norm180(city.longitude - dscLon));
      if (dAsc <= ORB) out.push({ body: placed.body, kind: "ASC", orb: round(dAsc, 1), strength: round((1 - dAsc / ORB) * 100, 0) });
      if (dDsc <= ORB) out.push({ body: placed.body, kind: "DSC", orb: round(dDsc, 1), strength: round((1 - dDsc / ORB) * 100, 0) });
    }
  }
  return out.sort((a, b) => b.strength - a.strength);
}

interface CategoryEffect {
  career: number;
  love: number;
  money: number;
  creativity: number;
  family: number;
  health: number;
  visibility: number;
  spirituality: number;
  adventure: number;
  business: number;
}

const PLANET_EFFECTS: Partial<Record<Body, Partial<CategoryEffect>>> = {
  Sun: { career: 3, visibility: 4, business: 2, health: 1, creativity: 2 },
  Moon: { family: 4, love: 2, health: 1, spirituality: 2 },
  Mercury: { business: 3, career: 2, creativity: 2, visibility: 1 },
  Venus: { love: 4, money: 3, creativity: 3, family: 1 },
  Mars: { career: 2, adventure: 4, business: 2, health: -1, love: -1 },
  Jupiter: { money: 4, career: 3, adventure: 2, business: 3, visibility: 2, spirituality: 2 },
  Saturn: { career: 2, business: 1, love: -2, health: -1, family: -1 },
  Uranus: { creativity: 3, adventure: 3, love: -1, business: 1 },
  Neptune: { spirituality: 4, creativity: 3, business: -2, money: -2 },
  Pluto: { career: 1, money: 2, love: -2, visibility: 1, health: -1 },
};

const KIND_MULTIPLIER: Record<LineKind, number> = { ASC: 1, MC: 1, DSC: 0.8, IC: 0.8 };

export function scoreCity(chart: NatalChart, city: City): CityScore {
  const influences = influencesAt(chart, city);
  const base: CategoryEffect = {
    career: 55, love: 55, money: 55, creativity: 55, family: 55,
    health: 60, visibility: 50, spirituality: 50, adventure: 50, business: 55,
  };

  for (const inf of influences) {
    const effects = PLANET_EFFECTS[inf.body];
    if (!effects) continue;
    const mult = (inf.strength / 100) * KIND_MULTIPLIER[inf.kind] * 3;
    for (const [key, value] of Object.entries(effects)) {
      if (key in base && typeof value === "number") {
        base[key as keyof CategoryEffect] += value * mult;
      }
    }
    // DSC lines emphasize relationships, IC home/family.
    if (inf.kind === "DSC") base.love += (inf.strength / 100) * 4;
    if (inf.kind === "IC") base.family += (inf.strength / 100) * 4;
    if (inf.kind === "MC") {
      base.career += (inf.strength / 100) * 4;
      base.visibility += (inf.strength / 100) * 3;
    }
  }

  const scores = Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, round(clamp(v, 5, 98), 0)]),
  ) as unknown as CityScore["scores"];
  scores.overall = round(
    (scores.career + scores.love + scores.money + scores.creativity + scores.family +
      scores.health + scores.visibility + scores.spirituality + scores.adventure + scores.business) / 10,
    0,
  );

  const relocated = computeAngles(chart.julianDay, city.latitude, city.longitude);
  const top = influences[0];
  const summary = top
    ? `${top.body} ${top.kind} line (${top.orb}° orb) dominates here — ${lineMeaning(top.body, top.kind)}`
    : "No major planetary lines within orb — a neutral location where your natal chart expresses without amplification.";

  return {
    city: city.name,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    influences: influences.slice(0, 5),
    scores,
    relocatedAscendant: formatZodiac(relocated.ascendant),
    relocatedMidheaven: formatZodiac(relocated.midheaven),
    summary,
  };
}

function formatZodiac(longitude: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const deg = norm360(longitude);
  return `${Math.floor(deg % 30)}° ${signs[Math.floor(deg / 30)]}`;
}

function lineMeaning(body: Body, kind: LineKind): string {
  const meanings: Partial<Record<Body, Record<LineKind, string>>> = {
    Sun: {
      ASC: "you become more visible, vital and self-directed; a place to be seen as yourself.",
      MC: "career recognition accelerates; authority and reputation build fast here.",
      DSC: "you attract strong, proud partners; relationships define the experience.",
      IC: "a deep sense of belonging; good for building a proud home base.",
    },
    Moon: {
      ASC: "emotions run closer to the surface; the public responds to your softness.",
      MC: "a public-facing, nurturing career flourishes; you become known to many.",
      DSC: "emotionally bonded partnerships; you attract caretakers.",
      IC: "the most 'home' you will feel anywhere; ideal for family and roots.",
    },
    Venus: {
      ASC: "charm, beauty and likability amplify; people say yes to you here.",
      MC: "a career in beauty, art, diplomacy or luxury thrives; money follows grace.",
      DSC: "one of the best lines for love and marriage anywhere on Earth.",
      IC: "a beautiful, harmonious home; property and domestic pleasure favored.",
    },
    Mars: {
      ASC: "drive and courage spike — with a temper to match; great for competing.",
      MC: "ambitious, aggressive career push; you fight your way up fast.",
      DSC: "passionate but combative partnerships; attraction runs hot.",
      IC: "domestic friction; better for training camps than family homes.",
    },
    Jupiter: {
      ASC: "confidence, luck and opportunity expand; doors open on arrival.",
      MC: "the classic success line — promotion, growth, abundance in career.",
      DSC: "generous, fortunate partners; excellent for business partnerships.",
      IC: "a lucky, expansive home life; property grows in value.",
    },
    Saturn: {
      ASC: "life gets serious — discipline, tests, and slow-earned respect.",
      MC: "heavy responsibility and slow, durable achievement; mastery through effort.",
      DSC: "karmic, binding partnerships; commitments made here last.",
      IC: "isolation or heaviness at home; better for solitary building phases.",
    },
    Uranus: {
      ASC: "reinvention — you become someone new here; freedom over stability.",
      MC: "sudden career changes, innovation, tech and disruption favored.",
      DSC: "electric, unconventional attractions; unstable but awakening bonds.",
      IC: "restless home life; frequent moves and unusual living situations.",
    },
    Neptune: {
      ASC: "dreamy, artistic, spiritual — and prone to illusion; keep boundaries.",
      MC: "creative or spiritual vocation shines; business clarity suffers.",
      DSC: "romantic idealization; soulmate feelings that need reality-testing.",
      IC: "a sanctuary home near water; retreat, art and meditation flourish.",
    },
    Pluto: {
      ASC: "an intensity upgrade — power, magnetism and profound self-transformation.",
      MC: "power careers and empire building; beware power struggles with authority.",
      DSC: "transformative, all-consuming relationships; profound but demanding.",
      IC: "deep ancestral excavation; a place to transform your foundations.",
    },
    Mercury: {
      ASC: "your voice sharpens; ideal for writers, traders and communicators.",
      MC: "commerce, media and intellectual careers accelerate.",
      DSC: "partnerships built on conversation; you attract thinkers.",
      IC: "a busy, wordy home; ideal for studying and writing from home.",
    },
  };
  return meanings[body]?.[kind] ?? "a distinctive influence colors life here.";
}

export interface AstroMapResult {
  lines: AstroLine[];
  cityScores: CityScore[];
  bestFor: Record<string, { city: string; country: string; score: number }[]>;
}

export function computeAstroMap(chart: NatalChart): AstroMapResult {
  const lines = computeAstroLines(chart);
  const cityScores = WORLD_CITIES.map((c) => scoreCity(chart, c)).sort(
    (a, b) => b.scores.overall - a.scores.overall,
  );
  const categories = ["career", "love", "money", "creativity", "family", "health", "visibility", "spirituality", "adventure", "business"] as const;
  const bestFor: AstroMapResult["bestFor"] = {};
  for (const cat of categories) {
    bestFor[cat] = [...cityScores]
      .sort((a, b) => b.scores[cat] - a.scores[cat])
      .slice(0, 5)
      .map((c) => ({ city: c.city, country: c.country, score: c.scores[cat] }));
  }
  return { lines, cityScores, bestFor };
}

export { WORLD_CITIES };
export type { City };
