import { useState } from "react";
import { useOracle, type AstroMapResponse, type CityScore } from "@/lib/oracle";
import { OracleSection, ScoreBar, scoreColor, LoadingOr } from "@/components/oracle/shared";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["overall", "career", "love", "money", "creativity", "family", "health", "visibility", "spirituality", "adventure", "business"];

export default function PlacesPage() {
  const map = useOracle<AstroMapResponse>("/astromap");
  const [category, setCategory] = useState("overall");
  const [selected, setSelected] = useState<CityScore | null>(null);

  const score = (city: CityScore) => city.scores[category] ?? city.scores.overall ?? 0;
  const ranked = map.data ? [...map.data.cities].sort((a, b) => score(b) - score(a)) : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">Places</h1>
        <p className="text-muted-foreground text-sm">Astrocartography: where on Earth your chart works hardest for each goal.</p>
      </div>

      <LoadingOr isLoading={map.isLoading} error={map.error}>
        {map.data && (
          <>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <OracleSection title={`Best for ${category}`}>
                <div className="divide-y">
                  {ranked.slice(0, 15).map((city, index) => (
                    <button
                      key={city.city}
                      onClick={() => setSelected(city)}
                      className="flex items-center gap-3 py-1.5 w-full text-left text-sm hover:bg-accent/50 px-1 rounded"
                    >
                      <span className="text-muted-foreground w-5 text-xs">{index + 1}</span>
                      <span className="flex-1">{city.city}, {city.country}</span>
                      <span className={`font-semibold ${scoreColor(score(city))}`}>{score(city)}</span>
                    </button>
                  ))}
                </div>
              </OracleSection>

              <OracleSection title={selected ? `${selected.city}, ${selected.country}` : "Select a city"} subtitle={selected?.summary}>
                {selected ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Relocated ASC {selected.relocatedAscendant} · MC {selected.relocatedMidheaven}
                    </p>
                    {Object.entries(selected.scores).filter(([key]) => key !== "overall").map(([key, value]) => (
                      <ScoreBar key={key} label={key} score={value} />
                    ))}
                    {selected.influences.length > 0 && (
                      <div className="pt-2 space-y-1">
                        {selected.influences.map((line) => (
                          <p key={line.body + line.kind} className="text-xs">
                            <Badge variant="secondary" className="mr-2">{line.body} {line.kind}</Badge>
                            {line.orb}° orb · {line.strength}% strength
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Pick a city from the ranking to see its full profile and planetary lines.</p>
                )}
              </OracleSection>
            </div>

            <OracleSection title="Local Space Compass" subtitle="Directions from your birth place — each planet's bearing colors what you find that way.">
              <div className="grid sm:grid-cols-2 gap-2">
                {map.data.localSpace.map((line) => (
                  <p key={line.body} className="text-sm">
                    <span className="font-semibold w-16 inline-block">{line.body}</span> {line.meaning}
                  </p>
                ))}
              </div>
            </OracleSection>

            {map.data.parans.length > 0 && (
              <OracleSection title="Paran Latitudes" subtitle="Bands where two planets act together, anywhere along that latitude.">
                {map.data.parans.slice(0, 15).map((paran) => (
                  <p key={`${paran.bodyA}${paran.bodyB}${paran.latitude}`} className="text-sm">
                    <span className="font-mono text-xs text-muted-foreground w-14 inline-block">{paran.latitude}°</span>
                    <span className="font-medium">{paran.bodyA}/{paran.bodyB}</span>: {paran.meaning}
                  </p>
                ))}
              </OracleSection>
            )}
          </>
        )}
      </LoadingOr>
    </div>
  );
}
