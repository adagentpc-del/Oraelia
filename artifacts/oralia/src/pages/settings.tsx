import { useGetMe, useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();

  if (isUserLoading || isProfileLoading) {
    return <div className="space-y-6"><Skeleton className="h-48" /></div>;
  }

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
          <CardTitle className="font-serif text-xl text-primary">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cycle Tracking</Label>
              <p className="text-sm text-muted-foreground">Track menstrual or moon cycles</p>
            </div>
            <Switch checked={profile?.menstrualCycleTracking || false} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sleep Tracking</Label>
              <p className="text-sm text-muted-foreground">Include sleep quality in patterns</p>
            </div>
            <Switch checked={profile?.sleepTracking || false} />
          </div>
          <div>
            <Label className="text-xs uppercase text-muted-foreground block mb-1">Guidance Tone</Label>
            <p className="font-medium capitalize">{profile?.guidanceTone || "Mystical"}</p>
          </div>
          <Button variant="outline" className="mt-4">Update Preferences</Button>
        </CardContent>
      </Card>

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
