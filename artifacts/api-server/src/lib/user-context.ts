import { eq, desc } from "drizzle-orm";
import { sanitizeForPrompt } from "./promptSafety";
import {
  db,
  usersTable,
  profilesTable,
  goalsTable,
  dailyCheckinsTable,
  chakraAssessmentsTable,
  relationshipProfilesTable,
  locationProfilesTable,
} from "@workspace/db";

export interface UserContext {
  user: {
    id: number;
    name: string;
  };
  profile: {
    fullName: string;
    birthday: string;
    birthTime: string | null;
    birthCity: string | null;
    currentCity: string | null;
    relationshipStatus: string | null;
    careerStage: string | null;
    sunSign: string | null;
    lifePathNumber: number | null;
    hdType: string | null;
    hdStrategy: string | null;
    hdAuthority: string | null;
    hdProfile: string | null;
    hdDefinedCenters: string[];
    hdKeyGates: string[];
    guidanceTone: string;
    topGoals: string[];
    currentChallenges: string | null;
    menstrualCycleTracking: boolean;
    sleepTracking: boolean;
    spiritualOpenness: string | null;
  } | null;
  goals: Array<{
    title: string;
    category: string | null;
    status: string;
  }>;
  recentCheckins: Array<{
    date: string;
    mood: number;
    energy: number;
    stress: number;
    sleepQuality: number;
    movement: string | null;
    socialActivity: string | null;
    cyclePhase: string | null;
    whatFeltAligned: string | null;
    whatFeltDraining: string | null;
  }>;
  latestChakra: {
    root: number;
    sacral: number;
    solarPlexus: number;
    heart: number;
    throat: number;
    thirdEye: number;
    crown: number;
    strongestChakra: string | null;
    lowestChakra: string | null;
  } | null;
  relationships: Array<{
    id: number;
    personName: string;
    relationshipType: string;
    communicationStyle: string | null;
    attachmentStyle: string | null;
    conflictStyle: string | null;
    loveLanguage: string | null;
    currentDynamic: string | null;
  }>;
  locations: Array<{
    id: number;
    city: string;
    country: string;
    locationType: string;
    locationGoal: string;
  }>;
  today: string;
}

export async function buildUserContext(userId: number): Promise<UserContext> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) throw new Error(`User ${userId} not found`);

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));

  const recentCheckins = await db
    .select()
    .from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, userId))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(7);

  const [latestChakra] = await db
    .select()
    .from(chakraAssessmentsTable)
    .where(eq(chakraAssessmentsTable.userId, userId))
    .orderBy(desc(chakraAssessmentsTable.createdAt))
    .limit(1);

  const relationships = await db
    .select()
    .from(relationshipProfilesTable)
    .where(eq(relationshipProfilesTable.userId, userId));

  const locations = await db
    .select()
    .from(locationProfilesTable)
    .where(eq(locationProfilesTable.userId, userId));

  return {
    user: { id: user.id, name: user.name },
    profile: profile
      ? {
          fullName: profile.fullName,
          birthday: profile.birthday,
          birthTime: profile.birthTime,
          birthCity: profile.birthCity,
          currentCity: profile.currentCity,
          relationshipStatus: profile.relationshipStatus,
          careerStage: profile.careerStage,
          sunSign: profile.sunSign,
          lifePathNumber: profile.lifePathNumber,
          hdType: profile.hdType,
          hdStrategy: profile.hdStrategy,
          hdAuthority: profile.hdAuthority,
          hdProfile: profile.hdProfile,
          hdDefinedCenters: profile.hdDefinedCenters,
          hdKeyGates: profile.hdKeyGates,
          guidanceTone: profile.guidanceTone || "mystical",
          topGoals: profile.topGoals,
          currentChallenges: profile.currentChallenges,
          menstrualCycleTracking: profile.menstrualCycleTracking,
          sleepTracking: profile.sleepTracking,
          spiritualOpenness: profile.spiritualOpenness,
        }
      : null,
    goals: goals.map((g) => ({
      title: g.title,
      category: g.category,
      status: g.status,
    })),
    recentCheckins: recentCheckins.map((c) => ({
      date: c.date,
      mood: c.mood,
      energy: c.energy,
      stress: c.stress,
      sleepQuality: c.sleepQuality,
      movement: c.movement,
      socialActivity: c.socialActivity,
      cyclePhase: c.cyclePhase,
      whatFeltAligned: c.whatFeltAligned,
      whatFeltDraining: c.whatFeltDraining,
    })),
    latestChakra: latestChakra
      ? {
          root: latestChakra.root,
          sacral: latestChakra.sacral,
          solarPlexus: latestChakra.solarPlexus,
          heart: latestChakra.heart,
          throat: latestChakra.throat,
          thirdEye: latestChakra.thirdEye,
          crown: latestChakra.crown,
          strongestChakra: latestChakra.strongestChakra,
          lowestChakra: latestChakra.lowestChakra,
        }
      : null,
    relationships: relationships.map((r) => ({
      id: r.id,
      personName: r.personName,
      relationshipType: r.relationshipType,
      communicationStyle: r.communicationStyle,
      attachmentStyle: r.attachmentStyle,
      conflictStyle: r.conflictStyle,
      loveLanguage: r.loveLanguage,
      currentDynamic: r.currentDynamic,
    })),
    locations: locations.map((l) => ({
      id: l.id,
      city: l.city,
      country: l.country,
      locationType: l.locationType,
      locationGoal: l.locationGoal,
    })),
    today: new Date().toISOString().split("T")[0],
  };
}

