import { Router, type IRouter } from "express";
import { computeHumanDesign } from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

router.get("/human-design", async (_req, res): Promise<void> => {
  const birth = await resolveBirth();
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

export default router;
