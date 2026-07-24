import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeNatalChart,
  planningTimeline,
  quarterlyForecast,
  computeHDConnection,
  localSpaceLines,
  julianDayFromDate,
  type BirthMoment,
} from "../src/index";

const MOMENT: BirthMoment = {
  date: "1990-06-15",
  time: "08:30",
  utcOffset: -4,
  latitude: 40.7128,
  longitude: -74.006,
};

const PARTNER: BirthMoment = {
  date: "1992-03-02",
  time: "14:00",
  utcOffset: -6,
  latitude: 41.88,
  longitude: -87.63,
};

test("planning timeline covers requested years with profection continuity", () => {
  const chart = computeNatalChart(MOMENT);
  const timeline = planningTimeline(chart, MOMENT, 30, 10);
  assert.equal(timeline.length, 10);
  assert.equal(timeline[0]!.age, 30);
  assert.equal(timeline[0]!.calendarYear, 2020);
  for (let i = 1; i < timeline.length; i++) {
    const expected = (timeline[i - 1]!.profectedHouse % 12) + 1;
    assert.equal(timeline[i]!.profectedHouse, expected);
  }
  // Saturn return marker appears in the age 29-30 vicinity window.
  const nearSaturn = planningTimeline(chart, MOMENT, 28, 4);
  assert.ok(
    nearSaturn.some((y) => y.cycleMarkers.some((m) => m.includes("Saturn return"))),
    "expected Saturn return marker near age 29.5",
  );
});

test("quarterly forecast structure is coherent and windowed", () => {
  const chart = computeNatalChart(MOMENT);
  const fromJd = julianDayFromDate(new Date("2026-07-01T00:00:00Z"));
  const quarter = quarterlyForecast(chart, MOMENT, fromJd);
  assert.equal(quarter.startDate, "2026-07-01");
  assert.equal(quarter.monthlyThemes.length, 3);
  for (const lunation of quarter.lunations) {
    assert.ok(lunation.date >= "2026-07-01" && lunation.date <= quarter.endDate);
  }
  assert.ok(quarter.launchWindows.length >= 1);
  assert.ok(quarter.cautionWindows.length >= 1);
  // ~92 days should hold 5-7 lunations.
  assert.ok(quarter.lunations.length >= 5 && quarter.lunations.length <= 7);
});

test("HD connection chart classifies channels and is symmetric in count", () => {
  const ab = computeHDConnection(MOMENT, PARTNER);
  const ba = computeHDConnection(PARTNER, MOMENT);
  assert.equal(ab.channels.length, ba.channels.length);
  assert.equal(ab.combinedDefinedCenters.length + ab.openTogether.length, 9);
  for (const channel of ab.channels) {
    assert.ok(["companionship", "dominance", "compromise", "electromagnetic"].includes(channel.kind));
  }
  assert.equal(
    ab.electromagneticCount,
    ab.channels.filter((c) => c.kind === "electromagnetic").length,
  );
  assert.match(ab.connectionTheme, /^\d-\d:/);
});

test("local space lines give one bearing per planet with valid ranges", () => {
  const chart = computeNatalChart(MOMENT);
  const lines = localSpaceLines(chart, MOMENT.latitude, MOMENT.longitude);
  assert.equal(lines.length, 10);
  for (const line of lines) {
    assert.ok(line.azimuth >= 0 && line.azimuth < 360);
    assert.ok(line.altitude >= -90 && line.altitude <= 90);
    assert.ok(line.compass.length >= 1 && line.compass.length <= 3);
  }
  // The Sun was above the horizon for this day birth.
  const sun = lines.find((l) => l.body === "Sun")!;
  assert.ok(sun.altitude > 0, `Sun altitude ${sun.altitude} should be positive for a day chart`);
});
