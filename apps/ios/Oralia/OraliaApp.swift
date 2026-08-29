import SwiftUI

@main
struct OraliaApp: App {
    @AppStorage("oraliaOnboardingComplete") private var onboardingComplete = false
    @AppStorage("oraliaAppearance") private var appearance = "light"

    var body: some Scene {
        WindowGroup {
            RootView(onboardingComplete: $onboardingComplete)
                .tint(Theme.primary)
                .preferredColorScheme(appearance == "dark" ? .dark : .light)
        }
    }
}

struct RootView: View {
    @Binding var onboardingComplete: Bool

    var body: some View {
        Group {
            if onboardingComplete {
                MainTabs(onboardingComplete: $onboardingComplete)
            } else {
                OnboardingView(isComplete: $onboardingComplete)
            }
        }
    }
}

struct MainTabs: View {
    @Binding var onboardingComplete: Bool

    var body: some View {
        TabView {
            NavigationStack { TodayView() }
                .tabItem { Label("Today", systemImage: "sun.max") }
            NavigationStack { MemoryView() }
                .tabItem { Label("Memory", systemImage: "clock.arrow.circlepath") }
            NavigationStack { ReportsView() }
                .tabItem { Label("Report", systemImage: "book.closed") }
            NavigationStack { AstroMapView() }
                .tabItem { Label("Places", systemImage: "globe.americas") }
            NavigationStack { MoreView(onboardingComplete: $onboardingComplete) }
                .tabItem { Label("More", systemImage: "circle.grid.2x2") }
        }
    }
}

struct TimingHubView: View {
    var body: some View {
        List {
            Section("Daily, weekly, and long-range timing") {
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
            Section {
                SafetyFootnote()
            }
        }
        .navigationTitle("Timing")
        .scrollContentBackground(.hidden)
        .background(Theme.appBackground)
    }
}

struct MoreView: View {
    @Binding var onboardingComplete: Bool

    var body: some View {
        List {
            Section("Blueprint systems") {
                NavigationLink { ChartView() } label: {
                    Label("Natal Chart", systemImage: "circle.grid.cross")
                }
                NavigationLink { HumanDesignView() } label: {
                    Label("Human Design", systemImage: "person.crop.square.filled.and.at.rectangle")
                }
                NavigationLink { NumerologyView() } label: {
                    Label("Numerology", systemImage: "number.square")
                }
                NavigationLink { SynastryView() } label: {
                    Label("Relationships", systemImage: "heart.circle")
                }
            }
            Section("Timing and memory") {
                NavigationLink { TimingHubView() } label: {
                    Label("Timing", systemImage: "calendar.badge.clock")
                }
                NavigationLink { LifeEventsView() } label: {
                    Label("Life Events", systemImage: "clock.arrow.circlepath")
                }
            }
            Section("App") {
                NavigationLink { SettingsView() } label: {
                    Label("Settings", systemImage: "gearshape")
                }
                Button(role: .destructive) {
                    UserDefaults.standard.set(false, forKey: "oraliaOnboardingComplete")
                    onboardingComplete = false
                } label: {
                    Label("Reset Onboarding", systemImage: "arrow.counterclockwise")
                }
            }
        }
        .navigationTitle("Oralia")
        .scrollContentBackground(.hidden)
        .background(Theme.appBackground)
    }
}
