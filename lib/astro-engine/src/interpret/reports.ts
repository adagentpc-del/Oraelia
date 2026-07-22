import type { NatalChart, PlacedBody } from "../natal/chart";
import type { Aspect } from "../natal/aspects";
import type { Body } from "../core/ephemeris";
import { SIGN_DEEP_DIVES, PLANET_DEEP_DIVES, HOUSE_DEEP_DIVES } from "./deepDives";

export type LifeCategory =
  | "love"
  | "career"
  | "money"
  | "fame"
  | "family"
  | "health"
  | "spirituality";

export interface LifeReport {
  category: LifeCategory;
  title: string;
  headline: string;
  sections: { heading: string; content: string }[];
  evidence: string[];
  actions: string[];
}

function placed(chart: NatalChart, body: Body): PlacedBody {
  return chart.bodies.find((b) => b.body === body)!;
}

function aspectsOf(chart: NatalChart, body: Body, minIntensity = 30): Aspect[] {
  return chart.aspects.filter(
    (a) => (a.a === body || a.b === body) && a.intensity >= minIntensity && a.major,
  );
}

function describeAspect(a: Aspect): string {
  const tone =
    a.harmonyScore > 20 ? "supportive" : a.harmonyScore < -20 ? "challenging" : "intense";
  return `${a.a} ${a.type} ${a.b} (${tone}, orb ${a.orb}°)`;
}

function planetsInHouse(chart: NatalChart, house: number): PlacedBody[] {
  return chart.bodies.filter(
    (b) => b.house === house && !["SouthNode", "Lilith"].includes(b.body),
  );
}

export function loveReport(chart: NatalChart): LifeReport {
  const venus = placed(chart, "Venus");
  const mars = placed(chart, "Mars");
  const moon = placed(chart, "Moon");
  const seventhPlanets = planetsInHouse(chart, 7);
  const venusAspects = aspectsOf(chart, "Venus");
  const hardVenus = venusAspects.filter((a) => a.harmonyScore < -20);
  const venusDive = SIGN_DEEP_DIVES[venus.sign];
  const moonDive = SIGN_DEEP_DIVES[moon.sign];

  const sections = [
    {
      heading: "How you love",
      content: `Venus in ${venus.sign} (house ${venus.house}): ${venusDive.datingStyle} Your attraction principle operates ${venus.dignity === "domicile" || venus.dignity === "exaltation" ? "from strength — love and worth come naturally when you let them" : venus.dignity === "detriment" || venus.dignity === "fall" ? "against some friction — love is a skill you consciously build rather than inherit, which ultimately makes you better at it than most" : "flexibly, taking the shape of whoever you practice being"}.`,
    },
    {
      heading: "What you need to feel safe",
      content: `Moon in ${moon.sign}: ${moonDive.datingStyle} At 3 a.m., beneath preferences and types, this is the emotional contract a partner must be able to sign.`,
    },
    {
      heading: "Desire and chemistry",
      content: `Mars in ${mars.sign} (house ${mars.house}): ${SIGN_DEEP_DIVES[mars.sign].conflictStyle} Desire runs on ${mars.sign} fuel — honor it or watch attraction quietly starve.`,
    },
    {
      heading: "Partnership patterns",
      content: seventhPlanets.length
        ? `Your 7th house holds ${seventhPlanets.map((p) => p.body).join(", ")} — you attract partners who embody ${seventhPlanets.map((p) => PLANET_DEEP_DIVES[p.body]?.purpose.split("—")[0]?.trim() ?? p.body).join("; ")}. Partnership is a major life theater for you, not a side plot.`
        : `Your 7th house is empty of planets (ruled from elsewhere) — partnership matters, but your relationships tend to serve the agenda of the houses your chart emphasizes rather than being the agenda itself.`,
    },
    {
      heading: "Wounds and healing",
      content: hardVenus.length
        ? `Challenging Venus contacts (${hardVenus.map(describeAspect).join("; ")}) describe your repeating lesson: ${hardVenus.some((a) => a.a === "Saturn" || a.b === "Saturn") ? "love entangled with worthiness-proving — you are allowed to be chosen easily" : hardVenus.some((a) => a.a === "Pluto" || a.b === "Pluto") ? "intensity and control confused with intimacy — real power is mutual transparency" : hardVenus.some((a) => a.a === "Neptune" || a.b === "Neptune") ? "idealization — date the person, not the potential" : "friction that matures into discernment"}.`
        : `Venus runs relatively clean of hard aspects — your romantic lessons come less from wounds than from choices.`,
    },
  ];

  return {
    category: "love",
    title: "Love & Relationships",
    headline: `Venus in ${venus.sign}, Moon in ${moon.sign}: you love in ${venus.sign}'s language and need in ${moon.sign}'s.`,
    sections,
    evidence: [
      `Venus ${venus.formatted}, house ${venus.house}, ${venus.dignity}`,
      `Moon ${moon.formatted}, house ${moon.house}`,
      `Mars ${mars.formatted}, house ${mars.house}`,
      ...venusAspects.slice(0, 4).map(describeAspect),
    ],
    actions: [
      `Tell partners explicitly what Moon-in-${moon.sign} needs; stop hoping they'll guess.`,
      `Notice your "type" repeating — it's a ${seventhPlanets[0]?.body ?? chart.ascendantSign} pattern asking to be integrated, not just dated.`,
      "Schedule pleasure without productivity attached: Venus atrophies in an optimized life.",
    ],
  };
}

