import { useState } from "react";
import { useOracle, type ChartResponse, type LifeReport, type NatalChartData } from "@/lib/oracle";
import { OracleSection, ScoreBar, BigStat, QualityBanner, LoadingOr } from "@/components/oracle/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", Chiron: "⚷",
  NorthNode: "☊", SouthNode: "☋", Lilith: "⚸",
};
const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

function ChartWheel({ chart }: { chart: NatalChartData }) {
  const size = 360;
  const center = size / 2;
  const radius = center - 10;
  const inner = radius * 0.82;
  const asc = chart.houses.angles.ascendant;
  const point = (lon: number, r: number) => {
    const angle = ((180 + (lon - asc)) * Math.PI) / 180;
    return { x: center + r * Math.cos(-angle), y: center + r * Math.sin(-angle) };
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm mx-auto">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-primary" />
      <circle cx={center} cy={center} r={inner} fill="none" stroke="currentColor" strokeWidth={0.8} className="text-primary/50" />
      {Array.from({ length: 12 }, (_, i) => {
        const start = point(i * 30, inner);
        const end = point(i * 30, radius);
        const glyph = point(i * 30 + 15, (radius + inner) / 2);
        return (
          <g key={i}>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="currentColor" strokeWidth={0.6} className="text-primary/40" />
            <text x={glyph.x} y={glyph.y} textAnchor="middle" dominantBaseline="central" fontSize={13} className="fill-amber-600">
              {SIGN_GLYPHS[i]}
            </text>
          </g>
        );
      })}
      {chart.houses.cusps.map((cusp, i) => {
        const isAngle = i % 3 === 0;
        const start = point(cusp, radius * 0.2);
        const end = point(cusp, inner);
        return (
          <line key={i} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="currentColor" strokeWidth={isAngle ? 1.4 : 0.5} className={isAngle ? "text-slate-700" : "text-slate-400"} />
        );
      })}
      {chart.bodies.map((body) => {
        const p = point(body.longitude, radius * 0.65);
        return (
          <text key={body.body} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={15} className={body.retrograde ? "fill-fuchsia-800" : "fill-slate-800"}>
            {GLYPHS[body.body] ?? "•"}
          </text>
        );
      })}
      <text {...point(asc, radius * 0.1)} textAnchor="middle" fontSize={9} fontWeight="bold" className="fill-primary">ASC</text>
    </svg>
  );
}

