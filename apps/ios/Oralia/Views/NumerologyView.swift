import SwiftUI

struct NumerologyView: View {
    @StateObject private var loader = Loadable<NumerologyResponse>()
    @State private var nameToScore = ""
    @State private var addressInput = ""
    @State private var addressLabel = "Current home"
    @StateObject private var nameLoader = Loadable<NameScoreResponse>()
    @StateObject private var launchLoader = Loadable<LaunchDatesResponse>()
    @StateObject private var addressLoader = Loadable<AddressCreateResponse>()

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 16) {
                    OraliaHeader(
                        eyebrow: "Numerology",
                        title: "Numbers, names, and addresses.",
                        subtitle: "Your core numbers explain the overall pattern. Your personal day and address number explain the daily environment."
                    )

                    if let error = loader.error { ErrorBanner(message: error) }
                    if loader.isLoading { ProgressView().padding(40) }
                    if let response = loader.value { content(response) }

                    addressCard

                    SectionCard(title: "Score a Name", subtitle: "Business, brand, or baby name") {
                        HStack {
                            TextField("Name to score", text: $nameToScore)
                                .textFieldStyle(.plain)
                                .font(.footnote)
                                .padding(12)
                                .background(RoundedRectangle(cornerRadius: 14).fill(Theme.cardFill))
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
                                    .foregroundStyle(Theme.accent)
                                VStack(alignment: .leading) {
                                    Text("Rating \(score.rating)/100\(score.isMaster ? " · Master" : "")\(score.karmicDebt ? " · Karmic debt" : "")")
                                        .font(.caption.bold())
                                    Text(score.notes).font(.caption2).foregroundStyle(Theme.secondaryText)
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
                        .tint(Theme.primary)
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
                    SafetyFootnote()
                }
                .padding()
            }
        }
        .navigationTitle("Numerology")
        .onAppear { if loader.value == nil { load() } }
    }

    private var addressCard: some View {
        SectionCard(title: "Address Vibration", subtitle: "Add a current, past, or possible address so Oralia can track place memory and daily home focus.") {
            VStack(alignment: .leading, spacing: 12) {
                TextField("Address or unit number", text: $addressInput)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Theme.cardFill))
                TextField("Label", text: $addressLabel)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 14).fill(Theme.cardFill))
                Button {
                    addressLoader.run {
                        try await APIClient.shared.post("/addresses", body: [
                            "addressInput": addressInput,
                            "label": addressLabel,
                            "locationType": "current_home"
                        ])
                    }
                } label: {
                    Label("Save Address Memory", systemImage: "house.and.flag")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.primary)
                .disabled(addressInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                if let result = addressLoader.value {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("\(result.address.addressNumber)")
                                .font(.system(size: 44, weight: .semibold, design: .serif))
                                .foregroundStyle(Theme.primary)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(result.address.bestUse ?? "Address pattern saved.")
                                    .font(.caption.bold())
                                    .foregroundStyle(Theme.primaryText)
                                Text(result.today.focus ?? "Use today to observe how this place affects your energy.")
                                    .font(.caption2)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                        }
                        if let watchOut = result.address.watchOut {
                            Text("Watch-out: \(watchOut)")
                                .font(.caption2)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                }
                if let error = addressLoader.error { ErrorBanner(message: error) }
            }
        }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/numerology") }
    }

    @ViewBuilder
    private func content(_ response: NumerologyResponse) -> some View {
        HeroOracleCard(title: "Core Number Diagram", subtitle: "Overall pattern above, daily cycle below.") {
            VStack(spacing: 10) {
                HStack(spacing: 10) {
                    numberTile("Life Path", response.core.lifePath, master: response.core.isMasterLifePath)
                    numberTile("Expression", response.core.expression)
                    numberTile("Soul Urge", response.core.soulUrge)
                    numberTile("Personality", response.core.personality)
                }
                HStack(spacing: 10) {
                    numberTile("Birthday", response.core.birthday)
                    numberTile("Maturity", response.core.maturity)
                    numberTile("Year", response.personal.personalYear)
                    numberTile("Today", response.personal.personalDay)
                }
                if let debt = response.core.lifePathKarmicDebt {
                    Text("Karmic debt \(debt) — extra lessons woven into the life path.")
                        .font(.caption2)
                        .foregroundStyle(Theme.secondaryText)
                }
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
                        .foregroundStyle(Theme.secondaryText)
                }
            }
            Text("Challenges: \(response.challenges.map(String.init).joined(separator: " · "))")
                .font(.caption2)
                .foregroundStyle(Theme.secondaryText)
        }
    }

    private func numberTile(_ label: String, _ value: Int, master: Bool = false) -> some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.system(.title2, design: .serif).bold())
                .foregroundStyle(master ? Theme.accent : Theme.primaryText)
            Text(label).font(.caption2).foregroundStyle(Theme.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 16).fill(Theme.softPanel))
    }

    private func labeled(_ label: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption.bold()).foregroundStyle(Theme.primary)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
        .padding(.vertical, 2)
    }
}