import SwiftUI
import CoreLocation

struct SettingsView: View {
    @AppStorage("apiBaseURL") private var apiBaseURL = "http://localhost:5000"
    @StateObject private var profileLoader = Loadable<UserProfile>()
    @State private var birthCity = ""
    @State private var geocodeStatus: String?
    @State private var isGeocoding = false

    var body: some View {
        Form {
            Section("API Server") {
                TextField("Base URL", text: $apiBaseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                Text("Point this at your Oralia API deployment. Connections are configured server-side.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Section("Profile") {
                if let profile = profileLoader.value {
                    LabeledContent("Name", value: profile.fullName)
                    LabeledContent("Birthday", value: profile.birthday)
                    LabeledContent("Birth time", value: profile.birthTime ?? "unknown")
                    if let lat = profile.birthLatitude, let lon = profile.birthLongitude {
                        LabeledContent("Birth coordinates", value: String(format: "%.3f, %.3f", lat, lon))
                    } else {
                        Text("No birth coordinates set — houses computed for a default location.")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                } else if profileLoader.isLoading {
                    ProgressView()
                } else if let error = profileLoader.error {
                    Text(error).font(.caption).foregroundStyle(.red)
                }
                Button("Reload profile") { loadProfile() }
            }

            Section("Birth Location") {
                TextField("Birth city (e.g. Chicago, USA)", text: $birthCity)
                Button {
                    geocodeAndSave()
                } label: {
                    if isGeocoding { ProgressView() } else { Text("Look up & save coordinates") }
                }
                .disabled(birthCity.trimmingCharacters(in: .whitespaces).isEmpty || isGeocoding)
                if let status = geocodeStatus {
                    Text(status).font(.caption2).foregroundStyle(.secondary)
                }
            }

            Section {
                Link("Oralia API on GitHub", destination: URL(string: "https://github.com/adagentpc-del/Oraelia")!)
            }
        }
        .navigationTitle("Settings")
        .onAppear { if profileLoader.value == nil { loadProfile() } }
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
                    geocodeStatus = String(format: "Saved %.3f, %.3f (UTC%+.1f). Charts now use this location.", lat, lon, utcOffset)
                    loadProfile()
                } catch {
                    geocodeStatus = "Save failed: \(error.localizedDescription)"
                }
            }
        }
    }
}
