import SwiftUI

struct HumanDesignView: View {
    @StateObject private var loader = Loadable<HumanDesignResponse>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(40) }
                if let response = loader.value {
                    if let note = response.note { ErrorBanner(message: note) }
                    content(response.design)
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Human Design")
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/human-design") }
    }

    @ViewBuilder
    private func content(_ design: HumanDesign) -> some View {
        SectionCard(title: design.type, subtitle: "Profile \(design.profile) — \(design.profileName) · \(design.definition)") {
            labeled("Strategy", design.strategy)
            labeled("Authority (\(design.authority))", design.authorityGuidance)
            labeled("Not-self theme", design.notSelfTheme)
            labeled("Signature", design.signature)
        }

        SectionCard(title: "Centers") {
            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Defined").font(.caption.bold()).foregroundStyle(Theme.gold)
                    ForEach(design.definedCenters, id: \.self) { Text($0).font(.caption) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Open").font(.caption.bold()).foregroundStyle(.secondary)
                    ForEach(design.undefinedCenters, id: \.self) { Text($0).font(.caption).foregroundStyle(.secondary) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }

        if !design.channels.isEmpty {
            SectionCard(title: "Channels") {
                ForEach(design.channels) { channel in
                    HStack {
                        Text(channel.gates.map(String.init).joined(separator: "–"))
                            .font(.caption.monospacedDigit().bold())
                            .foregroundStyle(Theme.gold)
                            .frame(width: 56, alignment: .leading)
                        Text("Channel of \(channel.name)").font(.caption)
                    }
                    .padding(.vertical, 2)
                }
            }
        }

        SectionCard(title: "Variables & Environment") {
            labeled("Incarnation Cross", design.incarnationCross)
            labeled("Digestion", design.digestion)
            labeled("Environment", design.environment)
            labeled("Motivation", design.motivation)
            labeled("Perspective", design.perspective)
        }
    }

    private func labeled(_ label: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption.bold()).foregroundStyle(Theme.plum)
            Text(text).font(.caption)
        }
        .padding(.vertical, 3)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
