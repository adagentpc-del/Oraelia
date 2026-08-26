import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import {
  coreNumbers,
  challengesAndPinnacles,
  personalCycles,
  scoreName,
  nameCompatibility,
  scoreDigits,
  optimizeLaunchDate,
  numberMeaning,
  extendedNameAnalysis,
  essenceAtAge,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

router.get("/numerology", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const core = coreNumbers(birth.fullName, birth.birthDate);
  const cp = challengesAndPinnacles(birth.birthDate);
  const today = new Date().toISOString().slice(0, 10);
  const cycles = personalCycles(birth.birthDate, today);
  const extended = extendedNameAnalysis(birth.fullName, birth.birthDate);
  const currentAge = Math.max(
    0,
    Math.floor((Date.now() - new Date(`${birth.birthDate}T00:00:00Z`).getTime()) / (365.25 * 86400000)),
  );
  res.json({
    core,
    extended,
    essence: essenceAtAge(birth.fullName, currentAge),
    meanings: {
      lifePath: numberMeaning(core.lifePath),
      expression: numberMeaning(core.expression),
      soulUrge: numberMeaning(core.soulUrge),
      personality: numberMeaning(core.personality),
      maturity: numberMeaning(core.maturity),
    },
    challenges: cp.challenges,
    pinnacles: cp.pinnacles,
    cycles: cp.cycles,
    personal: cycles,
  });
});

router.post("/numerology/score-name", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name : "";
  if (!name.trim()) {
    res.status(400).json({ error: "Provide { name, purpose? }" });
    return;
  }
  const purpose = body.purpose === "brand" || body.purpose === "personal" ? body.purpose : "business";
  const score = scoreName(name, purpose);
  res.json({ name, purpose, ...score, meaning: numberMeaning(score.value) });
});

router.post("/numerology/score-address", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const input = typeof body.input === "string" ? body.input : "";
  if (!input.trim()) {
    res.status(400).json({ error: "Provide { input, context? } where context is address|phone|plate" });
    return;
  }
  const context = body.context === "phone" || body.context === "plate" ? body.context : "address";
  res.json({ input, context, ...scoreDigits(input, context) });
});

router.post("/numerology/compatibility", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const nameA = typeof body.nameA === "string" ? body.nameA : "";
  const nameB = typeof body.nameB === "string" ? body.nameB : "";
  if (!nameA.trim() || !nameB.trim()) {
    res.status(400).json({ error: "Provide { nameA, nameB }" });
    return;
  }
  res.json({ nameA, nameB, ...nameCompatibility(nameA, nameB) });
});

router.post("/numerology/launch-dates", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const start = typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)
    ? body.startDate
    : new Date().toISOString().slice(0, 10);
  const days = typeof body.days === "number" ? Math.min(Math.max(body.days, 1), 120) : 30;
  const purpose =
    body.purpose === "creative" || body.purpose === "relationship" || body.purpose === "financial"
      ? body.purpose
      : "business";
  const ranked = optimizeLaunchDate(birth.birthDate, start, days, purpose);
  res.json({ purpose, startDate: start, days, best: ranked.slice(0, 7), worst: ranked.slice(-3).reverse() });
});

export default router;