export function formatContextForPrompt(ctx: UserContext): string {
  const lines: string[] = [];

  if (ctx.profile) {
    lines.push(`== PERSONAL PROFILE ==`);
    lines.push(`Name: ${sanitizeForPrompt(ctx.profile.fullName)}`);
    lines.push(`Birthday: ${ctx.profile.birthday}${ctx.profile.birthTime ? ` at ${ctx.profile.birthTime}` : ""}`);
    if (ctx.profile.birthCity) lines.push(`Birth City: ${ctx.profile.birthCity}`);
    if (ctx.profile.currentCity) lines.push(`Current City: ${ctx.profile.currentCity}`);
    lines.push(`Sun Sign: ${ctx.profile.sunSign || "Unknown"}`);
    lines.push(`Life Path Number: ${ctx.profile.lifePathNumber ?? "Unknown"}`);
    if (ctx.profile.relationshipStatus) lines.push(`Relationship Status: ${ctx.profile.relationshipStatus}`);
    if (ctx.profile.careerStage) lines.push(`Career Stage: ${ctx.profile.careerStage}`);
    if (ctx.profile.currentChallenges) lines.push(`Current Challenges: ${sanitizeForPrompt(ctx.profile.currentChallenges)}`);
    if (ctx.profile.spiritualOpenness) lines.push(`Spiritual Openness: ${ctx.profile.spiritualOpenness}`);
    lines.push(`Guidance Tone: ${ctx.profile.guidanceTone}`);
  }

  if (ctx.profile?.hdType) {
    lines.push(`\n== HUMAN DESIGN ==`);
    lines.push(`Type: ${ctx.profile.hdType}`);
    if (ctx.profile.hdStrategy) lines.push(`Strategy: ${ctx.profile.hdStrategy}`);
    if (ctx.profile.hdAuthority) lines.push(`Authority: ${ctx.profile.hdAuthority}`);
    if (ctx.profile.hdProfile) lines.push(`Profile: ${ctx.profile.hdProfile}`);
    if (ctx.profile.hdDefinedCenters.length > 0) lines.push(`Defined Centers: ${ctx.profile.hdDefinedCenters.join(", ")}`);
    if (ctx.profile.hdKeyGates.length > 0) lines.push(`Key Gates: ${ctx.profile.hdKeyGates.join(", ")}`);
  }

  if (ctx.goals.length > 0) {
    lines.push(`\n== GOALS ==`);
    for (const g of ctx.goals) {
      lines.push(`- ${sanitizeForPrompt(g.title)} [${g.status}]${g.category ? ` (${g.category})` : ""}`);
    }
  }

  if (ctx.recentCheckins.length > 0) {
    lines.push(`\n== RECENT CHECK-INS (last ${ctx.recentCheckins.length} days) ==`);
    for (const c of ctx.recentCheckins) {
      let line = `${c.date}: Mood ${c.mood}/10, Energy ${c.energy}/10, Stress ${c.stress}/10, Sleep ${c.sleepQuality}/10`;
      if (c.movement) line += `, Movement: ${c.movement}`;
      if (c.cyclePhase) line += `, Cycle: ${c.cyclePhase}`;
      lines.push(line);
    }
    const aligned = ctx.recentCheckins.filter((c) => c.whatFeltAligned).map((c) => sanitizeForPrompt(c.whatFeltAligned));
    const draining = ctx.recentCheckins.filter((c) => c.whatFeltDraining).map((c) => sanitizeForPrompt(c.whatFeltDraining));
    if (aligned.length > 0) lines.push(`Recent aligned moments: ${aligned.join("; ")}`);
    if (draining.length > 0) lines.push(`Recent draining moments: ${draining.join("; ")}`);
  }

  if (ctx.latestChakra) {
    lines.push(`\n== LATEST CHAKRA ASSESSMENT ==`);
    lines.push(`Root: ${ctx.latestChakra.root}/10, Sacral: ${ctx.latestChakra.sacral}/10, Solar Plexus: ${ctx.latestChakra.solarPlexus}/10`);
    lines.push(`Heart: ${ctx.latestChakra.heart}/10, Throat: ${ctx.latestChakra.throat}/10, Third Eye: ${ctx.latestChakra.thirdEye}/10, Crown: ${ctx.latestChakra.crown}/10`);
    if (ctx.latestChakra.strongestChakra) lines.push(`Strongest: ${ctx.latestChakra.strongestChakra}`);
    if (ctx.latestChakra.lowestChakra) lines.push(`Needs attention: ${ctx.latestChakra.lowestChakra}`);
  }

  lines.push(`\n== DATE ==`);
  lines.push(`Today: ${ctx.today}`);

  return lines.join("\n");
}
