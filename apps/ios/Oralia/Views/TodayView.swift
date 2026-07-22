import SwiftUI

struct TodayView: View {
    @StateObject private var loader = Loadable<DailyForecast>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error = loader.error {
                    ErrorBanner(message: error)
                }
                if loader.isLoading {
                    ProgressView().padding(40)
                }
                if let forecast = loader.value {
                    content(forecast)
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Today")
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
        SectionCard(title: "Decision Climate", subtitle: forecast.date) {
            HStack(spacing: 14) {
                ScoreRing(label: "Overall", score: forecast.scores.overall)
                ScoreRing(label: "Decisions", score: forecast.scores.decisionScore)
                ScoreRing(label: "Energy", score: forecast.scores.emotionalEnergy)
                ScoreRing(label: "Luck", score: forecast.scores.luck)
            }
            .frame(maxWidth: .infinity)
            Text("Personal day \(forecast.personalDay)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }

        SectionCard(title: "Life Areas") {
            VStack(spacing: 8) {
                ScoreBar(label: "Career", score: forecast.scores.career)
                ScoreBar(label: "Relationships", score: forecast.scores.relationships)
                ScoreBar(label: "Money", score: forecast.scores.money)
                ScoreBar(label: "Health", score: forecast.scores.health)
                ScoreBar(label: "Communication", score: forecast.scores.communication)
                ScoreBar(label: "Creativity", score: forecast.scores.creativity)
                ScoreBar(label: "Productivity", score: forecast.scores.productivity)
            }
        }

        if !forecast.opportunities.isEmpty {
            SectionCard(title: "Opportunities") {
                ForEach(forecast.opportunities, id: \.self) { item in
                    Label(item, systemImage: "arrow.up.right.circle")
                        .font(.footnote)
                        .foregroundStyle(Theme.navy)
                }
            }
        }

        if !forecast.risks.isEmpty {
            SectionCard(title: "Watch Out For") {
                ForEach(forecast.risks, id: \.self) { item in
                    Label(item, systemImage: "exclamationmark.circle")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }

        SectionCard(title: "Recommended Actions") {
            ForEach(forecast.recommendedActions, id: \.self) { action in
                Label(action, systemImage: "checkmark.seal")
                    .font(.footnote)
            }
        }

        if !forecast.powerHours.isEmpty {
            SectionCard(title: "Power Hours") {
                ForEach(forecast.powerHours) { hour in
                    HStack(alignment: .top) {
                        Text(hour.label)
                            .font(.caption.monospacedDigit().bold())
                            .foregroundStyle(Theme.gold)
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

        if !forecast.retrogrades.isEmpty {
            SectionCard(title: "Retrograde Now") {
                ForEach(forecast.retrogrades) { retro in
                    Text("\(retro.body) ℞ in \(retro.sign)")
                        .font(.footnote)
                        .foregroundStyle(Theme.plumLight)
                }
            }
        }

        if !forecast.transits.isEmpty {
            SectionCard(title: "Active Transits") {
                ForEach(forecast.transits) { transit in
                    HStack {
                        Text("\(transit.transiting) \(transit.type) \(transit.natal)")
                            .font(.caption)
                        Spacer()
                        Text(String(format: "%.1f°", transit.orb))
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                        Circle()
                            .fill(transit.harmonyScore >= 0 ? Color.green.opacity(0.6) : Color.red.opacity(0.55))
                            .frame(width: 8, height: 8)
                    }
                }
            }
        }
    }
}
