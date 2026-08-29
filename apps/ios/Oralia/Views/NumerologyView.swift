import SwiftUI

struct NumerologyView: View {
    @StateObject private var loader = Loadable<NumerologyResponse>()
    @State private var lens = ChartLens.today
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
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Numerology",
                        title: "Numbers, names, and addresses.",
                        subtitle: "Tap numbers, score addresses, and connect your daily cycle to the environment you live in."
                    )

                    if let error = loader.error { ErrorBanner(message: error) }
                    if loader.isLoading {
                        HeroOracleCard(title: "Calculating number map", subtitle: "Reading name, birthday, cycles, and address layers.") {
                            ProgressView().tint(Theme.primary).frame(maxWidth: .infinity)
                        }
                    }
                    if let response = loader.value { content(response) }
                    SafetyFootnote()
                }
                .padding(18)
            }
        }
        .navigationTitle("Numerology")
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/numerology") }
    }

    @ViewBuilder
    private func content(_ response: NumerologyResponse) -> some View {
        HeroOracleCard(title: "Core Number Diagram", subtitle: "Overall pattern above, daily cycle below.") {
            NumerologyDiagram(response: response)
                .frame(height: 290)
        }

        Picker("Lens", selection: $lens) {
            ForEach(ChartLens.allCases) { lens in Text(lens.title).tag(lens) }
        }
        .pickerStyle(.segmented)

        switch lens {
        case .today:
            SectionCard(title: "Today", subtitle: "Personal day \(response.personal.personalDay)") {
                VStack(alignment: .leading, spacing: 10) {
                    labeled("Best focus", dailyFocus(response.personal.personalDay))
                    labeled("Avoid", dailyAvoid(response.personal.personalDay))
                    labeled("Use with address", "Save your current address below so Oralia can combine today’s number with your home environment.")
                }
            }
            addressCard
        case .memory:
            SectionCard(title: "Numerology Memory") {
                VStack(alignment: .leading, spacing: 9) {
                    memoryLine("Addresses where money, visibility, rest, or conflict changed")
                    memoryLine("Name changes, brand names, launches, and relationship cycles")
                    memoryLine("Personal day/month/year patterns connected to major decisions")
                    memoryLine("Repeated numbers tied to moves, homes, trips, or clients")
                }
            }
        case .overall:
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
                        Text("Pinnacle \(pinnacle.number)").font(.caption.weight(.semibold)).foregroundStyle(Theme.primaryText)
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
        case .goDeeper:
            SectionCard(title: "Score a Name", subtitle: "Business, brand, personal, or creative identity.") {
                HStack {
                    TextField("Name to score", text: $nameToScore)
                        .textFieldStyle(.plain)
                        .font(.footnote)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.cardFill))
                    Button("Score") {
                        let name = nameToScore
                        nameLoader.run { try await APIClient.shared.post("/numerology/score-name", body: ["name": name]) }
                    }
                    .buttonStyle(.bordered)
                }
                if let score = nameLoader.value {
                    OraliaGlyphButton(kind: .numerology, title: "\(score.name): \(score.value)", subtitle: "Rating \(score.rating)/100\(score.isMaster ? " · Master" : "")\(score.karmicDebt ? " · Karmic debt" : "")") {}
                    Text(score.notes).font(.caption2).foregroundStyle(Theme.secondaryText)
                }
                if let error = nameLoader.error { ErrorBanner(message: error) }
            }

            SectionCard(title: "Launch Date Finder", subtitle: "Best dates in the next 30 days.") {
                Button {
                    launchLoader.run { try await APIClient.shared.post("/numerology/launch-dates", body: ["days": 30]) }
                } label: {
                    HStack {
                        OraliaSymbol(kind: .timing, size: 28)
                        Text("Find Launch Dates")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.primary)
                if let launch = launchLoader.value {
                    ForEach(launch.best) { day in
                        HStack {
                            Text(day.date).font(.caption.monospacedDigit())
                            Spacer()
                            Text("\(day.score)").font(.caption.weight(.semibold)).foregroundStyle(Theme.scoreColor(day.score))
                        }
                    }
                }
                if let error = launchLoader.error { ErrorBanner(message: error) }
            }
        }
    }

    private var addressCard: some View {
        SectionCard(title: "Address Vibration", subtitle: "Current, past, vacation, or possible address.") {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    OraliaSymbol(kind: .address, size: 42)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Home changes the signal.")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Theme.primaryText)
                        Text("Add addresses so Oralia can compare moves, homes, trips, and daily focus.")
                            .font(.caption2)
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
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
                    HStack {
                        OraliaSymbol(kind: .address, size: 28)
                        Text("Save Address Memory").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.primary)
                .disabled(addressInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                if let result = addressLoader.value {
                    AddressResultCard(result: result)
                }
                if let error = addressLoader.error { ErrorBanner(message: error) }
            }
        }
    }

    private func labeled(_ label: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(Theme.primary)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
        .padding(.vertical, 2)
    }

    private func memoryLine(_ text: String) -> some View {
        HStack(spacing: 10) {
            OraliaSymbol(kind: .memory, size: 24)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
    }

    private func dailyFocus(_ day: Int) -> String {
        switch day {
        case 1: return "Initiate, choose, start cleanly."
        case 2: return "Listen, connect, repair, collaborate."
        case 3: return "Speak, create, publish, lighten the room."
        case 4: return "Build, organize, schedule, stabilize."
        case 5: return "Move, market, travel, test a different path."
        case 6: return "Care, beautify, support, make the home or relationship cleaner."
        case 7: return "Research, retreat, listen inward, refine the question."
        case 8: return "Negotiate, price, lead, make power practical."
        case 9: return "Complete, release, forgive, close loops."
        default: return "Observe the pattern and choose one aligned action."
        }
    }

    private func dailyAvoid(_ day: Int) -> String {
        switch day {
        case 1: return "Waiting for permission when the signal is already clear."
        case 2: return "Forcing conflict or rushing delicate conversations."
        case 3: return "Overexplaining instead of expressing clearly."
        case 4: return "Skipping structure then blaming the timing."
        case 5: return "Chaos disguised as freedom."
        case 6: return "Rescuing people who did not ask for repair."
        case 7: return "Seeking outside validation before the insight has formed."
        case 8: return "Shrinking around money, authority, or visibility."
        case 9: return "Trying to resurrect what is clearly closing."
        default: return "Using numbers as fate instead of timing intelligence."
        }
    }
}

