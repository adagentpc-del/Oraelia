import { angularSeparation, norm360, round } from "../core/math";
import type { Body } from "../core/ephemeris";

export type AspectType =
  | "conjunction"
  | "opposition"
  | "square"
  | "trine"
  | "sextile"
  | "quincunx"
  | "semi-square"
  | "sesquiquadrate"
  | "quintile"
  | "biquintile"
  | "novile"
  | "semi-sextile";

export interface AspectDefinition {
  type: AspectType;
  angle: number;
  orb: number;
  /** -1 hard, +1 soft, 0 neutral/blended. */
  harmony: number;
  major: boolean;
}

export const ASPECT_DEFINITIONS: AspectDefinition[] = [
  { type: "conjunction", angle: 0, orb: 8, harmony: 0, major: true },
  { type: "opposition", angle: 180, orb: 8, harmony: -1, major: true },
  { type: "square", angle: 90, orb: 7, harmony: -1, major: true },
  { type: "trine", angle: 120, orb: 7, harmony: 1, major: true },
  { type: "sextile", angle: 60, orb: 5, harmony: 1, major: true },
  { type: "quincunx", angle: 150, orb: 3, harmony: -0.5, major: false },
  { type: "semi-square", angle: 45, orb: 2, harmony: -0.5, major: false },
  { type: "sesquiquadrate", angle: 135, orb: 2, harmony: -0.5, major: false },
  { type: "quintile", angle: 72, orb: 2, harmony: 0.5, major: false },
  { type: "biquintile", angle: 144, orb: 2, harmony: 0.5, major: false },
  { type: "novile", angle: 40, orb: 1.5, harmony: 0.5, major: false },
  { type: "semi-sextile", angle: 30, orb: 2, harmony: 0.25, major: false },
];

export interface Aspect {
  a: Body;
  b: Body;
  type: AspectType;
  angle: number;
  orb: number;
  applying: boolean;
  /** 0-100: tighter orb + heavier bodies = higher intensity. */
  intensity: number;
  /** -100 (very hard) to +100 (very harmonious). */
  harmonyScore: number;
  major: boolean;
}

const BODY_WEIGHT: Partial<Record<Body, number>> = {
  Sun: 1,
  Moon: 1,
  Mercury: 0.85,
  Venus: 0.85,
  Mars: 0.85,
  Jupiter: 0.75,
  Saturn: 0.75,
  Uranus: 0.6,
  Neptune: 0.6,
  Pluto: 0.6,
  Chiron: 0.5,
  NorthNode: 0.5,
  SouthNode: 0.4,
  Lilith: 0.4,
};

export interface BodyLongitude {
  body: Body;
  longitude: number;
  speed?: number;
}

export function findAspects(
  positions: BodyLongitude[],
  options?: { majorOnly?: boolean; orbMultiplier?: number },
): Aspect[] {
  const aspects: Aspect[] = [];
  const orbMult = options?.orbMultiplier ?? 1;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i]!;
      const p2 = positions[j]!;
      // Skip trivially exact node-node opposition.
      if (
        (p1.body === "NorthNode" && p2.body === "SouthNode") ||
        (p1.body === "SouthNode" && p2.body === "NorthNode")
      )
        continue;
      const sep = angularSeparation(p1.longitude, p2.longitude);
      for (const def of ASPECT_DEFINITIONS) {
        if (options?.majorOnly && !def.major) continue;
        const orb = Math.abs(sep - def.angle);
        const maxOrb = def.orb * orbMult;
        if (orb > maxOrb) continue;
        const closeness = 1 - orb / maxOrb;
        const weight = ((BODY_WEIGHT[p1.body] ?? 0.5) + (BODY_WEIGHT[p2.body] ?? 0.5)) / 2;
        const applying = isApplying(p1, p2, def.angle);
        const intensity = round(closeness * weight * 100 * (applying ? 1 : 0.9), 1);
        aspects.push({
          a: p1.body,
          b: p2.body,
          type: def.type,
          angle: def.angle,
          orb: round(orb, 2),
          applying,
          intensity: Math.min(100, intensity),
          harmonyScore: round(def.harmony * closeness * 100, 1),
          major: def.major,
        });
        break; // one aspect max per pair
      }
    }
  }
  return aspects.sort((x, y) => y.intensity - x.intensity);
}

