import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCheckin, getGetDashboardSummaryQueryKey, getListCheckinsQueryKey, getGetRecentCheckinsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function CheckInPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createCheckin = useCreateCheckin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCheckinsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentCheckinsQueryKey() });
        toast.success("Check-in saved successfully.");
        setLocation("/dashboard");
      },
      onError: () => {
        toast.error("Failed to save check-in.");
      },
    },
  });

  const [formData, setFormData] = useState({
    mood: 5,
    energy: 5,
    stress: 5,
    sleepQuality: 5,
    movement: "",
    socialActivity: "",
    cyclePhase: "",
    notes: "",
    whatHappened: "",
    whatFeltAligned: "",
    whatFeltDraining: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCheckin.mutate({ data: formData });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Daily Check-In</h1>
        <p className="text-muted-foreground mt-2">Log your energetic state to build your pattern intelligence.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="bg-card">
          <CardContent className="p-6 space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-primary border-b border-border pb-2">Core Metrics</h2>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Mood</Label>
                    <span className="text-sm font-medium">{formData.mood}/10</span>
                  </div>
                  <Slider
                    value={[formData.mood]}
                    min={1} max={10} step={1}
                    onValueChange={([v]) => setFormData({...formData, mood: v})}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Energy</Label>
                    <span className="text-sm font-medium">{formData.energy}/10</span>
                  </div>
                  <Slider
                    value={[formData.energy]}
                    min={1} max={10} step={1}
                    onValueChange={([v]) => setFormData({...formData, energy: v})}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Stress / Tension</Label>
                    <span className="text-sm font-medium">{formData.stress}/10</span>
                  </div>
                  <Slider
                    value={[formData.stress]}
                    min={1} max={10} step={1}
                    onValueChange={([v]) => setFormData({...formData, stress: v})}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Sleep Quality</Label>
                    <span className="text-sm font-medium">{formData.sleepQuality}/10</span>
                  </div>
                  <Slider
                    value={[formData.sleepQuality]}
                    min={1} max={10} step={1}
                    onValueChange={([v]) => setFormData({...formData, sleepQuality: v})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-serif text-primary border-b border-border pb-2">Context and Activities</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Movement / Exercise</Label>
                  <Input
                    value={formData.movement}
                    onChange={e => setFormData({...formData, movement: e.target.value})}
                    placeholder="e.g. Yoga, Walk, Rest"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Social Activity</Label>
                  <Input
                    value={formData.socialActivity}
                    onChange={e => setFormData({...formData, socialActivity: e.target.value})}
                    placeholder="e.g. Solitary, Dinner with friends"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cycle Phase (Optional)</Label>
                  <Input
                    value={formData.cyclePhase}
                    onChange={e => setFormData({...formData, cyclePhase: e.target.value})}
                    placeholder="e.g. Follicular, Luteal, Full Moon"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-serif text-primary border-b border-border pb-2">Reflections</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>What happened today?</Label>
                  <Textarea
                    value={formData.whatHappened}
                    onChange={e => setFormData({...formData, whatHappened: e.target.value})}
                    placeholder="Brief summary of the day's events"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>What felt aligned?</Label>
                    <Textarea
                      value={formData.whatFeltAligned}
                      onChange={e => setFormData({...formData, whatFeltAligned: e.target.value})}
                      placeholder="Moments of flow or joy"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What felt draining?</Label>
                    <Textarea
                      value={formData.whatFeltDraining}
                      onChange={e => setFormData({...formData, whatFeltDraining: e.target.value})}
                      placeholder="Energy leaks or friction"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any other observations"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg" disabled={createCheckin.isPending} data-testid="button-submit-checkin">
                {createCheckin.isPending ? "Saving..." : "Log Check-In"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