export function careerReport(chart: NatalChart): LifeReport {
  const mc = chart.houses.angles.midheaven;
  const mcSign = chart.bodies.length ? (["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"] as const)[Math.floor(((mc % 360) + 360) % 360 / 30)]! : "Aries";
  const tenthPlanets = planetsInHouse(chart, 10);
  const sixthPlanets = planetsInHouse(chart, 6);
  const saturn = placed(chart, "Saturn");
  const sun = placed(chart, "Sun");
  const dom = chart.dominantPlanets[0];
  const domDive = dom ? PLANET_DEEP_DIVES[dom.body] : undefined;
  const mcDive = SIGN_DEEP_DIVES[mcSign];

  const sections = [
    {
      heading: "Your public vocation",
      content: `Midheaven in ${mcSign}: your career works when it lets you operate like this — ${mcDive.businessStyle} The world promotes you for ${mcSign} qualities; fighting them means fighting your own reputation engine.`,
    },
    {
      heading: "The engine room",
      content: dom && domDive
        ? `${dom.body} is your strongest planet (${dom.score}/100). ${domDive.careerImpact} Build your role description around this planet and work stops feeling like impersonation.`
        : "Your planetary strengths are evenly distributed — versatility is the asset; positioning is the challenge.",
    },
    {
      heading: "Founder vs. executive vs. craftsperson",
      content: `${tenthPlanets.length ? `With ${tenthPlanets.map((p) => p.body).join(", ")} in your 10th house, public achievement is non-negotiable — you are built to be seen for your work.` : "With a quieter 10th house, your ambition expresses through the houses your planets occupy rather than public rank for its own sake."} ${sixthPlanets.length ? `Planets in the 6th (${sixthPlanets.map((p) => p.body).join(", ")}) add a craft-and-systems backbone: you scale by making things actually work.` : ""} Sun in house ${sun.house} says your vitality needs ${HOUSE_DEEP_DIVES[sun.house]?.opportunities ?? "expression"}`,
    },
    {
      heading: "Mastery and the long game",
      content: `Saturn in ${saturn.sign} (house ${saturn.house}): ${PLANET_DEEP_DIVES.Saturn!.lifeLesson.replace("Where Saturn sits is where", `House ${saturn.house} is where`)} Expect your ${saturn.house}th-house domain to feel behind schedule until roughly your Saturn return — then it becomes your authority zone.`,
    },
    {
      heading: "Burnout profile",
      content: `Your dominant ${chart.balance.dominantElement} chemistry burns out via ${chart.balance.dominantElement === "Fire" ? "overcommitment and boredom whiplash — leave 20% of the calendar unassigned" : chart.balance.dominantElement === "Earth" ? "grinding past the point of diminishing returns — schedule stopping" : chart.balance.dominantElement === "Air" ? "input overload and social depletion — protect silent deep-work blocks" : "emotional absorption — separate your feelings from the room's"}.`,
    },
  ];

  return {
    category: "career",
    title: "Career & Vocation",
    headline: `Midheaven in ${mcSign} with ${dom?.body ?? "a balanced chart"} leading: succeed by being more ${mcSign}, not less.`,
    sections,
    evidence: [
      `Midheaven ${Math.floor(((mc % 360) % 30))}° ${mcSign}`,
      ...tenthPlanets.map((p) => `${p.body} in 10th house (${p.formatted})`),
      `Saturn ${saturn.formatted}, house ${saturn.house}`,
      `Dominant planet: ${dom?.body ?? "none"} (${dom?.score ?? 0}/100)`,
    ],
    actions: [
      `Audit your current role against ${mcSign} qualities — negotiate toward the overlap.`,
      `Choose the decade skill: the ${dom?.body ?? "chart"}-aligned craft you'll still be compounding at your Saturn return.`,
      "Put your name on your work; anonymous excellence doesn't feed a Midheaven.",
    ],
  };
}

