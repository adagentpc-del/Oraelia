import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { eq } from "drizzle-orm";
import { db, usersTable, relationshipProfilesTable } from "@workspace/db";
import { CreateRelationshipBody, UpdateRelationshipBody, GetRelationshipParams, UpdateRelationshipParams, DeleteRelationshipParams, GenerateRelationshipSummaryParams } from "@workspace/api-zod";
import { generateContent, getCachedContent } from "../../lib/ai-engine";

const router: IRouter = Router();

router.get("/relationships", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const relationships = await db.select().from(relationshipProfilesTable)
    .where(eq(relationshipProfilesTable.userId, userId));
  res.json(relationships);
});

router.post("/relationships", async (req, res): Promise<void> => {
  const parsed = CreateRelationshipBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const [rel] = await db.insert(relationshipProfilesTable).values({ userId: userId, ...parsed.data }).returning();
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

  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const forceRegenerate = req.body?.regenerate === true;

  const extraContext = [
    `== RELATIONSHIP PROFILE ==`,
    `Person: ${rel.personName}`,
    `Type: ${rel.relationshipType}`,
    rel.birthday ? `Birthday: ${rel.birthday}` : null,
    rel.communicationStyle ? `Communication Style: ${rel.communicationStyle}` : null,
    rel.attachmentStyle ? `Attachment Style: ${rel.attachmentStyle}` : null,
    rel.conflictStyle ? `Conflict Style: ${rel.conflictStyle}` : null,
    rel.loveLanguage ? `Love Language: ${rel.loveLanguage}` : null,
    rel.currentDynamic ? `Current Dynamic: ${rel.currentDynamic}` : null,
  ].filter(Boolean).join("\n");

  const result = await generateContent({
    userId: userId,
    type: "relationship_overlay",
    referenceId: rel.id,
    extraContext,
    forceRegenerate,
  });

  const summary = result.content as Record<string, string>;
  const [updated] = await db.update(relationshipProfilesTable)
    .set({
      communicationPattern: summary.communicationPattern,
      emotionalActivation: summary.emotionalActivation,
      repairLanguage: summary.repairLanguage,
      conflictPattern: summary.conflictPattern,
      greenFlags: summary.greenFlags,
      redFlags: summary.redFlags,
      bestCommunication: summary.bestCommunication,
      bestTiming: summary.bestTiming,
    })
    .where(eq(relationshipProfilesTable.id, params.data.id))
    .returning();

  res.json(updated);
});

export default router;
