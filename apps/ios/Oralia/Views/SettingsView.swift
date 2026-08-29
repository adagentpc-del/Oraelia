import SwiftUI
import CoreLocation

struct SettingsView: View {
    @AppStorage("apiBaseURL") private var apiBaseURL = "http://localhost:5000"
    @StateObject private var profileLoader = Loadable<UserProfile>()
    @State private var birthCity = ""
    @State private var geocodeStatus: String?
    @State private var isGeocoding = false
    @State private var showDeveloperConnection = false

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Preferences",
                        title: "Tune your Oralia experience.",
                        subtitle: "Control appearance, profile accuracy, and birth-location intelligence without exposing developer details."
                    )

                    ThemeShowcaseCard()
                    profileCard
                    birthLocationCard
                    advancedCard
                    SafetyFootnote()
                }
                .padding(18)
            }
        }
        .navigationTitle("Settings")
        .tint(Theme.primary)
        .onAppear { if profileLoader.value == nil { loadProfile() } }
    }

    private var profileCard: some View {
        SectionCard(title: "Profile", subtitle: "These details ground your report, guide, timing, and Places calculations.") {
            VStack(alignment: .leading, spacing: 12) {
                if let profile = profileLoader.value {
                    profileRow("Name", profile.fullName)
                    profileRow("Birthday", profile.birthday)
                    profileRow("Birth time", profile.birthTime ?? "unknown")
                    if let lat = profile.birthLatitude, let lon = profile.birthLongitude {
                        profileRow("Birth coordinates", String(format: "%.3f, %.3f", lat, lon))
                    } else {
                        Text("Add your birth city so Oralia can calculate houses, location themes, and timing with better accuracy.")
                            .font(.caption)
                            .foregroundStyle(Theme.secondaryText)
                    }
                } else if profileLoader.isLoading {
                    HStack {
                        ProgressView().tint(Theme.primary)
                        Text("Loading profile")
                            .font(.caption)
                            .foregroundStyle(Theme.secondaryText)
                    }
                } else if let error = profileLoader.error {
                    Text(error).font(.caption).foregroundStyle(.red)
                }

                Button { loadProfile() } label: {
                    Label("Refresh profile", systemImage: "arrow.clockwise")
                        .font(.footnote.weight(.semibold))
                }
                .buttonStyle(.bordered)
                .tint(Theme.primary)
            }
        }
    }

    private func profileRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(1.0)
                .foregroundStyle(Theme.secondaryText)
                .frame(width: 118, alignment: .leading)
            Text(value)
                .font(.footnote)
                .foregroundStyle(Theme.primaryText)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
    }

    private var birthLocationCard: some View {
        SectionCard(title: "Birth Location", subtitle: "Used for houses, timing accuracy, and place strategy.") {
            VStack(alignment: .leading, spacing: 12) {
                TextField("Saint Louis Park, Minnesota", text: $birthCity)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.words)

                Button {
                    geocodeAndSave()
                } label: {
                    HStack {
                        if isGeocoding { ProgressView().tint(Theme.primary) }
                        Text(isGeocoding ? "Saving location" : "Save birth location")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.primary)
                .disabled(birthCity.trimmingCharacters(in: .whitespaces).isEmpty || isGeocoding)

                if let status = geocodeStatus {
                    Text(status)
                        .font(.caption2)
                        .foregroundStyle(Theme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var advancedCard: some View {
        SectionCard(title: "Advanced", subtitle: "Local connection settings stay hidden during normal use.") {
            VStack(alignment: .leading, spacing: 12) {
                Toggle("Show local connection settings", isOn: $showDeveloperConnection)
                    .tint(Theme.primary)

                if showDeveloperConnection {
                    VStack(alignment: .leading, spacing: 8) {
                        TextField("Server URL", text: $apiBaseURL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.URL)
                            .textFieldStyle(.roundedBorder)
                        Text("For local testing only. Production should provide this configuration without showing source-code or GitHub references to users.")
                            .font(.caption2)
                            .foregroundStyle(Theme.secondaryText)
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
            .animation(.easeInOut(duration: 0.22), value: showDeveloperConnection)
        }
    }

    private func loadProfile() {
        profileLoader.run { try await APIClient.shared.get("/profile") }
    }

    private func geocodeAndSave() {
        isGeocoding = true
        geocodeStatus = nil
        let geocoder = CLGeocoder()
        geocoder.geocodeAddressString(birthCity) { placemarks, error in
            Task { @MainActor in
                defer { isGeocoding = false }
                guard let placemark = placemarks?.first,
                      let location = placemark.location else {
                    geocodeStatus = "Could not find that city\(error != nil ? " (\(error!.localizedDescription))" : "")."
                    return
                }
                let lat = location.coordinate.latitude
                let lon = location.coordinate.longitude
                let offsetSeconds = placemark.timeZone?.secondsFromGMT() ?? 0
                let utcOffset = Double(offsetSeconds) / 3600.0
                do {
                    let _: UserProfile = try await APIClient.shared.put(
                        "/profile/birth-location",
                        body: ["latitude": lat, "longitude": lon, "utcOffset": utcOffset]
                    )
                    geocodeStatus = String(format: "Saved %.3f, %.3f. Oralia will use this for chart and place calculations.", lat, lon)
                    loadProfile()
                } catch {
                    geocodeStatus = "Save failed: \(error.localizedDescription)"
                }
            }
        }
    }
}
