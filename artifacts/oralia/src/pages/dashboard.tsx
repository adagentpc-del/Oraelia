import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGenerateDailyGuidance,
  useGenerateWeeklyGuidance,
  useGenerateMonthlyGuidance,
  getGetTodayGuidanceQueryKey,
} from "@workspace/api-client-react";
import type { DailyGuidance, WeeklyGuidance, MonthlyGuidance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine, User, Activity, Sun, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type GuidanceTab = "daily" | "weekly" | "monthly";

export default function DashboardPage() {
  const { data: summary, isLoading, isError, refetch } = useGetDashboardSummary();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<GuidanceTab>("daily");
  const [dailyGuidance, setDailyGuidance] = useState<DailyGuidance | null>(null);
  const [weeklyGuidance, setWeeklyGuidance] = useState<WeeklyGuidance | null>(null);
  const [monthlyGuidance, setMonthlyGuidance] = useState<MonthlyGuidance | null>(null);

  const generateDaily = useGenerateDailyGuidance({
    mutation: {
      onSuccess: (data) => {
        setDailyGuidance(data);
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayGuidanceQueryKey() });
        toast.success("Daily guidance generated.");
      },
      onError: () => { toast.error("Failed to generate daily guidance."); },
    },
  });

  const generateWeekly = useGenerateWeeklyGuidance({
    mutation: {
      onSuccess: (data) => {
        setWeeklyGuidance(data);
        toast.success("Weekly guidance generated.");
      },
      onError: () => { toast.error("Failed to generate weekly guidance."); },
    },
  });

  const generateMonthly = useGenerateMonthlyGuidance({
    mutation: {
      onSuccess: (data) => {
        setMonthlyGuidance(data);
        toast.success("Monthly guidance generated.");
      },
      onError: () => { toast.error("Failed to generate monthly guidance."); },
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-serif text-primary mb-2">Unable to load dashboard</h2>
        <p className="text-muted-foreground mb-6">Something went wrong while fetching your data.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const dashboardData = summary!;
  const currentDaily = dailyGuidance || dashboardData.todayGuidance;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Welcome, {dashboardData.userName}</h1>
        <p className="text-muted-foreground mt-2">Your energetic baseline for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Check-in Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-primary">{dashboardData.checkinStreak} Days</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-primary">{dashboardData.activeGoalsCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-primary">{dashboardData.totalCheckins}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/checkin">
          <Button className="gap-2"><PenLine className="w-4 h-4" /> Check In</Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" className="gap-2"><User className="w-4 h-4" /> Profile</Button>
        </Link>
        <Link href="/patterns">
          <Button variant="outline" className="gap-2"><Activity className="w-4 h-4" /> Patterns</Button>
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-1 border-b border-border mb-6">
          {(["daily", "weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab} Guidance
            </button>
          ))}
        </div>

        {activeTab === "daily" && (
          <DailyGuidanceSection
            guidance={currentDaily}
            onGenerate={(regenerate) => generateDaily.mutate({ data: { regenerate } })}
            isPending={generateDaily.isPending}
          />
        )}
        {activeTab === "weekly" && (
          <WeeklyGuidanceSection
            guidance={weeklyGuidance}
            onGenerate={(regenerate) => generateWeekly.mutate({ data: { regenerate } })}
            isPending={generateWeekly.isPending}
          />
        )}
        {activeTab === "monthly" && (
          <MonthlyGuidanceSection
            guidance={monthlyGuidance}
            onGenerate={(regenerate) => generateMonthly.mutate({ data: { regenerate } })}
            isPending={generateMonthly.isPending}
          />
        )}
      </div>
    </div>
  );
}

function GuidanceCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`bg-card ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-lg font-serif text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CachedBadge({ cached, isAiGenerated }: { cached?: boolean; isAiGenerated?: boolean }) {
  return (
    <div className="flex gap-2 items-center">
      {cached && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Cached</span>
      )}
      {isAiGenerated && (
        <span className="flex items-center gap-1 text-xs bg-chart-2/10 text-chart-2 px-2 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3" /> AI Generated
        </span>
      )}
    </div>
  );
}

function GenerateButton({ onGenerate, isPending, hasContent }: { onGenerate: (regenerate: boolean) => void; isPending: boolean; hasContent: boolean }) {
  return (
    <Button
      onClick={() => onGenerate(hasContent)}
      disabled={isPending}
      variant={hasContent ? "outline" : "default"}
      className="gap-2"
      data-testid="button-generate-guidance"
    >
      {isPending ? (
        <>Generating...</>
      ) : hasContent ? (
        <><RefreshCw className="w-4 h-4" /> Regenerate</>
      ) : (
        <>Generate</>
      )}
    </Button>
  );
}

function DailyGuidanceSection({ guidance, onGenerate, isPending }: { guidance?: DailyGuidance | null; onGenerate: (regenerate: boolean) => void; isPending: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif font-bold text-primary">Daily Guidance</h2>
          {guidance && <CachedBadge cached={guidance.cached} isAiGenerated={guidance.isAiGenerated} />}
        </div>
        <GenerateButton onGenerate={onGenerate} isPending={isPending} hasContent={!!guidance} />
      </div>

      {guidance ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuidanceCard title="Theme of the Day" className="md:col-span-2">
            <p className="text-lg">{guidance.theme}</p>
          </GuidanceCard>
          <GuidanceCard title="Best Use of Energy"><p>{guidance.bestUse}</p></GuidanceCard>
          <GuidanceCard title="What to Avoid"><p>{guidance.avoid}</p></GuidanceCard>
          <GuidanceCard title="Career and Focus"><p>{guidance.career}</p></GuidanceCard>
          <GuidanceCard title="Relationships"><p>{guidance.relationship}</p></GuidanceCard>
          <GuidanceCard title="Body and Wellness"><p>{guidance.body}</p></GuidanceCard>
          <GuidanceCard title="Chakra Focus"><p>{guidance.chakra}</p></GuidanceCard>
          <GuidanceCard title="Moon Phase"><p>{guidance.moon}</p></GuidanceCard>
          <GuidanceCard title="Goal Nudge"><p>{guidance.goalNudge}</p></GuidanceCard>
          <GuidanceCard title="Ritual and Journal" className="md:col-span-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">Today's Action</h4>
                <p>{guidance.action}</p>
              </div>
              <div>
                <h4 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">Ritual</h4>
                <p>{guidance.ritual}</p>
              </div>
              <div>
                <h4 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">Journal Prompt</h4>
                <p className="italic font-serif">{guidance.journalPrompt}</p>
              </div>
            </div>
          </GuidanceCard>
        </motion.div>
      ) : (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Sun className="w-12 h-12 mb-4 opacity-50" />
            <p>Your daily guidance has not been generated yet.</p>
            <p className="text-sm mt-2">Click the button above to receive your daily energetic intelligence.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WeeklyGuidanceSection({ guidance, onGenerate, isPending }: { guidance?: WeeklyGuidance | null; onGenerate: (regenerate: boolean) => void; isPending: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif font-bold text-primary">Weekly Guidance</h2>
          {guidance && <CachedBadge cached={guidance.cached} isAiGenerated={guidance.isAiGenerated} />}
        </div>
        <GenerateButton onGenerate={onGenerate} isPending={isPending} hasContent={!!guidance} />
      </div>

      {guidance ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuidanceCard title="Week Theme" className="md:col-span-2">
            <p className="text-lg">{guidance.weekTheme}</p>
          </GuidanceCard>
          <GuidanceCard title="Focus"><p>{guidance.focus}</p></GuidanceCard>
          <GuidanceCard title="Release"><p>{guidance.release}</p></GuidanceCard>
          <GuidanceCard title="Career Strategy"><p>{guidance.careerStrategy}</p></GuidanceCard>
          <GuidanceCard title="Relationship Focus"><p>{guidance.relationshipFocus}</p></GuidanceCard>
          <GuidanceCard title="Body Wisdom"><p>{guidance.bodyWisdom}</p></GuidanceCard>
          <GuidanceCard title="Energy Map"><p>{guidance.energyMap}</p></GuidanceCard>
          <GuidanceCard title="Weekly Ritual"><p>{guidance.weeklyRitual}</p></GuidanceCard>
          <GuidanceCard title="Journal Theme"><p className="italic font-serif">{guidance.journalTheme}</p></GuidanceCard>
          <GuidanceCard title="Goal Strategy" className="md:col-span-2"><p>{guidance.goalStrategy}</p></GuidanceCard>
        </motion.div>
      ) : (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Sun className="w-12 h-12 mb-4 opacity-50" />
            <p>Your weekly guidance has not been generated yet.</p>
            <p className="text-sm mt-2">Click Generate to receive your weekly energetic briefing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MonthlyGuidanceSection({ guidance, onGenerate, isPending }: { guidance?: MonthlyGuidance | null; onGenerate: (regenerate: boolean) => void; isPending: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif font-bold text-primary">Monthly Planning</h2>
          {guidance && <CachedBadge cached={guidance.cached} isAiGenerated={guidance.isAiGenerated} />}
        </div>
        <GenerateButton onGenerate={onGenerate} isPending={isPending} hasContent={!!guidance} />
      </div>

      {guidance ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuidanceCard title="Month Theme" className="md:col-span-2">
            <p className="text-lg">{guidance.monthTheme}</p>
          </GuidanceCard>
          <GuidanceCard title="Intention" className="md:col-span-2"><p>{guidance.intention}</p></GuidanceCard>
          <GuidanceCard title="Career"><p>{guidance.careerMonth}</p></GuidanceCard>
          <GuidanceCard title="Relationships"><p>{guidance.relationshipMonth}</p></GuidanceCard>
          <GuidanceCard title="Body and Health"><p>{guidance.bodyMonth}</p></GuidanceCard>
          <GuidanceCard title="Best Weeks"><p>{guidance.bestWeeks}</p></GuidanceCard>
          <GuidanceCard title="Challenges"><p>{guidance.challenges}</p></GuidanceCard>
          <GuidanceCard title="Opportunities"><p>{guidance.opportunities}</p></GuidanceCard>
          <GuidanceCard title="Moon Guidance"><p>{guidance.moonGuidance}</p></GuidanceCard>
          <GuidanceCard title="Monthly Ritual"><p>{guidance.monthlyRitual}</p></GuidanceCard>
          <GuidanceCard title="Reflection Prompt" className="md:col-span-2">
            <p className="italic font-serif text-lg">{guidance.reflectionPrompt}</p>
          </GuidanceCard>
        </motion.div>
      ) : (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Sun className="w-12 h-12 mb-4 opacity-50" />
            <p>Your monthly planning guide has not been generated yet.</p>
            <p className="text-sm mt-2">Click Generate to receive your monthly strategic overview.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
