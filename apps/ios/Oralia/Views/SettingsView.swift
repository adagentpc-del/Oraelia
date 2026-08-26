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
        Form {
            Section("Appearance") {
                ThemeModePicker()
                Text("Light is the default ivory and sage Oralia design. Dark switches to the deep green version.")
                    .font(.caption2)
                    .foregroundStyle(Theme.secondaryText)
            }

            Section("Profile") {
                if let profile = profileLoader.value {
                    LabeledContent("Name", value: profile.fullName)
                    LabeledContent("Birthday", value: profile.birthday)
                    LabeledContent("Birth time", value: profile.birthTime ?? "unknown")
                    if let lat = profile.birthLatitude, let lon = profile.birthLongitude {
                        LabeledContent("Birth coordinates", value: String(format: "%.3f, %.3f", lat, lon))
                    } else {
                        Text("Add your birth city so Oralia can calculate houses, location themes, and timing more accurately.")
                            .font(.caption)
                            .foregroundStyle(Theme.secondaryText)
                    }
                } else if profileLoader.isLoading {
                    ProgressView()
                } else if let error = profileLoader.error {
                    Text(error).font(.caption).foregroundStyle(.red)
                }
                Button("Reload profile") { loadProfile() }
            }

            Section("Birth Location") {
                TextField("Birth city", text: $birthCity, prompt: Text("Saint Louis Park, Minnesota"))
                Button {
                    geocodeAndSave()
                } label: {
                    if isGeocoding { ProgressView() } else { Text("Save birth location") }
                }
                .disabled(birthCity.trimmingCharacters(in: .whitespaces).isEmpty || isGeocoding)
                if let status = geocodeStatus {
                    Text(status).font(.caption2).foregroundStyle(Theme.secondaryText)
                }
            }

            Section("Advanced") {
                Toggle("Show local connection settings", isOn: $showDeveloperConnection)
                if showDeveloperConnection {
                    TextField("Server URL", text: $apiBaseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    Text("For local testing only. This will be hidden or replaced by production configuration before App Store release.")
                        .font(.caption2)
                        .foregroundStyle(Theme.secondaryText)
                }
            }
        }
        .navigationTitle("Settings")
        .scrollContentBackground(.hidden)
        .background(Theme.appBackground)
        .tint(Theme.primary)
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
                    geocodeStatus = String(format: "Saved %.3f, %.3f. Oralia will use this for chart and place calculations.", lat, lon)
                    loadProfile()
                } catch {
                    geocodeStatus = "Save failed: \(error.localizedDescription)"
                }
            }
        }
    }
}
