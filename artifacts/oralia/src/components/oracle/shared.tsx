import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function scoreColor(score: number): string {
  if (score < 35) return "text-red-700";
  if (score < 55) return "text-amber-600";
  if (score < 75) return "text-yellow-600";
  return "text-emerald-700";
}

export function barColor(score: number): string {
  if (score < 35) return "bg-red-600/70";
  if (score < 55) return "bg-amber-500/80";
  if (score < 75) return "bg-yellow-500/80";
  return "bg-emerald-600/80";
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className={`font-semibold ${scoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function BigStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-20">
      <span className={`font-serif text-2xl font-bold ${accent ? "text-amber-600" : "text-primary"}`}>{value}</span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

export function OracleSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg text-primary">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export function QualityBanner({ limitations }: { limitations?: string[] }) {
  if (!limitations?.length) return null;
  return (
    <div className="flex gap-2 items-start rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="space-y-1">
        {limitations.map((limitation) => (
          <p key={limitation}>{limitation}</p>
        ))}
      </div>
    </div>
  );
}

export function LoadingOr({ isLoading, error, children }: { isLoading: boolean; error: Error | null; children: ReactNode }) {
  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error.message}
      </div>
    );
  }
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Consulting the engine…</div>;
  }
  return <>{children}</>;
}
