export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/** Normalize an angle to [0, 360). */
export function norm360(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Normalize an angle to (-180, 180]. */
export function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

/** Shortest angular separation between two longitudes, in [0, 180]. */
export function angularSeparation(a: number, b: number): number {
  return Math.abs(norm180(a - b));
}

export function sinDeg(deg: number): number {
  return Math.sin(deg * DEG2RAD);
}

export function cosDeg(deg: number): number {
  return Math.cos(deg * DEG2RAD);
}

export function tanDeg(deg: number): number {
  return Math.tan(deg * DEG2RAD);
}

export function atan2Deg(y: number, x: number): number {
  return Math.atan2(y, x) * RAD2DEG;
}

export function asinDeg(x: number): number {
  return Math.asin(Math.min(1, Math.max(-1, x))) * RAD2DEG;
}

export function acosDeg(x: number): number {
  return Math.acos(Math.min(1, Math.max(-1, x))) * RAD2DEG;
}

/** Solve Kepler's equation M = E - e*sin(E) for E (all angles in degrees). */
export function solveKepler(meanAnomalyDeg: number, eccentricity: number): number {
  const M = norm360(meanAnomalyDeg) * DEG2RAD;
  let E = eccentricity < 0.8 ? M : Math.PI;
  for (let i = 0; i < 30; i++) {
    const dE = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E * RAD2DEG;
}

/** Midpoint of two zodiac longitudes (shorter arc). */
export function midpoint(a: number, b: number): number {
  const diff = norm180(b - a);
  return norm360(a + diff / 2);
}

export function round(value: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
