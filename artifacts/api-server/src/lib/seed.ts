import { db, usersTable, contentLibraryTable, profilesTable, goalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seed() {
  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length > 0) {
    logger.info("Seed data already exists, skipping");
    return;
  }

  logger.info("Seeding database...");

  const [user] = await db.insert(usersTable).values({
    name: "Luna",
    email: "luna@oralia.app",
    password: "demo",
  }).returning();

  await db.insert(profilesTable).values({
    userId: user.id,
    fullName: "Luna Starweaver",
    birthday: "1992-03-15",
    birthTime: "14:30",
    birthCity: "San Francisco, CA",
    currentCity: "Los Angeles, CA",
    relationshipStatus: "In a relationship",
    careerStage: "Mid-career transition",
    topGoals: ["Launch creative business", "Deepen spiritual practice", "Improve sleep quality"],
    currentChallenges: "Balancing ambition with rest, navigating career change",
    guidanceCategories: ["career", "relationships", "energy", "spirituality"],
    menstrualCycleTracking: true,
    sleepTracking: true,
    spiritualOpenness: "high",
    guidanceTone: "luxury-oracle",
    hdType: "Manifesting Generator",
    hdStrategy: "Wait to respond",
    hdAuthority: "Sacral",
    hdProfile: "3/5",
    hdDefinedCenters: ["Sacral", "Root", "Solar Plexus"],
    hdKeyGates: ["34", "20", "57"],
    sunSign: "Pisces",
    lifePathNumber: 3,
    onboardingComplete: true,
  });

  await db.insert(goalsTable).values([
    { userId: user.id, title: "Launch creative business", category: "career", status: "active", notes: "Focus on brand identity and first offerings" },
    { userId: user.id, title: "Deepen spiritual practice", category: "spiritual", status: "active", notes: "Daily meditation and weekly rituals" },
    { userId: user.id, title: "Improve sleep quality", category: "health", status: "active", notes: "Wind-down routine and no screens after 9pm" },
  ]);

  const libraryEntries = [
    { category: "Astrology", subcategory: "Signs", title: "Aries", content: "Aries is the first sign of the zodiac, symbolizing new beginnings, initiative, and raw courage. Ruled by Mars, Aries energy is direct, passionate, and action-oriented. Those with strong Aries placements are natural leaders who thrive when pioneering new territory. Shadow: impatience, impulsiveness, and difficulty with follow-through.", tags: ["fire", "cardinal", "mars"] },
    { category: "Astrology", subcategory: "Signs", title: "Pisces", content: "Pisces is the final sign of the zodiac, representing dissolution, transcendence, and deep empathy. Ruled by Neptune, Pisces energy is intuitive, creative, and spiritually attuned. Those with strong Pisces placements are natural healers and artists who feel the world deeply. Shadow: escapism, boundary issues, and martyrdom.", tags: ["water", "mutable", "neptune"] },
    { category: "Astrology", subcategory: "Planets", title: "The Moon", content: "The Moon represents your emotional nature, instincts, habits, and what makes you feel safe. In your birth chart, the Moon sign reveals how you process feelings, what you need for comfort, and your relationship with nurturing. Understanding your Moon sign is essential for emotional self-knowledge and healthy relationships.", tags: ["luminary", "emotions", "mother"] },
    { category: "Human Design", subcategory: "Types", title: "Manifesting Generator", content: "Manifesting Generators make up about 33% of the population. They are multi-passionate beings with sustainable energy and the ability to initiate once they receive a response. Their strategy is to wait to respond, then inform before acting. When aligned, they experience satisfaction; when misaligned, frustration and anger. They are designed to master many things, not just one.", tags: ["sacral", "response", "multi-passionate"] },
    { category: "Human Design", subcategory: "Centers", title: "Sacral Center", content: "The Sacral Center is the body's generator motor — it provides life force energy, sexuality, and the capacity for sustained work. When defined, you have consistent access to this energy and can trust your gut responses (the sacral sounds: uh-huh for yes, un-un for no). When undefined, you amplify others' sacral energy but don't have your own consistent supply.", tags: ["energy", "life-force", "generator"] },
    { category: "Numerology", subcategory: "Life Path", title: "Life Path 3", content: "Life Path 3 is the path of creative expression, joy, and communication. Threes are natural artists, writers, and performers who are here to inspire others through their authentic self-expression. Challenges include scattered energy, self-doubt about creative gifts, and difficulty with emotional depth. When aligned, Threes radiate infectious optimism and create beauty that uplifts everyone around them.", tags: ["creativity", "expression", "joy"] },
    { category: "Chakras", subcategory: "Energy Centers", title: "Heart Chakra (Anahata)", content: "The Heart Chakra is located at the center of the chest and governs love, compassion, empathy, and forgiveness. When balanced, you give and receive love freely, maintain healthy boundaries, and feel deeply connected to others. When blocked, you may experience jealousy, codependency, fear of intimacy, or emotional numbness. Color: green. Element: air.", tags: ["love", "compassion", "green", "air"] },
    { category: "Chakras", subcategory: "Energy Centers", title: "Third Eye Chakra (Ajna)", content: "The Third Eye Chakra is located between the eyebrows and governs intuition, insight, imagination, and inner vision. When balanced, you trust your intuition, see patterns clearly, and have vivid dream recall. When blocked, you may experience confusion, indecision, or disconnect from your inner knowing. Color: indigo. Element: light.", tags: ["intuition", "vision", "indigo", "light"] },
    { category: "Moon Phases", subcategory: "Cycles", title: "New Moon", content: "The New Moon is a time for new beginnings, intention-setting, and planting seeds. Energy is low and introspective — this is a time to go inward, clarify your desires, and set clear intentions for the lunar cycle ahead. Practices: write intentions, start new projects, cleanse your space, meditate on what you want to create.", tags: ["beginnings", "intention", "dark-moon"] },
    { category: "Moon Phases", subcategory: "Cycles", title: "Full Moon", content: "The Full Moon is a time of culmination, illumination, and release. Emotions run high and hidden truths come to light. This is the peak of the lunar cycle — celebrate your progress, release what no longer serves you, and practice gratitude. Practices: moon rituals, journaling on what to release, gratitude ceremonies, charging crystals.", tags: ["culmination", "release", "illumination"] },
    { category: "Relationships", subcategory: "Attachment", title: "Anxious Attachment", content: "Anxious attachment style develops when early caregivers were inconsistently available. Adults with this style crave closeness and reassurance, fear abandonment, and may become hypervigilant about their partner's emotional state. Growth path: self-soothing practices, clear communication of needs, building internal security rather than seeking it externally.", tags: ["attachment", "anxiety", "relationships"] },
    { category: "Personality", subcategory: "Communication", title: "Empathic Communication Style", content: "Empathic communicators lead with feeling and attunement. They read emotional undercurrents accurately, validate others' experiences, and create safe spaces for vulnerability. Strengths: deep listening, conflict resolution, emotional intelligence. Challenges: absorbing others' emotions, difficulty with directness, people-pleasing. Growth edge: learning to hold space while maintaining your own center.", tags: ["empathy", "listening", "emotional-intelligence"] },
  ];

  await db.insert(contentLibraryTable).values(libraryEntries);

  logger.info("Seeding complete");
}
