import SwiftUI

struct ReportsView: View {
    @StateObject private var loader = Loadable<ReportsResponse>()

    private let icons: [String: String] = [
        "love": "heart.fill", "career": "briefcase.fill", "money": "dollarsign.circle.fill",
        "fame": "star.fill", "family": "house.fill", "health": "cross.case.fill",
        "spirituality": "sparkles",
    ]

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Optimized Report",
                        title: "Your personal intelligence profile.",
                        subtitle: "A cohesive read of your chart, timing, patterns, places, relationships, body signals, strengths, shadows, and practical guidance."
                    )

                    if let error = loader.error {
                        ErrorBanner(message: error)
                    } else if loader.isLoading {
                        reportSkeleton
                    } else if let response = loader.value {
                        optimizedHero(response.reports)
                        reportGrid(response.reports)
                        integrationStandard
                        SafetyFootnote()
                    }
                }
                .padding(18)
            }
        }
        .navigationTitle("Report")
        .toolbar {
            Button { load() } label: { Image(systemName: "arrow.clockwise") }
        }
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/natal/reports") }
    }

    private var reportSkeleton: some View {
        HeroOracleCard(
            title: "Reading your pattern",
            subtitle: "Oralia is organizing your signals into one practical profile."
        ) {
            VStack(spacing: 10) {
                ProgressView()
                    .tint(Theme.primary)
                    .frame(maxWidth: .infinity)
                Text("Calculations stay separate from interpretation so the report remains grounded.")
                    .font(.caption)
                    .foregroundStyle(Theme.secondaryText)
                    .multilineTextAlignment(.center)
            }
        }
    }

    @ViewBuilder
    private func optimizedHero(_ reports: [LifeReport]) -> some View {
        let lead = reports.first
        HeroOracleCard(
            title: lead?.title ?? "Personal Pattern Map",
            subtitle: lead?.headline ?? "Your report connects symbolic systems into one usable operating profile."
        ) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    intelligencePill("Chart")
                    intelligencePill("Timing")
                    intelligencePill("Places")
                    intelligencePill("Body")
                }

                Divider().overlay(Theme.cardStroke)

                VStack(alignment: .leading, spacing: 10) {
                    Label("Charts become patterns.", systemImage: "circle.grid.cross")
                    Label("Patterns become timing.", systemImage: "calendar.badge.clock")
                    Label("Timing becomes practical guidance.", systemImage: "sparkles")
                }
                .font(.footnote)
                .foregroundStyle(Theme.primaryText)
            }
        }
    }

    private func intelligencePill(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.caption2.weight(.semibold))
            .tracking(1.1)
            .foregroundStyle(Theme.primary)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(
                Capsule()
                    .fill(Theme.softPanel)
                    .overlay(Capsule().stroke(Theme.cardStroke, lineWidth: 1))
            )
    }

    @ViewBuilder
    private func reportGrid(_ reports: [LifeReport]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Life Areas")
                .font(.system(.title3, design: .serif).weight(.semibold))
                .foregroundStyle(Theme.primaryText)
                .padding(.top, 2)

            LazyVStack(spacing: 12) {
                ForEach(Array(reports.enumerated()), id: \.element.id) { index, report in
                    NavigationLink {
                        ReportDetailView(report: report)
                    } label: {
                        reportRow(report, index: index)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func reportRow(_ report: LifeReport, index: Int) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Theme.softPanel)
                    .overlay(Circle().stroke(Theme.cardStroke, lineWidth: 1))
                Image(systemName: icons[report.category] ?? "book.closed")
                    .font(.headline)
                    .foregroundStyle(Theme.primary)
            }
            .frame(width: 46, height: 46)

            VStack(alignment: .leading, spacing: 5) {
                Text(report.title)
                    .font(.system(.headline, design: .serif).weight(.semibold))
                    .foregroundStyle(Theme.primaryText)
                Text(report.headline)
                    .font(.caption)
                    .foregroundStyle(Theme.secondaryText)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)
            }

            Spacer(minLength: 10)

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Theme.secondaryText.opacity(0.65))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(index == 0 ? Theme.elevatedCardFill : Theme.cardFill)
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Theme.cardStroke, lineWidth: 1)
                )
                .shadow(color: Theme.emerald.opacity(index == 0 ? 0.11 : 0.06), radius: index == 0 ? 18 : 10, y: index == 0 ? 10 : 5)
        )
    }

    private var integrationStandard: some View {
        SectionCard(title: "Report Standard", subtitle: "Every insight has to become useful, not just mystical.") {
            VStack(alignment: .leading, spacing: 10) {
                standardLine("Meaning", "What the system says and why it matters")
                standardLine("Pattern", "How it shows up in real life")
                standardLine("Action", "How to use the signal today")
                standardLine("Limits", "Confidence, evidence, and disclaimers")
            }
        }
    }

    private func standardLine(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(label.uppercased())
                .font(.caption2.weight(.bold))
                .tracking(1.0)
                .foregroundStyle(Theme.primary)
                .frame(width: 64, alignment: .leading)
            Text(value)
                .font(.caption)
                .foregroundStyle(Theme.secondaryText)
        }
    }
}

struct ReportDetailView: View {
    let report: LifeReport

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    OraliaHeader(
                        eyebrow: report.category,
                        title: report.title,
                        subtitle: report.headline
                    )

                    ForEach(report.sections) { section in
                        SectionCard(title: section.heading) {
                            Text(section.content)
                                .font(.footnote)
                                .foregroundStyle(Theme.primaryText)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    SectionCard(title: "How to Use This") {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(report.actions, id: \.self) { action in
                                Label(action, systemImage: "checkmark.circle")
                                    .font(.footnote)
                                    .foregroundStyle(Theme.primaryText)
                            }
                        }
                    }

                    SectionCard(title: "Evidence and Confidence") {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(report.evidence, id: \.self) { item in
                                Text("• \(item)")
                                    .font(.caption2)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                            Text("Interpretation is tendency-based. Calculated chart facts and personal synthesis remain separate.")
                                .font(.caption2)
                                .foregroundStyle(Theme.secondaryText)
                                .padding(.top, 4)
                        }
                    }

                    SafetyFootnote()
                }
                .padding(18)
            }
        }
        .navigationTitle(report.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
