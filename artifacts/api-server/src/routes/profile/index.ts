import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, profilesTable } from "@workspace/db";
import { UpdateProfileBody } from "@workspace/api-zod";

function getSunSign(birthday: string): string {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

function getLifePathNumber(birthday: string): number {
  const digits = birthday.replace(/\D/g, "");
  let sum = 0;
  for (const d of digits) {
    sum += parseInt(d, 10);
  }
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    let newSum = 0;
    for (const d of sum.toString()) {
      newSum += parseInt(d, 10);
    }
    sum = newSum;
  }
  return sum;
}

const router: IRouter = Router();

router.get("/profile", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) {
    res.status(404).json({ error: "No user found" });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(profile);
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) {
    res.status(400).json({ error: "No user found" });
    return;
  }

  const sunSign = getSunSign(parsed.data.fullName ? parsed.data.birthday : "");
  const lifePathNumber = getLifePathNumber(parsed.data.birthday);

  const existingProfile = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));

  if (existingProfile.length > 0) {
    const [updated] = await db.update(profilesTable)
      .set({
        ...parsed.data,
        sunSign,
        lifePathNumber,
      })
      .where(eq(profilesTable.userId, user.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(profilesTable)
      .values({
        userId: user.id,
        ...parsed.data,
        sunSign,
        lifePathNumber,
      })
      .returning();
    res.json(created);
  }
});

/** Store precise birth coordinates + UTC offset for chart computation. */
router.put("/profile/birth-location", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const latitude = typeof body.latitude === "number" ? body.latitude : NaN;
  const longitude = typeof body.longitude === "number" ? body.longitude : NaN;
  const utcOffset = typeof body.utcOffset === "number" ? body.utcOffset : NaN;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(utcOffset) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || Math.abs(utcOffset) > 14) {
    res.status(400).json({ error: "Provide { latitude, longitude, utcOffset } as numbers" });
    return;
  }

  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) {
    res.status(400).json({ error: "No user found" });
    return;
  }
  const [updated] = await db.update(profilesTable)
    .set({ birthLatitude: latitude, birthLongitude: longitude, birthUtcOffset: utcOffset })
    .where(eq(profilesTable.userId, user.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Profile not found — create your profile first" });
    return;
  }
  res.json(updated);
});

export default router;
