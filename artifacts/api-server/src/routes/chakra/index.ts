import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, chakraAssessmentsTable } from "@workspace/db";
import { CreateChakraAssessmentBody } from "@workspace/api-zod";

const CHAKRA_NAMES: Record<string, string> = {
  root: "Root",
  sacral: "Sacral",
  solarPlexus: "Solar Plexus",
  heart: "Heart",
  throat: "Throat",
  thirdEye: "Third Eye",
  crown: "Crown",
};

const CHAKRA_PRACTICES: Record<string, { practice: string; prompt: string; affirmation: string; somatic: string }> = {
  Root: {
    practice: "Grounding meditation, walking barefoot, or sitting with your back against a tree for 10 minutes.",
    prompt: "Where in your life do you feel ungrounded? What would stability look like for you right now?",
    affirmation: "I am safe, supported, and rooted in the present moment.",
    somatic: "Stand with your feet hip-width apart. Press firmly into the ground and slowly rock side to side for two minutes.",
  },
  Sacral: {
    practice: "Creative expression — paint, dance, cook something new, or take a warm bath with intention.",
    prompt: "What brings you pleasure that you have been denying yourself? What would it feel like to say yes?",
    affirmation: "I allow myself to feel fully and create freely.",
    somatic: "Place both hands on your lower belly. Breathe deeply and make slow circles with your hips.",
  },
  "Solar Plexus": {
    practice: "Core-strengthening exercise, power posing, or journaling about your personal boundaries.",
    prompt: "Where are you giving your power away? What decision are you avoiding?",
    affirmation: "I trust my inner fire and act with confidence and clarity.",
    somatic: "Take three deep breaths, exhaling forcefully through your mouth. Feel your core engage with each exhale.",
  },
  Heart: {
    practice: "Loving-kindness meditation, write a letter to someone you appreciate, or practice self-forgiveness.",
    prompt: "What would you say to yourself if you were your own best friend? Where is forgiveness needed?",
    affirmation: "I give and receive love freely. My heart is open and courageous.",
    somatic: "Place your right hand on your heart and left hand on your belly. Breathe slowly for three minutes.",
  },
  Throat: {
    practice: "Singing, chanting, or having an honest conversation you have been postponing.",
    prompt: "What truth are you holding back? What would change if you spoke it?",
    affirmation: "I express my truth with clarity and compassion.",
    somatic: "Gently tilt your head side to side, releasing tension in your neck. Hum a low tone for one minute.",
  },
  "Third Eye": {
    practice: "Visualization meditation, dream journaling, or spending time in quiet contemplation.",
    prompt: "What is your intuition telling you that your logic is overriding? What patterns are you starting to see?",
    affirmation: "I trust my inner wisdom and see clearly beyond the surface.",
    somatic: "Close your eyes and gently press your fingertips to the space between your eyebrows. Breathe and visualize indigo light.",
  },
  Crown: {
    practice: "Silent meditation, prayer, spending time in nature, or reading something that expands your perspective.",
    prompt: "What larger purpose are you being called toward? What would surrender look like right now?",
    affirmation: "I am connected to the infinite intelligence of the universe.",
    somatic: "Sit in stillness with your palms facing upward on your knees. Imagine a beam of white light entering through the top of your head.",
  },
};

const router: IRouter = Router();

router.get("/chakra-assessments", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.json([]); return; }

  const assessments = await db.select().from(chakraAssessmentsTable)
    .where(eq(chakraAssessmentsTable.userId, user.id))
    .orderBy(desc(chakraAssessmentsTable.createdAt));
  res.json(assessments);
});

router.post("/chakra-assessments", async (req, res): Promise<void> => {
  const parsed = CreateChakraAssessmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(400).json({ error: "No user found" }); return; }

  const scores: Record<string, number> = {
    root: parsed.data.root,
    sacral: parsed.data.sacral,
    solarPlexus: parsed.data.solarPlexus,
    heart: parsed.data.heart,
    throat: parsed.data.throat,
    thirdEye: parsed.data.thirdEye,
    crown: parsed.data.crown,
  };

  let strongest = "root";
  let lowest = "root";
  for (const [key, val] of Object.entries(scores)) {
    if (val > scores[strongest]) strongest = key;
    if (val < scores[lowest]) lowest = key;
  }

  const strongestName = CHAKRA_NAMES[strongest];
  const lowestName = CHAKRA_NAMES[lowest];
  const practice = CHAKRA_PRACTICES[lowestName] || CHAKRA_PRACTICES["Heart"];

  const [assessment] = await db.insert(chakraAssessmentsTable).values({
    userId: user.id,
    ...parsed.data,
    strongestChakra: strongestName,
    lowestChakra: lowestName,
    recommendedPractice: practice.practice,
    journalPrompt: practice.prompt,
    affirmation: practice.affirmation,
    somaticAction: practice.somatic,
  }).returning();

  res.status(201).json(assessment);
});

router.get("/chakra-assessments/latest", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(404).json({ error: "No user found" }); return; }

  const [latest] = await db.select().from(chakraAssessmentsTable)
    .where(eq(chakraAssessmentsTable.userId, user.id))
    .orderBy(desc(chakraAssessmentsTable.createdAt))
    .limit(1);

  if (!latest) { res.status(404).json({ error: "No assessments found" }); return; }
  res.json(latest);
});

export default router;