function isApplying(p1: BodyLongitude, p2: BodyLongitude, targetAngle: number): boolean {
  if (p1.speed === undefined || p2.speed === undefined) return false;
  // Separation in half a day at current speeds vs now.
  const now = angularSeparation(p1.longitude, p2.longitude);
  const later = angularSeparation(p1.longitude + p1.speed * 0.5, p2.longitude + p2.speed * 0.5);
  return Math.abs(later - targetAngle) < Math.abs(now - targetAngle);
}

// ---------------------------------------------------------------------------
// Aspect patterns
// ---------------------------------------------------------------------------

export type PatternType =
  | "Grand Trine"
  | "T-Square"
  | "Grand Cross"
  | "Yod"
  | "Kite"
  | "Mystic Rectangle"
  | "Stellium"
  | "Cradle"
  | "Grand Sextile"
  | "Thor's Hammer";

export interface AspectPattern {
  type: PatternType;
  bodies: Body[];
  focal?: Body;
  description: string;
}

function hasAspect(aspects: Aspect[], a: Body, b: Body, type: AspectType): boolean {
  return aspects.some(
    (asp) =>
      asp.type === type &&
      ((asp.a === a && asp.b === b) || (asp.a === b && asp.b === a)),
  );
}

const PATTERN_BODIES: Body[] = [
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

export function findPatterns(positions: BodyLongitude[], aspects: Aspect[]): AspectPattern[] {
  const patterns: AspectPattern[] = [];
  const bodies = PATTERN_BODIES.filter((b) => positions.some((p) => p.body === b));

  // Grand Trine: three mutual trines.
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++)
      for (let k = j + 1; k < bodies.length; k++) {
        const [a, b, c] = [bodies[i]!, bodies[j]!, bodies[k]!];
        if (
          hasAspect(aspects, a, b, "trine") &&
          hasAspect(aspects, b, c, "trine") &&
          hasAspect(aspects, a, c, "trine")
        ) {
          patterns.push({
            type: "Grand Trine",
            bodies: [a, b, c],
            description: `Self-reinforcing flow of talent between ${a}, ${b}, and ${c} — an innate gift that works so easily it can be taken for granted.`,
          });
        }
      }

  // T-Square: two squares to a focal planet in opposition pair.
  for (const asp of aspects.filter((x) => x.type === "opposition")) {
    for (const focal of bodies) {
      if (focal === asp.a || focal === asp.b) continue;
      if (hasAspect(aspects, focal, asp.a, "square") && hasAspect(aspects, focal, asp.b, "square")) {
        const isGrandCross = bodies.some(
          (d) =>
            d !== focal &&
            d !== asp.a &&
            d !== asp.b &&
            hasAspect(aspects, d, focal, "opposition") &&
            hasAspect(aspects, d, asp.a, "square") &&
            hasAspect(aspects, d, asp.b, "square"),
        );
        if (!isGrandCross) {
          patterns.push({
            type: "T-Square",
            bodies: [asp.a, asp.b, focal],
            focal,
            description: `Driving tension between ${asp.a} and ${asp.b} funnels through ${focal} — a pressure point that becomes a career-grade engine once mastered.`,
          });
        }
      }
    }
  }

  // Grand Cross: four bodies, two oppositions, four squares.
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++)
      for (let k = j + 1; k < bodies.length; k++)
        for (let l = k + 1; l < bodies.length; l++) {
          const set = [bodies[i]!, bodies[j]!, bodies[k]!, bodies[l]!];
          const opps = [];
          for (let x = 0; x < 4; x++)
            for (let y = x + 1; y < 4; y++)
              if (hasAspect(aspects, set[x]!, set[y]!, "opposition")) opps.push([x, y]);
          if (opps.length === 2) {
            const squares = set.filter((_, x) =>
              set.every(
                (other, y) =>
                  x === y ||
                  hasAspect(aspects, set[x]!, other, "square") ||
                  hasAspect(aspects, set[x]!, other, "opposition"),
              ),
            );
            if (squares.length === 4) {
              patterns.push({
                type: "Grand Cross",
                bodies: set,
                description: `Four-way tension between ${set.join(", ")} — relentless internal pressure that forges exceptional resilience and capacity.`,
              });
            }
          }
        }

  // Yod: two quincunxes to a focal point, sextile at the base.
  for (const focal of bodies) {
    const quincunxPartners = bodies.filter(
      (b) => b !== focal && hasAspect(aspects, focal, b, "quincunx"),
    );
    for (let i = 0; i < quincunxPartners.length; i++)
      for (let j = i + 1; j < quincunxPartners.length; j++) {
        if (hasAspect(aspects, quincunxPartners[i]!, quincunxPartners[j]!, "sextile")) {
          patterns.push({
            type: "Yod",
            bodies: [quincunxPartners[i]!, quincunxPartners[j]!, focal],
            focal,
            description: `"Finger of God" pointing at ${focal} — a fated adjustment point; life keeps redirecting you toward this planet's mission.`,
          });
        }
      }
  }

  // Kite: grand trine + opposition to one vertex with sextiles.
  for (const gt of patterns.filter((p) => p.type === "Grand Trine")) {
    for (const apex of bodies) {
      if (gt.bodies.includes(apex)) continue;
      const opp = gt.bodies.find((b) => hasAspect(aspects, apex, b, "opposition"));
      if (
        opp &&
        gt.bodies.filter((b) => b !== opp).every((b) => hasAspect(aspects, apex, b, "sextile"))
      ) {
        patterns.push({
          type: "Kite",
          bodies: [...gt.bodies, apex],
          focal: apex,
          description: `A Grand Trine given direction: ${apex} turns raw talent into deliverable results — a high-achievement signature.`,
        });
      }
    }
  }

  // Mystic Rectangle: two oppositions connected by trines and sextiles.
  const oppositionAspects = aspects.filter((x) => x.type === "opposition");
  for (let i = 0; i < oppositionAspects.length; i++)
    for (let j = i + 1; j < oppositionAspects.length; j++) {
      const o1 = oppositionAspects[i]!;
      const o2 = oppositionAspects[j]!;
      const set = [o1.a, o1.b, o2.a, o2.b];
      if (new Set(set).size !== 4) continue;
      const trineSextilePairs =
        (hasAspect(aspects, o1.a, o2.a, "trine") || hasAspect(aspects, o1.a, o2.a, "sextile")) &&
        (hasAspect(aspects, o1.a, o2.b, "trine") || hasAspect(aspects, o1.a, o2.b, "sextile")) &&
        (hasAspect(aspects, o1.b, o2.a, "trine") || hasAspect(aspects, o1.b, o2.a, "sextile")) &&
        (hasAspect(aspects, o1.b, o2.b, "trine") || hasAspect(aspects, o1.b, o2.b, "sextile"));
      if (trineSextilePairs) {
        patterns.push({
          type: "Mystic Rectangle",
          bodies: set,
          description: `Balanced tension between ${set.join(", ")} — practical mysticism; opposing needs that keep resolving into productive equilibrium.`,
        });
      }
    }

  // Cradle: an opposition bridged on one side by two planets forming a
  // sextile-trine chain (A opp B; A sextile C trine B; A trine D sextile B).
  for (const opp of aspects.filter((x) => x.type === "opposition")) {
    for (const c of bodies) {
      if (c === opp.a || c === opp.b) continue;
      for (const d of bodies) {
        if (d === c || d === opp.a || d === opp.b) continue;
        const chain =
          hasAspect(aspects, opp.a, c, "sextile") &&
          hasAspect(aspects, c, opp.b, "trine") &&
          hasAspect(aspects, opp.b, d, "sextile") &&
          hasAspect(aspects, d, opp.a, "trine") &&
          hasAspect(aspects, c, d, "sextile");
        if (chain) {
          patterns.push({
            type: "Cradle",
            bodies: [opp.a, c, d, opp.b],
            description: `A cradle rocks the ${opp.a}–${opp.b} opposition through ${c} and ${d} — tension that always has a soft landing; growth without the crash, at the risk of avoiding the core confrontation.`,
          });
        }
      }
    }
  }

  // Thor's Hammer: two planets in square, both sesquiquadrate a third apex.
  for (const sq of aspects.filter((x) => x.type === "square")) {
    for (const apex of bodies) {
      if (apex === sq.a || apex === sq.b) continue;
      if (
        hasAspect(aspects, apex, sq.a, "sesquiquadrate") &&
        hasAspect(aspects, apex, sq.b, "sesquiquadrate")
      ) {
        patterns.push({
          type: "Thor's Hammer",
          bodies: [sq.a, sq.b, apex],
          focal: apex,
          description: `Thor's Hammer pointing at ${apex}: pressurized, percussive drive — enormous force for breakthrough work, with a temper that needs a worthy target.`,
        });
      }
    }
  }

  // Grand Sextile: six planets in mutual hexagram (extremely rare).
  const sextilePartners = new Map<Body, Set<Body>>();
  for (const asp of aspects.filter((x) => x.type === "sextile")) {
    if (!sextilePartners.has(asp.a)) sextilePartners.set(asp.a, new Set());
    if (!sextilePartners.has(asp.b)) sextilePartners.set(asp.b, new Set());
    sextilePartners.get(asp.a)!.add(asp.b);
    sextilePartners.get(asp.b)!.add(asp.a);
  }
  const hexCandidates = bodies.filter((b) => (sextilePartners.get(b)?.size ?? 0) >= 2);
  if (hexCandidates.length >= 6) {
    // Walk the zodiac order and check consecutive sextiles around the wheel.
    const ordered = hexCandidates
      .map((b) => ({ b, lon: positions.find((p) => p.body === b)!.longitude }))
      .sort((x, y) => x.lon - y.lon);
    if (ordered.length >= 6) {
      const six = ordered.slice(0, 6);
      const closed = six.every((cur, i) =>
        hasAspect(aspects, cur.b, six[(i + 1) % 6]!.b, "sextile"),
      );
      if (closed) {
        patterns.push({
          type: "Grand Sextile",
          bodies: six.map((x) => x.b),
          description: "A Grand Sextile — six planets in a closed hexagram. Extraordinarily rare: opportunity circuits everywhere, activated only by deliberate effort.",
        });
      }
    }
  }

  // Stellium: 3+ planets in the same sign within tight range.
  const bySign = new Map<number, Body[]>();
  for (const p of positions) {
    if (!PATTERN_BODIES.includes(p.body)) continue;
    const signIdx = Math.floor(norm360(p.longitude) / 30);
    const list = bySign.get(signIdx) ?? [];
    list.push(p.body);
    bySign.set(signIdx, list);
  }
  for (const [signIdx, list] of bySign) {
    if (list.length >= 3) {
      patterns.push({
        type: "Stellium",
        bodies: list,
        description: `Concentrated force: ${list.join(", ")} cluster in one sign (sign ${signIdx + 1}) — an area of life that dominates identity and demands mastery.`,
      });
    }
  }

  // De-duplicate identical body sets per type.
  const seen = new Set<string>();
  return patterns.filter((p) => {
    const key = `${p.type}:${[...p.bodies].sort().join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Declination aspects (parallel / contra-parallel)
// ---------------------------------------------------------------------------

export interface DeclinationAspect {
  a: Body;
  b: Body;
  type: "parallel" | "contra-parallel";
  orb: number;
}

export interface BodyDeclination {
  body: Body;
  declination: number;
}

/** Parallels (same declination) act like conjunctions; contra-parallels like oppositions. */
export function findDeclinationAspects(
  positions: BodyDeclination[],
  maxOrb = 1.0,
): DeclinationAspect[] {
  const out: DeclinationAspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i]!;
      const p2 = positions[j]!;
      const parallelOrb = Math.abs(p1.declination - p2.declination);
      const contraOrb = Math.abs(p1.declination + p2.declination);
      if (parallelOrb <= maxOrb) {
        out.push({ a: p1.body, b: p2.body, type: "parallel", orb: round(parallelOrb, 2) });
      } else if (contraOrb <= maxOrb) {
        out.push({ a: p1.body, b: p2.body, type: "contra-parallel", orb: round(contraOrb, 2) });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/** Planets with no major aspects — "wild card" energies that operate unmoderated. */
export function findUnaspected(positions: BodyLongitude[], aspects: Aspect[]): Body[] {
  return positions
    .filter((p) => PATTERN_BODIES.includes(p.body))
    .filter(
      (p) => !aspects.some((a) => a.major && (a.a === p.body || a.b === p.body)),
    )
    .map((p) => p.body);
}

// ---------------------------------------------------------------------------
// Midpoints
// ---------------------------------------------------------------------------

export interface MidpointEntry {
  a: string;
  b: string;
  longitude: number;
}

export function computeMidpoints(points: { name: string; longitude: number }[]): MidpointEntry[] {
  const out: MidpointEntry[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i]!;
      const p2 = points[j]!;
      const diff = ((p2.longitude - p1.longitude) % 360 + 540) % 360 - 180;
      out.push({ a: p1.name, b: p2.name, longitude: round(norm360(p1.longitude + diff / 2), 2) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chart shape (Jones patterns)
// ---------------------------------------------------------------------------

export type ChartShape =
  | "Bundle"
  | "Bowl"
  | "Bucket"
  | "Locomotive"
  | "See-Saw"
  | "Splay"
  | "Splash";

export function chartShape(positions: BodyLongitude[]): { shape: ChartShape; description: string } {
  const longs = positions
    .filter((p) => PATTERN_BODIES.includes(p.body))
    .map((p) => norm360(p.longitude))
    .sort((a, b) => a - b);
  if (longs.length < 7) return { shape: "Splash", description: "Planets spread widely." };

  // Find the largest empty gap.
  let maxGap = 0;
  let maxGapStart = 0;
  let secondGap = 0;
  for (let i = 0; i < longs.length; i++) {
    const next = longs[(i + 1) % longs.length]!;
    const gap = norm360(next - longs[i]!);
    if (gap > maxGap) {
      secondGap = maxGap;
      maxGap = gap;
      maxGapStart = longs[i]!;
    } else if (gap > secondGap) {
      secondGap = gap;
    }
  }
  const occupiedSpan = 360 - maxGap;
  void maxGapStart;

  if (occupiedSpan <= 130)
    return {
      shape: "Bundle",
      description:
        "All planets within about a third of the zodiac — intense specialization. Depth over breadth; world-class focus in a narrow domain.",
    };
  if (occupiedSpan <= 190) {
    // Bucket check: one planet isolated opposite the rest.
    return {
      shape: "Bowl",
      description:
        "Planets fill half the chart — a self-contained hemisphere of experience, driven to complete what is missing on the empty side.",
    };
  }
  if (maxGap >= 120)
    return {
      shape: "Locomotive",
      description:
        "Two-thirds of the zodiac occupied with a driving lead planet — relentless executive momentum and a self-starting engine.",
    };
  // Bucket: bowl plus singleton handle.
  for (let i = 0; i < longs.length; i++) {
    const others = longs.filter((_, idx) => idx !== i);
    let gapBefore = 360;
    let gapAfter = 360;
    for (const o of others) {
      const d1 = norm360(longs[i]! - o);
      const d2 = norm360(o - longs[i]!);
      gapBefore = Math.min(gapBefore, d1);
      gapAfter = Math.min(gapAfter, d2);
    }
    if (gapBefore > 60 && gapAfter > 60)
      return {
        shape: "Bucket",
        description:
          "A bowl of planets with one isolated handle planet — all of the chart's energy funnels through that singleton; it is the point of the whole life.",
      };
  }
  if (secondGap >= 60)
    return {
      shape: "See-Saw",
      description:
        "Two opposing groups of planets — life proceeds through weighing alternatives; mastery comes from integrating both camps.",
    };
  return {
    shape: "Splash",
    description:
      "Planets scattered around the whole wheel — versatility, broad interests, and the challenge of choosing a focus.",
  };
}
