import { bodyPosition, type Body } from "../core/ephemeris";
import { julianDayFromMoment, type BirthMoment } from "../core/julian";
import { norm360 } from "../core/math";

/**
 * The Human Design gate wheel: 64 gates of 5.625° each, in wheel order
 * starting from Gate 41 at 2°00' Aquarius (302.0°).
 */
const GATE_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

const WHEEL_START = 302.0; // Gate 41 line 1
const GATE_SIZE = 360 / 64; // 5.625
const LINE_SIZE = GATE_SIZE / 6;

export type Center =
  | "Head"
  | "Ajna"
  | "Throat"
  | "G"
  | "Heart"
  | "Sacral"
  | "Spleen"
  | "SolarPlexus"
  | "Root";

const GATE_CENTERS: Record<number, Center> = {
  64: "Head", 61: "Head", 63: "Head",
  47: "Ajna", 24: "Ajna", 4: "Ajna", 17: "Ajna", 43: "Ajna", 11: "Ajna",
  62: "Throat", 23: "Throat", 56: "Throat", 35: "Throat", 12: "Throat",
  45: "Throat", 33: "Throat", 8: "Throat", 31: "Throat", 20: "Throat", 16: "Throat",
  1: "G", 13: "G", 25: "G", 46: "G", 2: "G", 15: "G", 10: "G", 7: "G",
  26: "Heart", 51: "Heart", 21: "Heart", 40: "Heart",
  34: "Sacral", 5: "Sacral", 14: "Sacral", 29: "Sacral", 59: "Sacral",
  9: "Sacral", 3: "Sacral", 42: "Sacral", 27: "Sacral",
  48: "Spleen", 57: "Spleen", 44: "Spleen", 50: "Spleen", 32: "Spleen", 28: "Spleen", 18: "Spleen",
  36: "SolarPlexus", 22: "SolarPlexus", 37: "SolarPlexus", 6: "SolarPlexus",
  49: "SolarPlexus", 55: "SolarPlexus", 30: "SolarPlexus",
  58: "Root", 38: "Root", 54: "Root", 53: "Root", 60: "Root",
  52: "Root", 19: "Root", 39: "Root", 41: "Root",
};

const CHANNELS: [number, number, string][] = [
  [1, 8, "Inspiration"],
  [2, 14, "The Beat"],
  [3, 60, "Mutation"],
  [4, 63, "Logic"],
  [5, 15, "Rhythm"],
  [6, 59, "Intimacy"],
  [7, 31, "The Alpha"],
  [9, 52, "Concentration"],
  [10, 20, "Awakening"],
  [10, 34, "Exploration"],
  [10, 57, "Perfected Form"],
  [11, 56, "Curiosity"],
  [12, 22, "Openness"],
  [13, 33, "The Prodigal"],
  [16, 48, "The Wavelength"],
  [17, 62, "Acceptance"],
  [18, 58, "Judgment"],
  [19, 49, "Synthesis"],
  [20, 34, "Charisma"],
  [20, 57, "The Brainwave"],
  [21, 45, "Money"],
  [23, 43, "Structuring"],
  [24, 61, "Awareness"],
  [25, 51, "Initiation"],
  [26, 44, "Surrender"],
  [27, 50, "Preservation"],
  [28, 38, "Struggle"],
  [29, 46, "Discovery"],
  [30, 41, "Recognition"],
  [32, 54, "Transformation"],
  [34, 57, "Power"],
  [35, 36, "Transitoriness"],
  [37, 40, "Community"],
  [39, 55, "Emoting"],
  [42, 53, "Maturation"],
  [47, 64, "Abstraction"],
];

export interface GateActivation {
  body: string;
  side: "personality" | "design";
  gate: number;
  line: number;
  longitude: number;
}

export type HDType =
  | "Manifestor"
  | "Generator"
  | "Manifesting Generator"
  | "Projector"
  | "Reflector";

export type HDAuthority =
  | "Emotional"
  | "Sacral"
  | "Splenic"
  | "Ego"
  | "Self-Projected"
  | "Mental"
  | "Lunar";

export interface HumanDesignChart {
  type: HDType;
  strategy: string;
  authority: HDAuthority;
  authorityGuidance: string;
  notSelfTheme: string;
  signature: string;
  profile: string;
  profileName: string;
  definition: string;
  definedCenters: Center[];
  undefinedCenters: Center[];
  channels: { gates: [number, number]; name: string }[];
  activations: GateActivation[];
  incarnationCross: string;
  digestion: string;
  environment: string;
  motivation: string;
  perspective: string;
}

export function gateAndLine(longitude: number): { gate: number; line: number } {
  const offset = norm360(longitude - WHEEL_START);
  const gateIndex = Math.floor(offset / GATE_SIZE) % 64;
  const line = Math.floor((offset % GATE_SIZE) / LINE_SIZE) + 1;
  return { gate: GATE_ORDER[gateIndex]!, line: Math.min(6, line) };
}

