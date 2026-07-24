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
// Local space: compass directions of the planets from the birth place
// ---------------------------------------------------------------------------

export interface LocalSpaceLine {
  body: Body;
  /** Compass azimuth in degrees (0 = North, 90 = East). */
  azimuth: number;
  /** Altitude at birth (negative = below horizon). */
  altitude: number;
  compass: string;
  meaning: string;
}

const LS_MEANINGS: Partial<Record<Body, string>> = {
  Sun: "vitality and recognition flow from this direction — orient important rooms, offices, and journeys this way",
  Moon: "comfort and belonging — the direction for homes, retreats, and family visits",
  Mercury: "commerce and communication — good direction for offices, studies, errands",
  Venus: "pleasure, love, and beauty — dates, studios, and social life thrive along this line",
  Mars: "drive and challenge — gyms, competitions, and confrontations; energizing but abrasive",
  Jupiter: "opportunity and growth — travel and business development along this bearing tends to expand",
  Saturn: "discipline and burden — serious work gets done here; not a holiday direction",
  Uranus: "surprise and reinvention — novelty and disruption come from this bearing",
  Neptune: "imagination and dissolution — retreats and art, but double-check practical plans",
  Pluto: "intensity and transformation — powerful, consuming; travel this way changes you",
};

function compassName(azimuth: number): string {
  const names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return names[Math.round(norm360(azimuth) / 22.5) % 16]!;
}

/** Local-space lines: horizon-system azimuths of each planet at birth. */
export function localSpaceLines(
  chart: NatalChart,
  latitude: number,
  longitude: number,
): LocalSpaceLine[] {
  const jd = chart.julianDay;
  const lstDeg = gmst(jd) + longitude;
  const out: LocalSpaceLine[] = [];
  for (const placed of chart.bodies) {
    if (!PLANETARY_BODIES.includes(placed.body)) continue;
    const shift = chart.meta.ayanamsaDegrees ?? 0;
    const eq = equatorialOf(norm360(placed.longitude + shift), placed.latitude, jd);
    const hourAngle = norm360(lstDeg - eq.ra);
    const sinAlt =
      sinDeg(latitude) * sinDeg(eq.decl) + cosDeg(latitude) * cosDeg(eq.decl) * cosDeg(hourAngle);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * (180 / Math.PI);
    // Azimuth measured from North, increasing eastward.
    const azimuth = norm360(
      Math.atan2(
        -sinDeg(hourAngle) * cosDeg(eq.decl),
        sinDeg(eq.decl) * cosDeg(latitude) - cosDeg(eq.decl) * sinDeg(latitude) * cosDeg(hourAngle),
      ) * (180 / Math.PI),
    );
    out.push({
      body: placed.body,
      azimuth: round(azimuth, 1),
      altitude: round(altitude, 1),
      compass: compassName(azimuth),
      meaning: `${compassName(azimuth)} (${round(azimuth, 0)}°): ${LS_MEANINGS[placed.body] ?? "a distinctive influence"}.`,
    });
  }
  return out.sort((a, b) => a.azimuth - b.azimuth);
}

// ---------------------------------------------------------------------------
// Parans: latitudes where two planets are simultaneously angular
// ---------------------------------------------------------------------------

export interface Paran {
  bodyA: Body;
  kindA: "MC" | "IC";
  bodyB: Body;
  kindB: "ASC" | "DSC";
  latitude: number;
  meaning: string;
}

const PARAN_PAIR_MEANINGS: Partial<Record<string, string>> = {
  "Sun-Jupiter": "success and visibility combine — a latitude band of recognition",
  "Venus-Jupiter": "love and abundance cross — among the most fortunate paran bands",
  "Sun-Saturn": "authority earned under pressure — achievement with weight",
  "Moon-Venus": "emotional sweetness — a comfort and belonging band",
  "Mars-Saturn": "grinding friction — a demanding band best used for hard training, not settling",
  "Sun-Pluto": "power and intensity — transformation follows you at this latitude",
  "Venus-Mars": "charged attraction — romance and creative heat",
  "Moon-Saturn": "emotional seriousness — solitude and duty color life here",
};

/**
 * Paran latitudes: where one planet's meridian line (MC/IC) crosses another's
 * horizon line (ASC/DSC). Influence is conventionally felt in a ~1° latitude
 * band around the crossing, anywhere along that latitude.
 */
export function computeParans(chart: NatalChart): Paran[] {
  const jd = chart.julianDay;
  const gst = gmst(jd);
  const shift = chart.meta.ayanamsaDegrees ?? 0;
  const planets = chart.bodies.filter((b) => PLANETARY_BODIES.includes(b.body));
  const out: Paran[] = [];

  const equatorial = new Map<Body, EquatorialCoords>();
  for (const p of planets) {
    equatorial.set(p.body, equatorialOf(norm360(p.longitude + shift), p.latitude, jd));
  }

  const risingLon = (eq: EquatorialCoords, lat: number, setting: boolean): number | null => {
    const x = -tanDeg(lat) * tanDeg(eq.decl);
    if (Math.abs(x) > 1) return null;
    const h0 = Math.acos(x) * (180 / Math.PI);
    return norm180(eq.ra + (setting ? h0 : -h0) - gst);
  };

  for (const a of planets) {
    const eqA = equatorial.get(a.body)!;
    for (const kindA of ["MC", "IC"] as const) {
      const meridianLon = norm180(eqA.ra - gst + (kindA === "IC" ? 180 : 0));
      for (const b of planets) {
        if (b.body === a.body) continue;
        const eqB = equatorial.get(b.body)!;
        for (const kindB of ["ASC", "DSC"] as const) {
          let prev: number | null = null;
          for (let lat = -66; lat <= 66; lat += 0.5) {
            const lon = risingLon(eqB, lat, kindB === "DSC");
            if (lon === null) {
              prev = null;
              continue;
            }
            const diff = norm180(lon - meridianLon);
            if (prev !== null && Math.sign(diff) !== Math.sign(prev) && Math.abs(diff - prev) < 90) {
              const frac = Math.abs(prev) / (Math.abs(prev) + Math.abs(diff) || 1);
              const paranLat = round(lat - 0.5 + frac * 0.5, 1);
              const key = `${a.body}-${b.body}`;
              const keyRev = `${b.body}-${a.body}`;
              out.push({
                bodyA: a.body,
                kindA,
                bodyB: b.body,
                kindB,
                latitude: paranLat,
                meaning:
                  PARAN_PAIR_MEANINGS[key] ?? PARAN_PAIR_MEANINGS[keyRev] ??
                  `${a.body} and ${b.body} act together along this latitude band`,
              });
            }
            prev = diff;
          }
        }
      }
    }
  }
  // Keep the strongest storyline: dedupe identical pairs at near-identical latitudes.
  const seen = new Set<string>();
  return out
    .filter((p) => {
      const key = `${p.bodyA}-${p.bodyB}-${Math.round(p.latitude)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((x, y) => x.latitude - y.latitude);
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
