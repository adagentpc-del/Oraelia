import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGenerateDailyGuidance, getGetTodayGuidanceQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine, User, Activity, Sun, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: summary, isLoading, isError, refetch } = useGetDashboardSummary();
  const queryClient = useQueryClient();
  const generateGuidance = useGenerateDailyGuidance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayGuidanceQueryKey() });
        toast.success("Daily guidance generated.");
      },
      onError: () => {
        toast.error("Failed to generate guidance. Please try again.");
      },
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-primary">Daily Guidance</h2>
          {!dashboardData.todayGuidance && (
            <Button
              onClick={() => generateGuidance.mutate(undefined)}
              disabled={generateGuidance.isPending}
              data-testid="button-generate-guidance"
            >
              {generateGuidance.isPending ? "Generating..." : "Generate Today's Guidance"}
            </Button>
          )}
        </div>

        {dashboardData.todayGuidance ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="bg-card md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-primary">Theme of the Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{dashboardData.todayGuidance.theme}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Best Use of Energy</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.bestUse}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">What to Avoid</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.avoid}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Career and Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.career}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.relationship}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Body and Wellness</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.body}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Chakra Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.chakra}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Moon Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.moon}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Goal Nudge</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dashboardData.todayGuidance.goalNudge}</p>
              </CardContent>
            </Card>

            <Card className="bg-card md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-primary">Ritual and Journal Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">Today's Action</h4>
                  <p>{dashboardData.todayGuidance.action}</p>
                </div>
                <div>
                  <h4 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">Ritual</h4>
                  <p>{dashboardData.todayGuidance.ritual}</p>
                </div>
                <div>
                  <h4 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground mb-1">Journal Prompt</h4>
                  <p className="italic font-serif">{dashboardData.todayGuidance.journalPrompt}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="bg-card border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Sun className="w-12 h-12 mb-4 opacity-50" />
              <p>Your guidance for today has not been generated yet.</p>
              <p className="text-sm mt-2">Click the button above to receive your daily energetic intelligence.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
