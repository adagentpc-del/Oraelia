import { norm360 } from "./math";

export interface BirthMoment {
  /** ISO date "YYYY-MM-DD" in local civil time at the birth place. */
  date: string;
  /** "HH:MM" 24h local time. Defaults to 12:00 when unknown. */
  time?: string | null;
  /** Timezone offset from UTC in hours (e.g. -5 for EST). */
  utcOffset: number;
  latitude: number;
  longitude: number;
}

/** Julian Day from a UTC calendar moment. */
export function julianDay(year: number, month: number, day: number, hourUtc: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    hourUtc / 24 +
    b -
    1524.5
  );
}

export function julianDayFromMoment(moment: BirthMoment): number {
  const [y, mo, d] = moment.date.split("-").map((s) => parseInt(s, 10));
  const time = moment.time && /^\d{1,2}:\d{2}/.test(moment.time) ? moment.time : "12:00";
  const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
  const localHours = (hh ?? 12) + (mm ?? 0) / 60;
  return julianDay(y ?? 2000, mo ?? 1, d ?? 1, localHours - moment.utcOffset);
}

export function julianDayFromDate(date: Date): number {
  return julianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600,
  );
}

export function dateFromJulianDay(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const dayInt = Math.floor(day);
  const hours = (day - dayInt) * 24;
  const hh = Math.floor(hours);
  const minutes = (hours - hh) * 60;
  const mm = Math.floor(minutes);
  const ss = Math.round((minutes - mm) * 60);
  return new Date(Date.UTC(year, month - 1, dayInt, hh, mm, Math.min(ss, 59)));
}

/** Julian centuries since J2000.0. */
export function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

/** Mean obliquity of the ecliptic, degrees. */
export function meanObliquity(jd: number): number {
  const t = julianCenturies(jd);
  return 23.43929111 - 0.0130041667 * t - 1.6389e-7 * t * t + 5.0361e-7 * t * t * t;
}

/** Greenwich Mean Sidereal Time in degrees. */
export function gmst(jd: number): number {
  const t = julianCenturies(jd);
  return norm360(
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000,
  );
}

/** Local Sidereal Time in degrees for an east-positive longitude. */
export function lst(jd: number, longitude: number): number {
  return norm360(gmst(jd) + longitude);
}
