import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeNatalChart,
  computeChartAt,
  julianDayFromMoment,
  houseOf,
  draconicPositions,
  lahiriAyanamsa,
  angularSeparation,
  type BirthMoment,
} from "../src/index";

/**
 * Alyssa QA fixture (from ORALIA_MASTER_BUILD_SPEC.md §26).
 * April 26, 1989, 4:20 PM CDT (UTC-5), Saint Louis Park, MN.
 *
 * Spec baseline: Virgo Ascendant near 23°, Taurus Sun near 6°, "Libra Moon
 * near 8°". The Moon expectation in the spec is astronomically inconsistent:
 * the full moon of 1989-04-21 fell near 1° Scorpio, so five days later the
 * Moon must be in Capricorn. Independent lunation check confirms ~12°
 * Capricorn; the spec value is flagged in docs/TEST_PLAN.md for product
 * review against professional sources.
 */
const ALYSSA: BirthMoment = {
  date: "1989-04-26",
  time: "16:20",
  utcOffset: -5,
  latitude: 44.9483,
  longitude: -93.348,
};

test("Alyssa fixture: Ascendant near 23 Virgo", () => {
  const chart = computeNatalChart(ALYSSA);
  assert.equal(chart.ascendantSign, "Virgo");
  const ascDegree = chart.houses.angles.ascendant % 30;
  assert.ok(Math.abs(ascDegree - 23) < 2.5, `ASC degree ${ascDegree.toFixed(2)}, expected ~23`);
});

test("Alyssa fixture: Sun near 6 Taurus", () => {
  const chart = computeNatalChart(ALYSSA);
  const sun = chart.bodies.find((b) => b.body === "Sun")!;
  assert.equal(sun.sign, "Taurus");
  assert.ok(Math.abs(sun.degreeInSign - 6.6) < 1, `Sun at ${sun.degreeInSign}, expected ~6.6`);
});

test("Alyssa fixture: Moon in Capricorn (verified against Apr 1989 lunation cycle)", () => {
  const chart = computeNatalChart(ALYSSA);
  const moon = chart.bodies.find((b) => b.body === "Moon")!;
  assert.equal(moon.sign, "Capricorn");
  assert.ok(Math.abs(moon.degreeInSign - 12.3) < 2, `Moon at ${moon.degreeInSign} Capricorn`);
});

test("chart has 12 cusps, valid houses, and a day-chart flag", () => {
  const chart = computeNatalChart(ALYSSA);
  assert.equal(chart.houses.cusps.length, 12);
  for (const body of chart.bodies) {
    assert.ok(body.house >= 1 && body.house <= 12);
  }
  // 16:20 with Sun in Taurus and Virgo rising: Sun is above the horizon.
  assert.equal(chart.isDayChart, true);
});

test("whole-sign, equal, and porphyry systems produce valid distinct cusps", () => {
  const whole = computeNatalChart(ALYSSA, "whole-sign");
  const equal = computeNatalChart(ALYSSA, "equal");
  const porphyry = computeNatalChart(ALYSSA, "porphyry");
  assert.equal(whole.houses.cusps[0]! % 30, 0); // whole sign starts at 0° of rising sign
  assert.ok(Math.abs(equal.houses.cusps[0]! - equal.houses.angles.ascendant) < 1e-9);
  assert.equal(porphyry.houses.cusps[9], porphyry.houses.angles.midheaven);
});

test("sidereal chart shifts longitudes by the ayanamsa", () => {
  const tropical = computeNatalChart(ALYSSA, { zodiac: "tropical" });
  const sidereal = computeNatalChart(ALYSSA, { zodiac: "sidereal" });
  const ayanamsa = lahiriAyanamsa(tropical.julianDay);
  const tropSun = tropical.bodies.find((b) => b.body === "Sun")!;
  const sidSun = sidereal.bodies.find((b) => b.body === "Sun")!;
  const shift = angularSeparation(tropSun.longitude, sidSun.longitude);
  assert.ok(Math.abs(shift - ayanamsa) < 0.01, `shift ${shift} vs ayanamsa ${ayanamsa}`);
  assert.equal(sidereal.meta.zodiac, "sidereal");
  assert.ok(sidereal.meta.ayanamsaDegrees! > 23 && sidereal.meta.ayanamsaDegrees! < 25);
});

test("houseOf places longitudes correctly for simple cusps", () => {
  const cusps = Array.from({ length: 12 }, (_, i) => i * 30);
  assert.equal(houseOf(15, cusps), 1);
  assert.equal(houseOf(45, cusps), 2);
  assert.equal(houseOf(359, cusps), 12);
});

test("calculation meta is versioned and deterministic", () => {
  const a = computeNatalChart(ALYSSA);
  const b = computeNatalChart(ALYSSA);
  assert.equal(a.meta.sourceHash, b.meta.sourceHash);
  assert.equal(a.meta.methodVersion, "oralia-astrology-2");
  assert.equal(a.meta.calculationEngine, "oralia-astro-engine");
  // Different house system changes the hash.
  const c = computeNatalChart(ALYSSA, "whole-sign");
  assert.notEqual(a.meta.sourceHash, c.meta.sourceHash);
});

test("draconic positions put the node axis at 0 Aries", () => {
  const chart = computeNatalChart(ALYSSA);
  const draconic = draconicPositions(chart);
  const node = chart.bodies.find((b) => b.body === "NorthNode")!;
  const sun = chart.bodies.find((b) => b.body === "Sun")!;
  const draconicSun = draconic.find((d) => d.body === "Sun")!;
  const expected = (sun.longitude - node.longitude + 360) % 360;
  assert.ok(Math.abs(draconicSun.longitude - expected) < 0.01);
});

test("traditional layer: sect, benefics, joys are consistent", () => {
  const chart = computeNatalChart(ALYSSA);
  assert.equal(chart.traditional.sect, chart.isDayChart ? "day" : "night");
  assert.equal(chart.traditional.beneficOfSect, chart.isDayChart ? "Jupiter" : "Venus");
  assert.equal(chart.traditional.maleficContrarySect, chart.isDayChart ? "Mars" : "Saturn");
  for (const joy of chart.traditional.planetsInJoy) {
    const placed = chart.bodies.find((b) => b.body === joy.body)!;
    assert.equal(placed.house, joy.house);
  }
});

test("computeChartAt equals computeNatalChart for the same moment", () => {
  const viaMovement = computeNatalChart(ALYSSA);
  const viaJd = computeChartAt(julianDayFromMoment(ALYSSA), ALYSSA.latitude, ALYSSA.longitude);
  assert.equal(viaMovement.meta.sourceHash, viaJd.meta.sourceHash);
});

test("midpoints and declination aspects are present and bounded", () => {
  const chart = computeNatalChart(ALYSSA);
  assert.ok(chart.midpoints.length >= 45);
  for (const decl of chart.declinationAspects) {
    assert.ok(decl.orb <= 1.0);
  }
});
