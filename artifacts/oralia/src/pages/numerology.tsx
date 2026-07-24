import { useState } from "react";
import { useOracle, useOracleMutation } from "@/lib/oracle";
import { OracleSection, BigStat, LoadingOr } from "@/components/oracle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Meaning { title: string; strengths: string; shadow: string; career: string }

interface NumerologyData {
  core: {
    lifePath: number; lifePathKarmicDebt: number | null; expression: number; soulUrge: number;
    personality: number; birthday: number; maturity: number; isMasterLifePath: boolean;
  };
  extended: {
    karmicLessons: number[]; hiddenPassion: number; balance: number; subconsciousSelf: number;
    rationalThought: number; cornerstone: string; capstone: string; firstVowel: string;
    pythagoreanExpression: number; chaldeanExpression: number;
    workings: { letter: string; value: number }[];
  };
  essence: { age: number; essence: number; activeLetters: string[] };
  meanings: Record<string, Meaning>;
  challenges: number[];
  pinnacles: { number: number; fromAge: number; toAge: number | null }[];
  personal: { personalYear: number; personalMonth: number; personalDay: number };
}

interface NameScore { name: string; value: number; rating: number; isMaster: boolean; karmicDebt: boolean; notes: string }

interface LaunchDates { best: { date: string; score: number; personalDay: number }[] }

export default function NumerologyPage() {
  const data = useOracle<NumerologyData>("/numerology");
  const [name, setName] = useState("");
  const scoreName = useOracleMutation<{ name: string }, NameScore>("/numerology/score-name");
  const launchDates = useOracleMutation<{ days: number }, LaunchDates>("/numerology/launch-dates");

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Numerology</h1>
        <p className="text-muted-foreground text-sm">Transparent arithmetic — every number verifiable by hand.</p>
      </div>

      <LoadingOr isLoading={data.isLoading} error={data.error}>
        {data.data && (
          <>
            <OracleSection title="Core Numbers" subtitle={data.data.core.lifePathKarmicDebt ? `Karmic debt ${data.data.core.lifePathKarmicDebt} woven into the life path.` : undefined}>
              <div className="flex gap-3 flex-wrap">
                <BigStat label="Life Path" value={data.data.core.lifePath} accent={data.data.core.isMasterLifePath} />
                <BigStat label="Expression" value={data.data.core.expression} />
                <BigStat label="Soul Urge" value={data.data.core.soulUrge} />
                <BigStat label="Personality" value={data.data.core.personality} />
                <BigStat label="Birthday" value={data.data.core.birthday} />
                <BigStat label="Maturity" value={data.data.core.maturity} />
              </div>
              <div className="flex gap-3 flex-wrap pt-2 border-t">
                <BigStat label="Personal Year" value={data.data.personal.personalYear} />
                <BigStat label="Personal Month" value={data.data.personal.personalMonth} />
                <BigStat label="Today" value={data.data.personal.personalDay} accent />
                <BigStat label="Essence now" value={data.data.essence.essence} />
              </div>
            </OracleSection>

            {data.data.meanings.lifePath && (
              <OracleSection title={`Life Path ${data.data.core.lifePath}: ${data.data.meanings.lifePath.title}`}>
                <p className="text-sm"><span className="font-semibold">Strengths:</span> {data.data.meanings.lifePath.strengths}</p>
                <p className="text-sm"><span className="font-semibold">Shadow:</span> {data.data.meanings.lifePath.shadow}</p>
                <p className="text-sm"><span className="font-semibold">Career:</span> {data.data.meanings.lifePath.career}</p>
              </OracleSection>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <OracleSection title="Extended Analysis">
                <p className="text-sm">Karmic lessons: {data.data.extended.karmicLessons.join(", ") || "none — all digits present"}</p>
                <p className="text-sm">Hidden passion: {data.data.extended.hiddenPassion} · Balance: {data.data.extended.balance} · Subconscious self: {data.data.extended.subconsciousSelf}</p>
                <p className="text-sm">Cornerstone {data.data.extended.cornerstone} · Capstone {data.data.extended.capstone} · First vowel {data.data.extended.firstVowel}</p>
                <p className="text-sm">Pythagorean {data.data.extended.pythagoreanExpression} vs Chaldean {data.data.extended.chaldeanExpression}</p>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Show the arithmetic</summary>
                  <p className="mt-1 font-mono break-all">
                    {data.data.extended.workings.map((w) => `${w.letter}=${w.value}`).join(" ")}
                  </p>
                </details>
              </OracleSection>
              <OracleSection title="Pinnacles & Challenges">
                {data.data.pinnacles.map((pinnacle) => (
                  <p key={pinnacle.fromAge} className="text-sm">
                    Pinnacle <span className="font-semibold">{pinnacle.number}</span> · age {pinnacle.fromAge}{pinnacle.toAge !== null ? `–${pinnacle.toAge}` : "+"}
                  </p>
                ))}
                <p className="text-sm text-muted-foreground">Challenges: {data.data.challenges.join(" · ")}</p>
              </OracleSection>
            </div>
          </>
        )}
      </LoadingOr>

      <div className="grid md:grid-cols-2 gap-6">
        <OracleSection title="Score a Name" subtitle="Business, brand, or baby name">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name to score" />
            <Button onClick={() => scoreName.mutate({ name })} disabled={!name.trim() || scoreName.isPending}>Score</Button>
          </div>
          {scoreName.data && (
            <p className="text-sm">
              <span className="font-serif text-xl text-amber-600 mr-2">{scoreName.data.value}</span>
              Rating {scoreName.data.rating}/100{scoreName.data.isMaster && " · Master"}{scoreName.data.karmicDebt && " · Karmic debt"} — {scoreName.data.notes}
            </p>
          )}
          {scoreName.error && <p className="text-sm text-destructive">{scoreName.error.message}</p>}
        </OracleSection>

        <OracleSection title="Launch Date Finder" subtitle="Best business dates in the next 30 days">
          <Button onClick={() => launchDates.mutate({ days: 30 })} disabled={launchDates.isPending}>
            {launchDates.isPending ? "Scanning…" : "Find dates"}
          </Button>
          {launchDates.data?.best.map((day) => (
            <p key={day.date} className="text-sm font-mono">
              {day.date} · score {day.score} · personal day {day.personalDay}
            </p>
          ))}
          {launchDates.error && <p className="text-sm text-destructive">{launchDates.error.message}</p>}
        </OracleSection>
      </div>
    </div>
  );
}
