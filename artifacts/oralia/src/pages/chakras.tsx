import { useState } from "react";
import {
  useGetLatestChakraAssessment,
  getGetLatestChakraAssessmentQueryKey,
  useCreateChakraAssessment,
  getListChakraAssessmentsQueryKey,
} from "@workspace/api-client-react";
import type { ChakraAssessment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export default function ChakrasPage() {
  const { data: latest, isLoading } = useGetLatestChakraAssessment({
    query: { retry: false, queryKey: getGetLatestChakraAssessmentQueryKey() },
  });
  const queryClient = useQueryClient();
  const createAssessment = useCreateChakraAssessment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLatestChakraAssessmentQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListChakraAssessmentsQueryKey() });
        toast.success("Assessment saved");
        setIsAssessing(false);
      },
      onError: () => {
        toast.error("Failed to save assessment.");
      },
    },
  });

  const [isAssessing, setIsAssessing] = useState(false);

  const [formData, setFormData] = useState({
    root: 5,
    sacral: 5,
    solarPlexus: 5,
    heart: 5,
    throat: 5,
    thirdEye: 5,
    crown: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssessment.mutate({ data: formData });
  };

  const typedLatest = latest as ChakraAssessment | undefined;

  const chartData = typedLatest ? [
    { subject: 'Root', A: typedLatest.root, fullMark: 10 },
    { subject: 'Sacral', A: typedLatest.sacral, fullMark: 10 },
    { subject: 'Solar Plexus', A: typedLatest.solarPlexus, fullMark: 10 },
    { subject: 'Heart', A: typedLatest.heart, fullMark: 10 },
    { subject: 'Throat', A: typedLatest.throat, fullMark: 10 },
    { subject: 'Third Eye', A: typedLatest.thirdEye, fullMark: 10 },
    { subject: 'Crown', A: typedLatest.crown, fullMark: 10 },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">Chakra Intelligence</h1>
          <p className="text-muted-foreground mt-2">Assess and balance your energetic centers.</p>
        </div>
        {!isAssessing && (
          <Button onClick={() => setIsAssessing(true)} data-testid="button-new-assessment">New Assessment</Button>
        )}
      </div>

      {isAssessing ? (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="font-serif text-primary">Assess Current Energy</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { key: 'root', label: 'Root (Grounding, Safety, Survival)' },
                { key: 'sacral', label: 'Sacral (Creativity, Pleasure, Emotion)' },
                { key: 'solarPlexus', label: 'Solar Plexus (Willpower, Confidence)' },
                { key: 'heart', label: 'Heart (Love, Compassion, Connection)' },
                { key: 'throat', label: 'Throat (Communication, Truth)' },
                { key: 'thirdEye', label: 'Third Eye (Intuition, Vision)' },
                { key: 'crown', label: 'Crown (Spirituality, Awareness)' },
              ].map((chakra) => (
                <div key={chakra.key} className="space-y-3">
                  <div className="flex justify-between">
                    <Label>{chakra.label}</Label>
                    <span className="text-sm font-medium">{formData[chakra.key as keyof typeof formData]}/10</span>
                  </div>
                  <Slider
                    value={[formData[chakra.key as keyof typeof formData]]}
                    min={1} max={10} step={1}
                    onValueChange={([v]) => setFormData({...formData, [chakra.key]: v})}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button variant="ghost" type="button" onClick={() => setIsAssessing(false)}>Cancel</Button>
                <Button type="submit" disabled={createAssessment.isPending}>
                  {createAssessment.isPending ? "Saving..." : "Save Assessment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6"><Skeleton className="h-96" /></div>
      ) : typedLatest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-primary">Energy Balance</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Chakras" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif text-primary">Guidance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-xs uppercase text-muted-foreground tracking-wider block mb-1">Strongest Center</Label>
                <p className="font-medium text-lg text-primary">{typedLatest.strongestChakra || "Not available"}</p>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground tracking-wider block mb-1">Focus Area</Label>
                <p className="font-medium text-lg text-destructive">{typedLatest.lowestChakra || "Not available"}</p>
              </div>
              {typedLatest.recommendedPractice && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground tracking-wider block mb-1">Recommended Practice</Label>
                  <p className="text-sm">{typedLatest.recommendedPractice}</p>
                </div>
              )}
              {typedLatest.journalPrompt && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground tracking-wider block mb-1">Journal Prompt</Label>
                  <p className="text-sm italic font-serif">{typedLatest.journalPrompt}</p>
                </div>
              )}
              {typedLatest.affirmation && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground tracking-wider block mb-1">Affirmation</Label>
                  <p className="italic font-serif">"{typedLatest.affirmation}"</p>
                </div>
              )}
              {typedLatest.somaticAction && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground tracking-wider block mb-1">Somatic Action</Label>
                  <p className="text-sm">{typedLatest.somaticAction}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No chakra assessments found.</p>
          <Button onClick={() => setIsAssessing(true)}>Take First Assessment</Button>
        </div>
      )}
    </div>
  );
}
