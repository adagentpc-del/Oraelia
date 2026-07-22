import SwiftUI

struct SynastryView: View {
    @State private var birthDate = Date(timeIntervalSince1970: 662_688_000) // 1991-01-01
    @State private var birthTime = ""
    @State private var utcOffset = "-5"
    @StateObject private var loader = Loadable<SynastryResponse>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard(title: "Partner Birth Data") {
                    DatePicker("Birth date", selection: $birthDate, displayedComponents: .date)
                        .font(.footnote)
                    HStack {
                        TextField("Birth time (HH:MM, optional)", text: $birthTime)
                            .textFieldStyle(.roundedBorder)
                            .font(.footnote)
                        TextField("UTC offset", text: $utcOffset)
                            .textFieldStyle(.roundedBorder)
                            .font(.footnote)
                            .frame(width: 90)
                    }
                    Button {
                        compare()
                    } label: {
                        Label("Compare Charts", systemImage: "heart.text.square")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }

                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(30) }
                if let response = loader.value { results(response.synastry) }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Synastry")
    }

    private func compare() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        var body: [String: Any] = [
            "date": formatter.string(from: birthDate),
            "utcOffset": Double(utcOffset) ?? -5,
        ]
        if !birthTime.isEmpty { body["time"] = birthTime }
        loader.run { try await APIClient.shared.post("/synastry", body: body) }
    }

    @ViewBuilder
    private func results(_ synastry: SynastryData) -> some View {
        SectionCard(title: "Compatibility") {
            HStack(spacing: 14) {
                ScoreRing(label: "Overall", score: synastry.scores.overall)
                ScoreRing(label: "Chemistry", score: synastry.scores.chemistry)
                ScoreRing(label: "Stability", score: synastry.scores.longTermStability)
                ScoreRing(label: "Conflict", score: synastry.scores.conflictRisk)
            }
            .frame(maxWidth: .infinity)
        }
        SectionCard(title: "Dimensions") {
            ScoreBar(label: "Emotional bond", score: synastry.scores.emotional)
            ScoreBar(label: "Communication", score: synastry.scores.communication)
            ScoreBar(label: "Passion", score: synastry.scores.passion)
            ScoreBar(label: "Friendship", score: synastry.scores.friendship)
            ScoreBar(label: "Shared purpose", score: synastry.scores.sharedPurpose)
            ScoreBar(label: "Business", score: synastry.scores.business)
            ScoreBar(label: "Growth", score: synastry.scores.growth)
        }
        if !synastry.greenFlags.isEmpty {
            SectionCard(title: "Green Flags") {
                ForEach(synastry.greenFlags, id: \.self) { flag in
                    Label(flag, systemImage: "checkmark.circle.fill")
                        .font(.footnote)
                        .foregroundStyle(Color(red: 0.27, green: 0.51, blue: 0.32))
                }
            }
        }
        if !synastry.redFlags.isEmpty {
            SectionCard(title: "Red Flags") {
                ForEach(synastry.redFlags, id: \.self) { flag in
                    Label(flag, systemImage: "flag.fill")
                        .font(.footnote)
                        .foregroundStyle(Color(red: 0.65, green: 0.25, blue: 0.22))
                }
            }
        }
        if !synastry.keyContacts.isEmpty {
            SectionCard(title: "Key Contacts", subtitle: "Davison date: \(synastry.davisonDate)") {
                ForEach(synastry.keyContacts, id: \.self) { contact in
                    Text("· \(contact)").font(.caption)
                }
            }
        }
    }
}
