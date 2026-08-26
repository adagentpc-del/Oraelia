import SwiftUI
import UIKit

/// Oralia's dual luxury mystical palette.
///
/// Design authority:
/// - Default is the approved LIGHT mockup direction: ivory, sage, pearl champagne, emerald text.
/// - Dark toggle = rich emerald / black pine app with restrained pearl accents.
/// - Avoid mustard yellow, harsh gold, masculine tech dashboard styling, generic iOS gray cards, neon purple, and cheap zodiac visuals.
enum Theme {
    static let midnightGreen = Color(red: 0.03, green: 0.10, blue: 0.09)
    static let darkPine = Color(red: 0.04, green: 0.16, blue: 0.14)
    static let forestGreen = Color(red: 0.07, green: 0.24, blue: 0.21)
    static let emerald = Color(red: 0.06, green: 0.36, blue: 0.30)
    static let softEmerald = Color(red: 0.22, green: 0.43, blue: 0.36)
    static let sage = Color(red: 0.70, green: 0.76, blue: 0.71)
    static let paleSage = Color(red: 0.91, green: 0.94, blue: 0.91)
    static let mistSage = Color(red: 0.94, green: 0.96, blue: 0.93)
    static let ivory = Color(red: 0.965, green: 0.952, blue: 0.914)
    static let cream = Color(red: 0.99, green: 0.975, blue: 0.94)
    static let pearl = Color(red: 0.84, green: 0.78, blue: 0.66)
    static let warmTaupe = Color(red: 0.62, green: 0.55, blue: 0.45)
    static let stone = Color(red: 0.875, green: 0.85, blue: 0.79)
    static let mist = Color(red: 0.94, green: 0.94, blue: 0.90)

    static let primary = Color(
        light: UIColor(red: 0.06, green: 0.25, blue: 0.22, alpha: 1),
        dark: UIColor(red: 0.88, green: 0.84, blue: 0.74, alpha: 1)
    )

    static let primaryText = Color(
        light: UIColor(red: 0.04, green: 0.15, blue: 0.13, alpha: 1),
        dark: UIColor(red: 0.96, green: 0.95, blue: 0.91, alpha: 1)
    )

    static let secondaryText = Color(
        light: UIColor(red: 0.35, green: 0.43, blue: 0.39, alpha: 1),
        dark: UIColor(red: 0.73, green: 0.78, blue: 0.72, alpha: 1)
    )

    static let accent = Color(
        light: UIColor(red: 0.70, green: 0.62, blue: 0.49, alpha: 1),
        dark: UIColor(red: 0.84, green: 0.78, blue: 0.66, alpha: 1)
    )

    static let cardFill = Color(
        light: UIColor(red: 1.0, green: 0.985, blue: 0.955, alpha: 0.94),
        dark: UIColor(red: 0.045, green: 0.17, blue: 0.15, alpha: 0.94)
    )

    static let elevatedCardFill = Color(
        light: UIColor(red: 0.985, green: 0.965, blue: 0.92, alpha: 0.96),
        dark: UIColor(red: 0.06, green: 0.21, blue: 0.18, alpha: 0.96)
    )

    static let cardStroke = Color(
        light: UIColor(red: 0.72, green: 0.78, blue: 0.72, alpha: 0.34),
        dark: UIColor(red: 0.80, green: 0.74, blue: 0.62, alpha: 0.22)
    )

    static let softPanel = Color(
        light: UIColor(red: 0.91, green: 0.94, blue: 0.91, alpha: 0.70),
        dark: UIColor(red: 0.06, green: 0.36, blue: 0.30, alpha: 0.18)
    )

    static let celestialAccent = accent
    static let plum = primary
    static let plumLight = softEmerald
    static let navy = darkPine
    static let gold = accent
    static let champagne = accent
    static let brass = warmTaupe
    static let moss = sage
    static let mutedEmerald = softEmerald
    static let primaryAccent = accent

    static let appBackground = LinearGradient(
        colors: [
            Color(light: UIColor(red: 0.99, green: 0.975, blue: 0.94, alpha: 1), dark: UIColor(red: 0.03, green: 0.10, blue: 0.09, alpha: 1)),
            Color(light: UIColor(red: 0.93, green: 0.955, blue: 0.925, alpha: 1), dark: UIColor(red: 0.04, green: 0.16, blue: 0.14, alpha: 1)),
            Color(light: UIColor(red: 0.965, green: 0.952, blue: 0.914, alpha: 1), dark: UIColor(red: 0.07, green: 0.24, blue: 0.21, alpha: 1))
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static func scoreColor(_ score: Int) -> Color {
        switch score {
        case ..<35: return warmTaupe
        case ..<55: return sage
        case ..<75: return softEmerald
        default: return emerald
        }
    }
}

extension Color {
    init(light: UIColor, dark: UIColor) {
        self.init(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? dark : light
        })
    }
}

struct CelestialBackground: View {
    @State private var drift = false

    var body: some View {
        ZStack {
            Theme.appBackground
            Circle()
                .stroke(Theme.accent.opacity(0.18), lineWidth: 1)
                .frame(width: 260, height: 260)
                .offset(x: drift ? 128 : 118, y: drift ? -188 : -176)
            Circle()
                .stroke(Theme.sage.opacity(0.20), lineWidth: 1)
                .frame(width: 360, height: 360)
                .offset(x: drift ? -172 : -160, y: drift ? 270 : 250)
            ForEach(0..<18, id: \.self) { index in
                Circle()
                    .fill(index.isMultiple(of: 3) ? Theme.accent.opacity(0.36) : Theme.sage.opacity(0.30))
                    .frame(width: index.isMultiple(of: 4) ? 3 : 2, height: index.isMultiple(of: 4) ? 3 : 2)
                    .offset(
                        x: CGFloat((index * 37) % 310) - 155 + (drift ? 3 : -3),
                        y: CGFloat((index * 61) % 680) - 340 + (drift ? -5 : 5)
                    )
            }
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.easeInOut(duration: 7).repeatForever(autoreverses: true)) {
                drift = true
            }
        }
    }
}

