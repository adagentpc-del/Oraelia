import { useState } from "react";
import { useGetPatternSummary, useGeneratePatternSummary, getGetPatternSummaryQueryKey } from "@workspace/api-client-react";
import type { DailyCheckin, PatternSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function PatternsPage() {
  const { data: summary, isLoading, isError, refetch } = useGetPatternSummary();
  const queryClient = useQueryClient();
  const [aiPatterns, setAiPatterns] = useState<PatternSummary | null>(null);

  const generatePatterns = useGeneratePatternSummary({
    mutation: {
      onSuccess: (data) => {
        setAiPatterns(data);
        queryClient.invalidateQueries({ queryKey: getGetPatternSummaryQueryKey() });
        toast.success("Pattern intelligence generated.");
      },
      onError: () => {
        toast.error("Failed to generate pattern analysis.");
      },
    },
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-48" /><Skeleton className="h-96" /></div>;
  }

  if (isError || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-serif text-primary mb-2">Unable to load patterns</h2>
        <p className="text-muted-foreground mb-6">Something went wrong while fetching your pattern data.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const displayData = aiPatterns || summary;
  const hasAi = !!aiPatterns;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Pattern Intelligence</h1>
          <p className="text-muted-foreground mt-2">Insights drawn from your daily tracking.</p>
        </div>
        <Button
          onClick={() => generatePatterns.mutate({ data: { regenerate: hasAi } })}
          disabled={generatePatterns.isPending}
          variant={hasAi ? "outline" : "default"}
          className="gap-2"
        >
          {generatePatterns.isPending ? (
            "Generating..."
          ) : hasAi ? (
            <><RefreshCw className="w-4 h-4" /> Regenerate</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate AI Analysis</>
          )}
        </Button>
      </div>

      {hasAi && (
        <div className="flex gap-2 items-center">
          {displayData.cached && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Cached</span>
          )}
          {displayData.aiGenerated && (
            <span className="flex items-center gap-1 text-xs bg-chart-2/10 text-chart-2 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> AI Generated
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Avg Mood" value={displayData.avgMood.toFixed(1)} />
        <MetricCard title="Avg Energy" value={displayData.avgEnergy.toFixed(1)} />
        <MetricCard title="Avg Stress" value={displayData.avgStress.toFixed(1)} />
        <MetricCard title="Avg Sleep" value={displayData.avgSleepQuality.toFixed(1)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-serif text-primary">Best and Worst Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-muted-foreground">Best Day</span>
              <span className="font-medium">{displayData.bestDayOfWeek || "Not enough data"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-muted-foreground">Most Challenging Day</span>
              <span className="font-medium">{displayData.worstDayOfWeek || "Not enough data"}</span>
            </div>
            <div className="pt-2">
              <span className="text-muted-foreground text-sm uppercase tracking-wider block mb-1">Weekly Summary</span>
              <p className="text-sm">{displayData.weeklySummary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-serif text-primary">Energy Leaks</CardTitle>
          </CardHeader>
          <CardContent>
            {displayData.energyLeakageWarnings.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-2 text-destructive">
                {displayData.energyLeakageWarnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No significant energy leaks detected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard title="Clarity" content={displayData.bestConditionsClarity} />
        <InsightCard title="Creativity" content={displayData.bestConditionsCreativity} />
        <InsightCard title="Connection" content={displayData.bestConditionsConnection} />
      </div>

      {(displayData.patternInsight || displayData.recommendation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayData.patternInsight && (
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-serif text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Pattern Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{displayData.patternInsight}</p>
              </CardContent>
            </Card>
          )}
          {displayData.recommendation && (
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="font-serif text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{displayData.recommendation}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {displayData.recentCheckins.length > 0 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-serif text-primary">Recent Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData.recentCheckins} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val: string) => { try { return new Date(val).toLocaleDateString(undefined, {weekday: 'short'}); } catch { return val; }}} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} name="Mood" />
                <Line type="monotone" dataKey="energy" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Energy" />
                <Line type="monotone" dataKey="stress" stroke="hsl(var(--destructive))" strokeWidth={2} name="Stress" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-serif font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ title, content }: { title: string; content: string }) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Best Conditions for {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{content || "Not enough data yet."}</p>
      </CardContent>
    </Card>
  );
}
