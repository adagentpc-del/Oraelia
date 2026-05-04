import { useState } from "react";
import {
  useListLocations,
  getListLocationsQueryKey,
  useCreateLocation,
  useGenerateLocationStrategy,
  useDeleteLocation,
} from "@workspace/api-client-react";
import type { LocationProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

export default function LocationsPage() {
  const { data: locations, isLoading, isError, refetch } = useListLocations();
  const queryClient = useQueryClient();
  const createLocation = useCreateLocation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        setIsDialogOpen(false);
        setFormData({ city: "", country: "", locationType: "", locationGoal: "" });
        toast.success("Location added");
      },
      onError: () => {
        toast.error("Failed to add location.");
      },
    },
  });
  const deleteLocation = useDeleteLocation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        toast.success("Location removed");
      },
      onError: () => {
        toast.error("Failed to remove location.");
      },
    },
  });
  const generateStrategy = useGenerateLocationStrategy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        toast.success("Strategy generated");
      },
      onError: () => {
        toast.error("Failed to generate strategy.");
      },
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    city: "",
    country: "",
    locationType: "",
    locationGoal: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation.mutate({ data: formData });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-serif text-primary mb-2">Unable to load locations</h2>
        <p className="text-muted-foreground mb-6">Something went wrong while fetching your data.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Locations</h1>
          <p className="text-muted-foreground mt-2">Find the best places for your goals using energy mapping.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-location">Add Location</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-serif">New Location Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.locationType} onValueChange={v => setFormData({...formData, locationType: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lived">Where I live</SelectItem>
                    <SelectItem value="visit">Frequent visitor</SelectItem>
                    <SelectItem value="considering">Considering moving</SelectItem>
                    <SelectItem value="business">Business / Work</SelectItem>
                    <SelectItem value="retreat">Retreat / Healing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Goal for this location</Label>
                <Select value={formData.locationGoal} onValueChange={v => setFormData({...formData, locationGoal: v})}>
                  <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="love">Love and Connection</SelectItem>
                    <SelectItem value="money">Money and Career</SelectItem>
                    <SelectItem value="visibility">Visibility and Fame</SelectItem>
                    <SelectItem value="healing">Healing and Rest</SelectItem>
                    <SelectItem value="writing">Writing and Communication</SelectItem>
                    <SelectItem value="rest">Rest and Restoration</SelectItem>
                    <SelectItem value="reinvention">Total Reinvention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createLocation.isPending}>
                {createLocation.isPending ? "Saving..." : "Save Location"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : locations?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc: LocationProfile) => (
            <Card key={loc.id} className="bg-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-serif text-xl text-primary">{loc.city}</CardTitle>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{loc.country}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteLocation.mutate({ id: loc.id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-sm uppercase tracking-wider">{loc.locationType}</span>
                  <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-sm uppercase tracking-wider">{loc.locationGoal}</span>
                </div>
                {loc.bestUse ? (
                  <div className="space-y-2">
                    <Button variant="link" className="px-0 h-auto text-primary" onClick={() => setExpandedId(expandedId === loc.id ? null : loc.id)}>
                      {expandedId === loc.id ? "Hide Strategy" : "View Strategy"}
                    </Button>
                    {expandedId === loc.id && (
                      <div className="mt-3 space-y-3 text-sm border-t border-border pt-3">
                        <div><span className="text-xs uppercase text-muted-foreground block">Best Use</span>{loc.bestUse}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">What to Do</span>{loc.whatToDo}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">What Not to Do</span>{loc.whatNotToDo}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Best Timing</span>{loc.bestTimingStyle}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Recommended Purpose</span>{loc.recommendedPurpose}</div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 gap-2 text-muted-foreground"
                      onClick={() => generateStrategy.mutate({ id: loc.id, data: { regenerate: true } })}
                      disabled={generateStrategy.isPending}
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => generateStrategy.mutate({ id: loc.id, data: {} })}
                    disabled={generateStrategy.isPending}
                  >
                    {generateStrategy.isPending ? "Generating..." : <><Sparkles className="w-3 h-3" /> Generate Strategy</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border border-dashed rounded-lg">
          <p className="text-muted-foreground">No locations mapped yet.</p>
        </div>
      )}
    </div>
  );
}
