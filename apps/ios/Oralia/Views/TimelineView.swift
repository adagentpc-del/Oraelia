import SwiftUI

struct TimelineView: View {
    @StateObject private var loader = Loadable<TimelineResponse>()

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(40) }
                if let response = loader.value {
                    if let note = response.note {
                        Text(note).font(.caption2).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    ForEach(response.timeline) { year in
                        SectionCard(
                            title: "Age \(year.age) · \(year.calendarYear)",
                            subtitle: "House \(year.profectedHouse) year in \(year.profectedSign) · lord \(year.yearLord) · progressed Moon: \(year.progressedMoonPhase)"
                        ) {
                            Text(year.theme).font(.footnote)
                            ForEach(year.cycleMarkers, id: \.self) { marker in
                                Label(marker, systemImage: "sparkle")
                                    .font(.caption)
                                    .foregroundStyle(Theme.gold)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("10-Year Timeline")
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/timing/timeline", query: ["years": "10"]) }
    }
}
