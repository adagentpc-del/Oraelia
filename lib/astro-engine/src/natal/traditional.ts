import type { Body } from "../core/ephemeris";
import { SIGN_ELEMENTS, type Element, type Sign } from "./zodiac";
import type { PlacedBody } from "./chart";

/** Dorothean triplicity rulers: [day ruler, night ruler, participating]. */
const TRIPLICITY_RULERS: Record<Element, [Body, Body, Body]> = {
  Fire: ["Sun", "Jupiter", "Saturn"],
  Earth: ["Venus", "Moon", "Mars"],
  Air: ["Saturn", "Mercury", "Jupiter"],
  Water: ["Venus", "Mars", "Moon"],
};

/** Planetary joys: the house each planet "rejoices" in. */
export const PLANETARY_JOYS: Partial<Record<Body, number>> = {
  Mercury: 1,
  Moon: 3,
  Venus: 5,
  Mars: 6,
  Sun: 9,
  Jupiter: 11,
  Saturn: 12,
};

export interface TriplicityInfo {
  element: Element;
  dayRuler: Body;
  nightRuler: Body;
  participating: Body;
  /** The ruler active for this chart's sect. */
  activeRuler: Body;
}

export interface TraditionalAnalysis {
  sect: "day" | "night";
  beneficOfSect: Body;
  beneficContrarySect: Body;
  maleficOfSect: Body;
  maleficContrarySect: Body;
  planetsInJoy: { body: Body; house: number }[];
  triplicities: Record<Element, TriplicityInfo>;
  /** House placement class per traditional planet. */
  angularity: { body: Body; class: "angular" | "succedent" | "cadent" }[];
  notes: string[];
}

const ANGULAR_HOUSES = [1, 4, 7, 10];
const SUCCEDENT_HOUSES = [2, 5, 8, 11];

export function traditionalAnalysis(bodies: PlacedBody[], isDayChart: boolean): TraditionalAnalysis {
  const sect: "day" | "night" = isDayChart ? "day" : "night";
  const beneficOfSect: Body = isDayChart ? "Jupiter" : "Venus";
  const beneficContrarySect: Body = isDayChart ? "Venus" : "Jupiter";
  const maleficOfSect: Body = isDayChart ? "Saturn" : "Mars";
  const maleficContrarySect: Body = isDayChart ? "Mars" : "Saturn";

  const planetsInJoy = bodies
    .filter((b) => PLANETARY_JOYS[b.body] === b.house)
    .map((b) => ({ body: b.body, house: b.house }));

  const triplicities = {} as Record<Element, TriplicityInfo>;
  for (const element of ["Fire", "Earth", "Air", "Water"] as Element[]) {
    const [dayRuler, nightRuler, participating] = TRIPLICITY_RULERS[element];
    triplicities[element] = {
      element,
      dayRuler,
      nightRuler,
      participating,
      activeRuler: isDayChart ? dayRuler : nightRuler,
    };
  }

  const traditionalPlanets: Body[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const angularity = bodies
    .filter((b) => traditionalPlanets.includes(b.body))
    .map((b) => ({
      body: b.body,
      class: (ANGULAR_HOUSES.includes(b.house)
        ? "angular"
        : SUCCEDENT_HOUSES.includes(b.house)
          ? "succedent"
          : "cadent") as "angular" | "succedent" | "cadent",
    }));

  const notes: string[] = [];
  const maleficContrary = bodies.find((b) => b.body === maleficContrarySect);
  if (maleficContrary && ANGULAR_HOUSES.includes(maleficContrary.house)) {
    notes.push(
      `${maleficContrarySect} (malefic contrary to sect) is angular in house ${maleficContrary.house} — the chart's most demanding pressure point; its topics require active management rather than avoidance.`,
    );
  }
  const beneficSect = bodies.find((b) => b.body === beneficOfSect);
  if (beneficSect && ANGULAR_HOUSES.includes(beneficSect.house)) {
    notes.push(
      `${beneficOfSect} (benefic of sect) is angular in house ${beneficSect.house} — the chart's most reliable helper; lean on this house's topics when you need momentum.`,
    );
  }
  for (const joy of planetsInJoy) {
    notes.push(`${joy.body} is in its joy (house ${joy.house}) — this planet's significations operate with unusual ease.`);
  }

  return {
    sect,
    beneficOfSect,
    beneficContrarySect,
    maleficOfSect,
    maleficContrarySect,
    planetsInJoy,
    triplicities,
    angularity,
    notes,
  };
}

/** Element of a sign (re-export convenience for consumers). */
export function elementOf(sign: Sign): Element {
  return SIGN_ELEMENTS[sign];
}