export function moneyReport(chart: NatalChart): LifeReport {
  const secondPlanets = planetsInHouse(chart, 2);
  const eighthPlanets = planetsInHouse(chart, 8);
  const venus = placed(chart, "Venus");
  const jupiter = placed(chart, "Jupiter");
  const fortune = chart.arabicParts.fortune;
  const fortuneSign = (["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"] as const)[Math.floor(((fortune % 360) + 360) % 360 / 30)]!;

  const sections = [
    {
      heading: "Money psychology",
      content: secondPlanets.length
        ? `Your 2nd house holds ${secondPlanets.map((p) => p.body).join(", ")}: money is charged with ${secondPlanets.map((p) => PLANET_DEEP_DIVES[p.body]?.moneyImpact ?? "").filter(Boolean).join(" ")} Your relationship with earning is a live psychological theater, not a neutral spreadsheet.`
        : `An empty 2nd house means your money story is ruled by ${SIGN_DEEP_DIVES[chart.bodies[0]!.sign] ? "its sign's ruler" : "its ruler"} — earning follows the agenda of your chart's louder houses; income stabilizes when the rest of life does.`,
    },
    {
      heading: "Earning style",
      content: `Venus in ${venus.sign}: ${SIGN_DEEP_DIVES[venus.sign].moneyStyle} Jupiter in ${jupiter.sign} (house ${jupiter.house}): abundance flows most easily through ${HOUSE_DEEP_DIVES[jupiter.house]?.opportunities ?? "expansion"}`,
    },
    {
      heading: "Leverage and other people's money",
      content: eighthPlanets.length
        ? `Planets in your 8th house (${eighthPlanets.map((p) => p.body).join(", ")}) mark you for leverage: investment, equity, financing, inheritance and joint ventures are how your wealth scales — with the discipline to keep power dynamics clean.`
        : "A quiet 8th house favors building wealth from your own engine first; use leverage sparingly and late.",
    },
    {
      heading: "Part of Fortune",
      content: `Your Part of Fortune sits in ${fortuneSign}: material flow increases when you operate in ${fortuneSign} mode — ${SIGN_DEEP_DIVES[fortuneSign].healthyTraits.toLowerCase()}`,
    },
  ];

  return {
    category: "money",
    title: "Money & Wealth",
    headline: `Wealth builds through ${jupiter.sign} expansion and ${venus.sign} attraction — with your Part of Fortune in ${fortuneSign}.`,
    sections,
    evidence: [
      ...secondPlanets.map((p) => `${p.body} in 2nd house`),
      ...eighthPlanets.map((p) => `${p.body} in 8th house`),
      `Jupiter ${jupiter.formatted}, house ${jupiter.house}`,
      `Part of Fortune in ${fortuneSign}`,
    ],
    actions: [
      "Write your money biography: first memory, family scripts, biggest shame, biggest win. Patterns you can see, you can price.",
      `Automate the ${SIGN_DEEP_DIVES[venus.sign].moneyStyle.toLowerCase().includes("spend") ? "saving before the spending" : "investing pipeline"} — your chart's leaks are predictable, so engineer around them.`,
      "Add one ownership position this year: equity, IP, or property. Wages alone don't satisfy a chart with money houses this configured.",
    ],
  };
}

