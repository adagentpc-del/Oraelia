import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOracle, useOracleMutation, oracleFetch, type Profection } from "@/lib/oracle";
import { OracleSection, LoadingOr } from "@/components/oracle/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LifeEvent {
  id: number; title: string; eventType: string; eventDate: string;
  category: string | null; intensity: number | null;
}

interface EventsData { events: LifeEvent[]; eventTypes: string[] }

interface AnalysisData {
  event: LifeEvent;
  analysis: {
    ageAtEvent: number;
    profection: Profection;
    personalCycles: { personalYear: number; personalMonth: number; personalDay: number };
    activeTransits: { transiting: string; natal: string; type: string; harmonyScore: number }[];
    retrogradesAtEvent: { body: string; sign: string }[];
  };
}

interface PatternsData { category: string; events: number; patterns: string[]; note?: string }

export default function LifeEventsPage() {
  const queryClient = useQueryClient();
  const events = useOracle<EventsData>("/life-events");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const analysis = useOracle<AnalysisData>(selectedId ? `/life-events/${selectedId}/analysis` : null);
  const [patternCategory, setPatternCategory] = useState<string | null>(null);
  const patterns = useOracle<PatternsData>(patternCategory ? `/life-events/patterns/${patternCategory}` : null);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("other");
  const [eventDate, setEventDate] = useState("");
  const [category, setCategory] = useState("career");
  const create = useOracleMutation<Record<string, unknown>, LifeEvent>("/life-events");

  const submit = () => {
    create.mutate(
      { title, eventType, eventDate, category, intensity: 5 },
      {
        onSuccess: () => {
          toast.success("Event logged");
          setTitle("");
          setEventDate("");
          queryClient.invalidateQueries({ queryKey: ["oracle", "/life-events"] });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const remove = async (id: number) => {
    try {
      await oracleFetch(`/life-events/${id}`, { method: "DELETE" });
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["oracle", "/life-events"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Life Events</h1>
        <p className="text-muted-foreground text-sm">Log what happened; Oralia shows the timing factors that were active — and which repeat.</p>
      </div>

      <OracleSection title="Log an Event">
        <div className="grid sm:grid-cols-2 gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What happened?" />
          <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm bg-background">
            {(events.data?.eventTypes ?? ["other"]).map((type) => (
              <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-md px-2 py-1.5 text-sm bg-background">
            {["love", "career", "money", "family", "health", "visibility", "other"].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <Button onClick={submit} disabled={!title.trim() || !eventDate || create.isPending} className="w-full">
          {create.isPending ? "Saving…" : "Log event"}
        </Button>
      </OracleSection>

      <div className="grid md:grid-cols-2 gap-6">
        <OracleSection title="Your Events">
          <LoadingOr isLoading={events.isLoading} error={events.error}>
            {events.data?.events.length ? (
              <div className="divide-y">
                {events.data.events.map((event) => (
                  <div key={event.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <button onClick={() => setSelectedId(event.id)} className={`flex-1 text-left hover:text-primary ${selectedId === event.id ? "font-semibold text-primary" : ""}`}>
                      {event.title}
                      <span className="block text-xs text-muted-foreground">{event.eventDate} · {event.category ?? "—"}</span>
                    </button>
                    <button onClick={() => remove(event.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
            )}
          </LoadingOr>
          <div className="pt-2 border-t flex gap-2 flex-wrap">
            {["love", "career", "money", "family"].map((cat) => (
              <button key={cat} onClick={() => setPatternCategory(cat)} className={`px-2 py-0.5 rounded-full text-xs border ${patternCategory === cat ? "bg-primary text-primary-foreground" : ""}`}>
                {cat} patterns
              </button>
            ))}
          </div>
          {patterns.data && (
            <div className="text-sm space-y-1">
              {patterns.data.patterns.length
                ? patterns.data.patterns.map((pattern) => <p key={pattern}>✦ {pattern}</p>)
                : <p className="text-muted-foreground">{patterns.data.note ?? "No repeating factors yet."}</p>}
            </div>
          )}
        </OracleSection>

        <OracleSection title={analysis.data ? `Analysis: ${analysis.data.event.title}` : "Select an event"}>
          <LoadingOr isLoading={analysis.isLoading} error={analysis.error}>
            {analysis.data ? (
              <>
                <p className="text-sm">
                  Age {analysis.data.analysis.ageAtEvent} · house {analysis.data.analysis.profection.profectedHouse} profection year
                  ({analysis.data.analysis.profection.profectedSign}, lord {analysis.data.analysis.profection.yearLord})
                </p>
                <p className="text-xs text-muted-foreground">
                  Personal year {analysis.data.analysis.personalCycles.personalYear} · month {analysis.data.analysis.personalCycles.personalMonth} · day {analysis.data.analysis.personalCycles.personalDay}
                </p>
                {analysis.data.analysis.activeTransits.slice(0, 8).map((transit) => (
                  <p key={transit.transiting + transit.type + transit.natal} className="text-sm">
                    <span className={transit.harmonyScore >= 0 ? "text-emerald-700" : "text-red-700"}>●</span>{" "}
                    {transit.transiting} {transit.type} natal {transit.natal}
                  </p>
                ))}
                {analysis.data.analysis.retrogradesAtEvent.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Retrograde then: {analysis.data.analysis.retrogradesAtEvent.map((r) => r.body).join(", ")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pick an event to see what the sky was doing.</p>
            )}
          </LoadingOr>
        </OracleSection>
      </div>
    </div>
  );
}
