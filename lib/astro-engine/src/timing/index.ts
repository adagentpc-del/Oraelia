import {
  PLANETARY_BODIES,
  allPositions,
  bodyPosition,
  moonPhase,
  meanNode,
  type Body,
} from "../core/ephemeris";
import {
  dateFromJulianDay,
  julianDayFromDate,
  julianDayFromMoment,
  type BirthMoment,
} from "../core/julian";
import { angularSeparation, norm360, round, clamp } from "../core/math";
import { houseOf } from "../core/houses";
import { findAspects, type Aspect, type BodyLongitude } from "../natal/aspects";
import { TRADITIONAL_RULERS, SIGNS, signOf, type Sign } from "../natal/zodiac";
import { computeChartAt, type NatalChart } from "../natal/chart";

// ---------------------------------------------------------------------------
// Transits
// ---------------------------------------------------------------------------

export interface Transit {
  transiting: Body;
  natal: Body | "Ascendant" | "Midheaven";
  type: Aspect["type"];
  orb: number;
  applying: boolean;
  intensity: number;
  harmonyScore: number;
}

const TRANSIT_BODIES: Body[] = [
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
  "Chiron",
  "NorthNode",
];

export function computeTransits(chart: NatalChart, jd: number): Transit[] {
  const current = allPositions(jd, TRANSIT_BODIES);
  const transits: Transit[] = [];

  const natalPoints: { name: Transit["natal"]; longitude: number }[] = [
    ...chart.bodies.map((b) => ({ name: b.body as Transit["natal"], longitude: b.longitude })),
    { name: "Ascendant", longitude: chart.houses.angles.ascendant },
    { name: "Midheaven", longitude: chart.houses.angles.midheaven },
  ];

  for (const tBody of TRANSIT_BODIES) {
    const tPos = current[tBody]!;
    for (const nPoint of natalPoints) {
      const pair: BodyLongitude[] = [
        { body: tBody, longitude: tPos.longitude, speed: tPos.speed },
        { body: "Sun", longitude: nPoint.longitude, speed: 0 }, // placeholder body for aspect finding
      ];
      const found = findAspects(pair, { majorOnly: false, orbMultiplier: tBody === "Moon" ? 0.6 : 0.5 });
      for (const asp of found) {
        transits.push({
          transiting: tBody,
          natal: nPoint.name,
          type: asp.type,
          orb: asp.orb,
          applying: asp.applying,
          intensity: asp.intensity,
          harmonyScore: asp.harmonyScore,
        });
      }
    }
  }
  return transits.sort((a, b) => b.intensity - a.intensity).slice(0, 40);
}

// ---------------------------------------------------------------------------
// Profections
// ---------------------------------------------------------------------------

export interface Profection {
  age: number;
  profectedHouse: number;
  profectedSign: Sign;
  yearLord: Body;
  theme: string;
}

const HOUSE_THEMES: Record<number, string> = {
  1: "Self, body, identity — a year to rebuild yourself and lead with your own name.",
  2: "Money, assets, self-worth — income and value questions move to center stage.",
  3: "Communication, siblings, skills — writing, learning, local networks pay off.",
  4: "Home, family, foundations — where and with whom you live becomes the work.",
  5: "Creativity, romance, children — self-expression and joy carry the year's luck.",
  6: "Health, work, routines — systems, habits and service determine everything.",
  7: "Partnership — marriage, business partners, open rivals; others hold the mirror.",
  8: "Shared resources, debt, transformation — other people's money and deep change.",
  9: "Travel, education, publishing, faith — widen the horizon; go far to grow.",
  10: "Career and public standing — ambition peaks; reputation is built or spent.",
  11: "Networks, friends, gains — community and audiences become the multiplier.",
  12: "Retreat, endings, the unconscious — close chapters, rest, work behind the scenes.",
};

