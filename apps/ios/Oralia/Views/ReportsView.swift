import SwiftUI

struct ReportsView: View {
    @StateObject private var loader = Loadable<ReportsResponse>()

    private let icons: [String: String] = [
        "love": "heart.fill", "career": "briefcase.fill", "money": "dollarsign.circle.fill",
        "fame": "star.fill", "family": "house.fill", "health": "cross.case.fill",
        "spirituality": "sparkles",
    ]

    var body: some View {
        Group {
            if let error = loader.error {
                ScrollView { ErrorBanner(message: error).padding() }
            } else if loader.isLoading {
                ProgressView()
            } else if let response = loader.value {
                List(response.reports) { report in
                    NavigationLink {
                        ReportDetailView(report: report)
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: icons[report.category] ?? "book")
                                .foregroundStyle(Theme.gold)
                                .frame(width: 28)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(report.title).font(.system(.subheadline, design: .serif).bold())
                                Text(report.headline).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            } else {
                Color.clear
            }
        }
        .background(Theme.ivory)
        .navigationTitle("Life Reports")
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/natal/reports") }
    }
}

struct ReportDetailView: View {
    let report: LifeReport

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(report.headline)
                    .font(.system(.title3, design: .serif))
                    .foregroundStyle(Theme.plum)

                ForEach(report.sections) { section in
                    SectionCard(title: section.heading) {
                        Text(section.content).font(.footnote)
                    }
                }

                SectionCard(title: "Do This") {
                    ForEach(report.actions, id: \.self) { action in
                        Label(action, systemImage: "checkmark.circle").font(.footnote)
                    }
                }

                SectionCard(title: "Chart Evidence") {
                    ForEach(report.evidence, id: \.self) { item in
                        Text("· \(item)").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle(report.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
