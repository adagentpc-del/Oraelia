import { useOracle, type DailyForecast, type Profection } from "@/lib/oracle";
import { OracleSection, ScoreBar, BigStat, LoadingOr } from "@/components/oracle/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface QuarterlyData {
  startDate: string;
  endDate: string;
  strategicTheme: string;
  monthlyThemes: { month: string; profectedHouse: number; theme: string }[];
  lunations: { date: string; type: string; sign: string; isEclipse: boolean; natalHouse: number | null }[];
  exactTransits: { transiting: string; natal: string; aspect: string; date: string; retrograde: boolean; pass: number }[];
  launchWindows: string[];
  cautionWindows: string[];
}

interface TimelineData {
  timeline: {
    age: number;
    calendarYear: number;
    profectedHouse: number;
    profectedSign: string;
    yearLord: string;
    theme: string;
    cycleMarkers: string[];
    progressedMoonPhase: string;
  }[];
  note?: string;
}

interface YearlyData {
  age: number;
  personalYear: number;
  profection: Profection;
  solarReturn: string;
  majorLessons: string[];
  progressions: { body: string; sign: string; changedSign: boolean }[];
}

export default function TimingPage() {
  const daily = useOracle<DailyForecast>("/forecast/daily");
  const quarterly = useOracle<QuarterlyData>("/forecast/quarterly");
  const yearly = useOracle<YearlyData>("/forecast/yearly");
  const timeline = useOracle<TimelineData>("/timing/timeline?years=10");

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Timing</h1>
        <p className="text-muted-foreground text-sm">Deterministic timing intelligence: today, this quarter, this year, this decade.</p>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="quarter">Quarter</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
          <TabsTrigger value="decade">10 Years</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <LoadingOr isLoading={daily.isLoading} error={daily.error}>
            {daily.data && (
              <>
                <OracleSection title={`Decision Climate — ${daily.data.date}`} subtitle={`Personal day ${daily.data.personalDay}`}>
                  <div className="flex gap-4 flex-wrap">
                    <BigStat label="Overall" value={daily.data.scores.overall} />
                    <BigStat label="Decisions" value={daily.data.scores.decisionScore} accent />
                    <BigStat label="Energy" value={daily.data.scores.emotionalEnergy} />
                    <BigStat label="Luck" value={daily.data.scores.luck} />
                  </div>
                </OracleSection>
                <OracleSection title="Life Areas">
                  <ScoreBar label="Career" score={daily.data.scores.career} />
                  <ScoreBar label="Relationships" score={daily.data.scores.relationships} />
                  <ScoreBar label="Money" score={daily.data.scores.money} />
                  <ScoreBar label="Health" score={daily.data.scores.health} />
                  <ScoreBar label="Communication" score={daily.data.scores.communication} />
                  <ScoreBar label="Creativity" score={daily.data.scores.creativity} />
                  <ScoreBar label="Productivity" score={daily.data.scores.productivity} />
                </OracleSection>
                <div className="grid md:grid-cols-2 gap-4">
                  <OracleSection title="Opportunities">
                    {daily.data.opportunities.length ? daily.data.opportunities.map((item) => <p key={item} className="text-sm">↗ {item}</p>) : <p className="text-sm text-muted-foreground">A quiet sky — momentum comes from you today.</p>}
                  </OracleSection>
                  <OracleSection title="Watch Out For">
                    {daily.data.risks.length ? daily.data.risks.map((item) => <p key={item} className="text-sm">⚠ {item}</p>) : <p className="text-sm text-muted-foreground">No major friction transits.</p>}
                  </OracleSection>
                </div>
                <OracleSection title="Power Hours">
                  {daily.data.powerHours.map((hour) => (
                    <p key={hour.hourIndex} className="text-sm"><span className="font-mono text-amber-600">{hour.label}</span> — {hour.ruler} hour: {hour.good}</p>
                  ))}
                  {daily.data.retrogrades.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-1">Retrograde: {daily.data.retrogrades.map((r) => `${r.body} in ${r.sign}`).join(", ")}</p>
                  )}
                </OracleSection>
              </>
            )}
          </LoadingOr>
        </TabsContent>

        <TabsContent value="quarter" className="space-y-4">
          <LoadingOr isLoading={quarterly.isLoading} error={quarterly.error}>
            {quarterly.data && (
              <>
                <OracleSection title="Strategic Theme" subtitle={`${quarterly.data.startDate} → ${quarterly.data.endDate}`}>
                  <p className="text-sm">{quarterly.data.strategicTheme}</p>
                </OracleSection>
                <OracleSection title="Month by Month">
                  {quarterly.data.monthlyThemes.map((month) => (
                    <div key={month.month} className="text-sm">
                      <span className="font-semibold">{month.month}</span> — house {month.profectedHouse}
                      <p className="text-xs text-muted-foreground">{month.theme}</p>
                    </div>
                  ))}
                </OracleSection>
                <div className="grid md:grid-cols-2 gap-4">
                  <OracleSection title="Launch Windows">
                    {quarterly.data.launchWindows.map((window) => <p key={window} className="text-sm">↗ {window}</p>)}
                  </OracleSection>
                  <OracleSection title="Caution Windows">
                    {quarterly.data.cautionWindows.map((window) => <p key={window} className="text-sm">⚠ {window}</p>)}
                  </OracleSection>
                </div>
                <OracleSection title="Lunations & Exact Hits">
                  {quarterly.data.lunations.map((lunation) => (
                    <p key={lunation.date + lunation.type} className="text-sm">
                      {lunation.date}: {lunation.type} in {lunation.sign}
                      {lunation.isEclipse && <Badge className="ml-2 bg-amber-500/20 text-amber-800 hover:bg-amber-500/20">Eclipse</Badge>}
                      {lunation.natalHouse && <span className="text-muted-foreground"> · your house {lunation.natalHouse}</span>}
                    </p>
                  ))}
                  {quarterly.data.exactTransits.map((event) => (
                    <p key={`${event.date}${event.transiting}${event.natal}${event.pass}`} className="text-xs text-muted-foreground font-mono">
                      {event.date} · {event.transiting} {event.aspect} {event.natal}{event.retrograde ? " ℞" : ""}{event.pass > 1 ? ` (pass ${event.pass})` : ""}
                    </p>
                  ))}
                </OracleSection>
              </>
            )}
          </LoadingOr>
        </TabsContent>

        <TabsContent value="year" className="space-y-4">
          <LoadingOr isLoading={yearly.isLoading} error={yearly.error}>
            {yearly.data && (
              <>
                <OracleSection title={`Age ${yearly.data.age} · Personal Year ${yearly.data.personalYear}`} subtitle={`Solar return ${yearly.data.solarReturn.slice(0, 10)} · house ${yearly.data.profection.profectedHouse} year, lord ${yearly.data.profection.yearLord}`}>
                  <p className="text-sm">{yearly.data.profection.theme}</p>
                </OracleSection>
                <OracleSection title="Major Lessons">
                  {yearly.data.majorLessons.map((lesson) => <p key={lesson} className="text-sm">· {lesson}</p>)}
                </OracleSection>
                <OracleSection title="Progressed Positions">
                  {yearly.data.progressions.map((progression) => (
                    <p key={progression.body} className="text-sm">
                      {progression.body} in {progression.sign}
                      {progression.changedSign && <Badge className="ml-2" variant="secondary">new sign</Badge>}
                    </p>
                  ))}
                </OracleSection>
              </>
            )}
          </LoadingOr>
        </TabsContent>

        <TabsContent value="decade" className="space-y-4">
          <LoadingOr isLoading={timeline.isLoading} error={timeline.error}>
            {timeline.data && (
              <>
                {timeline.data.note && <p className="text-xs text-muted-foreground">{timeline.data.note}</p>}
                {timeline.data.timeline.map((year) => (
                  <OracleSection
                    key={year.age}
                    title={`Age ${year.age} · ${year.calendarYear}`}
                    subtitle={`House ${year.profectedHouse} in ${year.profectedSign} · lord ${year.yearLord} · progressed Moon: ${year.progressedMoonPhase}`}
                  >
                    <p className="text-sm">{year.theme}</p>
                    {year.cycleMarkers.map((marker) => (
                      <p key={marker} className="text-sm text-amber-700">✦ {marker}</p>
                    ))}
                  </OracleSection>
                ))}
              </>
            )}
          </LoadingOr>
        </TabsContent>
      </Tabs>
    </div>
  );
}
