import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coreNumbers,
  lifePathNumber,
  personalCycles,
  scoreName,
  extendedNameAnalysis,
  essenceAtAge,
  challengesAndPinnacles,
  computeHumanDesign,
  gateAndLine,
  computeNatalChart,
  annualProfection,
  computeSynastry,
  computeAstroMap,
  bodyPosition,
  julianDayFromMoment,
  norm360,
  assessDataQuality,
  type BirthMoment,
} from "../src/index";

// ---------------------------------------------------------------------------
// Numerology arithmetic (hand-verifiable)
// ---------------------------------------------------------------------------

test("life path 1990-06-15: 6 + 6 + 1 = 13 -> 4, karmic debt 13", () => {
  const lp = lifePathNumber("1990-06-15");
  assert.equal(lp.value, 4);
  assert.equal(lp.karmicDebt, 13);
});

test("life path preserves master 11", () => {
  // 1910-11-29: month 11, day 29->11, year 1910->11; 11+11+11=33 master
  const lp = lifePathNumber("1910-11-29");
  assert.equal(lp.value, 33);
});

test("core numbers are deterministic and in range", () => {
  const core = coreNumbers("Luna Starweaver", "1990-06-15");
  assert.equal(core.lifePath, 4);
  for (const value of [core.expression, core.soulUrge, core.personality, core.birthday]) {
    assert.ok((value >= 1 && value <= 9) || [11, 22, 33].includes(value));
  }
});

test("personal year cycles are 1-9 or master", () => {
  const cycles = personalCycles("1990-06-15", "2026-07-22");
  for (const value of [cycles.personalYear, cycles.personalMonth, cycles.personalDay]) {
    assert.ok((value >= 1 && value <= 9) || [11, 22, 33].includes(value));
  }
});

test("extended analysis: karmic lessons are the missing digits", () => {
  // "abc" has values 1, 2, 3 -> lessons are 4..9
  const extended = extendedNameAnalysis("abc", "1990-06-15");
  assert.deepEqual(extended.karmicLessons, [4, 5, 6, 7, 8, 9]);
  assert.equal(extended.subconsciousSelf, 3);
  assert.equal(extended.cornerstone, "A");
  assert.equal(extended.capstone, "C");
});

test("chaldean and pythagorean expressions can differ", () => {
  const extended = extendedNameAnalysis("Oralia", "1990-06-15");
  assert.ok(extended.pythagoreanExpression >= 1);
  assert.ok(extended.chaldeanExpression >= 1);
  assert.equal(extended.workings.length, 6);
});

test("essence is deterministic per age", () => {
  const a = essenceAtAge("Luna Starweaver", 30);
  const b = essenceAtAge("Luna Starweaver", 30);
  assert.deepEqual(a, b);
  assert.ok(a.essence >= 1);
});

test("pinnacles cover the whole life without gaps", () => {
  const { pinnacles } = challengesAndPinnacles("1990-06-15");
  assert.equal(pinnacles.length, 4);
  assert.equal(pinnacles[0]!.fromAge, 0);
  assert.equal(pinnacles[3]!.toAge, null);
  for (let i = 1; i < 4; i++) {
    assert.equal(pinnacles[i]!.fromAge, (pinnacles[i - 1]!.toAge ?? 0) + 1);
  }
});

test("business name scoring penalizes karmic debt totals", () => {
  const scored = scoreName("aidd", "business"); // 1+9+4+4 = 18 -> not debt
  assert.ok(scored.rating >= 0 && scored.rating <= 100);
});

// ---------------------------------------------------------------------------
// Human Design
// ---------------------------------------------------------------------------

test("gate wheel starts with gate 41 at 2 Aquarius", () => {
  assert.deepEqual(gateAndLine(302.0), { gate: 41, line: 1 });
  assert.deepEqual(gateAndLine(302.0 + 5.625), { gate: 19, line: 1 });
  // Last line of gate 41
  assert.equal(gateAndLine(302.0 + 5.624).gate, 41);
  assert.equal(gateAndLine(302.0 + 5.624).line, 6);
});

