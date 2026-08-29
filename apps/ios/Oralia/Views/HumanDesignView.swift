import SwiftUI

struct HumanDesignView: View {
    @StateObject private var loader = Loadable<HumanDesignResponse>()
    @State private var lens = ChartLens.today
    @State private var selectedCenter: HDCenterNode?
    @State private var selectedChannel: HDChannel?

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Human Design",
                        title: "Your decision architecture.",
                        subtitle: "Tap the bodygraph centers and channels to understand how your energy is meant to move."
                    )

                    if let error = loader.error { ErrorBanner(message: error) }
                    if loader.isLoading {
                        HeroOracleCard(title: "Drawing bodygraph", subtitle: "Building type, authority, centers, and channels.") {
                            ProgressView().tint(Theme.primary).frame(maxWidth: .infinity)
                        }
                    }
                    if let response = loader.value {
                        if let note = response.note { ErrorBanner(message: note) }
                        content(response.design)
                    }
                }
                .padding(18)
            }
        }
        .navigationTitle("Human Design")
        .sheet(item: $selectedCenter) { center in
            HumanDesignCenterDetail(center: center)
                .presentationDetents([.medium, .large])
        }
        .sheet(item: $selectedChannel) { channel in
            HumanDesignChannelDetail(channel: channel)
                .presentationDetents([.medium])
        }
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/human-design") }
    }

    @ViewBuilder
    private func content(_ design: HumanDesign) -> some View {
        HeroOracleCard(
            title: "\(design.type) · \(design.authority)",
            subtitle: "Profile \(design.profile) — \(design.profileName) · \(design.definition)"
        ) {
            HumanDesignBodygraph(
                design: design,
                onCenterTap: { selectedCenter = $0 },
                onChannelTap: { selectedChannel = $0 }
            )
            .frame(height: 430)
        }

        Picker("Lens", selection: $lens) {
            ForEach(ChartLens.allCases) { lens in
                Text(lens.title).tag(lens)
            }
        }
        .pickerStyle(.segmented)

        switch lens {
        case .today:
            SectionCard(title: "Today", subtitle: "How to use this design right now.") {
                VStack(alignment: .leading, spacing: 10) {
                    labeled("Strategy", "Use \(design.strategy.lowercased()) as the filter before forcing momentum.")
                    labeled("Authority", design.authorityGuidance)
                    labeled("Watch for", "When \(design.notSelfTheme.lowercased()) rises, pause before you say yes, launch, text, spend, or commit.")
                }
            }
        case .memory:
            SectionCard(title: "Memory", subtitle: "What Oralia should track against your design.") {
                VStack(alignment: .leading, spacing: 9) {
                    memoryLine("Invitations accepted too quickly")
                    memoryLine("Decisions that felt clean in the body")
                    memoryLine("Environments where your energy became clearer")
                    memoryLine("People who drain or amplify recognition")
                }
            }
        case .overall:
            SectionCard(title: "Overall Pattern") {
                labeled("Signature", design.signature)
                labeled("Not-self theme", design.notSelfTheme)
                labeled("Incarnation Cross", design.incarnationCross)
                labeled("Environment", design.environment)
            }
        case .goDeeper:
            SectionCard(title: "Go Deeper", subtitle: "Tap any center or channel in the bodygraph above.") {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(design.channels) { channel in
                        OraliaGlyphButton(kind: .humanDesign, title: channel.gates.map(String.init).joined(separator: "–"), subtitle: "Channel of \(channel.name)") {
                            selectedChannel = channel
                        }
                    }
                    if design.channels.isEmpty {
                        Text("No defined channels returned yet. Centers are still tappable for education and memory tracking.")
                            .font(.caption)
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
            }
        }
    }

    private func labeled(_ label: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(Theme.primary)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
        .padding(.vertical, 3)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func memoryLine(_ text: String) -> some View {
        HStack(spacing: 10) {
            OraliaSymbol(kind: .memory, size: 24)
            Text(text).font(.caption).foregroundStyle(Theme.primaryText)
        }
    }
}

enum ChartLens: String, CaseIterable, Identifiable {
    case today
    case memory
    case overall
    case goDeeper

    var id: String { rawValue }
    var title: String {
        switch self {
        case .today: return "Today"
        case .memory: return "Memory"
        case .overall: return "Overall"
        case .goDeeper: return "Deeper"
        }
    }
}

struct HDCenterNode: Identifiable {
    let id: String
    let label: String
    let point: CGPoint
    let kind: CenterShape
    let defined: Bool

    enum CenterShape {
        case triangleUp, triangleDown, square, diamond
    }
}

struct HumanDesignBodygraph: View {
    let design: HumanDesign
    let onCenterTap: (HDCenterNode) -> Void
    let onChannelTap: (HDChannel) -> Void
    @State private var reveal = false

    private var centers: [HDCenterNode] {
        let defined = Set(design.definedCenters.map { $0.lowercased() })
        func isDefined(_ names: String...) -> Bool {
            names.contains { defined.contains($0.lowercased()) }
        }
        return [
            HDCenterNode(id: "head", label: "Head", point: CGPoint(x: 0.50, y: 0.08), kind: .triangleDown, defined: isDefined("head")),
            HDCenterNode(id: "ajna", label: "Ajna", point: CGPoint(x: 0.50, y: 0.19), kind: .triangleDown, defined: isDefined("ajna")),
            HDCenterNode(id: "throat", label: "Throat", point: CGPoint(x: 0.50, y: 0.33), kind: .square, defined: isDefined("throat")),
            HDCenterNode(id: "g", label: "G", point: CGPoint(x: 0.50, y: 0.49), kind: .diamond, defined: isDefined("g", "identity", "self")),
            HDCenterNode(id: "heart", label: "Heart", point: CGPoint(x: 0.70, y: 0.52), kind: .triangleUp, defined: isDefined("heart", "ego", "will")),
            HDCenterNode(id: "spleen", label: "Spleen", point: CGPoint(x: 0.30, y: 0.58), kind: .triangleUp, defined: isDefined("spleen", "splenic")),
            HDCenterNode(id: "solar", label: "Solar", point: CGPoint(x: 0.72, y: 0.68), kind: .triangleDown, defined: isDefined("solar plexus", "emotional")),
            HDCenterNode(id: "sacral", label: "Sacral", point: CGPoint(x: 0.50, y: 0.70), kind: .square, defined: isDefined("sacral")),
            HDCenterNode(id: "root", label: "Root", point: CGPoint(x: 0.50, y: 0.88), kind: .square, defined: isDefined("root")),
        ]
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(channelLines(in: geo.size), id: \.0) { item in
                    Path { path in
                        path.move(to: item.1)
                        path.addLine(to: item.2)
                    }
                    .stroke(Theme.cardStroke, lineWidth: 2)
                }

                ForEach(Array(design.channels.enumerated()), id: \.element.id) { index, channel in
                    Button {
                        onChannelTap(channel)
                    } label: {
                        Capsule()
                            .fill(Theme.primary.opacity(0.18))
                            .overlay(Capsule().stroke(Theme.primary.opacity(0.45), lineWidth: 1))
                            .frame(width: 58, height: 16)
                            .overlay(Text(channel.gates.map(String.init).joined(separator: "·")).font(.caption2.monospacedDigit()).foregroundStyle(Theme.primaryText))
                    }
                    .buttonStyle(.plain)
                    .position(x: geo.size.width * (index.isMultiple(of: 2) ? 0.32 : 0.68), y: geo.size.height * (0.40 + CGFloat(index % 4) * 0.09))
                }

                ForEach(centers) { center in
                    Button {
                        onCenterTap(center)
                    } label: {
                        CenterShapeView(node: center)
                            .frame(width: center.id == "g" ? 58 : 52, height: center.id == "g" ? 58 : 52)
                            .overlay(Text(center.label.prefix(1)).font(.caption.weight(.semibold)).foregroundStyle(center.defined ? Theme.cream : Theme.primaryText))
                    }
                    .buttonStyle(.plain)
                    .position(x: geo.size.width * center.point.x, y: geo.size.height * center.point.y)
                }
            }
            .opacity(reveal ? 1 : 0)
            .scaleEffect(reveal ? 1 : 0.96)
            .onAppear { withAnimation(.easeOut(duration: 0.7)) { reveal = true } }
        }
        .padding(.vertical, 8)
    }

    private func channelLines(in size: CGSize) -> [(String, CGPoint, CGPoint)] {
        let map = Dictionary(uniqueKeysWithValues: centers.map { ($0.id, CGPoint(x: size.width * $0.point.x, y: size.height * $0.point.y)) })
        let pairs: [(String, String, String)] = [
            ("head-ajna", "head", "ajna"), ("ajna-throat", "ajna", "throat"), ("throat-g", "throat", "g"),
            ("g-sacral", "g", "sacral"), ("sacral-root", "sacral", "root"), ("throat-heart", "throat", "heart"),
            ("heart-g", "heart", "g"), ("spleen-g", "spleen", "g"), ("spleen-sacral", "spleen", "sacral"),
            ("solar-sacral", "solar", "sacral"), ("solar-throat", "solar", "throat")
        ]
        return pairs.compactMap { id, a, b in
            guard let pa = map[a], let pb = map[b] else { return nil }
            return (id, pa, pb)
        }
    }
}

