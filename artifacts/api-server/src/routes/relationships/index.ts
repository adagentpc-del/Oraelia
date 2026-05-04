import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, relationshipProfilesTable } from "@workspace/db";
import { CreateRelationshipBody, UpdateRelationshipBody, GetRelationshipParams, UpdateRelationshipParams, DeleteRelationshipParams, GenerateRelationshipSummaryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/relationships", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.json([]); return; }

  const relationships = await db.select().from(relationshipProfilesTable)
    .where(eq(relationshipProfilesTable.userId, user.id));
  res.json(relationships);
});

router.post("/relationships", async (req, res): Promise<void> => {
  const parsed = CreateRelationshipBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(400).json({ error: "No user found" }); return; }

  const [rel] = await db.insert(relationshipProfilesTable).values({ userId: user.id, ...parsed.data }).returning();
  res.status(201).json(rel);
});

router.get("/relationships/:id", async (req, res): Promise<void> => {
  const params = GetRelationshipParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [rel] = await db.select().from(relationshipProfilesTable).where(eq(relationshipProfilesTable.id, params.data.id));
  if (!rel) { res.status(404).json({ error: "Relationship not found" }); return; }
  res.json(rel);
});

router.patch("/relationships/:id", async (req, res): Promise<void> => {
  const params = UpdateRelationshipParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateRelationshipBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [rel] = await db.update(relationshipProfilesTable).set(body.data).where(eq(relationshipProfilesTable.id, params.data.id)).returning();
  if (!rel) { res.status(404).json({ error: "Relationship not found" }); return; }
  res.json(rel);
});

router.delete("/relationships/:id", async (req, res): Promise<void> => {
  const params = DeleteRelationshipParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [rel] = await db.delete(relationshipProfilesTable).where(eq(relationshipProfilesTable.id, params.data.id)).returning();
  if (!rel) { res.status(404).json({ error: "Relationship not found" }); return; }
  res.sendStatus(204);
});

router.post("/relationships/:id/summary", async (req, res): Promise<void> => {
  const params = GenerateRelationshipSummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [rel] = await db.select().from(relationshipProfilesTable).where(eq(relationshipProfilesTable.id, params.data.id));
  if (!rel) { res.status(404).json({ error: "Relationship not found" }); return; }

  const summary = {
    communicationPattern: `Based on the ${rel.communicationStyle || "unspecified"} communication style, this relationship thrives with clear, intentional dialogue. Prioritize active listening and create space for both people to share openly.`,
    emotionalActivation: `With a ${rel.attachmentStyle || "secure"} attachment style, emotional triggers may arise around themes of consistency and presence. Notice when you feel activated and practice a pause before responding.`,
    repairLanguage: `After conflict, this relationship responds best to acknowledgment and gentle reconnection. A simple "I see you and I am here" can go a long way.`,
    conflictPattern: `The ${rel.conflictStyle || "collaborative"} conflict approach means disagreements tend toward ${rel.conflictStyle === "avoidant" ? "silence and withdrawal" : "direct engagement"}. Name the pattern when you notice it.`,
    greenFlags: `Mutual respect, willingness to grow together, and consistent care are strengths in this dynamic.`,
    redFlags: `Watch for patterns of over-giving, unspoken expectations, or avoiding difficult conversations for the sake of harmony.`,
    bestCommunication: `Speak with intention and avoid assumptions. Use "I feel" statements and check understanding before moving forward.`,
    bestTiming: `Important conversations are best held when both people are rested and emotionally regulated — avoid late nights and high-stress moments.`,
  };

  const [updated] = await db.update(relationshipProfilesTable)
    .set(summary)
    .where(eq(relationshipProfilesTable.id, params.data.id))
    .returning();

  res.json(updated);
});

export default router;
