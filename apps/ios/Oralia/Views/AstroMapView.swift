import SwiftUI
import MapKit

struct AstroMapView: View {
    @StateObject private var loader = Loadable<AstroMapResponse>()
    @State private var category = "overall"
    @State private var lens = ChartLens.today
    @State private var currentLocation = "Miami, Florida"
    @State private var travelIntent = "visibility"
    @State private var tripWindow = "next 30 days"

    private let categories = ["overall", "career", "love", "money", "creativity", "family", "health", "visibility", "spirituality", "adventure", "business"]
    private let travelIntents = ["visibility", "career", "love", "healing", "rest", "creative", "business", "spirituality", "adventure"]

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Places",
                        title: "Where your chart changes expression.",
                        subtitle: "Use current location, saved places, vacation timing, and astrocartography lines to plan where to move, visit, launch, heal, rest, date, and become visible."
                    )

                    if let error = loader.error { ErrorBanner(message: error) }
                    if loader.isLoading {
                        HeroOracleCard(title: "Drawing your place map", subtitle: "Ranking cities, relocated angles, and line influence.") {
                            ProgressView().tint(Theme.primary).frame(maxWidth: .infinity)
                        }
                    }
                    if let response = loader.value { content(response) }
                }
                .padding(18)
            }
        }
        .navigationTitle("Places")
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/astromap") }
    }

    private func score(_ city: CityScore) -> Int {
        switch category {
        case "career": return city.scores.career
        case "love": return city.scores.love
        case "money": return city.scores.money
        case "creativity": return city.scores.creativity
        case "family": return city.scores.family
        case "health": return city.scores.health
        case "visibility": return city.scores.visibility
        case "spirituality": return city.scores.spirituality
        case "adventure": return city.scores.adventure
        case "business": return city.scores.business
        default: return city.scores.overall
        }
    }

    @ViewBuilder
    private func content(_ response: AstroMapResponse) -> some View {
        let ranked = response.cities.sorted { score($0) > score($1) }
        let current = bestMatch(for: currentLocation, in: response.cities) ?? ranked.first

        HeroOracleCard(title: "Current Location", subtitle: currentLocation) {
            if let current {
                VStack(alignment: .leading, spacing: 12) {
                    PlacesMiniMap(cities: Array(ranked.prefix(18)), categoryScore: score)
                        .frame(height: 260)
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                    Text(current.summary)
                        .font(.footnote)
                        .foregroundStyle(Theme.primaryText)
                    HStack(spacing: 10) {
                        ScoreRing(label: "Overall", score: current.scores.overall)
                        ScoreRing(label: "Career", score: current.scores.career)
                        ScoreRing(label: "Love", score: current.scores.love)
                        ScoreRing(label: "Visibility", score: current.scores.visibility)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }

        Picker("Lens", selection: $lens) {
            ForEach(ChartLens.allCases) { lens in
                Text(lens.title).tag(lens)
            }
        }
        .pickerStyle(.segmented)

        switch lens {
        case .today:
            SectionCard(title: "Best Use Here Today", subtitle: current?.city ?? currentLocation) {
                VStack(alignment: .leading, spacing: 10) {
                    if let current {
                        locationUseLine("Do", bestUseForTopScore(current))
                        locationUseLine("Avoid", "Using the city against its signal. If the score is low for rest, do not expect recovery from constant stimulation.")
                        locationUseLine("Focus", "Use today's timing with this place's strongest categories: \(topCategories(current).joined(separator: ", ")).")
                    }
                }
            }
        case .memory:
            SectionCard(title: "Place Memory", subtitle: "Track how locations actually affect your life.") {
                VStack(alignment: .leading, spacing: 9) {
                    memoryRow("Moves and addresses")
                    memoryRow("Vacations and retreats")
                    memoryRow("Cities where visibility increased")
                    memoryRow("Places tied to relationships, money, health, and creativity")
                    memoryRow("Where your nervous system got louder or calmer")
                }
            }
        case .overall:
            SectionCard(title: "Overall Location Pattern") {
                if let current {
                    ScoreBar(label: "Career", score: current.scores.career)
                    ScoreBar(label: "Love", score: current.scores.love)
                    ScoreBar(label: "Money", score: current.scores.money)
                    ScoreBar(label: "Creativity", score: current.scores.creativity)
                    ScoreBar(label: "Health", score: current.scores.health)
                    ScoreBar(label: "Visibility", score: current.scores.visibility)
                    ScoreBar(label: "Spirituality", score: current.scores.spirituality)
                }
            }
        case .goDeeper:
            SectionCard(title: "Vacation and Timing Planner", subtitle: "Pick an intention and compare cities.") {
                VStack(alignment: .leading, spacing: 12) {
                    Picker("Trip purpose", selection: $travelIntent) {
                        ForEach(travelIntents, id: \.self) { Text($0.capitalized).tag($0) }
                    }
                    .pickerStyle(.menu)
                    TextField("Timing window", text: $tripWindow)
                        .textFieldStyle(.roundedBorder)
                    ForEach(ranked.prefix(6)) { city in
                        NavigationLink {
                            CityDetailView(city: city, purpose: travelIntent)
                        } label: {
                            OraliaPlaceRow(city: city, score: score(city), purpose: travelIntent)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }

        Picker("Rank by", selection: $category) {
            ForEach(categories, id: \.self) { Text($0.capitalized) }
        }
        .pickerStyle(.menu)

        SectionCard(title: "Best Places for \(category.capitalized)") {
            VStack(spacing: 10) {
                ForEach(ranked.prefix(12)) { city in
                    NavigationLink {
                        CityDetailView(city: city, purpose: category)
                    } label: {
                        OraliaPlaceRow(city: city, score: score(city), purpose: category)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func bestMatch(for text: String, in cities: [CityScore]) -> CityScore? {
        let lower = text.lowercased()
        return cities.first { lower.contains($0.city.lowercased()) || lower.contains($0.country.lowercased()) }
    }

    private func topCategories(_ city: CityScore) -> [String] {
        [
            ("career", city.scores.career), ("love", city.scores.love), ("money", city.scores.money),
            ("creativity", city.scores.creativity), ("health", city.scores.health), ("visibility", city.scores.visibility),
            ("spirituality", city.scores.spirituality), ("business", city.scores.business)
        ].sorted { $0.1 > $1.1 }.prefix(3).map { $0.0 }
    }

    private func bestUseForTopScore(_ city: CityScore) -> String {
        let top = topCategories(city).first ?? "overall"
        switch top {
        case "career": return "Use this place for work structure, authority, presentations, and long-term positioning."
        case "love": return "Use this place for connection, softness, beauty, dates, repair, and relational clarity."
        case "money": return "Use this place for pricing, financial decisions, negotiation, and grounded opportunity."
        case "creativity": return "Use this place for writing, design, storytelling, visual identity, and inspired output."
        case "health": return "Use this place for restoration, body routines, grounding, and nervous-system repair."
        case "visibility": return "Use this place for being seen, performing, posting, speaking, pitching, and claiming space."
        case "spirituality": return "Use this place for retreat, ritual, intuition, pattern recognition, and meaning-making."
        default: return "Use this place where its top scores support the life area you are actively working on."
        }
    }

    private func locationUseLine(_ label: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(Theme.primary)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
    }

    private func memoryRow(_ text: String) -> some View {
        HStack(spacing: 10) {
            OraliaSymbol(kind: .memory, size: 24)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
    }
}

struct PlacesMiniMap: View {
    let cities: [CityScore]
    let categoryScore: (CityScore) -> Int

    var body: some View {
        Map {
            ForEach(cities) { city in
                Annotation(city.city, coordinate: CLLocationCoordinate2D(latitude: city.latitude, longitude: city.longitude)) {
                    ZStack {
                        Circle().fill(Theme.scoreColor(categoryScore(city)).opacity(0.28)).frame(width: 28, height: 28)
                        Circle().fill(Theme.scoreColor(categoryScore(city))).frame(width: 9, height: 9)
                        Circle().stroke(Theme.cream, lineWidth: 1.3).frame(width: 12, height: 12)
                    }
                }
            }
        }
        .mapStyle(.standard(elevation: .flat, pointsOfInterest: .excludingAll))
    }
}

struct OraliaPlaceRow: View {
    let city: CityScore
    let score: Int
    let purpose: String

    var body: some View {
        HStack(spacing: 12) {
            OraliaSymbol(kind: .places, size: 38, active: score >= 75)
            VStack(alignment: .leading, spacing: 4) {
                Text("\(city.city), \(city.country)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.primaryText)
                Text("\(purpose.capitalized): \(score)/100 · ASC \(city.relocatedAscendant) · MC \(city.relocatedMidheaven)")
                    .font(.caption2)
                    .foregroundStyle(Theme.secondaryText)
            }
            Spacer()
            Text("\(score)")
                .font(.system(.headline, design: .serif).weight(.semibold))
                .foregroundStyle(Theme.scoreColor(score))
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Theme.softPanel.opacity(0.68)))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.cardStroke, lineWidth: 1))
    }
}

struct CityDetailView: View {
    let city: CityScore
    var purpose: String = "overall"
    @State private var lens = ChartLens.today

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    HeroOracleCard(title: "\(city.city), \(city.country)", subtitle: city.summary) {
                        HStack(spacing: 10) {
                            ScoreRing(label: "Overall", score: city.scores.overall)
                            ScoreRing(label: "Career", score: city.scores.career)
                            ScoreRing(label: "Love", score: city.scores.love)
                            ScoreRing(label: "Visibility", score: city.scores.visibility)
                        }
                    }

                    Picker("Lens", selection: $lens) {
                        ForEach(ChartLens.allCases) { lens in Text(lens.title).tag(lens) }
                    }
                    .pickerStyle(.segmented)

                    switch lens {
                    case .today:
                        SectionCard(title: "Use This Place Today", subtitle: purpose.capitalized) {
                            Text("Use this city for \(purpose) when the day also supports that life area. If today's timing is low, use the place for planning rather than action.")
                                .font(.footnote)
                                .foregroundStyle(Theme.primaryText)
                        }
                    case .memory:
                        SectionCard(title: "Memory to Compare") {
                            Text("Log trips, dates, launches, health shifts, revenue moments, and relationship changes tied to this city. Oralia can compare them against place lines and daily timing.")
                                .font(.footnote)
                                .foregroundStyle(Theme.primaryText)
                        }
                    case .overall:
                        SectionCard(title: "Location Scores") {
                            ScoreBar(label: "Overall", score: city.scores.overall)
                            ScoreBar(label: "Career", score: city.scores.career)
                            ScoreBar(label: "Love", score: city.scores.love)
                            ScoreBar(label: "Money", score: city.scores.money)
                            ScoreBar(label: "Creativity", score: city.scores.creativity)
                            ScoreBar(label: "Family", score: city.scores.family)
                            ScoreBar(label: "Health", score: city.scores.health)
                            ScoreBar(label: "Visibility", score: city.scores.visibility)
                            ScoreBar(label: "Spirituality", score: city.scores.spirituality)
                            ScoreBar(label: "Adventure", score: city.scores.adventure)
                            ScoreBar(label: "Business", score: city.scores.business)
                        }
                    case .goDeeper:
                        if !city.influences.isEmpty {
                            SectionCard(title: "Planetary Lines Here") {
                                VStack(spacing: 10) {
                                    ForEach(city.influences) { line in
                                        OraliaGlyphButton(kind: .transit, title: "\(line.body) \(line.kind)", subtitle: "\(String(format: "%.1f", line.orb))° orb · \(line.strength)% strength") {}
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(18)
            }
        }
        .navigationTitle(city.city)
        .navigationBarTitleDisplayMode(.inline)
    }
}
