import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import {
  computeNatalChart,
  allReports,
  coreNumbers,
  challengesAndPinnacles,
  computeHumanDesign,
  annualProfection,
  ageAt,
  julianDayFromDate,
  type NatalChart,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

function chartMarkdown(chart: NatalChart): string {
  const lines: string[] = [];
  lines.push("## Natal Chart\n");
  lines.push(`- ${chart.isDayChart ? "Day" : "Night"} chart · ${chart.houseSystem} houses · ${chart.zodiac} zodiac`);
  lines.push(`- Ascendant: ${chart.ascendantSign} · Sun: ${chart.sunSign} · Moon: ${chart.moonSign} · Chart ruler: ${chart.chartRuler}`);
  lines.push(`- Shape: ${chart.shape.shape} · Dominant: ${chart.balance.dominantElement}/${chart.balance.dominantModality} · Moon phase: ${chart.moonPhase.name}\n`);
  lines.push("| Body | Position | House | Dignity | Notes |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const b of chart.bodies) {
    const notes = [b.retrograde ? "℞" : "", b.angular ? "angular" : "", b.outOfBounds ? "OOB" : "", b.anaretic ? "anaretic" : ""].filter(Boolean).join(", ");
    lines.push(`| ${b.body} | ${b.formatted} | ${b.house} | ${b.dignity} | ${notes} |`);
  }
  lines.push("\n### Major aspects\n");
  for (const a of chart.aspects.filter((x) => x.major).slice(0, 15)) {
    lines.push(`- ${a.a} ${a.type} ${a.b} (orb ${a.orb}°, ${a.harmonyScore >= 0 ? "supportive" : "challenging"})`);
  }
  if (chart.patterns.length) {
    lines.push("\n### Patterns\n");
    for (const p of chart.patterns) lines.push(`- **${p.type}** (${p.bodies.join(", ")}): ${p.description}`);
  }
  return lines.join("\n");
}

/**
 * Complete blueprint export. ?format=markdown (default) or json.
 * Markdown returns text/markdown for save/print; JSON returns the raw facts.
 */
router.get("/export/blueprint", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile with birth data first" });
    return;
  }
  const chart = computeNatalChart(birth.moment);
  const reports = allReports(chart);
  const numerology = {
    core: coreNumbers(birth.fullName, birth.birthDate),
    ...challengesAndPinnacles(birth.birthDate),
  };
  const humanDesign = computeHumanDesign(birth.moment);
  const age = ageAt(birth.moment, julianDayFromDate(new Date()));
  const profection = annualProfection(chart, age);

  if (req.query.format === "json") {
    res.json({
      generatedAt: new Date().toISOString(),
      meta: chart.meta,
      dataQuality: birth.dataQuality,
      chart,
      reports,
      numerology,
      humanDesign,
      currentProfection: profection,
    });
    return;
  }

  const md: string[] = [];
  md.push(`# Oralia Blueprint — ${birth.fullName}\n`);
  md.push(`Generated ${new Date().toISOString().slice(0, 10)} · Method ${chart.meta.methodVersion} · Data quality ${birth.dataQuality.score}/100`);
  if (birth.dataQuality.limitations.length) {
    md.push(`\n> Data limitations: ${birth.dataQuality.limitations.join(" ")}`);
  }
  md.push("\n" + chartMarkdown(chart));

  md.push(`\n## Current Timing\n\n- Age ${age}: ${profection.profectedHouse}th-house profection year in ${profection.profectedSign}, lord ${profection.yearLord}\n- ${profection.theme}`);

  md.push("\n## Numerology\n");
  md.push(`- Life Path ${numerology.core.lifePath}${numerology.core.lifePathKarmicDebt ? ` (karmic debt ${numerology.core.lifePathKarmicDebt})` : ""} · Expression ${numerology.core.expression} · Soul Urge ${numerology.core.soulUrge} · Personality ${numerology.core.personality} · Maturity ${numerology.core.maturity}`);

  md.push("\n## Human Design\n");
  md.push(`- ${humanDesign.type} · ${humanDesign.profile} (${humanDesign.profileName}) · ${humanDesign.definition}`);
  md.push(`- Strategy: ${humanDesign.strategy}`);
  md.push(`- Authority: ${humanDesign.authority} — ${humanDesign.authorityGuidance}`);
  md.push(`- Defined centers: ${humanDesign.definedCenters.join(", ") || "none (Reflector)"}`);
  md.push(`- Channels: ${humanDesign.channels.map((c) => `${c.gates.join("-")} ${c.name}`).join("; ") || "none"}`);

  for (const report of reports) {
    md.push(`\n## ${report.title}\n\n**${report.headline}**\n`);
    for (const section of report.sections) {
      md.push(`### ${section.heading}\n\n${section.content}\n`);
    }
    md.push(`**Higher expression:** ${report.higherExpression}\n`);
    md.push(`**Lower expression:** ${report.lowerExpression}\n`);
    md.push(`**Do this:** ${report.actions.join(" · ")}\n`);
    md.push(`*Evidence: ${report.evidence.join("; ")}*\n`);
    md.push(`*Confidence: ${report.confidence}. ${report.disclaimer}*`);
  }

  md.push("\n---\n\n*Oralia's interpretations describe tendencies from symbolic systems, not proven causal facts or fixed fate. Not medical, legal, or financial advice.*");

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="oralia-blueprint.md"');
  res.send(md.join("\n"));
});

export default router;
