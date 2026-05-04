import { useState } from "react";
import { useGetMe, useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check } from "lucide-react";

const TONE_OPTIONS = [
  { value: "soft", label: "Soft", description: "Warm, gentle, nurturing guidance" },
  { value: "direct", label: "Direct", description: "Clear, concise, no-fluff advice" },
  { value: "mystical", label: "Mystical", description: "Poetic, archetypal, cosmic language" },
  { value: "practical", label: "Practical", description: "Actionable steps, grounded approach" },
  { value: "luxury-oracle", label: "Luxury Oracle", description: "Elegant, refined, curated wisdom" },
];

export default function SettingsPage() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();
  const queryClient = useQueryClient();
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [cycleTracking, setCycleTracking] = useState<boolean | null>(null);
  const [sleepTracking, setSleepTracking] = useState<boolean | null>(null);

  const updateProfile = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        toast.success("Preferences saved.");
      },
      onError: () => {
        toast.error("Failed to save preferences.");
      },
    },
  });

  if (isUserLoading || isProfileLoading) {
    return <div className="space-y-6"><Skeleton className="h-48" /></div>;
  }

  const currentTone = selectedTone ?? profile?.guidanceTone ?? "mystical";
  const currentCycle = cycleTracking ?? profile?.menstrualCycleTracking ?? false;
  const currentSleep = sleepTracking ?? profile?.sleepTracking ?? false;

  const hasChanges =
    (selectedTone !== null && selectedTone !== (profile?.guidanceTone ?? "mystical")) ||
    (cycleTracking !== null && cycleTracking !== (profile?.menstrualCycleTracking ?? false)) ||
    (sleepTracking !== null && sleepTracking !== (profile?.sleepTracking ?? false));

  const handleSave = () => {
    if (!profile) return;
    updateProfile.mutate({
      data: {
        fullName: profile.fullName,
        birthday: profile.birthday,
        guidanceTone: currentTone,
        menstrualCycleTracking: currentCycle,
        sleepTracking: currentSleep,
      },
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences.</p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-primary">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs uppercase text-muted-foreground block mb-1">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-xs uppercase text-muted-foreground block mb-1">Name</Label>
            <p className="font-medium">{user?.name}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-primary">Guidance Tone</CardTitle>
          <p className="text-sm text-muted-foreground">Choose how Oralia speaks to you. This affects all AI-generated guidance.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setSelectedTone(tone.value)}
                className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                  currentTone === tone.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {currentTone === tone.value && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
                <p className="font-medium text-sm">{tone.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{tone.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-primary">Tracking Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cycle Tracking</Label>
              <p className="text-sm text-muted-foreground">Track menstrual or moon cycles</p>
            </div>
            <Switch
              checked={currentCycle}
              onCheckedChange={(v) => setCycleTracking(v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sleep Tracking</Label>
              <p className="text-sm text-muted-foreground">Include sleep quality in patterns</p>
            </div>
            <Switch
              checked={currentSleep}
              onCheckedChange={(v) => setSleepTracking(v)}
            />
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="gap-2"
          >
            {updateProfile.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      )}

      <Card className="bg-card border-destructive/20">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
