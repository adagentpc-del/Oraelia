import SwiftUI

@main
struct OraliaApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .tint(Theme.plum)
        }
    }
}

struct RootView: View {
    var body: some View {
        TabView {
            NavigationStack { TodayView() }
                .tabItem { Label("Today", systemImage: "sun.max") }
            NavigationStack { ChartView() }
                .tabItem { Label("Chart", systemImage: "circle.grid.cross") }
            NavigationStack { ReportsView() }
                .tabItem { Label("Reports", systemImage: "book.closed") }
            NavigationStack { AstroMapView() }
                .tabItem { Label("Places", systemImage: "globe.americas") }
            NavigationStack { MoreView() }
                .tabItem { Label("More", systemImage: "sparkles") }
        }
    }
}

struct MoreView: View {
    var body: some View {
        List {
            Section("Timing") {
                NavigationLink { ForecastView() } label: {
                    Label("Forecasts", systemImage: "calendar")
                }
                NavigationLink { TimelineView() } label: {
                    Label("10-Year Timeline", systemImage: "chart.line.uptrend.xyaxis")
                }
                NavigationLink { DecisionView() } label: {
                    Label("Decision Engine", systemImage: "scale.3d")
                }
            }
            Section("Patterns") {
                NavigationLink { LifeEventsView() } label: {
                    Label("Life Events", systemImage: "clock.arrow.circlepath")
                }
            }
            Section("Systems") {
                NavigationLink { HumanDesignView() } label: {
                    Label("Human Design", systemImage: "person.crop.square.filled.and.at.rectangle")
                }
                NavigationLink { NumerologyView() } label: {
                    Label("Numerology", systemImage: "number.square")
                }
                NavigationLink { SynastryView() } label: {
                    Label("Synastry", systemImage: "heart.circle")
                }
            }
            Section {
                NavigationLink { SettingsView() } label: {
                    Label("Settings", systemImage: "gearshape")
                }
            }
        }
        .navigationTitle("Oralia")
    }
}