const HD_BODIES: Body[] = [
  "Sun",
  "Moon",
  "NorthNode",
  "SouthNode",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

function activationsAt(jd: number, side: "personality" | "design"): GateActivation[] {
  const out: GateActivation[] = [];
  for (const body of HD_BODIES) {
    const pos = bodyPosition(body, jd);
    const gl = gateAndLine(pos.longitude);
    out.push({ body, side, gate: gl.gate, line: gl.line, longitude: pos.longitude });
    if (body === "Sun") {
      const earthLon = norm360(pos.longitude + 180);
      const eg = gateAndLine(earthLon);
      out.push({ body: "Earth", side, gate: eg.gate, line: eg.line, longitude: earthLon });
    }
  }
  return out;
}

/** Find the design moment: Sun exactly 88° of arc before the natal Sun. */
function designJulianDay(natalJd: number): number {
  const natalSun = bodyPosition("Sun", natalJd).longitude;
  const target = norm360(natalSun - 88);
  let jd = natalJd - 88.135;
  for (let i = 0; i < 10; i++) {
    const pos = bodyPosition("Sun", jd);
    let diff = target - pos.longitude;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-5) break;
    jd += diff / (pos.speed || 0.9856);
  }
  return jd;
}

const MOTOR_CENTERS: Center[] = ["Sacral", "Heart", "SolarPlexus", "Root"];

const PROFILE_NAMES: Record<string, string> = {
  "1/3": "Investigator / Martyr",
  "1/4": "Investigator / Opportunist",
  "2/4": "Hermit / Opportunist",
  "2/5": "Hermit / Heretic",
  "3/5": "Martyr / Heretic",
  "3/6": "Martyr / Role Model",
  "4/6": "Opportunist / Role Model",
  "4/1": "Opportunist / Investigator",
  "5/1": "Heretic / Investigator",
  "5/2": "Heretic / Hermit",
  "6/2": "Role Model / Hermit",
  "6/3": "Role Model / Martyr",
};

