import {
  DEG2RAD,
  RAD2DEG,
  asinDeg,
  atan2Deg,
  cosDeg,
  norm360,
  sinDeg,
  solveKepler,
} from "./math";
import { julianCenturies, meanObliquity } from "./julian";

export type Body =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto"
  | "Chiron"
  | "NorthNode"
  | "SouthNode"
  | "Lilith";

export const PLANETARY_BODIES: Body[] = [
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

export const ALL_BODIES: Body[] = [...PLANETARY_BODIES, "Chiron", "NorthNode", "SouthNode", "Lilith"];

export interface EclipticPosition {
  /** Geocentric ecliptic longitude in degrees [0, 360). */
  longitude: number;
  /** Geocentric ecliptic latitude in degrees. */
  latitude: number;
  /** Distance in AU (0 for points). */
  distance: number;
  /** Longitudinal speed in degrees/day (negative = retrograde). */
  speed: number;
  /** Equatorial declination in degrees. */
  declination: number;
  retrograde: boolean;
}

/**
 * Keplerian elements and per-century rates from the JPL approximation
 * for 1800 AD – 2050 AD (a, e, I, L, longPeri, longNode).
 */
const KEPLER_ELEMENTS: Record<
  string,
  { a: number[]; e: number[]; i: number[]; l: number[]; p: number[]; n: number[] }
> = {
  Mercury: {
    a: [0.38709927, 0.00000037],
    e: [0.20563593, 0.00001906],
    i: [7.00497902, -0.00594749],
    l: [252.2503235, 149472.67411175],
    p: [77.45779628, 0.16047689],
    n: [48.33076593, -0.12534081],
  },
  Venus: {
    a: [0.72333566, 0.0000039],
    e: [0.00677672, -0.00004107],
    i: [3.39467605, -0.0007889],
    l: [181.9790995, 58517.81538729],
    p: [131.60246718, 0.00268329],
    n: [76.67984255, -0.27769418],
  },
  Earth: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    i: [-0.00001531, -0.01294668],
    l: [100.46457166, 35999.37244981],
    p: [102.93768193, 0.32327364],
    n: [0, 0],
  },
  Mars: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    i: [1.84969142, -0.00813131],
    l: [-4.55343205, 19140.30268499],
    p: [-23.94362959, 0.44441088],
    n: [49.55953891, -0.29257343],
  },
  Jupiter: {
    a: [5.202887, -0.00011607],
    e: [0.04838624, -0.00013253],
    i: [1.30439695, -0.00183714],
    l: [34.39644051, 3034.74612775],
    p: [14.72847983, 0.21252668],
    n: [100.47390909, 0.20469106],
  },
  Saturn: {
    a: [9.53667594, -0.0012506],
    e: [0.05386179, -0.00050991],
    i: [2.48599187, 0.00193609],
    l: [49.95424423, 1222.49362201],
    p: [92.59887831, -0.41897216],
    n: [113.66242448, -0.28867794],
  },
  Uranus: {
    a: [19.18916464, -0.00196176],
    e: [0.04725744, -0.00004397],
    i: [0.77263783, -0.00242939],
    l: [313.23810451, 428.48202785],
    p: [170.9542763, 0.40805281],
    n: [74.01692503, 0.04240589],
  },
  Neptune: {
    a: [30.06992276, 0.00026291],
    e: [0.00859048, 0.00005105],
    i: [1.77004347, 0.00035372],
    l: [-55.12002969, 218.45945325],
    p: [44.96476227, -0.32241464],
    n: [131.78422574, -0.00508664],
  },
  Pluto: {
    a: [39.48211675, -0.00031596],
    e: [0.2488273, 0.0000517],
    i: [17.14001206, 0.00004818],
    l: [238.92903833, 145.20780515],
    p: [224.06891629, -0.04062942],
    n: [110.30393684, -0.01183482],
  },
};

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Heliocentric ecliptic rectangular coordinates from Keplerian elements. */
function heliocentricVector(planet: string, jd: number): Vec3 {
  const el = KEPLER_ELEMENTS[planet];
  if (!el) throw new Error(`Unknown planet ${planet}`);
  const t = julianCenturies(jd);
  const a = el.a[0]! + el.a[1]! * t;
  const e = el.e[0]! + el.e[1]! * t;
  const i = el.i[0]! + el.i[1]! * t;
  const l = el.l[0]! + el.l[1]! * t;
  const p = el.p[0]! + el.p[1]! * t;
  const n = el.n[0]! + el.n[1]! * t;

  const M = norm360(l - p);
  const omega = p - n;
  const E = solveKepler(M, e);

  const xOrb = a * (cosDeg(E) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * sinDeg(E);

  const cw = cosDeg(omega);
  const sw = sinDeg(omega);
  const co = cosDeg(n);
  const so = sinDeg(n);
  const ci = cosDeg(i);
  const si = sinDeg(i);

  return {
    x: (cw * co - sw * so * ci) * xOrb + (-sw * co - cw * so * ci) * yOrb,
    y: (cw * so + sw * co * ci) * xOrb + (-sw * so + cw * co * ci) * yOrb,
    z: sw * si * xOrb + cw * si * yOrb,
  };
}

function eclipticFromVector(v: Vec3): { longitude: number; latitude: number; distance: number } {
  const distance = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return {
    longitude: norm360(atan2Deg(v.y, v.x)),
    latitude: asinDeg(v.z / (distance || 1)),
    distance,
  };
}

/** Geocentric ecliptic longitude/latitude for a classical planet. */
function planetGeocentric(planet: string, jd: number) {
  const earth = heliocentricVector("Earth", jd);
  const body = heliocentricVector(planet, jd);
  return eclipticFromVector({ x: body.x - earth.x, y: body.y - earth.y, z: body.z - earth.z });
}

/** Apparent geocentric solar longitude (Meeus, low accuracy ~0.01 deg). */
function sunLongitude(jd: number) {
  const t = julianCenturies(jd);
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * sinDeg(m) +
    (0.019993 - 0.000101 * t) * sinDeg(2 * m) +
    0.000289 * sinDeg(3 * m);
  const trueLong = l0 + c;
  // Aberration correction for apparent longitude.
  return { longitude: norm360(trueLong - 0.00569), latitude: 0, distance: 1.000001018 };
}

/** Geocentric lunar position — truncated ELP theory (Meeus ch. 47), ~0.05 deg. */
function moonPosition(jd: number) {
  const t = julianCenturies(jd);
  const lp = norm360(
    218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + (t * t * t) / 538841,
  );
  const d = norm360(297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + (t * t * t) / 545868);
  const m = norm360(357.5291092 + 35999.0502909 * t - 0.0001536 * t * t);
  const mp = norm360(134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + (t * t * t) / 69699);
  const f = norm360(93.272095 + 483202.0175233 * t - 0.0036539 * t * t - (t * t * t) / 3526000);
  const e = 1 - 0.002516 * t - 0.0000074 * t * t;

  // [coefficient (1e-6 deg), D, M, M', F]
  const lonTerms: [number, number, number, number, number][] = [
    [6288774, 0, 0, 1, 0],
    [1274027, 2, 0, -1, 0],
    [658314, 2, 0, 0, 0],
    [213618, 0, 0, 2, 0],
    [-185116, 0, 1, 0, 0],
    [-114332, 0, 0, 0, 2],
    [58793, 2, 0, -2, 0],
    [57066, 2, -1, -1, 0],
    [53322, 2, 0, 1, 0],
    [45758, 2, -1, 0, 0],
    [-40923, 0, 1, -1, 0],
    [-34720, 1, 0, 0, 0],
    [-30383, 0, 1, 1, 0],
    [15327, 2, 0, 0, -2],
    [-12528, 0, 0, 1, 2],
    [10980, 0, 0, 1, -2],
    [10675, 4, 0, -1, 0],
    [10034, 0, 0, 3, 0],
    [8548, 4, 0, -2, 0],
    [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0],
    [-5163, 1, 0, -1, 0],
    [4987, 1, 1, 0, 0],
    [4036, 2, -1, 1, 0],
    [3994, 2, 0, 2, 0],
    [3861, 4, 0, 0, 0],
    [3665, 2, 0, -3, 0],
    [-2689, 0, 1, -2, 0],
    [-2602, 2, 0, -1, 2],
    [2390, 2, -1, -2, 0],
    [-2348, 1, 0, 1, 0],
    [2236, 2, -2, 0, 0],
  ];

  const latTerms: [number, number, number, number, number][] = [
    [5128122, 0, 0, 0, 1],
    [280602, 0, 0, 1, 1],
    [277693, 0, 0, 1, -1],
    [173237, 2, 0, 0, -1],
    [55413, 2, 0, -1, 1],
    [46271, 2, 0, -1, -1],
    [32573, 2, 0, 0, 1],
    [17198, 0, 0, 2, 1],
    [9266, 2, 0, 1, -1],
    [8822, 0, 0, 2, -1],
    [8216, 2, -1, 0, -1],
    [4324, 2, 0, -2, -1],
    [4200, 2, 0, 1, 1],
    [-3359, 2, 1, 0, -1],
    [2463, 2, -1, -1, 1],
    [2211, 2, -1, 0, 1],
    [2065, 2, -1, -1, -1],
  ];

  let sumL = 0;
  for (const [coef, td, tm, tmp, tf] of lonTerms) {
    const eFactor = tm === 0 ? 1 : Math.pow(e, Math.abs(tm));
    sumL += coef * eFactor * sinDeg(td * d + tm * m + tmp * mp + tf * f);
  }
  let sumB = 0;
  for (const [coef, td, tm, tmp, tf] of latTerms) {
    const eFactor = tm === 0 ? 1 : Math.pow(e, Math.abs(tm));
    sumB += coef * eFactor * sinDeg(td * d + tm * m + tmp * mp + tf * f);
  }

  return {
    longitude: norm360(lp + sumL / 1e6),
    latitude: sumB / 1e6,
    distance: 0.00257,
  };
}

/** Chiron — approximate Keplerian orbit anchored to the 1996 perihelion. */
function chironPosition(jd: number) {
  const a = 13.7;
  const ecc = 0.3827;
  const inc = 6.94;
  const node = 209.3;
  const peri = 339.6;
  const periodDays = 50.42 * 365.25;
  const M = norm360(((jd - 2450128.5) / periodDays) * 360);
  const E = solveKepler(M, ecc);
  const xOrb = a * (cosDeg(E) - ecc);
  const yOrb = a * Math.sqrt(1 - ecc * ecc) * sinDeg(E);
  const cw = cosDeg(peri);
  const sw = sinDeg(peri);
  const co = cosDeg(node);
  const so = sinDeg(node);
  const ci = cosDeg(inc);
  const si = sinDeg(inc);
  const helio: Vec3 = {
    x: (cw * co - sw * so * ci) * xOrb + (-sw * co - cw * so * ci) * yOrb,
    y: (cw * so + sw * co * ci) * xOrb + (-sw * so + cw * co * ci) * yOrb,
    z: sw * si * xOrb + cw * si * yOrb,
  };
  const earth = heliocentricVector("Earth", jd);
  return eclipticFromVector({ x: helio.x - earth.x, y: helio.y - earth.y, z: helio.z - earth.z });
}

/** Mean lunar ascending node. */
export function meanNode(jd: number): number {
  const t = julianCenturies(jd);
  return norm360(125.0445479 - 1934.1362891 * t + 0.0020754 * t * t + (t * t * t) / 467441);
}

/** Mean lunar apogee — Black Moon Lilith. */
export function meanLilith(jd: number): number {
  const t = julianCenturies(jd);
  return norm360(83.3532465 + 4069.0137287 * t - 0.01032 * t * t - (t * t * t) / 80053);
}

function rawPosition(body: Body, jd: number): { longitude: number; latitude: number; distance: number } {
  switch (body) {
    case "Sun":
      return sunLongitude(jd);
    case "Moon":
      return moonPosition(jd);
    case "Chiron":
      return chironPosition(jd);
    case "NorthNode":
      return { longitude: meanNode(jd), latitude: 0, distance: 0 };
    case "SouthNode":
      return { longitude: norm360(meanNode(jd) + 180), latitude: 0, distance: 0 };
    case "Lilith":
      return { longitude: meanLilith(jd), latitude: 0, distance: 0 };
    default:
      return planetGeocentric(body, jd);
  }
}

function declinationOf(longitude: number, latitude: number, jd: number): number {
  const eps = meanObliquity(jd);
  return asinDeg(
    sinDeg(latitude) * cosDeg(eps) + cosDeg(latitude) * sinDeg(eps) * sinDeg(longitude),
  );
}

/** Full ecliptic position with speed, declination, and retrograde flag. */
export function bodyPosition(body: Body, jd: number): EclipticPosition {
  const pos = rawPosition(body, jd);
  const before = rawPosition(body, jd - 0.5);
  const after = rawPosition(body, jd + 0.5);
  let speed = after.longitude - before.longitude;
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;
  return {
    longitude: pos.longitude,
    latitude: pos.latitude,
    distance: pos.distance,
    speed,
    declination: declinationOf(pos.longitude, pos.latitude, jd),
    retrograde: speed < 0,
  };
}

export function allPositions(jd: number, bodies: Body[] = ALL_BODIES): Record<Body, EclipticPosition> {
  const out = {} as Record<Body, EclipticPosition>;
  for (const b of bodies) out[b] = bodyPosition(b, jd);
  return out;
}

/** Maximum solar declination — beyond this a body is "out of bounds". */
export function isOutOfBounds(declination: number, jd: number): boolean {
  return Math.abs(declination) > meanObliquity(jd);
}

/** Illuminated-phase angle of the Moon (0 new → 180 full), plus phase name. */
export function moonPhase(jd: number): { angle: number; name: string; illumination: number } {
  const sun = rawPosition("Sun", jd).longitude;
  const moon = rawPosition("Moon", jd).longitude;
  const angle = norm360(moon - sun);
  const illumination = (1 - cosDeg(angle)) / 2;
  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];
  const idx = Math.floor(((angle + 22.5) % 360) / 45);
  return { angle, name: names[idx]!, illumination };
}