export function fameReport(chart: NatalChart): LifeReport {
  const sun = placed(chart, "Sun");
  const tenthPlanets = planetsInHouse(chart, 10);
  const eleventhPlanets = planetsInHouse(chart, 11);
  const leoLikeStrength = sun.strength;
  const visibilityScore = Math.min(
    98,
    40 +
      (tenthPlanets.length * 10) +
      (eleventhPlanets.length * 6) +
      (sun.angular ? 15 : 0) +
      Math.round(leoLikeStrength / 5),
  );

  return {
    category: "fame",
    title: "Fame & Visibility",
    headline: `Visibility potential ${visibilityScore}/100 — your public magnetism runs through ${chart.ascendantSign} packaging and ${sun.sign} substance.`,
    sections: [
      {
        heading: "Personal brand",
        content: `The world meets ${chart.ascendantSign} first (your Ascendant), then discovers ${sun.sign} (your Sun). A durable brand makes both visible: lead with ${SIGN_DEEP_DIVES[chart.ascendantSign].communicationStyle.toLowerCase()} and deliver ${SIGN_DEEP_DIVES[sun.sign].healthyTraits.toLowerCase()}`,
      },
      {
        heading: "Where audience comes from",
        content: eleventhPlanets.length
          ? `Planets in your 11th house (${eleventhPlanets.map((p) => p.body).join(", ")}) make audience-building native to you — communities, platforms and networks respond to your presence.`
          : "Your audience grows through your work's excellence (10th) and your message (3rd/9th) more than through raw network effects — depth over reach.",
      },
      {
        heading: "Authority and legacy",
        content: `${tenthPlanets.length ? `${tenthPlanets.map((p) => p.body).join(", ")} on the career axis mean reputation compounds around ${tenthPlanets.map((p) => PLANET_DEEP_DIVES[p.body]?.purpose.split("—")[1]?.trim() ?? "").filter(Boolean).join("; ")}` : `Your Midheaven ruler carries your reputation — its condition (${chart.chartRuler} as chart ruler nearby) sets the pace.`} Speak, teach and publish: visibility for its own sake decays, visibility attached to mastery compounds.`,
      },
      {
        heading: "Visibility cycles",
        content: "Your high-visibility windows: Jupiter transits over your Midheaven and Ascendant (roughly every 12 years each), 10th and 11th house profection years, and eclipses on your chart angles. Launch public efforts inside those windows; build quietly outside them.",
      },
    ],
    evidence: [
      `Ascendant ${chart.ascendantSign}; Sun ${sun.formatted} (strength ${sun.strength}/100)`,
      ...tenthPlanets.map((p) => `${p.body} in 10th`),
      ...eleventhPlanets.map((p) => `${p.body} in 11th`),
    ],
    actions: [
      `Pick one channel that rewards ${SIGN_DEEP_DIVES[chart.ascendantSign].communicationStyle.split(";")[0]!.toLowerCase()} and publish weekly for a year.`,
      "Attach your visibility to a body of work, not a personality feed.",
    ],
  };
}

