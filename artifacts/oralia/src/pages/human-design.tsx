import { useOracle } from "@/lib/oracle";
import { OracleSection, QualityBanner, LoadingOr } from "@/components/oracle/shared";
import { Badge } from "@/components/ui/badge";

interface HDData {
  design: {
    type: string; strategy: string; authority: string; authorityGuidance: string;
    notSelfTheme: string; signature: string; profile: string; profileName: string;
    definition: string; definedCenters: string[]; undefinedCenters: string[];
    channels: { gates: number[]; name: string }[];
    incarnationCross: string; digestion: string; environment: string;
    motivation: string; perspective: string;
  };
  note?: string;
}

export default function HumanDesignPage() {
  const data = useOracle<HDData>("/human-design");

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Human Design</h1>
        <p className="text-muted-foreground text-sm">Your energetic operating system — calculated from both birth and design charts.</p>
      </div>

      <LoadingOr isLoading={data.isLoading} error={data.error}>
        {data.data && (
          <>
            <QualityBanner limitations={data.data.note ? [data.data.note] : undefined} />
            <OracleSection title={data.data.design.type} subtitle={`Profile ${data.data.design.profile} — ${data.data.design.profileName} · ${data.data.design.definition}`}>
              <p className="text-sm"><span className="font-semibold">Strategy:</span> {data.data.design.strategy}</p>
              <p className="text-sm"><span className="font-semibold">Authority ({data.data.design.authority}):</span> {data.data.design.authorityGuidance}</p>
              <p className="text-sm"><span className="font-semibold">Not-self theme:</span> {data.data.design.notSelfTheme}</p>
              <p className="text-sm"><span className="font-semibold">Signature:</span> {data.data.design.signature}</p>
            </OracleSection>

            <div className="grid md:grid-cols-2 gap-6">
              <OracleSection title="Centers">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Defined</p>
                <div className="flex gap-1 flex-wrap">
                  {data.data.design.definedCenters.map((center) => <Badge key={center}>{center}</Badge>)}
                  {!data.data.design.definedCenters.length && <span className="text-sm text-muted-foreground">None (Reflector)</span>}
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Open</p>
                <div className="flex gap-1 flex-wrap">
                  {data.data.design.undefinedCenters.map((center) => <Badge key={center} variant="secondary">{center}</Badge>)}
                </div>
              </OracleSection>
              <OracleSection title="Channels">
                {data.data.design.channels.length ? data.data.design.channels.map((channel) => (
                  <p key={channel.name} className="text-sm">
                    <span className="font-mono text-amber-600 mr-2">{channel.gates.join("–")}</span>
                    Channel of {channel.name}
                  </p>
                )) : <p className="text-sm text-muted-foreground">No complete channels — definition comes through connection with others.</p>}
              </OracleSection>
            </div>

            <OracleSection title="Variables & Environment" subtitle={data.data.design.incarnationCross}>
              <p className="text-sm"><span className="font-semibold">Digestion:</span> {data.data.design.digestion}</p>
              <p className="text-sm"><span className="font-semibold">Environment:</span> {data.data.design.environment}</p>
              <p className="text-sm"><span className="font-semibold">Motivation:</span> {data.data.design.motivation}</p>
              <p className="text-sm"><span className="font-semibold">Perspective:</span> {data.data.design.perspective}</p>
              <p className="text-xs text-muted-foreground pt-1">Treat these as experiments to run, not rules to obey.</p>
            </OracleSection>
          </>
        )}
      </LoadingOr>
    </div>
  );
}
