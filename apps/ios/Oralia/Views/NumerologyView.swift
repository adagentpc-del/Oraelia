import SwiftUI

struct NumerologyView: View {
    @StateObject private var loader = Loadable<NumerologyResponse>()
    @State private var nameToScore = ""
    @StateObject private var nameLoader = Loadable<NameScoreResponse>()
    @StateObject private var launchLoader = Loadable<LaunchDatesResponse>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(40) }
                if let response = loader.value { content(response) }

                SectionCard(title: "Score a Name", subtitle: "Business, brand, or baby name") {
                    HStack {
                        TextField("Name to score", text: $nameToScore)
                            .textFieldStyle(.roundedBorder)
                            .font(.footnote)
                        Button("Score") {
                            let name = nameToScore
                            nameLoader.run {
                                try await APIClient.shared.post("/numerology/score-name", body: ["name": name])
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                    if let score = nameLoader.value {
                        HStack {
                            Text("\(score.value)")
                                .font(.system(.title, design: .serif).bold())
                                .foregroundStyle(Theme.gold)
                            VStack(alignment: .leading) {
                                Text("Rating \(score.rating)/100\(score.isMaster ? " · Master" : "")\(score.karmicDebt ? " · Karmic debt" : "")")
                                    .font(.caption.bold())
                                Text(score.notes).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    }
                    if let error = nameLoader.error { ErrorBanner(message: error) }
                }

                SectionCard(title: "Launch Date Finder", subtitle: "Best dates in the next 30 days") {
                    Button {
                        launchLoader.run {
                            try await APIClient.shared.post("/numerology/launch-dates", body: ["days": 30])
                        }
                    } label: {
                        Label("Find Launch Dates", systemImage: "calendar.badge.clock")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    if let launch = launchLoader.value {
                        ForEach(launch.best) { day in
                            HStack {
                                Text(day.date).font(.caption.monospacedDigit())
                                Spacer()
                                Text("\(day.score)").font(.caption.bold()).foregroundStyle(Theme.scoreColor(day.score))
                            }
                        }
                    }
                    if let error = launchLoader.error { ErrorBanner(message: error) }
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Numerology")
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/numerology") }
    }

    @ViewBuilder
    private func content(_ response: NumerologyResponse) -> some View {
        SectionCard(title: "Core Numbers") {
            HStack(spacing: 10) {
                numberTile("Life Path", response.core.lifePath, master: response.core.isMasterLifePath)
                numberTile("Expression", response.core.expression)
                numberTile("Soul Urge", response.core.soulUrge)
                numberTile("Personality", response.core.personality)
            }
            .frame(maxWidth: .infinity)
            HStack(spacing: 10) {
                numberTile("Birthday", response.core.birthday)
                numberTile("Maturity", response.core.maturity)
                numberTile("Year", response.personal.personalYear)
                numberTile("Today", response.personal.personalDay)
            }
            .frame(maxWidth: .infinity)
            if let debt = response.core.lifePathKarmicDebt {
                Text("Karmic debt \(debt) — extra lessons woven into the life path.")
                    .font(.caption2)
                    .foregroundStyle(Theme.plumLight)
            }
        }

        if let meaning = response.meanings["lifePath"] {
            SectionCard(title: "Life Path \(response.core.lifePath): \(meaning.title)") {
                labeled("Strengths", meaning.strengths)
                labeled("Shadow", meaning.shadow)
                labeled("Career", meaning.career)
            }
        }
        if let meaning = response.meanings["expression"] {
            SectionCard(title: "Expression \(response.core.expression): \(meaning.title)") {
                labeled("Strengths", meaning.strengths)
                labeled("Career", meaning.career)
            }
        }

        SectionCard(title: "Pinnacles & Challenges") {
            ForEach(response.pinnacles) { pinnacle in
                HStack {
                    Text("Pinnacle \(pinnacle.number)").font(.caption.bold())
                    Spacer()
                    Text(pinnacle.toAge != nil ? "age \(pinnacle.fromAge)–\(pinnacle.toAge!)" : "age \(pinnacle.fromAge)+")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            Text("Challenges: \(response.challenges.map(String.init).joined(separator: " · "))")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func numberTile(_ label: String, _ value: Int, master: Bool = false) -> some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.system(.title2, design: .serif).bold())
                .foregroundStyle(master ? Theme.gold : Theme.navy)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func labeled(_ label: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption.bold()).foregroundStyle(Theme.plum)
            Text(text).font(.caption)
        }
        .padding(.vertical, 2)
    }
}
