import SwiftUI

struct OnboardingProfile: Codable {
    var birthName: String = ""
    var birthday: String = ""
    var birthTime: String = ""
    var birthLocation: String = ""
    var currentLocation: String = ""
    var primaryGoals: String = ""
    var careerContext: String = ""
    var relationshipContext: String = ""
    var guidanceTone: String = "Practical mystical"
}

struct OnboardingView: View {
    @Binding var isComplete: Bool
    @State private var profile = OnboardingProfile()
    @State private var step = 0

    private let tones = ["Practical mystical", "Direct", "Soft", "Luxury oracle", "Analytical"]

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.appBackground.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        OraliaHeader(
                            eyebrow: "Oralia setup",
                            title: "Build your personal intelligence profile.",
                            subtitle: "Enter the core details Oralia needs to synthesize astrology, Human Design, numerology, places, chakras, personality patterns, timing, and daily guidance."
                        )

                        progress

                        Group {
                            switch step {
                            case 0: identityStep
                            case 1: locationStep
                            case 2: contextStep
                            default: preferenceStep
                            }
                        }

                        HStack {
                            if step > 0 {
                                Button("Back") { step -= 1 }
                                    .buttonStyle(.bordered)
                            }
                            Spacer()
                            Button(step == 3 ? "Enter Oralia" : "Continue") {
                                if step < 3 {
                                    step += 1
                                } else {
                                    complete()
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Theme.primary)
                        }

                        SafetyFootnote()
                    }
                    .padding()
                }
            }
            .navigationTitle("Welcome")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var progress: some View {
        HStack(spacing: 8) {
            ForEach(0..<4, id: \.self) { index in
                Capsule()
                    .fill(index <= step ? Theme.primary : Theme.stone)
                    .frame(height: 5)
            }
        }
    }

    private var identityStep: some View {
        SectionCard(title: "Identity and birth data", subtitle: "This is the foundation for the optimized report.") {
            VStack(spacing: 12) {
                TextField("Birth name", text: $profile.birthName)
                    .textFieldStyle(.roundedBorder)
                TextField("Birthday, example 1989-04-26", text: $profile.birthday)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.numbersAndPunctuation)
                TextField("Birth time, example 4:20 PM", text: $profile.birthTime)
                    .textFieldStyle(.roundedBorder)
            }
        }
    }

    private var locationStep: some View {
        SectionCard(title: "Location intelligence", subtitle: "Used for houses, timing, and Places / astrocartography.") {
            VStack(spacing: 12) {
                TextField("Birth location", text: $profile.birthLocation)
                    .textFieldStyle(.roundedBorder)
                TextField("Current location", text: $profile.currentLocation)
                    .textFieldStyle(.roundedBorder)
            }
        }
    }

    private var contextStep: some View {
        SectionCard(title: "Life context", subtitle: "Oralia uses this to make the report practical instead of generic.") {
            VStack(spacing: 12) {
                TextField("Top goals right now", text: $profile.primaryGoals, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)
                TextField("Career or visibility context", text: $profile.careerContext, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)
                TextField("Relationship context", text: $profile.relationshipContext, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)
            }
        }
    }

    private var preferenceStep: some View {
        SectionCard(title: "Guidance style", subtitle: "Choose how Oralia should sound when it gives daily guidance.") {
            Picker("Tone", selection: $profile.guidanceTone) {
                ForEach(tones, id: \.self) { tone in
                    Text(tone).tag(tone)
                }
            }
            .pickerStyle(.inline)
        }
    }

    private func complete() {
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: "oraliaOnboardingProfile")
        }
        UserDefaults.standard.set(true, forKey: "oraliaOnboardingComplete")
        isComplete = true
    }
}