export function computeHumanDesign(moment: BirthMoment): HumanDesignChart {
  const natalJd = julianDayFromMoment(moment);
  const designJd = designJulianDay(natalJd);

  const activations = [...activationsAt(natalJd, "personality"), ...activationsAt(designJd, "design")];
  const activeGates = new Set(activations.map((a) => a.gate));

  const channels = CHANNELS.filter(([g1, g2]) => activeGates.has(g1) && activeGates.has(g2)).map(
    ([g1, g2, name]) => ({ gates: [g1, g2] as [number, number], name }),
  );

  const definedCenters = new Set<Center>();
  for (const ch of channels) {
    definedCenters.add(GATE_CENTERS[ch.gates[0]]!);
    definedCenters.add(GATE_CENTERS[ch.gates[1]]!);
  }

  const allCenters: Center[] = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Spleen", "SolarPlexus", "Root"];
  const defined = allCenters.filter((c) => definedCenters.has(c));
  const undefinedCenters = allCenters.filter((c) => !definedCenters.has(c));

  // Center connectivity graph through defined channels.
  const adjacency = new Map<Center, Set<Center>>();
  for (const ch of channels) {
    const c1 = GATE_CENTERS[ch.gates[0]]!;
    const c2 = GATE_CENTERS[ch.gates[1]]!;
    if (!adjacency.has(c1)) adjacency.set(c1, new Set());
    if (!adjacency.has(c2)) adjacency.set(c2, new Set());
    adjacency.get(c1)!.add(c2);
    adjacency.get(c2)!.add(c1);
  }

  const connectedTo = (from: Center, to: Center): boolean => {
    const seen = new Set<Center>();
    const stack: Center[] = [from];
    while (stack.length) {
      const c = stack.pop()!;
      if (c === to) return true;
      if (seen.has(c)) continue;
      seen.add(c);
      for (const n of adjacency.get(c) ?? []) stack.push(n);
    }
    return false;
  };

  const sacralDefined = definedCenters.has("Sacral");
  const motorToThroat = MOTOR_CENTERS.some(
    (m) => definedCenters.has(m) && definedCenters.has("Throat") && connectedTo(m, "Throat"),
  );

  let type: HDType;
  if (defined.length === 0) type = "Reflector";
  else if (sacralDefined) type = motorToThroat ? "Manifesting Generator" : "Generator";
  else if (motorToThroat) type = "Manifestor";
  else type = "Projector";

  const strategyMap: Record<HDType, string> = {
    Manifestor: "Inform before you act — initiate, but tell those in your impact field first.",
    Generator: "Wait to respond — let life bring things to you, then follow your gut yes/no.",
    "Manifesting Generator": "Wait to respond, then move fast — inform as you pivot and skip steps.",
    Projector: "Wait for the invitation — for the big things (love, work, home), recognition must come first.",
    Reflector: "Wait a lunar cycle — sample a decision across a full 28-day Moon cycle before committing.",
  };
  const notSelfMap: Record<HDType, string> = {
    Manifestor: "Anger — a sign you initiated without informing, or were controlled.",
    Generator: "Frustration — a sign you initiated from the mind instead of responding.",
    "Manifesting Generator": "Frustration and anger — a sign of forcing instead of responding.",
    Projector: "Bitterness — a sign of working uninvited and unrecognized.",
    Reflector: "Disappointment — a sign of moving faster than your lunar rhythm.",
  };
  const signatureMap: Record<HDType, string> = {
    Manifestor: "Peace",
    Generator: "Satisfaction",
    "Manifesting Generator": "Satisfaction",
    Projector: "Success",
    Reflector: "Surprise and delight",
  };

  let authority: HDAuthority;
  let authorityGuidance: string;
  if (type === "Reflector") {
    authority = "Lunar";
    authorityGuidance = "Give major decisions a full lunar cycle. Talk them through with trusted people in different environments and track how the answer shifts.";
  } else if (definedCenters.has("SolarPlexus")) {
    authority = "Emotional";
    authorityGuidance = "There is no truth in the now for you. Ride the emotional wave — decide only after you have felt high, low, and neutral about the same question. Clarity arrives as calm.";
  } else if (sacralDefined) {
    authority = "Sacral";
    authorityGuidance = "Your gut response in the moment is the truth: an expansive 'uh-huh' or a contracting 'uh-uh'. Ask yourself yes/no questions out loud and feel the body's answer.";
  } else if (definedCenters.has("Spleen")) {
    authority = "Splenic";
    authorityGuidance = "Your knowing is instant, quiet, and never repeats. Act on the first subtle hit — hesitation lets the mind talk you out of survival-grade intelligence.";
  } else if (definedCenters.has("Heart") && connectedTo("Heart", "Throat")) {
    authority = "Ego";
    authorityGuidance = "Ask: do I actually want this? Is it worth my will? What you hear yourself say — and promise — reveals the truth. Never over-promise.";
  } else if (definedCenters.has("G")) {
    authority = "Self-Projected";
    authorityGuidance = "Talk it out. Your truth emerges from hearing your own voice — speak with sounding boards who listen without advising, and notice what you say.";
  } else {
    authority = "Mental";
    authorityGuidance = "Your environment and sounding boards matter most. Discuss decisions in different places with different people; clarity comes from the process, never from pressure.";
  }

  // Definition: connected components among defined centers.
  const components: Center[][] = [];
  const visited = new Set<Center>();
  for (const c of defined) {
    if (visited.has(c)) continue;
    const comp: Center[] = [];
    const stack = [c];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      comp.push(cur);
      for (const n of adjacency.get(cur) ?? []) stack.push(n);
    }
    components.push(comp);
  }
  const definitionNames = ["No Definition", "Single Definition", "Split Definition", "Triple Split Definition", "Quadruple Split Definition"];
  const definition = definitionNames[Math.min(components.length, 4)]!;

  const pSun = activations.find((a) => a.side === "personality" && a.body === "Sun")!;
  const dSun = activations.find((a) => a.side === "design" && a.body === "Sun")!;
  const pEarth = activations.find((a) => a.side === "personality" && a.body === "Earth")!;
  const dEarth = activations.find((a) => a.side === "design" && a.body === "Earth")!;
  const profile = `${pSun.line}/${dSun.line}`;
  const incarnationCross = `Cross of Gates ${pSun.gate}/${pEarth.gate} | ${dSun.gate}/${dEarth.gate}`;

  // Variables (simplified): derived from design Sun / design Node tones via color bands.
  const colorOf = (longitude: number): number => {
    const offset = norm360(longitude - WHEEL_START);
    const withinLine = (offset % GATE_SIZE) % LINE_SIZE;
    return Math.floor(withinLine / (LINE_SIZE / 6)) + 1;
  };
  const digestionColors = [
    "Appetite — eat only when genuinely hungry; simple, consistent food",
    "Taste — follow what tastes right; selective, particular eating",
    "Thirst — hydration-led; drink-centered rhythm, light meals",
    "Touch — eat with others; atmosphere and company aid digestion",
    "Sound — calm or lively sound environments change how you metabolize",
    "Light — eat in daylight; your metabolism follows the sun",
  ];
  const environments = [
    "Caves — protected spaces with your back covered; control the entrance",
    "Markets — lively exchanges of goods and ideas; you thrive amid transactions",
    "Kitchens — alchemical, busy, warm places where things are being made",
    "Mountains — elevated, dry places with perspective over the landscape",
    "Valleys — acoustic, riverine places where people and information flow past",
    "Shores — edge environments between two worlds: coasts, borders, thresholds",
  ];
  const motivations = ["Fear", "Hope", "Desire", "Need", "Guilt", "Innocence"];
  const perspectives = ["Survival", "Possibility", "Power", "Wanting", "Probability", "Personal"];

  const dColor = colorOf(dSun.longitude);
  const pColor = colorOf(pSun.longitude);

  return {
    type,
    strategy: strategyMap[type],
    authority,
    authorityGuidance,
    notSelfTheme: notSelfMap[type],
    signature: signatureMap[type],
    profile,
    profileName: PROFILE_NAMES[profile] ?? profile,
    definition,
    definedCenters: defined,
    undefinedCenters,
    channels,
    activations,
    incarnationCross,
    digestion: digestionColors[dColor - 1]!,
    environment: environments[dColor - 1]!,
    motivation: motivations[pColor - 1]!,
    perspective: perspectives[pColor - 1]!,
  };
}
