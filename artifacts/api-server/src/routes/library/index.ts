import { Router, type IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, contentLibraryTable } from "@workspace/db";
import { ListLibraryEntriesQueryParams, GetLibraryEntryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/library", async (req, res): Promise<void> => {
  const query = ListLibraryEntriesQueryParams.safeParse(req.query);
  const category = query.success ? query.data.category : undefined;
  const search = query.success ? query.data.search : undefined;

  let q = db.select().from(contentLibraryTable).$dynamic();

  if (category) {
    q = q.where(eq(contentLibraryTable.category, category));
  }

  if (search) {
    q = q.where(
      or(
        ilike(contentLibraryTable.title, `%${search}%`),
        ilike(contentLibraryTable.content, `%${search}%`)
      )
    );
  }

  const entries = await q.orderBy(contentLibraryTable.category, contentLibraryTable.title);
  res.json(entries);
});

router.get("/library/categories", async (_req, res): Promise<void> => {
  const result = await db.selectDistinct({ category: contentLibraryTable.category }).from(contentLibraryTable).orderBy(contentLibraryTable.category);
  res.json(result.map(r => r.category));
});

router.get("/library/:id", async (req, res): Promise<void> => {
  const params = GetLibraryEntryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [entry] = await db.select().from(contentLibraryTable).where(eq(contentLibraryTable.id, params.data.id));
  if (!entry) { res.status(404).json({ error: "Entry not found" }); return; }
  res.json(entry);
});

export default router;