struct CenterShapeView: View {
    let node: HDCenterNode

    var body: some View {
        Group {
            switch node.kind {
            case .triangleUp:
                Triangle(up: true)
            case .triangleDown:
                Triangle(up: false)
            case .square:
                RoundedRectangle(cornerRadius: 10, style: .continuous)
            case .diamond:
                RoundedRectangle(cornerRadius: 10, style: .continuous).rotation(.degrees(45))
            }
        }
        .fill(node.defined ? Theme.primary : Theme.cardFill)
        .overlay(
            Group {
                switch node.kind {
                case .triangleUp:
                    Triangle(up: true).stroke(Theme.cardStroke, lineWidth: 1)
                case .triangleDown:
                    Triangle(up: false).stroke(Theme.cardStroke, lineWidth: 1)
                case .square:
                    RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(Theme.cardStroke, lineWidth: 1)
                case .diamond:
                    RoundedRectangle(cornerRadius: 10, style: .continuous).rotation(.degrees(45)).stroke(Theme.cardStroke, lineWidth: 1)
                }
            }
        )
        .shadow(color: Theme.emerald.opacity(node.defined ? 0.12 : 0.04), radius: 10, y: 5)
    }
}

struct Triangle: Shape {
    let up: Bool
    func path(in rect: CGRect) -> Path {
        var p = Path()
        if up {
            p.move(to: CGPoint(x: rect.midX, y: rect.minY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        } else {
            p.move(to: CGPoint(x: rect.minX, y: rect.minY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            p.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        }
        p.closeSubpath()
        return p
    }
}

struct HumanDesignCenterDetail: View {
    let center: HDCenterNode

    var body: some View {
        ZStack {
            CelestialBackground()
            VStack(alignment: .leading, spacing: 16) {
                OraliaHeader(eyebrow: "Center", title: center.label, subtitle: center.defined ? "Defined: consistent energy you broadcast." : "Open: variable energy you sample and learn through.")
                SectionCard(title: "How to use this") {
                    Text(center.defined ? "Track where this energy helps you become more recognizable, stable, and clear." : "Track where you amplify other people and confuse their energy for your own.")
                        .font(.footnote)
                        .foregroundStyle(Theme.primaryText)
                }
                Spacer()
            }
            .padding(18)
        }
    }
}

struct HumanDesignChannelDetail: View {
    let channel: HDChannel

    var body: some View {
        ZStack {
            CelestialBackground()
            VStack(alignment: .leading, spacing: 16) {
                OraliaHeader(eyebrow: "Channel", title: channel.gates.map(String.init).joined(separator: "–"), subtitle: "Channel of \(channel.name)")
                SectionCard(title: "Memory to watch") {
                    Text("Log moments when this channel feels recognized, rejected, pressured, or unusually clean. Oralia can compare those moments against timing cycles later.")
                        .font(.footnote)
                        .foregroundStyle(Theme.primaryText)
                }
                Spacer()
            }
            .padding(18)
        }
    }
}
