import SwiftUI

struct TodayView: View {
    @StateObject private var loader = Loadable<DailyForecast>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                OraliaHeader(
                    eyebrow: "Daily Guide",
                    title: "Your energetic plan for today.",
                    subtitle: "A practical synthesis of timing, numerology, transits, life areas, and your current decision climate."
                )

                if let error = loader.error {
                    ErrorBanner(message: error)
                }
                if loader.isLoading {
                    ProgressView().padding(40)
                }
                if let forecast = loader.value {
                    content(forecast)
                }
                SafetyFootnote()
            }
            .padding()
        }
        .background(Theme.appBackground.ignoresSafeArea())
        .navigationTitle("Guide")
        .toolbar {
            Button {
                load()
            } label: {
                Image(systemName: "arrow.clockwise")
            }
        }
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/forecast/daily") }
    }

    @ViewBuilder
    private func content(_ forecast: DailyForecast) -> some View {
        SectionCard(title: "Today’s Theme", subtitle: forecast.date) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 14) {
                    ScoreRing(label: "Overall", score: forecast.scores.overall)
                    ScoreRing(label: "Decisions", score: forecast.scores.decisionScore)
                    ScoreRing(label: "Energy", score: forecast.scores.emotionalEnergy)
                    ScoreRing(label: "Luck", score: forecast.scores.luck)
                }
                .frame(maxWidth: .infinity)

                Text("Personal day \(forecast.personalDay): use today as a practical calibration point. Let the strongest categories guide where you place your attention, and let the lower scores tell you where to simplify.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }

        let bestUse = topCategories(from: forecast.scores).joined(separator: ", ")
        SignalCard(
            title: "Best Use of Today",
            value: bestUse.isEmpty ? "Choose one focused action and keep the day simple." : "Prioritize \(bestUse). These areas have the cleanest signal today.",
            footnote: "This is a timing signal, not a guarantee.",
            symbol: "arrow.up.right.circle"
        )

        if !forecast.avoid.isEmpty || !forecast.risks.isEmpty {
            SectionCard(title: "Avoid Today") {
                let avoidItems = forecast.avoid.isEmpty ? forecast.risks : forecast.avoid
                ForEach(avoidItems.prefix(4), id: \.self) { item in
                    Label(item, systemImage: "minus.circle")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }

        SectionCard(title: "Career, Visibility, Money") {
            VStack(spacing: 8) {
                ScoreBar(label: "Career", score: forecast.scores.career)
                ScoreBar(label: "Visibility / Luck", score: forecast.scores.luck)
                ScoreBar(label: "Money", score: forecast.scores.money)
                ScoreBar(label: "Productivity", score: forecast.scores.productivity)
            }
        }

        SectionCard(title: "Relationship, Body, Creativity") {
            VStack(spacing: 8) {
                ScoreBar(label: "Relationships", score: forecast.scores.relationships)
                ScoreBar(label: "Health / Body", score: forecast.scores.health)
                ScoreBar(label: "Communication", score: forecast.scores.communication)
                ScoreBar(label: "Creativity", score: forecast.scores.creativity)
            }
        }

        if !forecast.opportunities.isEmpty {
            SectionCard(title: "Opportunities") {
                ForEach(forecast.opportunities.prefix(4), id: \.self) { item in
                    Label(item, systemImage: "sparkles")
                        .font(.footnote)
                        .foregroundStyle(Theme.primary)
                }
            }
        }

        SectionCard(title: "One Practical Action") {
            if let first = forecast.recommendedActions.first {
                Label(first, systemImage: "checkmark.seal")
                    .font(.footnote)
            } else {
                Label("Choose one task that moves your most important goal forward, then stop before you dilute your energy.", systemImage: "checkmark.seal")
                    .font(.footnote)
            }
        }

        SignalCard(
            title: "Journal Prompt",
            value: "Where am I trying to force timing, and where is there already a cleaner opening?",
            symbol: "pencil.and.scribble"
        )

        SignalCard(
            title: "Ritual or Reset",
            value: "Take three minutes to name one intention, one boundary, and one thing you are willing to release today.",
            symbol: "moon.stars"
        )

        if !forecast.powerHours.isEmpty {
            SectionCard(title: "Power Hours") {
                ForEach(forecast.powerHours.prefix(5)) { hour in
                    HStack(alignment: .top) {
                        Text(hour.label)
                            .font(.caption.monospacedDigit().bold())
                            .foregroundStyle(Theme.champagne)
                            .frame(width: 92, alignment: .leading)
                        VStack(alignment: .leading) {
                            Text("\(hour.ruler) hour").font(.caption.bold())
                            Text(hour.good).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }

        if !forecast.transits.isEmpty || !forecast.retrogrades.isEmpty {
            SectionCard(title: "Moon, Transit, and Retrograde Notes") {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(forecast.transits.prefix(5)) { transit in
                        HStack {
                            Text("\(transit.transiting) \(transit.type) \(transit.natal)")
                                .font(.caption)
                            Spacer()
                            Text(String(format: "%.1f°", transit.orb))
                                .font(.caption2.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
                    }
                    ForEach(forecast.retrogrades.filter { $0.retrograde }.prefix(4)) { retro in
                        Text("\(retro.body) retrograde in \(retro.sign)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func topCategories(from scores: CategoryScores) -> [String] {
        [
            ("career", scores.career),
            ("relationships", scores.relationships),
            ("money", scores.money),
            ("communication", scores.communication),
            ("creativity", scores.creativity),
            ("productivity", scores.productivity)
        ]
        .sorted { $0.1 > $1.1 }
        .prefix(3)
        .map { $0.0 }
    }
}