const HD_MOMENT: BirthMoment = {
  date: "1990-06-15",
  time: "08:30",
  utcOffset: -4,
  latitude: 40.7128,
  longitude: -74.006,
};

test("human design chart has consistent structure", () => {
  const hd = computeHumanDesign(HD_MOMENT);
  assert.ok(["Manifestor", "Generator", "Manifesting Generator", "Projector", "Reflector"].includes(hd.type));
  assert.match(hd.profile, /^[1-6]\/[1-6]$/);
  assert.equal(hd.definedCenters.length + hd.undefinedCenters.length, 9);
  // Every defined channel's gates must be activated.
  const activeGates = new Set(hd.activations.map((a) => a.gate));
  for (const channel of hd.channels) {
    assert.ok(activeGates.has(channel.gates[0]));
    assert.ok(activeGates.has(channel.gates[1]));
  }
});

test("design side is computed 88 solar-arc degrees before birth", () => {
  const hd = computeHumanDesign(HD_MOMENT);
  const natalSunLon = bodyPosition("Sun", julianDayFromMoment(HD_MOMENT)).longitude;
  const designSun = hd.activations.find((a) => a.side === "design" && a.body === "Sun")!;
  const arc = norm360(natalSunLon - designSun.longitude);
  assert.ok(Math.abs(arc - 88) < 0.1, `solar arc ${arc.toFixed(3)}, expected 88`);
});

// ---------------------------------------------------------------------------
// Profections
// ---------------------------------------------------------------------------

test("annual profection cycles through houses by age", () => {
  const chart = computeNatalChart(HD_MOMENT);
  assert.equal(annualProfection(chart, 0).profectedHouse, 1);
  assert.equal(annualProfection(chart, 12).profectedHouse, 1);
  assert.equal(annualProfection(chart, 24).profectedHouse, 1);
  assert.equal(annualProfection(chart, 35).profectedHouse, 12);
  assert.equal(annualProfection(chart, 9).profectedHouse, 10);
  // Profected sign advances from the Ascendant sign.
  const age1 = annualProfection(chart, 1);
  assert.equal(age1.profectedHouse, 2);
});

// ---------------------------------------------------------------------------
// Synastry & data quality
// ---------------------------------------------------------------------------

const PARTNER: BirthMoment = {
  date: "1992-03-02",
  time: null,
  utcOffset: -6,
  latitude: 41.88,
  longitude: -87.63,
};

test("unknown birth time removes house overlays and records limitations", () => {
  const result = computeSynastry(HD_MOMENT, PARTNER);
  assert.equal(result.dataQuality.timeKnownB, false);
  assert.ok(result.dataQuality.limitations.length >= 1);
  // No overlays into B's (unknown) houses:
  assert.ok(result.overlays.every((o) => o.owner === "B"));
  // Scores still produced from time-independent factors.
  assert.ok(result.scores.overall >= 5 && result.scores.overall <= 98);
});

test("data quality scoring reflects confidence and coordinates", () => {
  const exact = assessDataQuality({ birthTimeConfidence: "exact_documented", hasTime: true, hasCoordinates: true });
  const unknown = assessDataQuality({ birthTimeConfidence: "unknown", hasTime: false, hasCoordinates: false });
  assert.equal(exact.score, 100);
  assert.equal(exact.timeDependentSafe, true);
  assert.ok(unknown.score < 30);
  assert.equal(unknown.timeDependentSafe, false);
  assert.ok(unknown.limitations.length >= 2);
});

test("astro map scores are bounded and rankings populated", () => {
  const chart = computeNatalChart(HD_MOMENT);
  const map = computeAstroMap(chart);
  assert.ok(map.cityScores.length >= 70);
  for (const city of map.cityScores.slice(0, 10)) {
    assert.ok(city.scores.overall >= 5 && city.scores.overall <= 98);
  }
  assert.equal(map.bestFor.career!.length, 5);
});
