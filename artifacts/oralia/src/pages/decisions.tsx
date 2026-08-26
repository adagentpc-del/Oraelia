import { useState } from "react";
import { useOracleMutation } from "@/lib/oracle";
import { OracleSection, BigStat, LoadingOr } from "@/components/oracle/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES: [string, string][] = [
  ["move", "Move"], ["start-company", "Start a company"], ["marry", "Marry"],
  ["leave-job", "Leave my job"], ["hire", "Hire someone"], ["launch", "Launch something"],
  ["invest", "Invest"], ["travel", "Travel"], ["surgery", "Schedule surgery"],
  ["buy-home", "Buy a home"], ["sell-company", "Sell my company"],
  ["date-person", "Date this person"], ["accept-offer", "Accept an offer"], ["other", "Something else"],
];

interface DecisionResult {
  evaluation: {
    opportunityScore: number; riskScore: number; confidence: number; recommendation: string;
    factors: { factor: string; impact: number; explanation: string }[];
    bestWindows: { date: string; score: number; reason: string }[];
  };
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  proceed: "✓ Proceed",
  "proceed-with-care": "Proceed with care",
  wait: "Wait for a better window",
  "avoid-for-now": "Avoid for now",
};

export default function DecisionsPage() {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("other");
  const evaluate = useOracleMutation<{ question: string; category: string }, DecisionResult>("/decision");

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Decision Engine</h1>
        <p className="text-muted-foreground text-sm">
          "Should I…?" — evaluated against your natal chart, current transits, profection year, retrogrades, eclipses, and numerology.
        </p>
      </div>

      <OracleSection title="Ask">
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Describe the decision you're weighing…" rows={3} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm bg-background w-full">
          {CATEGORIES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <Button onClick={() => evaluate.mutate({ question, category })} disabled={!question.trim() || evaluate.isPending} className="w-full">
          {evaluate.isPending ? "Evaluating…" : "Evaluate"}
        </Button>
      </OracleSection>

      <LoadingOr isLoading={evaluate.isPending} error={evaluate.error}>
        {evaluate.data && (
          <>
            <OracleSection title={RECOMMENDATION_LABELS[evaluate.data.evaluation.recommendation] ?? evaluate.data.evaluation.recommendation}>
              <div className="flex gap-4">
                <BigStat label="Opportunity" value={evaluate.data.evaluation.opportunityScore} />
                <BigStat label="Risk" value={evaluate.data.evaluation.riskScore} />
                <BigStat label="Confidence" value={evaluate.data.evaluation.confidence} accent />
              </div>
            </OracleSection>
            <OracleSection title="Why">
              {evaluate.data.evaluation.factors.map((factor) => (
                <div key={factor.factor + factor.explanation.slice(0, 20)} className="text-sm">
                  <span className="font-semibold">{factor.factor}</span>
                  <span className={`ml-2 font-mono text-xs ${factor.impact >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {factor.impact >= 0 ? `+${factor.impact}` : factor.impact}
                  </span>
                  <p className="text-xs text-muted-foreground">{factor.explanation}</p>
                </div>
              ))}
            </OracleSection>
            {evaluate.data.evaluation.bestWindows.length > 0 && (
              <OracleSection title="Better Windows Ahead">
                {evaluate.data.evaluation.bestWindows.map((window) => (
                  <p key={window.date} className="text-sm">
                    <span className="font-mono font-semibold">{window.date}</span> · score {window.score} — {window.reason}
                  </p>
                ))}
              </OracleSection>
            )}
            <p className="text-xs text-muted-foreground">
              Symbolic timing cannot answer questions of fact, legality, safety, or another person's intent. Do practical due diligence regardless of the score.
            </p>
          </>
        )}
      </LoadingOr>
    </div>
  );
}
