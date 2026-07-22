import { asinDeg, atan2Deg, cosDeg, norm360, sinDeg, tanDeg } from "./math";
import { lst, meanObliquity } from "./julian";

export type HouseSystem = "placidus" | "whole-sign";

export interface Angles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
  vertex: number;
  antiVertex: number;
}

/** Ecliptic longitude of the point on the ecliptic with right ascension `ra`. */
function eclipticLongitudeFromRa(ra: number, eps: number): number {
  return norm360(atan2Deg(sinDeg(ra), cosDeg(ra) * cosDeg(eps)));
}

function ascFromRamc(ramc: number, lat: number, eps: number): number {
  return norm360(
    atan2Deg(cosDeg(ramc), -(sinDeg(ramc) * cosDeg(eps) + tanDeg(lat) * sinDeg(eps))),
  );
}

export function computeAngles(jd: number, latitude: number, longitude: number): Angles {
  const eps = meanObliquity(jd);
  const ramc = lst(jd, longitude);
  const midheaven = eclipticLongitudeFromRa(ramc, eps);
  const ascendant = ascFromRamc(ramc, latitude, eps);
  // Vertex: intersection of prime vertical and ecliptic in the west —
  // the "ascendant" of the co-latitude computed from RAMC + 180.
  const vertex = ascFromRamc(norm360(ramc + 180), 90 - latitude, eps);
  return {
    ascendant,
    midheaven,
    descendant: norm360(ascendant + 180),
    imumCoeli: norm360(midheaven + 180),
    vertex,
    antiVertex: norm360(vertex + 180),
  };
}

/**
 * Placidus intermediate cusps by fixed-point iteration on the semi-arc
 * fractions. Falls back to Porphyry at polar latitudes where the cusp
 * point never rises or sets.
 */
function placidusCusps(jd: number, latitude: number, longitude: number, angles: Angles): number[] {
  if (Math.abs(latitude) > 66) return porphyryCusps(angles);
  const eps = meanObliquity(jd);
  const ramc = lst(jd, longitude);

  // offsetFn maps ascensional difference AD -> RA offset from RAMC for the cusp.
  const solve = (initialOffset: number, offsetFn: (ad: number) => number): number => {
    let ra = norm360(ramc + initialOffset);
    for (let i = 0; i < 60; i++) {
      const lambda = eclipticLongitudeFromRa(ra, eps);
      const decl = asinDeg(sinDeg(eps) * sinDeg(lambda));
      const x = tanDeg(latitude) * tanDeg(decl);
      if (Math.abs(x) >= 1) return NaN;
      const ad = asinDeg(x);
      const raNew = norm360(ramc + offsetFn(ad));
      const delta = Math.abs(norm360(raNew - ra + 180) - 180);
      ra = raNew;
      if (delta < 1e-8) break;
    }
    return eclipticLongitudeFromRa(ra, eps);
  };

  // Diurnal semi-arc DSA = 90 + AD; nocturnal NSA = 90 - AD.
  const c11 = solve(30, (ad) => (90 + ad) / 3);
  const c12 = solve(60, (ad) => (2 * (90 + ad)) / 3);
  const c2 = solve(120, (ad) => 120 + (2 * ad) / 3);
  const c3 = solve(150, (ad) => 150 + ad / 3);

  if ([c11, c12, c2, c3].some((c) => Number.isNaN(c))) return porphyryCusps(angles);

  return [
    angles.ascendant,
    c2,
    c3,
    angles.imumCoeli,
    norm360(c11 + 180),
    norm360(c12 + 180),
    angles.descendant,
    norm360(c2 + 180),
    norm360(c3 + 180),
    angles.midheaven,
    c11,
    c12,
  ];
}

/** Porphyry: trisect each quadrant between the angles. */
function porphyryCusps(angles: Angles): number[] {
  const { ascendant: asc, midheaven: mc, descendant: dsc, imumCoeli: ic } = angles;
  const arc = (from: number, to: number) => norm360(to - from);
  const a1 = arc(asc, ic);
  const a2 = arc(ic, dsc);
  const a3 = arc(dsc, mc);
  const a4 = arc(mc, asc);
  return [
    asc,
    norm360(asc + a1 / 3),
    norm360(asc + (2 * a1) / 3),
    ic,
    norm360(ic + a2 / 3),
    norm360(ic + (2 * a2) / 3),
    dsc,
    norm360(dsc + a3 / 3),
    norm360(dsc + (2 * a3) / 3),
    mc,
    norm360(mc + a4 / 3),
    norm360(mc + (2 * a4) / 3),
  ];
}

function wholeSignCusps(ascendant: number): number[] {
  const startSign = Math.floor(ascendant / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(startSign + i * 30));
}

export interface HouseData {
  system: HouseSystem;
  /** 12 cusp longitudes; cusps[0] is the 1st-house cusp. */
  cusps: number[];
  angles: Angles;
}

export function computeHouses(
  jd: number,
  latitude: number,
  longitude: number,
  system: HouseSystem = "placidus",
): HouseData {
  const angles = computeAngles(jd, latitude, longitude);
  const cusps =
    system === "whole-sign"
      ? wholeSignCusps(angles.ascendant)
      : placidusCusps(jd, latitude, longitude, angles);
  return { system, cusps, angles };
}

/** House number (1-12) containing an ecliptic longitude. */
export function houseOf(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    const span = norm360(end - start) || 360;
    const off = norm360(longitude - start);
    if (off < span) return i + 1;
  }
  return 12;
}