export function annualProfection(chart: NatalChart, age: number): Profection {
  const profectedHouse = (age % 12) + 1;
  const ascSignIndex = SIGNS.indexOf(chart.ascendantSign);
  const profectedSign = SIGNS[(ascSignIndex + (profectedHouse - 1)) % 12]!;
  return {
    age,
    profectedHouse,
    profectedSign,
    yearLord: TRADITIONAL_RULERS[profectedSign],
    theme: HOUSE_THEMES[profectedHouse]!,
  };
}

export function monthlyProfection(chart: NatalChart, age: number, monthsSinceBirthday: number): Profection {
  const annual = annualProfection(chart, age);
  const house = ((annual.profectedHouse - 1 + monthsSinceBirthday) % 12) + 1;
  const ascSignIndex = SIGNS.indexOf(chart.ascendantSign);
  const sign = SIGNS[(ascSignIndex + house - 1) % 12]!;
  return { age, profectedHouse: house, profectedSign: sign, yearLord: TRADITIONAL_RULERS[sign], theme: HOUSE_THEMES[house]! };
}

// ---------------------------------------------------------------------------
// Returns & progressions
// ---------------------------------------------------------------------------

/** Find the JD when a transiting body returns to a natal longitude, near a guess. */
function findReturn(body: Body, targetLongitude: number, guessJd: number): number {
  let jd = guessJd;
  for (let i = 0; i < 25; i++) {
    const pos = bodyPosition(body, jd);
    let diff = targetLongitude - pos.longitude;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-5) break;
    jd += diff / (pos.speed || 1);
  }
  return jd;
}

export function solarReturnDate(chart: NatalChart, year: number): Date {
  const natalSun = chart.bodies.find((b) => b.body === "Sun")!;
  const birthDate = dateFromJulianDay(chart.julianDay);
  const guess = julianDayFromDate(
    new Date(Date.UTC(year, birthDate.getUTCMonth(), birthDate.getUTCDate(), 12)),
  );
  return dateFromJulianDay(findReturn("Sun", natalSun.longitude, guess));
}

export function nextLunarReturn(chart: NatalChart, fromJd: number): Date {
  const natalMoon = chart.bodies.find((b) => b.body === "Moon")!;
  const current = bodyPosition("Moon", fromJd);
  const gap = norm360(natalMoon.longitude - current.longitude);
  const guess = fromJd + gap / 13.176;
  return dateFromJulianDay(findReturn("Moon", natalMoon.longitude, guess));
}

export interface ProgressedPosition {
  body: Body;
  longitude: number;
  sign: Sign;
  natalLongitude: number;
  changedSign: boolean;
}

/** Secondary progressions: a day after birth = a year of life. */
export function secondaryProgressions(chart: NatalChart, ageYears: number): ProgressedPosition[] {
  const progJd = chart.julianDay + ageYears;
  const bodies: Body[] = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
  return bodies.map((b) => {
    const natal = chart.bodies.find((x) => x.body === b)!;
    const pos = bodyPosition(b, progJd);
    return {
      body: b,
      longitude: round(pos.longitude, 2),
      sign: signOf(pos.longitude),
      natalLongitude: natal.longitude,
      changedSign: signOf(pos.longitude) !== natal.sign,
    };
  });
}

/** Solar arc directions: every point advanced by the progressed Sun's arc. */
export function solarArcDirections(chart: NatalChart, ageYears: number): ProgressedPosition[] {
  const natalSun = chart.bodies.find((b) => b.body === "Sun")!;
  const progSun = bodyPosition("Sun", chart.julianDay + ageYears);
  const arc = norm360(progSun.longitude - natalSun.longitude);
  return chart.bodies
    .filter((b) => PLANETARY_BODIES.includes(b.body))
    .map((b) => {
      const directed = norm360(b.longitude + arc);
      return {
        body: b.body,
        longitude: round(directed, 2),
        sign: signOf(directed),
        natalLongitude: b.longitude,
        changedSign: signOf(directed) !== b.sign,
      };
    });
}

