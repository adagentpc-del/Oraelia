import SwiftUI

struct ChartView: View {
    @StateObject private var loader = Loadable<ChartResponse>()
    @State private var lens = "Today"
    private let lenses = ["Today", "Memory", "Overall", "Go Deeper"]

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Natal Blueprint",
                        title: "Your chart first, then the meaning.",
                        subtitle: "The diagram stays at the top. Today, Memory, Overall, and Go Deeper explain the same chart from different angles."
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
        .onAppear { if loader.value == nil { load() } }
        .toolbar { Button { load() } label: { Image(systemName: "arrow.clockwise") } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/natal/chart") }
    }

    @ViewBuilder
    private func content(_ chart: NatalChart, approximate: Bool) -> some View {
        if approximate {
            ErrorBanner(message: "Birth location approximate. Set exact coordinates in Settings for more precise houses.")
        }

        SectionCard(title: "Natal Wheel", subtitle: "Diagram first. Every glyph, house, angle, and aspect should become tappable in the next interaction pass.") {
            ChartWheel(chart: chart)
                .frame(height: 330)
        }

        Picker("Chart lens", selection: $lens) {
            ForEach(lenses, id: \.self) { item in Text(item).tag(item) }
        }
        .pickerStyle(.segmented)

        switch lens {
        case "Memory":
            memoryLens(chart)
        case "Overall":
            overallLens(chart)
        case "Go Deeper":
            goDeeperLens(chart)
        default:
            todayLens(chart)
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
                    bigThree("Sun", chart.sunSign, "sun.max")
                    bigThree("Moon", chart.moonSign, "moon")
                    bigThree("Rising", chart.ascendantSign, "sunrise")
                }
                Text("Use the chart as the permanent blueprint, then let Today and Memory decide which pieces matter right now.")
                    .font(.footnote)
                    .foregroundStyle(Theme.secondaryText)
            }
        }

        SectionCard(title: "Today’s Chart Use") {
            VStack(alignment: .leading, spacing: 8) {
                Label("Lead with the chart ruler: \(chart.chartRuler).", systemImage: "smallcircle.circle")
                Label("Track emotional tone through the \(chart.moonPhase.name) moon phase.", systemImage: "moon")
                Label("Use dominant planets as the strongest recurring pattern signals.", systemImage: "point.3.connected.trianglepath.dotted")
            }
            .font(.footnote)
            .foregroundStyle(Theme.primaryText)
        }
    }

    @ViewBuilder
    private func memoryLens(_ chart: NatalChart) -> some View {
        SectionCard(title: "Memory Cross-Reference") {
            VStack(alignment: .leading, spacing: 8) {
                Text("Logged memories should be compared against this chart: profection year, houses, angles, transits, repeated planets, moves, relationships, launches, losses, and body events.")
                    .font(.footnote)
                    .foregroundStyle(Theme.primaryText)
                Text("Next build pass: pull Memory API results directly into this lens and show which chart factors repeat across life events.")
                    .font(.caption2)
                    .foregroundStyle(Theme.secondaryText)
            }
        }

        if !chart.patterns.isEmpty {
            SectionCard(title: "Patterns to Watch in Memory") {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(chart.patterns) { pattern in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(pattern.type): \(pattern.bodies.joined(separator: " · "))")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(Theme.primaryText)
                            Text(pattern.description)
                                .font(.caption2)
                                .foregroundStyle(Theme.secondaryText)
                        }
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
                bigThree("Sun", chart.sunSign, "sun.max")
                bigThree("Moon", chart.moonSign, "moon")
                bigThree("Rising", chart.ascendantSign, "sunrise")
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
                    NavigationLink {
                        ChartFactorDetailView(title: body.body, subtitle: body.formatted, detail: "House \(body.house). Dignity: \(body.dignity). Strength: \(body.strength). This screen will become the deep clickable explanation for this placement.")
                    } label: {
                        HStack {
                            Text(body.body).font(.caption.weight(.semibold)).foregroundStyle(Theme.primaryText).frame(width: 82, alignment: .leading)
                            Text(body.formatted).font(.caption).foregroundStyle(Theme.secondaryText)
                            if body.retrograde { Text("℞").font(.caption).foregroundStyle(Theme.primary) }
                            Spacer()
                            Text("H\(body.house)").font(.caption2).foregroundStyle(Theme.secondaryText)
                            Image(systemName: "chevron.right").font(.caption2).foregroundStyle(Theme.secondaryText)
                        }
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
                        HStack {
                            Text("\(aspect.a) \(aspect.type) \(aspect.b)").font(.caption).foregroundStyle(Theme.primaryText)
                            Spacer()
                            Text(String(format: "%.1f°", aspect.orb)).font(.caption2.monospacedDigit()).foregroundStyle(Theme.secondaryText)
                            Image(systemName: "chevron.right").font(.caption2).foregroundStyle(Theme.secondaryText)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func bigThree(_ label: String, _ sign: String, _ icon: String) -> some View {
        VStack(spacing: 7) {
            ZStack { Circle().fill(Theme.softPanel); Image(systemName: icon).foregroundStyle(Theme.primary) }
                .frame(width: 42, height: 42)
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

/// Draws the natal wheel: zodiac ring, house cusps, and planet glyph positions.
struct ChartWheel: View {
    let chart: NatalChart
    @State private var reveal: CGFloat = 0
    @State private var breathe = false

    private static let glyphs: [String: String] = [
        "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
        "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
        "Chiron": "⚷", "NorthNode": "☊", "SouthNode": "☋", "Lilith": "⚸",
    ]
    private static let signGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) / 2 - 10
            let ascendant = chart.houses.angles.ascendant

            func point(longitude: Double, r: CGFloat) -> CGPoint {
                let angle = (180 + (longitude - ascendant)) * .pi / 180
                return CGPoint(x: center.x + r * cos(-angle), y: center.y + r * sin(-angle))
            }

            let outerRect = CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)
            let innerRing = radius * 0.82
            let innerRect = CGRect(x: center.x - innerRing, y: center.y - innerRing, width: innerRing * 2, height: innerRing * 2)

            context.stroke(Path(ellipseIn: outerRect), with: .color(Theme.primary.opacity(0.78)), lineWidth: 1.6)
            context.stroke(Path(ellipseIn: innerRect), with: .color(Theme.cardStroke.opacity(0.92)), lineWidth: 1)
            context.stroke(Path(ellipseIn: CGRect(x: center.x - radius * 0.22, y: center.y - radius * 0.22, width: radius * 0.44, height: radius * 0.44)), with: .color(Theme.cardStroke.opacity(0.7)), lineWidth: 1)

            for signIndex in 0..<12 {
                let lon = Double(signIndex) * 30
                var path = Path()
                path.move(to: point(longitude: lon, r: innerRing))
                path.addLine(to: point(longitude: lon, r: radius))
                context.stroke(path, with: .color(Theme.cardStroke.opacity(0.72)), lineWidth: 0.8)
                let glyphPoint = point(longitude: lon + 15, r: (radius + innerRing) / 2)
                context.draw(Text(Self.signGlyphs[signIndex]).font(.system(size: 14)).foregroundStyle(Theme.accent), at: glyphPoint)
            }

            let hub = radius * 0.2
            for (index, cusp) in chart.houses.cusps.enumerated() {
                var path = Path()
                path.move(to: point(longitude: cusp, r: hub))
                path.addLine(to: point(longitude: cusp, r: innerRing))
                let isAngle = index == 0 || index == 3 || index == 6 || index == 9
                context.stroke(path, with: .color(Theme.primary.opacity(isAngle ? 0.68 : 0.22)), lineWidth: isAngle ? 1.5 : 0.7)
            }

            for body in chart.bodies {
                let glyph = Self.glyphs[body.body] ?? "•"
                let planetPoint = point(longitude: body.longitude, r: radius * 0.65)
                context.draw(Text(glyph).font(.system(size: 16)).foregroundStyle(body.retrograde ? Theme.warmTaupe : Theme.primaryText), at: planetPoint)
            }

            context.draw(Text("ASC").font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.primary), at: point(longitude: ascendant, r: radius * 0.12))
        }
        .opacity(reveal)
        .scaleEffect(0.96 + reveal * 0.04)
        .rotationEffect(.degrees(breathe ? 0.45 : -0.45))
        .onAppear {
            withAnimation(.easeOut(duration: 0.85)) { reveal = 1 }
            withAnimation(.easeInOut(duration: 4.8).repeatForever(autoreverses: true)) { breathe = true }
        }
    }
}