import { eq } from "drizzle-orm";
import { db, usersTable, profilesTable } from "@workspace/db";
import type { BirthMoment } from "@workspace/astro-engine";

export interface ResolvedBirth {
  moment: BirthMoment;
  birthDate: string;
  fullName: string;
  /** True when coordinates were defaulted rather than stored. */
  approximateLocation: boolean;
  userId: number;
}

const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;

/**
 * Loads the current (placeholder-auth) user's profile and resolves a
 * BirthMoment for chart computation. Falls back to New York coordinates
 * when no birth location has been stored, flagging the result.
 */
export async function resolveBirth(): Promise<ResolvedBirth | null> {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) return null;
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));
  if (!profile || !profile.birthday) return null;

  const hasCoords = profile.birthLatitude !== null && profile.birthLongitude !== null;
  return {
    moment: {
      date: profile.birthday,
      time: profile.birthTime,
      utcOffset: profile.birthUtcOffset ?? -5,
      latitude: profile.birthLatitude ?? DEFAULT_LAT,
      longitude: profile.birthLongitude ?? DEFAULT_LON,
    },
    birthDate: profile.birthday,
    fullName: profile.fullName,
    approximateLocation: !hasCoords,
    userId: user.id,
  };
}
