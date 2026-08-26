import { test } from "node:test";
import assert from "node:assert/strict";
import {
  julianDay,
  julianDayFromMoment,
  dateFromJulianDay,
  meanObliquity,
  bodyPosition,
  moonPhase,
  norm360,
  midpoint,
  angularSeparation,
  reduceNumber,
} from "../src/index";

test("Julian day for J2000.0 epoch", () => {
  assert.equal(julianDay(2000, 1, 1, 12), 2451545.0);
});

test("Julian day round-trips through calendar dates", () => {
  const jd = julianDay(1989, 4, 26, 21.333);
  const date = dateFromJulianDay(jd);
  assert.equal(date.getUTCFullYear(), 1989);
  assert.equal(date.getUTCMonth() + 1, 4);
  assert.equal(date.getUTCDate(), 26);
});

test("BirthMoment conversion applies UTC offset", () => {
  // 16:20 local at UTC-5 = 21:20 UTC
  const jd = julianDayFromMoment({
    date: "1989-04-26",
    time: "16:20",
    utcOffset: -5,
    latitude: 0,
    longitude: 0,
  });
  const date = dateFromJulianDay(jd);
  assert.equal(date.getUTCHours(), 21);
  assert.equal(date.getUTCMinutes(), 20);
});

test("mean obliquity near 23.44 degrees at J2000", () => {
  const eps = meanObliquity(2451545.0);
  assert.ok(Math.abs(eps - 23.4393) < 0.001, `got ${eps}`);
});

// Golden fixture: geocentric ecliptic longitudes at J2000.0 (reference values
// from standard ephemerides), tolerance 0.5 degrees.
const J2000_LONGITUDES: [string, number][] = [
  ["Sun", 280.46],
  ["Moon", 223.3],
  ["Mercury", 271.9],
  ["Venus", 241.5],
  ["Mars", 327.9],
  ["Jupiter", 25.3],
  ["Saturn", 40.3],
  ["Uranus", 314.8],
  ["Neptune", 303.2],
  ["Pluto", 251.4],
];

for (const [body, expected] of J2000_LONGITUDES) {
  test(`J2000 longitude of ${body} within 0.5 deg of ${expected}`, () => {
    const pos = bodyPosition(body as never, 2451545.0);
    const diff = angularSeparation(pos.longitude, expected);
    assert.ok(diff < 0.5, `${body}: got ${pos.longitude.toFixed(2)}, expected ~${expected}`);
  });
}

test("Saturn is retrograde at J2000", () => {
  assert.equal(bodyPosition("Saturn", 2451545.0).retrograde, true);
});

test("moon phase angle is Sun-Moon elongation", () => {
  const phase = moonPhase(2451545.0);
  assert.ok(phase.angle >= 0 && phase.angle < 360);
  assert.ok(phase.illumination >= 0 && phase.illumination <= 1);
});

test("norm360 and midpoint math", () => {
  assert.equal(norm360(-30), 330);
  assert.equal(norm360(370), 10);
  assert.equal(midpoint(350, 10), 0);
  assert.equal(midpoint(0, 90), 45);
});

test("reduceNumber preserves masters and reduces others", () => {
  assert.equal(reduceNumber(29), 11);
  assert.equal(reduceNumber(22), 22);
  assert.equal(reduceNumber(33), 33);
  assert.equal(reduceNumber(29, false), 2);
  assert.equal(reduceNumber(1990), 1);
});