struct OraliaHeader: View {
    let eyebrow: String
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(eyebrow.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(2.4)
                .foregroundStyle(Theme.accent)
            Text(title)
                .font(.system(size: 36, weight: .semibold, design: .serif))
                .foregroundStyle(Theme.primaryText)
                .lineSpacing(-3)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Theme.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct SectionCard<Content: View>: View {
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(.headline, design: .serif).weight(.semibold))
                .foregroundStyle(Theme.primaryText)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Theme.secondaryText)
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Theme.cardFill)
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Theme.cardStroke, lineWidth: 1)
                )
                .shadow(color: Theme.emerald.opacity(0.08), radius: 18, y: 9)
        )
    }
}

struct HeroOracleCard<Content: View>: View {
    let title: String
    let subtitle: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(title)
                        .font(.system(size: 28, weight: .semibold, design: .serif))
                        .foregroundStyle(Theme.primaryText)
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundStyle(Theme.secondaryText)
                }
                Spacer()
                ZStack {
                    Circle().stroke(Theme.accent.opacity(0.32), lineWidth: 1)
                    Circle().stroke(Theme.sage.opacity(0.22), lineWidth: 8)
                    Image(systemName: "moon.stars")
                        .font(.title3)
                        .foregroundStyle(Theme.accent)
                }
                .frame(width: 58, height: 58)
            }
            content
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(Theme.elevatedCardFill)
                .overlay(
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .stroke(Theme.cardStroke, lineWidth: 1)
                )
                .shadow(color: Theme.emerald.opacity(0.10), radius: 22, y: 12)
        )
    }
}

struct SignalCard: View {
    let title: String
    let value: String
    var footnote: String? = nil
    var symbol: String = "sparkles"

    var body: some View {
        SectionCard(title: title) {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle().fill(Theme.softPanel)
                    Image(systemName: symbol)
                        .foregroundStyle(Theme.primary)
                }
                .frame(width: 34, height: 34)
                VStack(alignment: .leading, spacing: 6) {
                    Text(value)
                        .font(.footnote)
                        .foregroundStyle(Theme.primaryText)
                    if let footnote {
                        Text(footnote)
                            .font(.caption2)
                            .foregroundStyle(Theme.secondaryText)
                    }
                }
            }
        }
    }
}

struct ThemeModePicker: View {
    @AppStorage("oraliaAppearance") private var appearance = "light"

    var body: some View {
        Picker("Appearance", selection: $appearance) {
            Label("Light", systemImage: "sun.max.fill").tag("light")
            Label("Dark", systemImage: "moon.stars.fill").tag("dark")
        }
        .pickerStyle(.segmented)
    }
}

struct ThemeShowcaseCard: View {
    var body: some View {
        SectionCard(title: "Appearance") {
            VStack(alignment: .leading, spacing: 12) {
                ThemeModePicker()
                Text("Light is the default ivory and sage Oralia experience. Dark is the deep green companion mode.")
                    .font(.caption)
                    .foregroundStyle(Theme.secondaryText)
            }
        }
    }
}

struct ScoreRing: View {
    let label: String
    let score: Int
    @State private var progress: CGFloat = 0

    var body: some View {
        VStack(spacing: 7) {
            ZStack {
                Circle()
                    .stroke(Theme.stone.opacity(0.54), lineWidth: 7)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Theme.scoreColor(score), style: StrokeStyle(lineWidth: 7, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(score)")
                    .font(.system(.subheadline, design: .serif).bold())
                    .foregroundStyle(Theme.primaryText)
            }
            .frame(width: 58, height: 58)
            Text(label)
                .font(.caption2)
                .foregroundStyle(Theme.secondaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .onAppear { animate() }
        .onChange(of: score) { _, _ in animate() }
    }

    private func animate() {
        progress = 0
        withAnimation(.easeOut(duration: 0.85)) {
            progress = CGFloat(score) / 100
        }
    }
}

struct ScoreBar: View {
    let label: String
    let score: Int
    @State private var progress: CGFloat = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(label).font(.caption).foregroundStyle(Theme.primaryText)
                Spacer()
                Text("\(score)").font(.caption.bold()).foregroundStyle(Theme.scoreColor(score))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.stone.opacity(0.42))
                    Capsule()
                        .fill(Theme.scoreColor(score).opacity(0.86))
                        .frame(width: geo.size.width * progress)
                }
            }
            .frame(height: 7)
        }
        .onAppear { animate() }
        .onChange(of: score) { _, _ in animate() }
    }

    private func animate() {
        progress = 0
        withAnimation(.easeOut(duration: 0.72)) {
            progress = CGFloat(score) / 100
        }
    }
}

struct ErrorBanner: View {
    let message: String
    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle")
            .font(.footnote)
            .foregroundStyle(Theme.primaryText)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.red.opacity(0.08)))
    }
}

struct SafetyFootnote: View {
    var body: some View {
        Text("Oralia is for reflection, self-knowledge, and planning. It describes tendencies and timing patterns, not fixed fate or medical, legal, financial, or mental health advice.")
            .font(.caption2)
            .foregroundStyle(Theme.secondaryText)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 4)
    }
}
