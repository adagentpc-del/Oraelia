import SwiftUI
import MapKit

struct AstroMapView: View {
    @StateObject private var loader = Loadable<AstroMapResponse>()
    @State private var category = "overall"

    private let categories = ["overall", "career", "love", "money", "creativity", "family", "health", "visibility", "spirituality", "adventure", "business"]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(40) }
                if let response = loader.value { content(response) }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Astrocartography")
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

        SectionCard(title: "World Map") {
            Map {
                ForEach(ranked.prefix(20)) { city in
                    Annotation(city.city, coordinate: CLLocationCoordinate2D(latitude: city.latitude, longitude: city.longitude)) {
                        Circle()
                            .fill(Theme.scoreColor(score(city)))
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(.white, lineWidth: 1.5))
                    }
                }
            }
            .frame(height: 260)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }

        Picker("Category", selection: $category) {
            ForEach(categories, id: \.self) { Text($0.capitalized) }
        }
        .pickerStyle(.menu)

        SectionCard(title: "Best Places for \(category.capitalized)") {
            ForEach(ranked.prefix(12)) { city in
                NavigationLink {
                    CityDetailView(city: city)
                } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(city.city).font(.subheadline.bold()).foregroundStyle(Theme.navy)
                            Text(city.country).font(.caption2).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(score(city))")
                            .font(.headline.monospacedDigit())
                            .foregroundStyle(Theme.scoreColor(score(city)))
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

struct CityDetailView: View {
    let city: CityScore

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard(title: "\(city.city), \(city.country)", subtitle: city.summary) {
                    Text("Relocated Ascendant: \(city.relocatedAscendant) · Midheaven: \(city.relocatedMidheaven)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                SectionCard(title: "Scores") {
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

                if !city.influences.isEmpty {
                    SectionCard(title: "Planetary Lines Here") {
                        ForEach(city.influences) { line in
                            HStack {
                                Text("\(line.body) \(line.kind)").font(.caption.bold())
                                Spacer()
                                Text("\(String(format: "%.1f", line.orb))° orb · \(line.strength)%")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle(city.city)
        .navigationBarTitleDisplayMode(.inline)
    }
}
