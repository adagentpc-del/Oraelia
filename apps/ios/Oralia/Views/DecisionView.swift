import SwiftUI

struct DecisionView: View {
    @State private var question = ""
    @State private var category = "other"
    @StateObject private var loader = Loadable<DecisionResponse>()

    private let categories: [(String, String)] = [
        ("move", "Move"), ("start-company", "Start a company"), ("marry", "Marry"),
        ("leave-job", "Leave my job"), ("hire", "Hire someone"), ("launch", "Launch something"),
        ("invest", "Invest"), ("travel", "Travel"), ("surgery", "Schedule surgery"),
        ("buy-home", "Buy a home"), ("sell-company", "Sell my company"),
        ("date-person", "Date this person"), ("accept-offer", "Accept an offer"), ("other", "Something else"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SectionCard(title: "Should I…?", subtitle: "Evaluated against your natal chart, transits, profections and numerology") {
                    TextField("Describe the decision", text: $question, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)
                        .font(.footnote)
                    Picker("Category", selection: $category) {
                        ForEach(categories, id: \.0) { key, label in
                            Text(label).tag(key)
                        }
                    }
                    Button {
                        evaluate()
                    } label: {
                        Label("Evaluate", systemImage: "scale.3d")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(question.trimmingCharacters(in: .whitespaces).isEmpty)
                }

                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(30) }
                if let response = loader.value { results(response.evaluation) }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Decision Engine")
    }

    private func evaluate() {
        let q = question
        let c = category
        loader.run {
            try await APIClient.shared.post("/decision", body: ["question": q, "category": c])
        }
    }

    @ViewBuilder
    private func results(_ evaluation: DecisionEvaluation) -> some View {
        SectionCard(title: recommendationLabel(evaluation.recommendation)) {
            HStack(spacing: 14) {
                ScoreRing(label: "Opportunity", score: evaluation.opportunityScore)
                ScoreRing(label: "Risk", score: evaluation.riskScore)
                ScoreRing(label: "Confidence", score: evaluation.confidence)
            }
            .frame(maxWidth: .infinity)
        }

        SectionCard(title: "Why") {
            ForEach(evaluation.factors) { factor in
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(factor.factor).font(.caption.bold())
                        Spacer()
                        Text(factor.impact >= 0 ? "+\(factor.impact)" : "\(factor.impact)")
                            .font(.caption.monospacedDigit().bold())
                            .foregroundStyle(factor.impact >= 0 ? Color(red: 0.27, green: 0.51, blue: 0.32) : Color(red: 0.65, green: 0.25, blue: 0.22))
                    }
                    Text(factor.explanation).font(.caption2).foregroundStyle(.secondary)
                }
                .padding(.vertical, 3)
            }
        }

        if !evaluation.bestWindows.isEmpty {
            SectionCard(title: "Better Windows Ahead") {
                ForEach(evaluation.bestWindows) { window in
                    HStack {
                        Text(window.date).font(.caption.monospacedDigit().bold())
                        Spacer()
                        Text("\(window.score)").font(.caption.bold()).foregroundStyle(Theme.scoreColor(window.score))
                    }
                    Text(window.reason).font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
    }

    private func recommendationLabel(_ recommendation: String) -> String {
        switch recommendation {
        case "proceed": return "✓ Proceed"
        case "proceed-with-care": return "Proceed with care"
        case "wait": return "Wait for a better window"
        default: return "Avoid for now"
        }
    }
}