// ---------------------------------------------------------------------------
// Transit event arcs (exact hits, retrograde revisits)
// ---------------------------------------------------------------------------

export interface TransitEvent {
  transiting: Body;
  natal: Body | "Ascendant" | "Midheaven";
  aspect: "conjunction" | "opposition" | "square" | "trine" | "sextile";
  date: string;
  retrograde: boolean;
  /** 1 = first contact, 2 = retrograde revisit, 3 = final pass, ... */
  pass: number;
}

const EVENT_ASPECTS: { type: TransitEvent["aspect"]; angle: number }[] = [
  { type: "conjunction", angle: 0 },
  { type: "sextile", angle: 60 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "opposition", angle: 180 },
];

const SLOW_BODIES: Body[] = ["Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"];

/**
 * Scan a window for exact transit hits from the slow planets to natal points,
 * numbering multiple passes of the same contact (direct → retrograde → direct).
 */
export function transitEvents(chart: NatalChart, fromJd: number, days: number): TransitEvent[] {
  const natalPoints: { name: TransitEvent["natal"]; longitude: number }[] = [
    ...chart.bodies
      .filter((b) => ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "NorthNode"].includes(b.body))
      .map((b) => ({ name: b.body as TransitEvent["natal"], longitude: b.longitude })),
    { name: "Ascendant", longitude: chart.houses.angles.ascendant },
    { name: "Midheaven", longitude: chart.houses.angles.midheaven },
  ];

  const step = 1; // days
  const maxDays = Math.min(days, 730);
  const events: TransitEvent[] = [];

  for (const body of SLOW_BODIES) {
    // Pre-sample positions once per body.
    const samples: { jd: number; lon: number; speed: number }[] = [];
    for (let d = 0; d <= maxDays; d += step) {
      const pos = bodyPosition(body, fromJd + d);
      samples.push({ jd: fromJd + d, lon: pos.longitude, speed: pos.speed });
    }
    for (const point of natalPoints) {
      for (const { type, angle } of EVENT_ASPECTS) {
        const passCounter = { count: 0 };
        for (let i = 1; i < samples.length; i++) {
          const prev = samples[i - 1]!;
          const cur = samples[i]!;
          // Signed offset from exactness, in (-180, 180].
          const offPrev = signedOffset(prev.lon, point.longitude, angle);
          const offCur = signedOffset(cur.lon, point.longitude, angle);
          if (Math.sign(offPrev) !== Math.sign(offCur) && Math.abs(offPrev) < 5 && Math.abs(offCur) < 5) {
            const frac = Math.abs(offPrev) / (Math.abs(offPrev) + Math.abs(offCur) || 1);
            const exactJd = prev.jd + frac * step;
            passCounter.count += 1;
            events.push({
              transiting: body,
              natal: point.name,
              aspect: type,
              date: dateFromJulianDay(exactJd).toISOString().slice(0, 10),
              retrograde: cur.speed < 0,
              pass: passCounter.count,
            });
          }
        }
      }
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function signedOffset(transitLon: number, natalLon: number, aspectAngle: number): number {
  // Distance from the nearest exact aspect point (either side of natal).
  const diff = norm360(transitLon - natalLon);
  const d1 = ((diff - aspectAngle + 540) % 360) - 180;
  const d2 = ((diff + aspectAngle + 540) % 360) - 180;
  return Math.abs(d1) <= Math.abs(d2) ? d1 : d2;
}

// ---------------------------------------------------------------------------
// Return charts (solar & lunar) with natal overlay
// ---------------------------------------------------------------------------

export interface ReturnChartResult {
  kind: "solar" | "lunar";
  returnDate: string;
  chart: NatalChart;
  /** Return planets located in the NATAL houses (the overlay). */
  overlay: { body: Body; natalHouse: number }[];
  annualAscendant: string;
  annualMidheaven: string;
  angularPlanets: Body[];
  themes: string[];
}

function buildReturnResult(
  kind: "solar" | "lunar",
  returnJd: number,
  natal: NatalChart,
  latitude: number,
  longitude: number,
): ReturnChartResult {
  const chart = computeChartAt(returnJd, latitude, longitude, {
    houseSystem: natal.houseSystem,
    zodiac: natal.zodiac,
  });
  const overlay = chart.bodies
    .filter((b) => PLANETARY_BODIES.includes(b.body))
    .map((b) => ({ body: b.body, natalHouse: houseOf(b.longitude, natal.houses.cusps) }));
  const angularPlanets = chart.bodies.filter((b) => b.angular && PLANETARY_BODIES.includes(b.body)).map((b) => b.body);
  const themes: string[] = [];
  const sunHouse = chart.bodies.find((b) => b.body === "Sun")?.house;
  if (sunHouse) {
    themes.push(
      `${kind === "solar" ? "Year" : "Month"} centers on house ${sunHouse} themes at the return location.`,
    );
  }
  if (angularPlanets.length) {
    themes.push(`Angular at the return: ${angularPlanets.join(", ")} — these planets set the period's tone.`);
  }
  const moonSign = chart.bodies.find((b) => b.body === "Moon")?.sign;
  if (moonSign) themes.push(`Return Moon in ${moonSign}: the emotional weather of the period.`);
  return {
    kind,
    returnDate: dateFromJulianDay(returnJd).toISOString(),
    chart,
    overlay,
    annualAscendant: formatSignDeg(chart.houses.angles.ascendant),
    annualMidheaven: formatSignDeg(chart.houses.angles.midheaven),
    angularPlanets,
    themes,
  };
}

function formatSignDeg(longitude: number): string {
  return `${Math.floor(norm360(longitude) % 30)}° ${signOf(longitude)}`;
}

export function solarReturnChart(
  natal: NatalChart,
  year: number,
  latitude: number,
  longitude: number,
): ReturnChartResult {
  const natalSun = natal.bodies.find((b) => b.body === "Sun")!;
  const birthDate = dateFromJulianDay(natal.julianDay);
  const guess = julianDayFromDate(
    new Date(Date.UTC(year, birthDate.getUTCMonth(), birthDate.getUTCDate(), 12)),
  );
  // For sidereal charts the stored natal Sun is ayanamsa-shifted; return-finding
  // must work in tropical terms, so recover the tropical longitude.
  const shift = natal.meta.ayanamsaDegrees ?? 0;
  const jd = findReturn("Sun", norm360(natalSun.longitude + shift), guess);
  return buildReturnResult("solar", jd, natal, latitude, longitude);
}

export function lunarReturnChart(
  natal: NatalChart,
  fromJd: number,
  latitude: number,
  longitude: number,
): ReturnChartResult {
  const natalMoon = natal.bodies.find((b) => b.body === "Moon")!;
  const shift = natal.meta.ayanamsaDegrees ?? 0;
  const target = norm360(natalMoon.longitude + shift);
  const current = bodyPosition("Moon", fromJd);
  const gap = norm360(target - current.longitude);
  const jd = findReturn("Moon", target, fromJd + gap / 13.176);
  return buildReturnResult("lunar", jd, natal, latitude, longitude);
}

// ---------------------------------------------------------------------------
// Lunations & eclipses
// ---------------------------------------------------------------------------

export interface Lunation {
  date: Date;
  type: "New Moon" | "Full Moon";
  longitude: number;
  sign: Sign;
  isEclipse: boolean;
  eclipseType: string | null;
  natalHouse: number | null;
}

export function upcomingLunations(fromJd: number, count: number, chart?: NatalChart): Lunation[] {
  const out: Lunation[] = [];
  let jd = fromJd;
  const findPhaseJd = (startJd: number, targetAngle: number): number => {
    let t = startJd;
    for (let i = 0; i < 40; i++) {
      const sun = bodyPosition("Sun", t);
      const moon = bodyPosition("Moon", t);
      let diff = targetAngle - norm360(moon.longitude - sun.longitude);
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      if (Math.abs(diff) < 1e-4) break;
      t += diff / (moon.speed - sun.speed);
    }
    return t;
  };

  while (out.length < count) {
    const phase = moonPhase(jd);
    // Next event: new (0) or full (180), whichever comes first.
    const toNew = norm360(360 - phase.angle);
    const toFull = norm360(180 - phase.angle);
    const nextIsFull = toFull < toNew;
    const target = nextIsFull ? 180 : 0;
    const guess = jd + (nextIsFull ? toFull : toNew) / 12.19;
    const eventJd = findPhaseJd(guess, target);
    const moonPos = bodyPosition("Moon", eventJd);
    const nodeLon = meanNode(eventJd);
    const nodeDistance = Math.min(
      angularSeparation(moonPos.longitude, nodeLon),
      angularSeparation(moonPos.longitude, norm360(nodeLon + 180)),
    );
    const isEclipse = nextIsFull ? nodeDistance < 12 : nodeDistance < 17;
    out.push({
      date: dateFromJulianDay(eventJd),
      type: nextIsFull ? "Full Moon" : "New Moon",
      longitude: round(moonPos.longitude, 2),
      sign: signOf(moonPos.longitude),
      isEclipse,
      eclipseType: isEclipse ? (nextIsFull ? "Lunar Eclipse" : "Solar Eclipse") : null,
      natalHouse: chart ? houseOf(moonPos.longitude, chart.houses.cusps) : null,
    });
    jd = eventJd + 5;
  }
  return out;
}

export interface RetrogradeStatus {
  body: Body;
  retrograde: boolean;
  sign: Sign;
}

export function currentRetrogrades(jd: number): RetrogradeStatus[] {
  const bodies: Body[] = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"];
  return bodies.map((b) => {
    const pos = bodyPosition(b, jd);
    return { body: b, retrograde: pos.retrograde, sign: signOf(pos.longitude) };
  });
}

// ---------------------------------------------------------------------------
// Daily forecast scoring
// ---------------------------------------------------------------------------

export interface CategoryScores {
  overall: number;
  career: number;
  relationships: number;
  money: number;
  health: number;
  communication: number;
  creativity: number;
  luck: number;
  productivity: number;
  decisionScore: number;
  emotionalEnergy: number;
}

const CATEGORY_PLANETS: Record<string, (Body | "Ascendant" | "Midheaven")[]> = {
  career: ["Sun", "Saturn", "Mars", "Midheaven", "Jupiter"],
  relationships: ["Venus", "Moon", "Mars", "Ascendant"],
  money: ["Venus", "Jupiter", "Saturn", "Pluto"],
  health: ["Sun", "Mars", "Saturn", "Chiron", "Ascendant"],
  communication: ["Mercury", "Moon", "Jupiter"],
  creativity: ["Venus", "Neptune", "Sun", "Moon"],
  luck: ["Jupiter", "Venus", "Sun", "NorthNode"],
  productivity: ["Mars", "Saturn", "Mercury", "Sun"],
};

export function scoreDay(chart: NatalChart, jd: number): { scores: CategoryScores; transits: Transit[] } {
  const transits = computeTransits(chart, jd);
  const retro = currentRetrogrades(jd);
  const mercuryRx = retro.find((r) => r.body === "Mercury")?.retrograde ?? false;

  const scoreFor = (planets: (Body | "Ascendant" | "Midheaven")[]): number => {
    let score = 60;
    for (const t of transits) {
      const involved =
        planets.includes(t.natal) || (planets as string[]).includes(t.transiting);
      if (!involved) continue;
      const contribution = clamp(
        (t.harmonyScore / 100) * (t.intensity / 100) * 20 +
          (t.type === "conjunction" ? (t.intensity / 100) * 4 : 0),
        -7,
        7,
      );
      score += contribution;
    }
    return round(clamp(score, 15, 98), 0);
  };

  const career = scoreFor(CATEGORY_PLANETS.career!);
  const relationships = scoreFor(CATEGORY_PLANETS.relationships!);
  const money = scoreFor(CATEGORY_PLANETS.money!);
  const health = scoreFor(CATEGORY_PLANETS.health!);
  let communication = scoreFor(CATEGORY_PLANETS.communication!);
  if (mercuryRx) communication = round(clamp(communication - 15, 5, 98), 0);
  const creativity = scoreFor(CATEGORY_PLANETS.creativity!);
  const luck = scoreFor(CATEGORY_PLANETS.luck!);
  const productivity = scoreFor(CATEGORY_PLANETS.productivity!);

  const moonPos = bodyPosition("Moon", jd);
  const natalMoon = chart.bodies.find((b) => b.body === "Moon")!;
  const moonAspect = angularSeparation(moonPos.longitude, natalMoon.longitude);
  const emotionalEnergy = round(clamp(75 - Math.abs(moonAspect - 120) * 0.2 + (moonAspect < 10 ? 10 : 0), 20, 95), 0);

  const overall = round((career + relationships + money + health + communication + creativity + luck + productivity) / 8, 0);
  const hardHits = transits.filter((t) => t.harmonyScore < -30 && t.intensity > 40).length;
  const decisionScore = round(clamp(overall - Math.min(hardHits, 4) * 4 - (mercuryRx ? 6 : 0), 10, 98), 0);

  return {
    scores: {
      overall,
      career,
      relationships,
      money,
      health,
      communication,
      creativity,
      luck,
      productivity,
      decisionScore,
      emotionalEnergy,
    },
    transits,
  };
}

// ---------------------------------------------------------------------------
// Planetary hours (power hours)
// ---------------------------------------------------------------------------

const CHALDEAN_ORDER: Body[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const DAY_RULERS: Body[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // Sun..Sat by weekday

export interface PowerHour {
  hourIndex: number;
  ruler: Body;
  label: string;
  good: string;
}

const HOUR_USES: Partial<Record<Body, string>> = {
  Sun: "visibility, leadership moves, asking for what you want",
  Moon: "emotional conversations, home matters, intuition work",
  Mars: "workouts, hard tasks, confrontation you've been avoiding",
  Mercury: "writing, negotiations, emails, contracts, learning",
  Jupiter: "pitches, asks, launches, investing, big-picture planning",
  Venus: "dates, design work, diplomacy, purchases of beauty",
  Saturn: "deep work, planning, discipline, long-term commitments",
};

/** Simplified equal planetary hours from local 6:00; returns the day's best hours. */
export function planetaryHours(date: Date): PowerHour[] {
  const weekday = date.getUTCDay();
  const dayRuler = DAY_RULERS[weekday]!;
  const startIdx = CHALDEAN_ORDER.indexOf(dayRuler);
  const hours: PowerHour[] = [];
  for (let i = 0; i < 12; i++) {
    const ruler = CHALDEAN_ORDER[(startIdx + i) % 7]!;
    hours.push({
      hourIndex: i,
      ruler,
      label: `${6 + i}:00–${7 + i}:00`,
      good: HOUR_USES[ruler] ?? "general activity",
    });
  }
  const favored: Body[] = ["Jupiter", "Venus", "Sun", "Mercury"];
  return hours.filter((h) => favored.includes(h.ruler)).slice(0, 4);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function ageAt(moment: BirthMoment, onJd: number): number {
  return Math.floor((onJd - julianDayFromMoment(moment)) / 365.25);
}

export function monthsSinceBirthday(moment: BirthMoment, onJd: number): number {
  const elapsed = (onJd - julianDayFromMoment(moment)) / 365.25;
  const frac = elapsed - Math.floor(elapsed);
  return Math.floor(frac * 12);
}
