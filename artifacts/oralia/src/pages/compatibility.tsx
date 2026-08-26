import { useState } from "react";
import { useOracle, type SynastryPayload, type HDConnectionPayload } from "@/lib/oracle";
import { OracleSection, ScoreBar, BigStat, QualityBanner, LoadingOr } from "@/components/oracle/shared";
import { Badge } from "@/components/ui/badge";

interface RelationshipRow { id: number; personName: string; relationshipType: string; birthday: string | null }

const MODES: [string, string][] = [
  ["romantic", "Romantic"],
  ["business", "Business"],
  ["breakup", "Breakup Integration"],
];

export default function CompatibilityPage() {
  const relationships = useOracle<RelationshipRow[]>("/relationships");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState("romantic");
  const synastry = useOracle<SynastryPayload>(
    selectedId ? `/synastry/relationship/${selectedId}?mode=${mode}` : null,
  );
  const connection = useOracle<HDConnectionPayload>(
    selectedId ? `/human-design/connection/${selectedId}` : null,
  );

  const withBirthday = relationships.data?.filter((r) => r.birthday) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Compatibility</h1>
        <p className="text-muted-foreground text-sm">Synastry and Human Design connection charts for the people in your life.</p>
      </div>

      <LoadingOr isLoading={relationships.isLoading} error={relationships.error}>
        {withBirthday.length ? (
          <div className="flex gap-2 flex-wrap">
            {withBirthday.map((rel) => (
              <button
                key={rel.id}
                onClick={() => setSelectedId(rel.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedId === rel.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
              >
                {rel.personName} <span className="opacity-60 text-xs">({rel.relationshipType})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add a relationship with a birthday on the Relationships page to unlock synastry.
          </p>
        )}
      </LoadingOr>

      {selectedId && (
        <>
          <div className="flex gap-2">
            {MODES.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-3 py-1 rounded-full text-xs border ${mode === key ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <LoadingOr isLoading={synastry.isLoading} error={synastry.error}>
            {synastry.data && (
              <>
                <QualityBanner limitations={synastry.data.synastry.dataQuality.limitations} />
                <OracleSection title={`Compatibility with ${synastry.data.personName ?? "partner"}`} subtitle={synastry.data.report?.thesis}>
                  <div className="flex gap-4 flex-wrap">
                    <BigStat label="Overall" value={synastry.data.synastry.scores.overall} accent />
                    <BigStat label="Chemistry" value={synastry.data.synastry.scores.chemistry} />
                    <BigStat label="Stability" value={synastry.data.synastry.scores.longTermStability} />
                    <BigStat label="Conflict risk" value={synastry.data.synastry.scores.conflictRisk} />
                  </div>
                </OracleSection>
                <OracleSection title="Dimensions">
                  <ScoreBar label="Emotional bond" score={synastry.data.synastry.scores.emotional} />
                  <ScoreBar label="Communication" score={synastry.data.synastry.scores.communication} />
                  <ScoreBar label="Passion" score={synastry.data.synastry.scores.passion} />
                  <ScoreBar label="Friendship" score={synastry.data.synastry.scores.friendship} />
                  <ScoreBar label="Shared purpose" score={synastry.data.synastry.scores.sharedPurpose} />
                  <ScoreBar label="Business" score={synastry.data.synastry.scores.business} />
                  <ScoreBar label="Growth" score={synastry.data.synastry.scores.growth} />
                </OracleSection>
                {synastry.data.report && (
                  <OracleSection title={`${MODES.find(([k]) => k === mode)?.[1]} Reading`}>
                    {synastry.data.report.sections.map((section) => (
                      <div key={section.heading} className="text-sm">
                        <p className="font-semibold">{section.heading}</p>
                        <p className="text-muted-foreground">{section.content}</p>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic">{synastry.data.report.disclaimer}</p>
                  </OracleSection>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <OracleSection title="Green Flags">
                    {synastry.data.synastry.greenFlags.map((flag) => <p key={flag} className="text-sm text-emerald-800">✓ {flag}</p>)}
                  </OracleSection>
                  <OracleSection title="Red Flags">
                    {synastry.data.synastry.redFlags.length
                      ? synastry.data.synastry.redFlags.map((flag) => <p key={flag} className="text-sm text-red-800">⚑ {flag}</p>)
                      : <p className="text-sm text-muted-foreground">No major red-flag contacts.</p>}
                  </OracleSection>
                </div>
              </>
            )}
          </LoadingOr>

          <LoadingOr isLoading={connection.isLoading} error={connection.error}>
            {connection.data && (
              <OracleSection title="Human Design Connection" subtitle={`${connection.data.connection.typeA} + ${connection.data.connection.typeB} · ${connection.data.connection.connectionTheme}`}>
                {connection.data.connection.channels.map((channel) => (
                  <p key={channel.name} className="text-sm">
                    <Badge variant={channel.kind === "electromagnetic" ? "default" : "secondary"} className="mr-2">{channel.kind}</Badge>
                    {channel.meaning}
                  </p>
                ))}
                {connection.data.connection.notes.map((note) => (
                  <p key={note} className="text-xs text-muted-foreground">{note}</p>
                ))}
              </OracleSection>
            )}
          </LoadingOr>
        </>
      )}
    </div>
  );
}