export function familyReport(chart: NatalChart): LifeReport {
  const moon = placed(chart, "Moon");
  const saturn = placed(chart, "Saturn");
  const fourthPlanets = planetsInHouse(chart, 4);
  const moonHard = aspectsOf(chart, "Moon").filter((a) => a.harmonyScore < -20);

  return {
    category: "family",
    title: "Family, Home & Roots",
    headline: `Moon in ${moon.sign} carries your inheritance of feeling; the 4th house shows the home you're here to build.`,
    sections: [
      {
        heading: "The inherited emotional climate",
        content: `Moon in ${moon.sign} (house ${moon.house}) describes the emotional weather you grew up metabolizing: ${SIGN_DEEP_DIVES[moon.sign].shadowTraits.toLowerCase()} in its unhealed form, ${SIGN_DEEP_DIVES[moon.sign].healthyTraits.toLowerCase()} when tended. ${moonHard.length ? `Hard contacts (${moonHard.slice(0, 2).map(describeAspect).join("; ")}) suggest early conditions that taught you to manage feelings rather than have them — the adult work is reversing that order.` : "Relatively clean lunar aspects suggest your emotional inheritance, while imperfect, gave you a workable foundation."}`,
      },
      {
        heading: "Foundations and the home you need",
        content: fourthPlanets.length
          ? `Your 4th house holds ${fourthPlanets.map((p) => p.body).join(", ")}: home is an active project, charged with ${fourthPlanets.map((p) => PLANET_DEEP_DIVES[p.body]?.needs ?? "").filter(Boolean).join(" ")}`
          : `${HOUSE_DEEP_DIVES[4]!.practicalRecommendations[0]!} Your foundations strengthen quietly when your outer life aligns with your chart's dominant themes.`,
      },
      {
        heading: "Generational patterns",
        content: `Saturn in ${saturn.sign} often marks the family's unfinished structural business — themes of ${SIGN_DEEP_DIVES[saturn.sign].shadowTraits.toLowerCase()} passed down until someone converts them into ${SIGN_DEEP_DIVES[saturn.sign].healthyTraits.toLowerCase()} You may be that someone; that's what 'breaking the cycle' means astrologically.`,
      },
    ],
    evidence: [
      `Moon ${moon.formatted}, house ${moon.house}`,
      ...fourthPlanets.map((p) => `${p.body} in 4th`),
      `Saturn ${saturn.formatted}`,
    ],
    actions: [
      "Interview the elders you still can; pattern-mapping three generations is the cheapest therapy available.",
      `Make your physical home serve Moon-in-${moon.sign}: it is not decoration, it is nervous-system infrastructure.`,
    ],
  };
}

export function healthReport(chart: NatalChart): LifeReport {
  const mars = placed(chart, "Mars");
  const sixthPlanets = planetsInHouse(chart, 6);
  const chiron = placed(chart, "Chiron");
  const el = chart.balance.dominantElement;
  const missing = chart.balance.missingElements;

  return {
    category: "health",
    title: "Health & Vitality",
    headline: `A ${el}-dominant constitution: your energy system has a specific manual — here it is.`,
    sections: [
      {
        heading: "Constitutional type",
        content: `${el} dominance means ${el === "Fire" ? "fast metabolism of experience: you need intense movement, real rest (not scrolling), and projects that burn clean. Inflammation and burnout are your signature imbalances." : el === "Earth" ? "a steady, embodied system that thrives on routine, nature, and strength work — and stagnates without them. Watch sluggishness, comfort eating, and rigidity in the body." : el === "Air" ? "a nervous-system-led constitution: the mind runs hot and the body gets forgotten. Breathwork, sleep hygiene and single-tasking are medicine; anxiety and scattered energy are the signals." : "a permeable, emotionally-conductive system: you somatize the room. Water, boundaries, and regular emotional discharge (talking, crying, art) keep the system clear; unprocessed feeling becomes fatigue."}${missing.length ? ` Missing ${missing.join(" and ")} in the chart: deliberately supplement ${missing.map((m) => (m === "Fire" ? "exertion and challenge" : m === "Earth" ? "grounding, nature and routine" : m === "Air" ? "social variety and intellectual play" : "feeling time and water")).join("; ")}.` : ""}`,
      },
      {
        heading: "Energy and stress mechanics",
        content: `Mars in ${mars.sign} (house ${mars.house}) is your adrenal signature: under stress you ${SIGN_DEEP_DIVES[mars.sign].conflictStyle.toLowerCase()} Exercise that matches Mars-in-${mars.sign} keeps stress metabolized instead of stored.`,
      },
      {
        heading: "The body's curriculum",
        content: `${sixthPlanets.length ? `Planets in your 6th house (${sixthPlanets.map((p) => p.body).join(", ")}) make daily habits unusually consequential for you — small routines create outsized outcomes in both directions.` : "A quiet 6th house means health responds to macro-alignment more than micro-optimization: right work, right people, right place."} Chiron in ${chiron.sign} (house ${chiron.house}) can express somatically when ignored — the ${chiron.house}th-house area of life is where stress first whispers.`,
      },
    ],
    evidence: [
      `Element balance: ${JSON.stringify(chart.balance.elements)}`,
      `Mars ${mars.formatted}, house ${mars.house}`,
      `Chiron ${chiron.formatted}, house ${chiron.house}`,
    ],
    actions: [
      "Fix sleep first — every chart's health advice starts there.",
      `Choose movement that matches Mars in ${mars.sign} so you'll actually do it.`,
      "Track energy against your check-ins; your patterns section will show which inputs actually move your baseline.",
    ],
  };
}

