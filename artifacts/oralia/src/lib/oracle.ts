/**
 * Client for the deterministic astro-engine endpoints. These routes are not
 * yet in the OpenAPI spec / generated client (see docs/PROMPT_REGISTRY.md
 * roadmap); this thin typed wrapper is the interim access path.
 */
import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";

async function oracleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function useOracle<T>(
  path: string | null,
  options?: Omit<UseQueryOptions<T, Error, T, readonly unknown[]>, "queryKey" | "queryFn">,
) {
  return useQuery<T, Error, T, readonly unknown[]>({
    queryKey: ["oracle", path] as const,
    queryFn: () => oracleFetch<T>(path!),
    enabled: path !== null,
    retry: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useOracleMutation<TBody extends object, TResult>(path: string) {
  return useMutation<TResult, Error, TBody>({
    mutationFn: (body) =>
      oracleFetch<TResult>(path, { method: "POST", body: JSON.stringify(body) }),
  });
}

export { oracleFetch };

// ---------------------------------------------------------------------------
// Response types (mirroring lib/astro-engine output shapes; kept loose where
// the UI only reads a subset)
// ---------------------------------------------------------------------------

export interface PlacedBody {
  body: string;
  longitude: number;
  sign: string;
  degreeInSign: number;
  formatted: string;
  house: number;
  dignity: string;
  retrograde: boolean;
  angular: boolean;
  outOfBounds: boolean;
  strength: number;
}

export interface ChartAspect {
  a: string;
  b: string;
  type: string;
  orb: number;
  intensity: number;
  harmonyScore: number;
  major: boolean;
}

export interface NatalChartData {
  isDayChart: boolean;
  houseSystem: string;
  zodiac: string;
  ascendantSign: string;
  sunSign: string;
  moonSign: string;
  chartRuler: string;
  houses: { cusps: number[]; angles: { ascendant: number; midheaven: number } };
  bodies: PlacedBody[];
  aspects: ChartAspect[];
  patterns: { type: string; bodies: string[]; description: string }[];
  shape: { shape: string; description: string };
  balance: {
    elements: Record<string, number>;
    modalities: Record<string, number>;
    dominantElement: string;
    dominantModality: string;
    missingElements: string[];
  };
  dominantPlanets: { body: string; score: number }[];
  moonPhase: { name: string };
  unaspectedPlanets: string[];
  traditional: { notes: string[]; sect: string };
  meta: { methodVersion: string; sourceHash: string };
}

export interface DataQuality {
  score: number;
  birthTimeConfidence: string;
  timeDependentSafe: boolean;
  limitations: string[];
}

export interface ChartResponse {
  chart: NatalChartData;
  approximateLocation?: boolean;
  dataQuality?: DataQuality;
}

export interface LifeReport {
  category: string;
  title: string;
  headline: string;
  sections: { heading: string; content: string }[];
  evidence: string[];
  actions: string[];
  higherExpression: string;
  lowerExpression: string;
  reflectionQuestions: string[];
  confidence: string;
  disclaimer: string;
}

export interface CategoryScores {
  overall: number;
  career: number;
  relationships: number;
  money: number;
  health: number;
  communication: number;
  creativity: number;
  luck: number;
  productivity: number;
  decisionScore: number;
  emotionalEnergy: number;
}

export interface DailyForecast {
  date: string;
  scores: CategoryScores;
  personalDay: number;
  powerHours: { hourIndex: number; ruler: string; label: string; good: string }[];
  retrogrades: { body: string; sign: string }[];
  opportunities: string[];
  risks: string[];
  recommendedActions: string[];
  transits: { transiting: string; natal: string; type: string; orb: number; harmonyScore: number }[];
}

export interface Profection {
  age: number;
  profectedHouse: number;
  profectedSign: string;
  yearLord: string;
  theme: string;
}

export interface CityScore {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  scores: Record<string, number>;
  relocatedAscendant: string;
  relocatedMidheaven: string;
  summary: string;
  influences: { body: string; kind: string; orb: number; strength: number }[];
}

export interface AstroMapResponse {
  cities: CityScore[];
  bestFor: Record<string, { city: string; country: string; score: number }[]>;
  localSpace: { body: string; azimuth: number; altitude: number; compass: string; meaning: string }[];
  parans: { bodyA: string; kindA: string; bodyB: string; kindB: string; latitude: number; meaning: string }[];
}

export interface SynastryScores {
  chemistry: number;
  communication: number;
  emotional: number;
  longTermStability: number;
  sharedPurpose: number;
  passion: number;
  friendship: number;
  business: number;
  conflictRisk: number;
  growth: number;
  overall: number;
}

export interface SynastryPayload {
  personName?: string;
  synastry: {
    scores: SynastryScores;
    greenFlags: string[];
    redFlags: string[];
    keyContacts: string[];
    davisonDate: string;
    dataQuality: { limitations: string[] };
  };
  report?: {
    mode: string;
    thesis: string;
    sections: { heading: string; content: string }[];
    disclaimer: string;
  };
}

export interface HDConnectionPayload {
  personName?: string;
  connection: {
    typeA: string;
    typeB: string;
    connectionTheme: string;
    combinedDefinedCenters: string[];
    openTogether: string[];
    channels: { gates: number[]; name: string; kind: string; meaning: string }[];
    notes: string[];
  };
}
