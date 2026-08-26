import SwiftUI

struct ReportsView: View {
    @StateObject private var loader = Loadable<ReportsResponse>()

    private let icons: [String: String] = [
        "love": "heart.fill", "career": "briefcase.fill", "money": "dollarsign.circle.fill",
        "fame": "star.fill", "family": "house.fill", "health": "cross.case.fill",
        "spirituality": "sparkles",
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OraliaHeader(
                    eyebrow: "Optimized Report",
                    title: "Your personal intelligence profile.",
                    subtitle: "A unified synthesis of astrology, Human Design, numerology, timing, relationship patterns, body signals, chakras, places, strengths, shadows, and practical guidance."
                )

                if let error = loader.error {
                    ErrorBanner(message: error)
                } else if loader.isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(40)
                } else if let response = loader.value {
                    optimizedOverview(response.reports)
                    reportGrid(response.reports)
                    integrationStandard
                    SafetyFootnote()
                }
            }
            .padding()
        }
        .background(Theme.appBackground.ignoresSafeArea())
        .navigationTitle("Report")
        .toolbar {
            Button { load() } label: { Image(systemName: "arrow.clockwise") }
        }
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/natal/reports") }
    }

    @ViewBuilder
    private func optimizedOverview(_ reports: [LifeReport]) -> some View {
        SectionCard(title: "Synthesis", subtitle: "The report is designed to become one coherent read of the user, not separate mystical tabs.") {
            VStack(alignment: .leading, spacing: 10) {
                Label("Charts become patterns. Patterns become timing. Timing becomes practical guidance.", systemImage: "sparkles")
                    .font(.footnote)
                    .foregroundStyle(Theme.primary)
                Label("Every claim should show evidence, confidence, higher expression, shadow expression, and one practical use.", systemImage: "checkmark.seal")
                    .font(.footnote)
                Label("Places, timing, relationships, career, body, and spirituality should all connect back to the same personal pattern map.", systemImage: "point.3.connected.trianglepath.dotted")
                    .font(.footnote)
            }
        }

        if let first = reports.first {
            SectionCard(title: "Lead Insight", subtitle: first.title) {
                Text(first.headline)
                    .font(.system(.title3, design: .serif))
                    .foregroundStyle(Theme.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    @ViewBuilder
    private func reportGrid(_ reports: [LifeReport]) -> some View {
        LazyVStack(spacing: 12) {
            ForEach(reports) { report in
                NavigationLink {
                    ReportDetailView(report: report)
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: icons[report.category] ?? "book")
                            .foregroundStyle(Theme.champagne)
                            .frame(width: 30)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(report.title)
                                .font(.system(.headline, design: .serif))
                                .foregroundStyle(Theme.primary)
                            Text(report.headline)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(3)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(Color(.systemBackground).opacity(0.96))
                            .overlay(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .stroke(Theme.champagne.opacity(0.20), lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var integrationStandard: some View {
        SectionCard(title: "Report Standard") {
            VStack(alignment: .leading, spacing: 8) {
                ForEach([
                    "What the system says",
                    "What it means for the user",
                    "How it shows up in real life",
                    "Higher expression and shadow expression",
                    "Suggested action and confidence limits"
                ], id: \.self) { item in
                    Label(item, systemImage: "checkmark.circle")
                        .font(.caption)
                }
            }
        }
    }
}

struct ReportDetailView: View {
    let report: LifeReport

    var body: some View {
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
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                SectionCard(title: "How to Use This") {
                    ForEach(report.actions, id: \.self) { action in
                        Label(action, systemImage: "checkmark.circle")
                            .font(.footnote)
                    }
                }

                SectionCard(title: "Evidence and Confidence") {
                    ForEach(report.evidence, id: \.self) { item in
                        Text("· \(item)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Text("Interpretation is tendency-based. Calculated chart facts and personal synthesis should remain separate.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .padding(.top, 4)
                }

                SafetyFootnote()
            }
            .padding()
        }
        .background(Theme.appBackground.ignoresSafeArea())
        .navigationTitle(report.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
