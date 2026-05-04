import { useState } from "react";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    defaultValues: {
      hdType: profile?.hdType || "",
      hdStrategy: profile?.hdStrategy || "",
      hdAuthority: profile?.hdAuthority || "",
      hdProfile: profile?.hdProfile || "",
    }
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  }

  if (!profile) return <div>No profile found</div>;

  const onSubmit = (data: any) => {
    updateProfile.mutate(
      { data: { ...profile, ...data } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          setIsEditing(false);
          toast.success("Profile updated");
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">My Profile</h1>
        <p className="text-muted-foreground mt-2">Your foundational energetic blueprint.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-primary">Core Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Full Name</Label>
              <p className="font-medium text-lg">{profile.fullName}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Birthday</Label>
              <p className="font-medium">{profile.birthday} {profile.birthTime && `at ${profile.birthTime}`}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Location</Label>
              <p className="font-medium">Born in {profile.birthCity}, currently in {profile.currentCity}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-primary">Astrological Baseline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Sun Sign</Label>
              <p className="font-medium text-lg">{profile.sunSign || "Not calculated"}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Life Path Number</Label>
              <p className="font-medium text-lg">{profile.lifePathNumber || "Not calculated"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-serif text-primary">Human Design</CardTitle>
            <Button variant="outline" size="sm" onClick={() => {
              form.reset({
                hdType: profile?.hdType || "",
                hdStrategy: profile?.hdStrategy || "",
                hdAuthority: profile?.hdAuthority || "",
                hdProfile: profile?.hdProfile || "",
              });
              setIsEditing(!isEditing);
            }}>
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="hdType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hdStrategy" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hdAuthority" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authority</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hdProfile" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={updateProfile.isPending}>Save Design</Button>
                </form>
              </Form>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Type</Label>
                  <p className="font-medium">{profile.hdType || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Strategy</Label>
                  <p className="font-medium">{profile.hdStrategy || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Authority</Label>
                  <p className="font-medium">{profile.hdAuthority || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Profile</Label>
                  <p className="font-medium">{profile.hdProfile || "Not set"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
