import SwiftUI

struct ChartView: View {
    @StateObject private var loader = Loadable<ChartResponse>()
    @State private var lens = "Today"
    @State private var selectedBody: PlacedBody?
    private let lenses = ["Today", "Memory", "Overall", "Go Deeper"]

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Natal Blueprint",
                        title: "Your chart first, then the meaning.",
                        subtitle: "Tap any glyph in the wheel. Today, Memory, Overall, and Go Deeper explain the same chart from different angles."
                    )

                    if let error = loader.error { ErrorBanner(message: error) }
                    if loader.isLoading {
                        HeroOracleCard(title: "Drawing your chart", subtitle: "Building houses, placements, angles, and pattern signals.") {
                            ProgressView().tint(Theme.primary).frame(maxWidth: .infinity)
                        }
                    }
                    if let response = loader.value {
                        content(response.chart, approximate: response.approximateLocation ?? false)
                    }
                }
                .padding(18)
            }
        }
        .navigationTitle("Natal Chart")
        .sheet(item: $selectedBody) { body in
            NatalGlyphDetail(body: body)
                .presentationDetents([.medium, .large])
        }
        .onAppear { if loader.value == nil { load() } }
        .toolbar { Button { load() } label: { OraliaSymbol(kind: .timing, size: 24) } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/natal/chart") }
    }

    @ViewBuilder
    private func content(_ chart: NatalChart, approximate: Bool) -> some View {
        if approximate {
            ErrorBanner(message: "Birth location approximate. Set exact coordinates in Settings for more precise houses.")
        }

        SectionCard(title: "Natal Wheel", subtitle: "Every planet glyph in the diagram is tappable.") {
            TappableChartWheel(chart: chart) { body in
                selectedBody = body
            }
            .frame(height: 340)
        }

        Picker("Chart lens", selection: $lens) {
            ForEach(lenses, id: \.self) { item in Text(item).tag(item) }
        }
        .pickerStyle(.segmented)

        switch lens {
        case "Memory": memoryLens(chart)
        case "Overall": overallLens(chart)
        case "Go Deeper": goDeeperLens(chart)
        default: todayLens(chart)
        }
    }

    @ViewBuilder
    private func todayLens(_ chart: NatalChart) -> some View {
        HeroOracleCard(
            title: "Today through the chart",
            subtitle: "\(chart.sunSign) Sun · \(chart.moonSign) Moon · \(chart.ascendantSign) Rising"
        ) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    bigThree("Sun", chart.sunSign, .natal)
                    bigThree("Moon", chart.moonSign, .timing)
                    bigThree("Rising", chart.ascendantSign, .location)
                }
                Text("Use the chart as the permanent blueprint, then let Today and Memory decide which pieces matter right now.")
                    .font(.footnote)
                    .foregroundStyle(Theme.secondaryText)
            }
        }

        SectionCard(title: "Today’s Chart Use") {
            VStack(alignment: .leading, spacing: 10) {
                OraliaGlyphButton(kind: .natal, title: "Chart ruler", subtitle: "Lead with \(chart.chartRuler) as the strongest operating signal today.") {}
                OraliaGlyphButton(kind: .timing, title: "Moon phase", subtitle: "Track emotional tone through the \(chart.moonPhase.name) phase.") {}
                OraliaGlyphButton(kind: .memory, title: "Pattern signal", subtitle: "Use dominant planets as recurring memory tags.") {}
            }
        }
    }

    @ViewBuilder
    private func memoryLens(_ chart: NatalChart) -> some View {
        SectionCard(title: "Memory Cross-Reference") {
            VStack(alignment: .leading, spacing: 10) {
                Text("Logged memories should be compared against this chart: profection year, houses, angles, transits, repeated planets, moves, relationships, launches, losses, and body events.")
                    .font(.footnote)
                    .foregroundStyle(Theme.primaryText)
                OraliaGlyphButton(kind: .memory, title: "What to log", subtitle: "Moves, launches, relationship starts/ends, body events, money swings, public visibility, and major decisions.") {}
            }
        }

        if !chart.patterns.isEmpty {
            SectionCard(title: "Patterns to Watch in Memory") {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(chart.patterns) { pattern in
                        OraliaGlyphButton(kind: .transit, title: pattern.type, subtitle: pattern.bodies.joined(separator: " · ")) {}
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func overallLens(_ chart: NatalChart) -> some View {
        HeroOracleCard(
            title: "\(chart.sunSign) Sun · \(chart.moonSign) Moon · \(chart.ascendantSign) Rising",
            subtitle: "\(chart.isDayChart ? "Day" : "Night") chart · ruled by \(chart.chartRuler) · \(chart.moonPhase.name)"
        ) {
            HStack(spacing: 12) {
                bigThree("Sun", chart.sunSign, .natal)
                bigThree("Moon", chart.moonSign, .timing)
                bigThree("Rising", chart.ascendantSign, .location)
            }
        }

        SectionCard(title: "Element & Modality Balance") {
            VStack(spacing: 12) {
                HStack(spacing: 8) {
                    ForEach(["Fire", "Earth", "Air", "Water"], id: \.self) { element in
                        balanceTile(label: element, value: chart.balance.elements[element] ?? 0, active: chart.balance.dominantElement == element)
                    }
                }
                HStack(spacing: 8) {
                    ForEach(["Cardinal", "Fixed", "Mutable"], id: \.self) { modality in
                        balanceTile(label: modality, value: chart.balance.modalities[modality] ?? 0, active: chart.balance.dominantModality == modality)
                    }
                }
            }
        }

        SectionCard(title: "Strongest Planets") {
            VStack(spacing: 8) {
                ForEach(chart.dominantPlanets) { planet in
                    ScoreBar(label: planet.body, score: planet.score)
                }
            }
        }
    }

    @ViewBuilder
    private func goDeeperLens(_ chart: NatalChart) -> some View {
        SectionCard(title: "Placements") {
            VStack(spacing: 8) {
                ForEach(chart.bodies) { body in
                    Button { selectedBody = body } label: {
                        HStack(spacing: 12) {
                            PlanetGlyph(body: body.body, retrograde: body.retrograde, size: 34)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(body.body).font(.caption.weight(.semibold)).foregroundStyle(Theme.primaryText)
                                Text("\(body.formatted) · House \(body.house) · \(body.dignity)").font(.caption2).foregroundStyle(Theme.secondaryText)
                            }
                            Spacer()
                            Text("\(body.strength)").font(.caption.weight(.semibold)).foregroundStyle(Theme.scoreColor(body.strength))
                        }
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 18).fill(Theme.softPanel.opacity(0.68)))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.cardStroke, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }

        SectionCard(title: "Major Aspects") {
            VStack(spacing: 8) {
                ForEach(chart.aspects.filter { $0.major }.prefix(14).map { $0 }) { aspect in
                    NavigationLink {
                        ChartFactorDetailView(title: "\(aspect.a) \(aspect.type) \(aspect.b)", subtitle: String(format: "Orb %.1f°", aspect.orb), detail: "This aspect should explain the general meaning, your specific expression, memory examples, timing activations, shadow expression, and practical use.")
                    } label: {
                        OraliaGlyphButton(kind: .transit, title: "\(aspect.a) \(aspect.type) \(aspect.b)", subtitle: String(format: "%.1f° orb", aspect.orb)) {}
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func bigThree(_ label: String, _ sign: String, _ kind: OraliaSymbolKind) -> some View {
        VStack(spacing: 7) {
            OraliaSymbol(kind: kind, size: 42, active: true)
            Text(sign).font(.system(.subheadline, design: .serif).weight(.semibold)).foregroundStyle(Theme.primaryText)
            Text(label).font(.caption2).foregroundStyle(Theme.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }

    private func balanceTile(label: String, value: Int, active: Bool) -> some View {
        VStack(spacing: 4) {
            Text("\(value)").font(.title3.weight(.semibold)).foregroundStyle(active ? Theme.primary : Theme.secondaryText)
            Text(label).font(.caption2).foregroundStyle(Theme.secondaryText).lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(active ? Theme.softPanel : Theme.cardFill.opacity(0.55)).overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.cardStroke, lineWidth: 1)))
    }
}

struct TappableChartWheel: View {
    let chart: NatalChart
    let onBodyTap: (PlacedBody) -> Void
    @State private var reveal: CGFloat = 0
    @State private var breathe = false

    private static let signGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) / 2 - 12
            let ascendant = chart.houses.angles.ascendant

            ZStack {
                Canvas { context, canvasSize in
                    let center = CGPoint(x: canvasSize.width / 2, y: canvasSize.height / 2)
                    let radius = min(canvasSize.width, canvasSize.height) / 2 - 12
                    let innerRing = radius * 0.82

                    func point(longitude: Double, r: CGFloat) -> CGPoint {
                        let angle = (180 + (longitude - ascendant)) * .pi / 180
                        return CGPoint(x: center.x + r * cos(-angle), y: center.y + r * sin(-angle))
                    }

                    context.stroke(Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)), with: .color(Theme.primary.opacity(0.78)), lineWidth: 1.6)
                    context.stroke(Path(ellipseIn: CGRect(x: center.x - innerRing, y: center.y - innerRing, width: innerRing * 2, height: innerRing * 2)), with: .color(Theme.cardStroke.opacity(0.92)), lineWidth: 1)
                    context.stroke(Path(ellipseIn: CGRect(x: center.x - radius * 0.22, y: center.y - radius * 0.22, width: radius * 0.44, height: radius * 0.44)), with: .color(Theme.cardStroke.opacity(0.7)), lineWidth: 1)

                    for signIndex in 0..<12 {
                        let lon = Double(signIndex) * 30
                        var path = Path()
                        path.move(to: point(longitude: lon, r: innerRing))
                        path.addLine(to: point(longitude: lon, r: radius))
                        context.stroke(path, with: .color(Theme.cardStroke.opacity(0.72)), lineWidth: 0.8)
                        context.draw(Text(Self.signGlyphs[signIndex]).font(.system(size: 14)).foregroundStyle(Theme.accent), at: point(longitude: lon + 15, r: (radius + innerRing) / 2))
                    }

                    let hub = radius * 0.2
                    for (index, cusp) in chart.houses.cusps.enumerated() {
                        var path = Path()
                        path.move(to: point(longitude: cusp, r: hub))
                        path.addLine(to: point(longitude: cusp, r: innerRing))
                        let isAngle = index == 0 || index == 3 || index == 6 || index == 9
                        context.stroke(path, with: .color(Theme.primary.opacity(isAngle ? 0.68 : 0.22)), lineWidth: isAngle ? 1.5 : 0.7)
                    }

                    context.draw(Text("ASC").font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.primary), at: point(longitude: ascendant, r: radius * 0.12))
                }

                ForEach(chart.bodies) { body in
                    Button { onBodyTap(body) } label: {
                        PlanetGlyph(body: body.body, retrograde: body.retrograde, size: 34)
                    }
                    .buttonStyle(.plain)
                    .position(point(longitude: body.longitude, r: radius * 0.65, center: center, ascendant: ascendant))
                }
            }
            .opacity(reveal)
            .scaleEffect(0.96 + reveal * 0.04)
            .rotationEffect(.degrees(breathe ? 0.35 : -0.35))
            .onAppear {
                withAnimation(.easeOut(duration: 0.85)) { reveal = 1 }
                withAnimation(.easeInOut(duration: 4.8).repeatForever(autoreverses: true)) { breathe = true }
            }
        }
    }

    private func point(longitude: Double, r: CGFloat, center: CGPoint, ascendant: Double) -> CGPoint {
        let angle = (180 + (longitude - ascendant)) * .pi / 180
        return CGPoint(x: center.x + r * cos(-angle), y: center.y + r * sin(-angle))
    }
}

struct PlanetGlyph: View {
    let body: String
    let retrograde: Bool
    var size: CGFloat = 32

    private var glyph: String {
        ["Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇", "Chiron": "⚷", "NorthNode": "☊", "SouthNode": "☋", "Lilith": "⚸"][body] ?? "•"
    }

    var body: some View {
        ZStack {
            Circle().fill(Theme.cardFill.opacity(0.92))
            Circle().stroke(retrograde ? Theme.warmTaupe.opacity(0.75) : Theme.cardStroke, lineWidth: 1)
            Text(glyph)
                .font(.system(size: size * 0.48, weight: .regular, design: .serif))
                .foregroundStyle(retrograde ? Theme.warmTaupe : Theme.primaryText)
        }
        .frame(width: size, height: size)
        .shadow(color: Theme.emerald.opacity(0.08), radius: 8, y: 3)
        .accessibilityLabel("\(body) glyph")
    }
}

struct NatalGlyphDetail: View {
    let body: PlacedBody

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 16) {
                    HeroOracleCard(title: body.body, subtitle: "\(body.formatted) · House \(body.house)") {
                        HStack(spacing: 14) {
                            PlanetGlyph(body: body.body, retrograde: body.retrograde, size: 72)
                            VStack(alignment: .leading, spacing: 8) {
                                ScoreBar(label: "Strength", score: body.strength)
                                Text("Dignity: \(body.dignity)\(body.retrograde ? " · Retrograde" : "")")
                                    .font(.caption)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                        }
                    }
                    SectionCard(title: "Today") {
                        Text("Use this placement as a current signal when today’s transits, memory entries, or goals activate \(body.body), house \(body.house), or \(body.sign).")
                            .font(.footnote)
                            .foregroundStyle(Theme.primaryText)
                    }
                    SectionCard(title: "Memory") {
                        Text("Log moments when this planet feels loud: decisions, relationships, moves, body shifts, public moments, money events, and emotional patterns. Oralia can compare them later.")
                            .font(.footnote)
                            .foregroundStyle(Theme.primaryText)
                    }
                    SectionCard(title: "Overall") {
                        Text("This is the permanent natal position. The deep interpretation should include general meaning, personal meaning, higher expression, shadow expression, and practical use.")
                            .font(.footnote)
                            .foregroundStyle(Theme.primaryText)
                    }
                }
                .padding(18)
            }
        }
    }
}

struct ChartFactorDetailView: View {
    let title: String
    let subtitle: String
    let detail: String

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 16) {
                    OraliaHeader(eyebrow: "Go deeper", title: title, subtitle: subtitle)
                    SectionCard(title: "Interpretation Standard") {
                        Text(detail).font(.footnote).foregroundStyle(Theme.primaryText)
                    }
                    SectionCard(title: "What this should include next") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("General meaning")
                            Text("Personal meaning")
                            Text("Today’s use")
                            Text("Memory examples")
                            Text("Higher and shadow expression")
                            Text("One practical action")
                        }
                        .font(.caption)
                        .foregroundStyle(Theme.secondaryText)
                    }
                }
                .padding()
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