struct NumerologyDiagram: View {
    let response: NumerologyResponse
    @State private var reveal = false

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Circle().stroke(Theme.cardStroke, lineWidth: 1).frame(width: geo.size.width * 0.70, height: geo.size.width * 0.70)
                Circle().stroke(Theme.accent.opacity(0.22), lineWidth: 1).frame(width: geo.size.width * 0.48, height: geo.size.width * 0.48)
                numberNode("Life", response.core.lifePath, x: 0.50, y: 0.20, geo: geo, active: true)
                numberNode("Expression", response.core.expression, x: 0.24, y: 0.44, geo: geo)
                numberNode("Soul", response.core.soulUrge, x: 0.76, y: 0.44, geo: geo)
                numberNode("Personality", response.core.personality, x: 0.33, y: 0.74, geo: geo)
                numberNode("Today", response.personal.personalDay, x: 0.67, y: 0.74, geo: geo, active: true)
                OraliaSymbol(kind: .numerology, size: 54, active: true)
                    .position(x: geo.size.width * 0.50, y: geo.size.height * 0.50)
            }
            .opacity(reveal ? 1 : 0)
            .scaleEffect(reveal ? 1 : 0.96)
            .onAppear { withAnimation(.easeOut(duration: 0.7)) { reveal = true } }
        }
    }

    private func numberNode(_ label: String, _ value: Int, x: CGFloat, y: CGFloat, geo: GeometryProxy, active: Bool = false) -> some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.system(.title2, design: .serif).weight(.semibold))
                .foregroundStyle(active ? Theme.primary : Theme.primaryText)
            Text(label)
                .font(.caption2)
                .foregroundStyle(Theme.secondaryText)
        }
        .frame(width: 86, height: 64)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(active ? Theme.softPanel : Theme.cardFill.opacity(0.78)))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.cardStroke, lineWidth: 1))
        .position(x: geo.size.width * x, y: geo.size.height * y)
    }
}

struct AddressResultCard: View {
    let result: AddressCreateResponse

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(result.address.addressNumber)")
                .font(.system(size: 44, weight: .semibold, design: .serif))
                .foregroundStyle(Theme.primary)
                .frame(width: 56)
            VStack(alignment: .leading, spacing: 7) {
                Text(result.address.bestUse ?? "Address pattern saved.")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.primaryText)
                Text(result.today.focus ?? "Use today to observe how this place affects your energy.")
                    .font(.caption2)
                    .foregroundStyle(Theme.secondaryText)
                if let watchOut = result.address.watchOut {
                    Text("Watch-out: \(watchOut)")
                        .font(.caption2)
                        .foregroundStyle(Theme.secondaryText)
                }
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 18).fill(Theme.softPanel.opacity(0.72)))
    }
}
