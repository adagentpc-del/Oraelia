import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeNatalChart,
  upcomingLunations,
  transitEvents,
  solarReturnChart,
  lunarReturnChart,
  scoreDay,
  julianDayFromDate,
  bodyPosition,
  angularSeparation,
  evaluateDecision,
  type BirthMoment,
} from "../src/index";

const MOMENT: BirthMoment = {
  date: "1990-06-15",
  time: "08:30",
  utcOffset: -4,
  latitude: 40.7128,
  longitude: -74.006,
};

test("predicts the real August 2026 eclipses", () => {
  const fromJd = julianDayFromDate(new Date("2026-07-22T00:00:00Z"));
  const lunations = upcomingLunations(fromJd, 4);
  const eclipses = lunations.filter((l) => l.isEclipse);
  const dates = eclipses.map((e) => e.date.toISOString().slice(0, 10));
  // Solar eclipse 2026-08-12, lunar eclipse 2026-08-28 (real events).
  assert.ok(dates.some((d) => d === "2026-08-12" || d === "2026-08-13"), `got ${dates.join(",")}`);
  assert.ok(dates.some((d) => d === "2026-08-27" || d === "2026-08-28"), `got ${dates.join(",")}`);
});

test("lunations alternate new and full", () => {
  const fromJd = julianDayFromDate(new Date("2026-01-01T00:00:00Z"));
  const lunations = upcomingLunations(fromJd, 6);
  for (let i = 1; i < lunations.length; i++) {
    assert.notEqual(lunations[i]!.type, lunations[i - 1]!.type);
  }
});

test("transit events are sorted, dated, and within window", () => {
  const chart = computeNatalChart(MOMENT);
  const fromJd = julianDayFromDate(new Date("2026-01-01T00:00:00Z"));
  const events = transitEvents(chart, fromJd, 365);
  assert.ok(events.length > 0, "expected at least one slow-planet exact hit in a year");
  for (let i = 1; i < events.length; i++) {
    assert.ok(events[i]!.date >= events[i - 1]!.date);
  }
  for (const event of events) {
    assert.ok(event.date >= "2026-01-01" && event.date <= "2027-01-02");
    assert.ok(event.pass >= 1);
  }
});

test("retrograde revisits produce multi-pass arcs for at least one contact", () => {
  const chart = computeNatalChart(MOMENT);
  const fromJd = julianDayFromDate(new Date("2026-01-01T00:00:00Z"));
  const events = transitEvents(chart, fromJd, 730);
  const byContact = new Map<string, number>();
  for (const e of events) {
    const key = `${e.transiting}-${e.aspect}-${e.natal}`;
    byContact.set(key, Math.max(byContact.get(key) ?? 0, e.pass));
  }
  const multiPass = [...byContact.values()].filter((p) => p >= 2);
  assert.ok(multiPass.length > 0, "expected at least one retrograde revisit in 2 years");
});

test("solar return chart puts the Sun back on the natal degree", () => {
  const natal = computeNatalChart(MOMENT);
  const result = solarReturnChart(natal, 2026, MOMENT.latitude, MOMENT.longitude);
  const natalSun = natal.bodies.find((b) => b.body === "Sun")!;
  const returnSun = result.chart.bodies.find((b) => b.body === "Sun")!;
  assert.ok(
    angularSeparation(natalSun.longitude, returnSun.longitude) < 0.01,
    `separation ${angularSeparation(natalSun.longitude, returnSun.longitude)}`,
  );
  assert.ok(result.returnDate.startsWith("2026-06-1"), result.returnDate);
  assert.equal(result.overlay.length, 10);
});

test("lunar return chart puts the Moon back on the natal degree", () => {
  const natal = computeNatalChart(MOMENT);
  const fromJd = julianDayFromDate(new Date("2026-07-01T00:00:00Z"));
  const result = lunarReturnChart(natal, fromJd, MOMENT.latitude, MOMENT.longitude);
  const natalMoon = natal.bodies.find((b) => b.body === "Moon")!;
  const returnMoon = result.chart.bodies.find((b) => b.body === "Moon")!;
  assert.ok(angularSeparation(natalMoon.longitude, returnMoon.longitude) < 0.05);
  // A lunar return occurs within ~27.5 days of the from date.
  const returnJd = julianDayFromDate(new Date(result.returnDate));
  assert.ok(returnJd >= fromJd - 0.01 && returnJd <= fromJd + 28);
});

test("daily scores stay in bounds across a month", () => {
  const chart = computeNatalChart(MOMENT);
  for (let day = 0; day < 30; day += 3) {
    const jd = julianDayFromDate(new Date(Date.UTC(2026, 6, 1 + day, 12)));
    const { scores } = scoreDay(chart, jd);
    for (const value of Object.values(scores)) {
      assert.ok(value >= 5 && value <= 98, `score out of bounds: ${value}`);
    }
  }
});

test("decision engine returns coherent structure", () => {
  const chart = computeNatalChart(MOMENT);
  const evaluation = evaluateDecision(
    chart,
    MOMENT,
    MOMENT.date,
    "Should I launch?",
    "launch",
    new Date("2026-07-22T12:00:00Z"),
  );
  assert.ok(evaluation.opportunityScore >= 10 && evaluation.opportunityScore <= 98);
  assert.ok(evaluation.riskScore >= 8 && evaluation.riskScore <= 90);
  assert.ok(evaluation.factors.length >= 3);
  assert.equal(evaluation.bestWindows.length, 3);
  assert.ok(["proceed", "proceed-with-care", "wait", "avoid-for-now"].includes(evaluation.recommendation));
});

test("ephemeris speed sign matches position change", () => {
  const jd = julianDayFromDate(new Date("2026-07-22T00:00:00Z"));
  for (const body of ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const) {
    const pos = bodyPosition(body, jd);
    const next = bodyPosition(body, jd + 1);
    let delta = next.longitude - pos.longitude;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    assert.equal(Math.sign(delta) === -1, pos.retrograde || Math.abs(delta) < 1e-4);
  }
});
