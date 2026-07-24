import { eq } from "drizzle-orm";
import { db, usersTable, profilesTable } from "@workspace/db";
import { assessDataQuality, type BirthMoment, type DataQuality } from "@workspace/astro-engine";

export interface ResolvedBirth {
  moment: BirthMoment;
  birthDate: string;
  fullName: string;
  /** True when coordinates were defaulted rather than stored. */
  approximateLocation: boolean;
  userId: number;
  dataQuality: DataQuality;
}

const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;

/**
 * Loads the given user's profile and resolves a BirthMoment for chart
 * computation. Falls back to New York coordinates when no birth location
 * has been stored, flagging the result.
 */
export async function resolveBirth(userId: number): Promise<ResolvedBirth | null> {
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
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
    userId,
    dataQuality: assessDataQuality({
      birthTimeConfidence: profile.birthTimeConfidence,
      hasTime: Boolean(profile.birthTime),
      hasCoordinates: hasCoords,
    }),
  };
}