export function spiritualityReport(chart: NatalChart): LifeReport {
  const northNode = placed(chart, "NorthNode");
  const southNode = placed(chart, "SouthNode");
  const neptune = placed(chart, "Neptune");
  const twelfthPlanets = planetsInHouse(chart, 12);

  return {
    category: "spirituality",
    title: "Purpose & Soul Path",
    headline: `From ${southNode.sign} mastery toward ${northNode.sign} growth: the chart's single clearest developmental arrow.`,
    sections: [
      {
        heading: "The soul's direction",
        content: `South Node in ${southNode.sign} (house ${southNode.house}): your pre-installed competence — ${SIGN_DEEP_DIVES[southNode.sign].healthyTraits.toLowerCase()} It's comfortable, and overusing it stalls you. North Node in ${northNode.sign} (house ${northNode.house}): the unfamiliar direction that reliably produces growth, "luck," and the sensation of a life on-purpose — ${SIGN_DEEP_DIVES[northNode.sign].growth.toLowerCase()}`,
      },
      {
        heading: "Life lessons in progress",
        content: `The ${northNode.house}th-house North Node makes ${HOUSE_DEEP_DIVES[northNode.house]?.name.toLowerCase() ?? "growth"} your curriculum: ${HOUSE_DEEP_DIVES[northNode.house]?.lifeLessons ?? ""} Decisions that move you toward this territory tend to compound; decisions that retreat into the South Node feel safe and then stale.`,
      },
      {
        heading: "The transcendent function",
        content: `Neptune in ${neptune.sign} (house ${neptune.house}) is where you touch something larger — and where fog gathers if unexamined. ${twelfthPlanets.length ? `With ${twelfthPlanets.map((p) => p.body).join(", ")} in the 12th house, inner life is a first-class function: solitude, dreams and contemplative practice are load-bearing for you, not luxuries.` : "Your spirituality is practical: it lives in how you work, love and build rather than in retreat from them."}`,
      },
      {
        heading: "Shadow work",
        content: `Lilith in ${placed(chart, "Lilith").sign} marks the exiled instinct — the part deemed 'too much' that carries surprising power once reclaimed. Chiron in ${placed(chart, "Chiron").sign} is the wound-turned-gift. Working these two consciously is the fastest route to the North Node.`,
      },
    ],
    evidence: [
      `North Node ${northNode.formatted}, house ${northNode.house}`,
      `South Node ${southNode.formatted}, house ${southNode.house}`,
      `Neptune ${neptune.formatted}; 12th house: ${twelfthPlanets.map((p) => p.body).join(", ") || "empty"}`,
    ],
    actions: [
      `When stuck, ask: "What would the ${northNode.sign} version of me do?" — then do 10% of it.`,
      "Make one North-Node-direction decision per quarter and journal what follows.",
    ],
  };
}

export function allReports(chart: NatalChart): LifeReport[] {
  return [
    loveReport(chart),
    careerReport(chart),
    moneyReport(chart),
    fameReport(chart),
    familyReport(chart),
    healthReport(chart),
    spiritualityReport(chart),
  ];
}
