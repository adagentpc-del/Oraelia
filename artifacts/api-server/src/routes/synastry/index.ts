import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, relationshipProfilesTable } from "@workspace/db";
import { computeNatalChart, synastryFromCharts, type BirthMoment } from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

function momentFromBody(body: Record<string, unknown>): BirthMoment | null {
  const date = typeof body.date === "string" ? body.date : null;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    date,
    time: typeof body.time === "string" ? body.time : null,
    utcOffset: typeof body.utcOffset === "number" ? body.utcOffset : -5,
    latitude: typeof body.latitude === "number" ? body.latitude : 40.7128,
    longitude: typeof body.longitude === "number" ? body.longitude : -74.006,
  };
}

/** Ad-hoc synastry against arbitrary birth data. */
router.post("/synastry", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const partner = momentFromBody((req.body ?? {}) as Record<string, unknown>);
  if (!partner) {
    res.status(400).json({ error: "Provide partner birth data: { date: 'YYYY-MM-DD', time?, utcOffset?, latitude?, longitude? }" });
    return;
  }
  const chartA = computeNatalChart(birth.moment);
  const chartB = computeNatalChart(partner);
  const result = synastryFromCharts(chartA, chartB, birth.moment, partner, {
    timeKnownA: Boolean(birth.moment.time),
    timeKnownB: Boolean(partner.time),
  });
  res.json({ synastry: result });
});

/** Synastry against a saved relationship profile. */
router.get("/synastry/relationship/:id", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const id = parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid relationship id" });
    return;
  }
  const [rel] = await db
    .select()
    .from(relationshipProfilesTable)
    .where(and(eq(relationshipProfilesTable.id, id), eq(relationshipProfilesTable.userId, birth.userId)));
  if (!rel) {
    res.status(404).json({ error: "Relationship not found" });
    return;
  }
  if (!rel.birthday) {
    res.status(400).json({ error: "This relationship has no birthday on file — add one to unlock synastry" });
    return;
  }
  const partner: BirthMoment = {
    date: rel.birthday,
    time: rel.birthTime,
    utcOffset: rel.birthUtcOffset ?? -5,
    latitude: rel.birthLatitude ?? 40.7128,
    longitude: rel.birthLongitude ?? -74.006,
  };
  const chartA = computeNatalChart(birth.moment);
  const chartB = computeNatalChart(partner);
  const result = synastryFromCharts(chartA, chartB, birth.moment, partner, {
    timeKnownA: Boolean(birth.moment.time),
    timeKnownB: Boolean(rel.birthTime),
  });
  res.json({
    personName: rel.personName,
    relationshipType: rel.relationshipType,
    synastry: result,
    approximatePartnerLocation: rel.birthLatitude === null,
  });
});

export default router;
