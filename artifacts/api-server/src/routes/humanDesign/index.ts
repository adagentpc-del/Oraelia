import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { computeHumanDesign, computeHDConnection, type BirthMoment } from "@workspace/astro-engine";
import { eq, and } from "drizzle-orm";
import { db, relationshipProfilesTable } from "@workspace/db";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

router.get("/human-design", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const design = computeHumanDesign(birth.moment);
  res.json({
    design,
    note: birth.moment.time
      ? undefined
      : "Birth time unknown — computed for 12:00; type and profile may shift with an exact time.",
  });
});

/** HD connection chart against arbitrary partner birth data. */
router.post("/human-design/connection", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
  if (!date) {
    res.status(400).json({ error: "Provide partner birth data: { date: 'YYYY-MM-DD', time?, utcOffset?, latitude?, longitude? }" });
    return;
  }
  const partner: BirthMoment = {
    date,
    time: typeof body.time === "string" ? body.time : null,
    utcOffset: typeof body.utcOffset === "number" ? body.utcOffset : -5,
    latitude: typeof body.latitude === "number" ? body.latitude : 40.7128,
    longitude: typeof body.longitude === "number" ? body.longitude : -74.006,
  };
  const connection = computeHDConnection(birth.moment, partner);
  res.json({
    connection,
    note: partner.time
      ? undefined
      : "Partner birth time unknown — computed for noon; gates from fast-moving points (Moon, ascending activations) may differ.",
  });
});

/** HD connection chart against a saved relationship profile. */
router.get("/human-design/connection/:relationshipId", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const id = parseInt(req.params.relationshipId ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid relationship id" });
    return;
  }
  const [rel] = await db
    .select()
    .from(relationshipProfilesTable)
    .where(and(eq(relationshipProfilesTable.id, id), eq(relationshipProfilesTable.userId, birth.userId)));
  if (!rel?.birthday) {
    res.status(rel ? 400 : 404).json({ error: rel ? "This relationship has no birthday on file" : "Relationship not found" });
    return;
  }
  const partner: BirthMoment = {
    date: rel.birthday,
    time: rel.birthTime,
    utcOffset: rel.birthUtcOffset ?? -5,
    latitude: rel.birthLatitude ?? 40.7128,
    longitude: rel.birthLongitude ?? -74.006,
  };
  res.json({
    personName: rel.personName,
    connection: computeHDConnection(birth.moment, partner),
  });
});

export default router;
