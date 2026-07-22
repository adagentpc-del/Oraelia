import SwiftUI

struct ChartView: View {
    @StateObject private var loader = Loadable<ChartResponse>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(40) }
                if let response = loader.value {
                    content(response.chart, approximate: response.approximateLocation ?? false)
                }
            }
            .padding()
        }
        .background(Theme.ivory)
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
            ErrorBanner(message: "Birth location approximate — set exact coordinates in Settings for precise houses.")
        }

        SectionCard(title: "The Big Three") {
            HStack {
                bigThree("Sun", chart.sunSign, "sun.max.fill")
                bigThree("Moon", chart.moonSign, "moon.fill")
                bigThree("Rising", chart.ascendantSign, "sunrise.fill")
            }
            .frame(maxWidth: .infinity)
            Text("\(chart.isDayChart ? "Day" : "Night") chart · ruled by \(chart.chartRuler) · \(chart.moonPhase.name)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }

        SectionCard(title: "Chart Wheel") {
            ChartWheel(chart: chart)
                .frame(height: 320)
        }

        SectionCard(title: "Placements") {
            ForEach(chart.bodies) { body in
                HStack {
                    Text(body.body).font(.caption.bold()).frame(width: 82, alignment: .leading)
                    Text(body.formatted).font(.caption)
                    if body.retrograde { Text("℞").font(.caption).foregroundStyle(Theme.plumLight) }
                    Spacer()
                    Text("H\(body.house)").font(.caption2).foregroundStyle(.secondary)
                    Text(body.dignity)
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(dignityColor(body.dignity).opacity(0.15)))
                        .foregroundStyle(dignityColor(body.dignity))
                }
                .padding(.vertical, 1)
            }
        }

        SectionCard(title: "Chart Shape: \(chart.shape.shape)") {
            Text(chart.shape.description).font(.footnote)
        }

        if !chart.patterns.isEmpty {
            SectionCard(title: "Aspect Patterns") {
                ForEach(chart.patterns) { pattern in
                    VStack(alignment: .leading, spacing: 3) {
                        Text("\(pattern.type): \(pattern.bodies.joined(separator: " · "))")
                            .font(.caption.bold())
                            .foregroundStyle(Theme.navy)
                        Text(pattern.description).font(.caption2).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 3)
                }
            }
        }

        SectionCard(title: "Element & Modality Balance") {
            HStack(spacing: 8) {
                ForEach(["Fire", "Earth", "Air", "Water"], id: \.self) { element in
                    VStack {
                        Text("\(chart.balance.elements[element] ?? 0)")
                            .font(.title3.bold())
                            .foregroundStyle(chart.balance.dominantElement == element ? Theme.gold : Theme.navy)
                        Text(element).font(.caption2)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            HStack(spacing: 8) {
                ForEach(["Cardinal", "Fixed", "Mutable"], id: \.self) { modality in
                    VStack {
                        Text("\(chart.balance.modalities[modality] ?? 0)")
                            .font(.title3.bold())
                            .foregroundStyle(chart.balance.dominantModality == modality ? Theme.gold : Theme.navy)
                        Text(modality).font(.caption2)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            if !chart.balance.missingElements.isEmpty {
                Text("Missing: \(chart.balance.missingElements.joined(separator: ", ")) — supplement deliberately.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }

        SectionCard(title: "Strongest Planets") {
            ForEach(chart.dominantPlanets) { planet in
                ScoreBar(label: planet.body, score: planet.score)
            }
        }

        SectionCard(title: "Major Aspects") {
            ForEach(chart.aspects.filter { $0.major }.prefix(14).map { $0 }) { aspect in
                HStack {
                    Text("\(aspect.a) \(aspect.type) \(aspect.b)").font(.caption)
                    Spacer()
                    Text(String(format: "%.1f°", aspect.orb))
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.secondary)
                    Circle()
                        .fill(aspect.harmonyScore >= 0 ? Color.green.opacity(0.6) : Color.red.opacity(0.55))
                        .frame(width: 8, height: 8)
                }
            }
        }
    }

    private func bigThree(_ label: String, _ sign: String, _ icon: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).foregroundStyle(Theme.gold)
            Text(sign).font(.system(.subheadline, design: .serif).bold())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func dignityColor(_ dignity: String) -> Color {
        switch dignity {
        case "domicile", "exaltation": return Color(red: 0.27, green: 0.51, blue: 0.32)
        case "detriment", "fall": return Color(red: 0.65, green: 0.25, blue: 0.22)
        default: return .secondary
        }
    }
}

/// Draws the natal wheel: zodiac ring, house cusps, and planet glyph positions.
struct ChartWheel: View {
    let chart: NatalChart

    private static let glyphs: [String: String] = [
        "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
        "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
        "Chiron": "⚷", "NorthNode": "☊", "SouthNode": "☋", "Lilith": "⚸",
    ]
    private static let signGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) / 2 - 8
            // Rotate so the Ascendant sits at 9 o'clock (standard wheel).
            let ascendant = chart.houses.angles.ascendant

            func point(longitude: Double, r: CGFloat) -> CGPoint {
                let angle = (180 + (longitude - ascendant)) * .pi / 180
                return CGPoint(x: center.x + r * cos(-angle), y: center.y + r * sin(-angle))
            }

            // Outer zodiac ring
            context.stroke(Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)),
                           with: .color(Theme.plum), lineWidth: 1.5)
            let innerRing = radius * 0.82
            context.stroke(Path(ellipseIn: CGRect(x: center.x - innerRing, y: center.y - innerRing, width: innerRing * 2, height: innerRing * 2)),
                           with: .color(Theme.plum.opacity(0.5)), lineWidth: 1)

            // Sign divisions + glyphs
            for signIndex in 0..<12 {
                let lon = Double(signIndex) * 30
                var path = Path()
                path.move(to: point(longitude: lon, r: innerRing))
                path.addLine(to: point(longitude: lon, r: radius))
                context.stroke(path, with: .color(Theme.plum.opacity(0.4)), lineWidth: 0.8)
                let glyphPoint = point(longitude: lon + 15, r: (radius + innerRing) / 2)
                context.draw(Text(Self.signGlyphs[signIndex]).font(.system(size: 13)).foregroundStyle(Theme.gold), at: glyphPoint)
            }

            // House cusps
            let hub = radius * 0.2
            for (index, cusp) in chart.houses.cusps.enumerated() {
                var path = Path()
                path.move(to: point(longitude: cusp, r: hub))
                path.addLine(to: point(longitude: cusp, r: innerRing))
                let isAngle = index == 0 || index == 3 || index == 6 || index == 9
                context.stroke(path, with: .color(Theme.navy.opacity(isAngle ? 0.8 : 0.25)), lineWidth: isAngle ? 1.6 : 0.7)
            }

            // Planets
            for body in chart.bodies {
                let glyph = Self.glyphs[body.body] ?? "•"
                let planetPoint = point(longitude: body.longitude, r: radius * 0.65)
                context.draw(
                    Text(glyph).font(.system(size: 15)).foregroundStyle(body.retrograde ? Theme.plumLight : Theme.navy),
                    at: planetPoint
                )
            }

            // ASC marker
            context.draw(Text("ASC").font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.plum),
                         at: point(longitude: ascendant, r: radius * 0.1))
        }
    }
}
