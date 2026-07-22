import type { Body } from "../core/ephemeris";

export type Sign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type Element = "Fire" | "Earth" | "Air" | "Water";
export type Modality = "Cardinal" | "Fixed" | "Mutable";

export const SIGNS: Sign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const SIGN_ELEMENTS: Record<Sign, Element> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

export const SIGN_MODALITIES: Record<Sign, Modality> = {
  Aries: "Cardinal",
  Taurus: "Fixed",
  Gemini: "Mutable",
  Cancer: "Cardinal",
  Leo: "Fixed",
  Virgo: "Mutable",
  Libra: "Cardinal",
  Scorpio: "Fixed",
  Sagittarius: "Mutable",
  Capricorn: "Cardinal",
  Aquarius: "Fixed",
  Pisces: "Mutable",
};

/** Modern rulerships (used for chart ruler and dispositors). */
export const SIGN_RULERS: Record<Sign, Body> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

/** Traditional rulerships (used for dignities, sect, profections). */
export const TRADITIONAL_RULERS: Record<Sign, Body> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

export const EXALTATIONS: Partial<Record<Body, Sign>> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mercury: "Virgo",
  Venus: "Pisces",
  Mars: "Capricorn",
  Jupiter: "Cancer",
  Saturn: "Libra",
};

export function signOf(longitude: number): Sign {
  return SIGNS[Math.floor(((longitude % 360) + 360) % 360 / 30) % 12]!;
}

export function degreeInSign(longitude: number): number {
  return ((longitude % 360) + 360) % 360 % 30;
}

export function formatDegree(longitude: number): string {
  const deg = degreeInSign(longitude);
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}' ${signOf(longitude)}`;
}

/** 29th degree of any sign. */
export function isAnaretic(longitude: number): boolean {
  return Math.floor(degreeInSign(longitude)) === 29;
}

/** Classic critical degrees by modality (0/13/26 cardinal, 8-9/21-22 fixed, 4/17 mutable). */
export function isCriticalDegree(longitude: number): boolean {
  const sign = signOf(longitude);
  const deg = Math.floor(degreeInSign(longitude));
  const modality = SIGN_MODALITIES[sign];
  if (modality === "Cardinal") return [0, 13, 26].includes(deg);
  if (modality === "Fixed") return [8, 9, 21, 22].includes(deg);
  return [4, 17].includes(deg);
}
