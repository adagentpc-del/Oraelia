import { useState } from "react";
import {
  useListRelationships,
  getListRelationshipsQueryKey,
  useCreateRelationship,
  useGenerateRelationshipSummary,
  useDeleteRelationship,
} from "@workspace/api-client-react";
import type { RelationshipProfile } from "@workspace/api-client-react";
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

export default function RelationshipsPage() {
  const { data: relationships, isLoading, isError, refetch } = useListRelationships();
  const queryClient = useQueryClient();
  const createRelationship = useCreateRelationship({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRelationshipsQueryKey() });
        setIsDialogOpen(false);
        toast.success("Relationship added");
      },
      onError: () => {
        toast.error("Failed to add relationship.");
      },
    },
  });
  const deleteRelationship = useDeleteRelationship({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRelationshipsQueryKey() });
        toast.success("Relationship removed");
      },
      onError: () => {
        toast.error("Failed to remove relationship.");
      },
    },
  });
  const generateSummary = useGenerateRelationshipSummary({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRelationshipsQueryKey() });
        toast.success("Summary generated");
      },
      onError: () => {
        toast.error("Failed to generate summary.");
      },
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    personName: "",
    relationshipType: "",
    birthday: "",
    communicationStyle: "",
    attachmentStyle: "",
    conflictStyle: "",
    loveLanguage: "",
    currentDynamic: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRelationship.mutate({ data: formData });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-serif text-primary mb-2">Unable to load relationships</h2>
        <p className="text-muted-foreground mb-6">Something went wrong while fetching your data.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Relationships</h1>
          <p className="text-muted-foreground mt-2">Map dynamics and improve communication.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-relationship">Add Relationship</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">New Relationship Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.relationshipType} onValueChange={v => setFormData({...formData, relationshipType: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="colleague">Colleague</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Birthday (Optional)</Label>
                <Input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Communication Style</Label>
                <Select value={formData.communicationStyle} onValueChange={v => setFormData({...formData, communicationStyle: v})}>
                  <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="empathic">Empathic</SelectItem>
                    <SelectItem value="analytical">Analytical</SelectItem>
                    <SelectItem value="passive">Passive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Attachment Style</Label>
                <Select value={formData.attachmentStyle} onValueChange={v => setFormData({...formData, attachmentStyle: v})}>
                  <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secure">Secure</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="avoidant">Avoidant</SelectItem>
                    <SelectItem value="disorganized">Disorganized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Love Language</Label>
                <Select value={formData.loveLanguage} onValueChange={v => setFormData({...formData, loveLanguage: v})}>
                  <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="words">Words of Affirmation</SelectItem>
                    <SelectItem value="acts">Acts of Service</SelectItem>
                    <SelectItem value="gifts">Receiving Gifts</SelectItem>
                    <SelectItem value="time">Quality Time</SelectItem>
                    <SelectItem value="touch">Physical Touch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createRelationship.isPending}>
                {createRelationship.isPending ? "Saving..." : "Save Profile"}
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
      ) : relationships?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relationships.map((rel: RelationshipProfile) => (
            <Card key={rel.id} className="bg-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-serif text-xl text-primary">{rel.personName}</CardTitle>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{rel.relationshipType}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteRelationship.mutate({ id: rel.id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rel.communicationStyle && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Communication</span>
                    <p className="text-sm">{rel.communicationStyle}</p>
                  </div>
                )}
                {rel.loveLanguage && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Love Language</span>
                    <p className="text-sm">{rel.loveLanguage}</p>
                  </div>
                )}

                {rel.communicationPattern ? (
                  <div className="space-y-2">
                    <Button variant="link" className="px-0 h-auto text-primary" onClick={() => setExpandedId(expandedId === rel.id ? null : rel.id)}>
                      {expandedId === rel.id ? "Hide Summary" : "View Summary"}
                    </Button>
                    {expandedId === rel.id && (
                      <div className="mt-3 space-y-3 text-sm border-t border-border pt-3">
                        <div><span className="text-xs uppercase text-muted-foreground block">Communication Pattern</span>{rel.communicationPattern}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Emotional Activation</span>{rel.emotionalActivation}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Repair Language</span>{rel.repairLanguage}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Conflict Pattern</span>{rel.conflictPattern}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Best Communication</span>{rel.bestCommunication}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Best Timing</span>{rel.bestTiming}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Green Flags</span>{rel.greenFlags}</div>
                        <div><span className="text-xs uppercase text-muted-foreground block">Red Flags</span>{rel.redFlags}</div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 gap-2 text-muted-foreground"
                      onClick={() => generateSummary.mutate({ id: rel.id, data: { regenerate: true } })}
                      disabled={generateSummary.isPending}
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => generateSummary.mutate({ id: rel.id, data: {} })}
                    disabled={generateSummary.isPending}
                  >
                    {generateSummary.isPending ? "Generating..." : <><Sparkles className="w-3 h-3" /> Generate Summary</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border border-dashed rounded-lg">
          <p className="text-muted-foreground">No relationships mapped yet.</p>
        </div>
      )}
    </div>
  );
}
