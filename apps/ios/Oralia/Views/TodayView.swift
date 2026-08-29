import SwiftUI

struct TodayView: View {
    @StateObject private var loader = Loadable<DailyForecast>()
    @State private var appeared = false
    @State private var latestBrainDump: BrainDumpResponse?

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Today",
                        title: "What is your signal today?",
                        subtitle: "Oralia combines timing, chart intelligence, memory, goals, and what is actually happening in your life."
                    )
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 12)

                    BrainDumpCard(latest: $latestBrainDump)

                    if let latestBrainDump {
                        SectionCard(title: "Memory Updated", subtitle: latestBrainDump.extraction.lifeArea.capitalized) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(latestBrainDump.todayAdjustment)
                                    .font(.footnote)
                                    .foregroundStyle(Theme.primaryText)
                                Text("Saved as: \(latestBrainDump.memory.title)")
                                    .font(.caption2)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                        }
                    }

                    if let error = loader.error {
                        ErrorBanner(message: error)
                    }
                    if loader.isLoading {
                        HeroOracleCard(title: "Reading today’s signal", subtitle: "Oralia is preparing your daily guide.") {
                            ProgressView()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.vertical, 18)
                        }
                    }
                    if let forecast = loader.value {
                        content(forecast)
                    }
                    SafetyFootnote()
                }
                .padding()
            }
        }
        .navigationTitle("Today")
        .toolbar {
            Button {
                load()
            } label: {
                Image(systemName: "arrow.clockwise")
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.45)) {
                appeared = true
            }
            if loader.value == nil { load() }
        }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/forecast/daily") }
    }

    @ViewBuilder
    private func content(_ forecast: DailyForecast) -> some View {
        HeroOracleCard(
            title: "Today’s Timing",
            subtitle: "Personal day \(forecast.personalDay) • \(forecast.date)"
        ) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 14) {
                    ScoreRing(label: "Overall", score: forecast.scores.overall)
                    ScoreRing(label: "Decisions", score: forecast.scores.decisionScore)
                    ScoreRing(label: "Energy", score: forecast.scores.emotionalEnergy)
                    ScoreRing(label: "Luck", score: forecast.scores.luck)
                }
                .frame(maxWidth: .infinity)

                Text("Let the strongest categories guide where you place attention. Let the lower scores tell you where to simplify, not where to panic.")
                    .font(.footnote)
                    .foregroundStyle(Theme.secondaryText)
            }
        }

        let bestUse = topCategories(from: forecast.scores).joined(separator: ", ")
        SignalCard(
            title: "Best Use of Today",
            value: bestUse.isEmpty ? "Choose one focused action and keep the day simple." : "Prioritize \(bestUse). These areas have the cleanest signal today.",
            footnote: "This is a timing signal, not a guarantee.",
            symbol: "arrow.up.right.circle"
        )

        if !forecast.powerHours.isEmpty {
            SectionCard(title: "Power Hours", subtitle: "Save these as in-app reminders once notification scheduling is wired.") {
                VStack(alignment: .leading, spacing: 9) {
                    ForEach(forecast.powerHours.prefix(5)) { hour in
                        PowerHourRow(hour: hour)
                    }
                }
            }
        }

        if !forecast.avoid.isEmpty || !forecast.risks.isEmpty {
            SectionCard(title: "Avoid Today") {
                let avoidItems = forecast.avoid.isEmpty ? forecast.risks : forecast.avoid
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(avoidItems.prefix(4), id: \.self) { item in
                        Label(item, systemImage: "minus.circle")
                            .font(.footnote)
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
            }
        }

        SectionCard(title: "Career, Visibility, Money") {
            VStack(spacing: 10) {
                ScoreBar(label: "Career", score: forecast.scores.career)
                ScoreBar(label: "Visibility / Luck", score: forecast.scores.luck)
                ScoreBar(label: "Money", score: forecast.scores.money)
                ScoreBar(label: "Productivity", score: forecast.scores.productivity)
            }
        }

        SectionCard(title: "Relationship, Body, Creativity") {
            VStack(spacing: 10) {
                ScoreBar(label: "Relationships", score: forecast.scores.relationships)
                ScoreBar(label: "Health / Body", score: forecast.scores.health)
                ScoreBar(label: "Communication", score: forecast.scores.communication)
                ScoreBar(label: "Creativity", score: forecast.scores.creativity)
            }
        }

        if !forecast.opportunities.isEmpty {
            SectionCard(title: "Openings") {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(forecast.opportunities.prefix(4), id: \.self) { item in
                        Label(item, systemImage: "sparkles")
                            .font(.footnote)
                            .foregroundStyle(Theme.primary)
                    }
                }
            }
        }

        SectionCard(title: "One Practical Action") {
            if let first = forecast.recommendedActions.first {
                Label(first, systemImage: "checkmark.seal")
                    .font(.footnote)
                    .foregroundStyle(Theme.primaryText)
            } else {
                Label("Choose one task that moves your most important goal forward, then stop before you dilute your energy.", systemImage: "checkmark.seal")
                    .font(.footnote)
                    .foregroundStyle(Theme.primaryText)
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

        if !forecast.transits.isEmpty || !forecast.retrogrades.isEmpty {
            SectionCard(title: "Transit Notes") {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(forecast.transits.prefix(5)) { transit in
                        HStack {
                            Text("\(transit.transiting) \(transit.type) \(transit.natal)")
                                .font(.caption)
                                .foregroundStyle(Theme.primaryText)
                            Spacer()
                            Text(String(format: "%.1f°", transit.orb))
                                .font(.caption2.monospacedDigit())
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                    ForEach(forecast.retrogrades.filter { $0.retrograde }.prefix(4)) { retro in
                        Text("\(retro.body) retrograde in \(retro.sign)")
                            .font(.caption)
                            .foregroundStyle(Theme.secondaryText)
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

struct BrainDumpCard: View {
    @Binding var latest: BrainDumpResponse?
    @State private var text = ""
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        HeroOracleCard(
            title: "Brain Dump",
            subtitle: "What is going on today? How are you feeling? What changed? What are you working on?"
        ) {
            VStack(alignment: .leading, spacing: 12) {
                TextField("Talk to Oralia like a private life log…", text: $text, axis: .vertical)
                    .lineLimit(4...8)
                    .textFieldStyle(.plain)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(Theme.cardFill)
                            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Theme.cardStroke, lineWidth: 1))
                    )
                HStack {
                    Button {
                        save()
                    } label: {
                        Label(saving ? "Saving…" : "Save to Memory", systemImage: "waveform")
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.primary)
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).count < 4 || saving)
                    Spacer()
                    Text("Voice transcript next")
                        .font(.caption2)
                        .foregroundStyle(Theme.secondaryText)
                }
                if let error {
                    ErrorBanner(message: error)
                }
            }
        }
    }

    private func save() {
        saving = true
        error = nil
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        let body: [String: Any] = [
            "rawText": text,
            "inputMode": "text",
            "date": formatter.string(from: Date())
        ]
        Task { @MainActor in
            do {
                let response: BrainDumpResponse = try await APIClient.shared.post("/memory/brain-dump", body: body)
                latest = response
                text = ""
            } catch {
                self.error = error.localizedDescription
            }
            saving = false
        }
    }
}

struct PowerHourRow: View {
    let hour: PowerHour

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(hour.label)
                    .font(.caption.monospacedDigit().bold())
                    .foregroundStyle(Theme.accent)
                Text("\(hour.ruler) hour")
                    .font(.caption2)
                    .foregroundStyle(Theme.secondaryText)
            }
            .frame(width: 96, alignment: .leading)
            Text(hour.good)
                .font(.caption)
                .foregroundStyle(Theme.primaryText)
            Spacer()
            Button {
                // Notification scheduling comes after local notification permission wiring.
            } label: {
                Image(systemName: "bell.badge")
            }
            .buttonStyle(.plain)
            .foregroundStyle(Theme.primary)
        }
    }
}