export default function BlueprintPage() {
  const [houses, setHouses] = useState("placidus");
  const [zodiac, setZodiac] = useState("tropical");
  const chartQuery = useOracle<ChartResponse>(`/natal/chart?houses=${houses}&zodiac=${zodiac}`);
  const reportsQuery = useOracle<{ reports: LifeReport[] }>("/natal/reports");

  const chart = chartQuery.data?.chart;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">My Blueprint</h1>
          <p className="text-muted-foreground text-sm">Your complete natal architecture — calculated, versioned, explained.</p>
        </div>
        <div className="flex gap-2">
          <select value={houses} onChange={(e) => setHouses(e.target.value)} className="border rounded-md px-2 py-1 text-sm bg-background">
            <option value="placidus">Placidus</option>
            <option value="whole-sign">Whole Sign</option>
            <option value="equal">Equal</option>
            <option value="porphyry">Porphyry</option>
          </select>
          <select value={zodiac} onChange={(e) => setZodiac(e.target.value)} className="border rounded-md px-2 py-1 text-sm bg-background">
            <option value="tropical">Tropical</option>
            <option value="sidereal">Sidereal</option>
          </select>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/export/blueprint" download>Export</a>
          </Button>
        </div>
      </div>

      <QualityBanner limitations={chartQuery.data?.dataQuality?.limitations} />

      <LoadingOr isLoading={chartQuery.isLoading} error={chartQuery.error}>
        {chart && (
          <>
            <OracleSection title="The Big Three" subtitle={`${chart.isDayChart ? "Day" : "Night"} chart · ruled by ${chart.chartRuler} · ${chart.moonPhase.name} · ${chart.shape.shape} shape`}>
              <div className="flex gap-4">
                <BigStat label="Sun" value={chart.sunSign} />
                <BigStat label="Moon" value={chart.moonSign} />
                <BigStat label="Rising" value={chart.ascendantSign} accent />
              </div>
            </OracleSection>

            <OracleSection title="Chart Wheel">
              <ChartWheel chart={chart} />
            </OracleSection>

            <OracleSection title="Placements">
              <div className="divide-y">
                {chart.bodies.map((body) => (
                  <div key={body.body} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className="w-24 font-medium">{body.body}</span>
                    <span className="flex-1">{body.formatted}{body.retrograde && <span className="text-fuchsia-800 ml-1">℞</span>}</span>
                    <span className="text-xs text-muted-foreground">H{body.house}</span>
                    <Badge variant={body.dignity === "domicile" || body.dignity === "exaltation" ? "default" : body.dignity === "detriment" || body.dignity === "fall" ? "destructive" : "secondary"} className="text-xs">
                      {body.dignity}
                    </Badge>
                  </div>
                ))}
              </div>
            </OracleSection>

            <div className="grid md:grid-cols-2 gap-6">
              <OracleSection title="Element & Modality Balance" subtitle={chart.balance.missingElements.length ? `Missing: ${chart.balance.missingElements.join(", ")}` : undefined}>
                {Object.entries(chart.balance.elements).map(([element, count]) => (
                  <ScoreBar key={element} label={element} score={Math.min(100, count * 12)} />
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Dominant: {chart.balance.dominantElement} / {chart.balance.dominantModality}
                </p>
              </OracleSection>
              <OracleSection title="Strongest Planets">
                {chart.dominantPlanets.map((planet) => (
                  <ScoreBar key={planet.body} label={planet.body} score={planet.score} />
                ))}
                {chart.unaspectedPlanets.length > 0 && (
                  <p className="text-xs text-muted-foreground">Unaspected (wild card): {chart.unaspectedPlanets.join(", ")}</p>
                )}
              </OracleSection>
            </div>

            {chart.patterns.length > 0 && (
              <OracleSection title="Aspect Patterns">
                {chart.patterns.map((pattern) => (
                  <div key={pattern.type + pattern.bodies.join()} className="text-sm">
                    <span className="font-semibold text-primary">{pattern.type}</span>
                    <span className="text-muted-foreground"> ({pattern.bodies.join(" · ")})</span>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                  </div>
                ))}
              </OracleSection>
            )}

            {chart.traditional.notes.length > 0 && (
              <OracleSection title="Traditional Notes" subtitle={`${chart.traditional.sect} sect chart`}>
                {chart.traditional.notes.map((note) => (
                  <p key={note} className="text-sm">{note}</p>
                ))}
              </OracleSection>
            )}
          </>
        )}
      </LoadingOr>

      <h2 className="text-2xl font-serif font-bold text-primary pt-2">Life Reports</h2>
      <LoadingOr isLoading={reportsQuery.isLoading} error={reportsQuery.error}>
        {reportsQuery.data && (
          <Tabs defaultValue={reportsQuery.data.reports[0]?.category}>
            <TabsList className="flex-wrap h-auto">
              {reportsQuery.data.reports.map((report) => (
                <TabsTrigger key={report.category} value={report.category}>{report.title.split(" ")[0]}</TabsTrigger>
              ))}
            </TabsList>
            {reportsQuery.data.reports.map((report) => (
              <TabsContent key={report.category} value={report.category} className="space-y-4">
                <p className="font-serif text-lg text-primary">{report.headline}</p>
                <Accordion type="multiple" defaultValue={[report.sections[0]?.heading ?? ""]}>
                  {report.sections.map((section) => (
                    <AccordionItem key={section.heading} value={section.heading}>
                      <AccordionTrigger className="text-sm font-medium">{section.heading}</AccordionTrigger>
                      <AccordionContent className="text-sm">{section.content}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                    <p className="font-semibold text-emerald-900 text-xs uppercase tracking-wide mb-1">Higher expression</p>
                    <p>{report.higherExpression}</p>
                  </div>
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <p className="font-semibold text-amber-900 text-xs uppercase tracking-wide mb-1">Lower expression</p>
                    <p>{report.lowerExpression}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">Do this:</p>
                  {report.actions.map((action) => <p key={action}>· {action}</p>)}
                </div>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Evidence & confidence ({report.confidence})</summary>
                  <ul className="mt-1 space-y-0.5">{report.evidence.map((item) => <li key={item}>· {item}</li>)}</ul>
                  <p className="mt-2 italic">{report.disclaimer}</p>
                </details>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </LoadingOr>
    </div>
  );
}
