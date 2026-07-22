import { Router, type IRouter } from "express";
import { computeNatalChart, evaluateDecision, type DecisionCategory } from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const CATEGORIES: DecisionCategory[] = [
  "move", "start-company", "marry", "leave-job", "hire", "launch", "invest",
  "travel", "surgery", "buy-home", "sell-company", "date-person", "accept-offer", "other",
];

const router: IRouter = Router();

router.post("/decision", async (req, res): Promise<void> => {
  const birth = await resolveBirth();
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const question = typeof body.question === "string" ? body.question.slice(0, 500) : "";
  if (!question.trim()) {
    res.status(400).json({ error: "Provide { question, category? , date? }" });
    return;
  }
  const category = CATEGORIES.includes(body.category as DecisionCategory)
    ? (body.category as DecisionCategory)
    : "other";
  const onDate =
    typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? new Date(`${body.date}T12:00:00Z`)
      : new Date();
  const chart = computeNatalChart(birth.moment);
  const evaluation = evaluateDecision(chart, birth.moment, birth.birthDate, question, category, onDate);
  res.json({ evaluation, categories: CATEGORIES });
});

export default router;
