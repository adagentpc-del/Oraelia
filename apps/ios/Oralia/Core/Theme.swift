import SwiftUI
import UIKit

/// Oralia's dual luxury mystical palette.
///
/// Design authority from the approved dual-mode mockup:
/// - Default mode is the light ivory / sage app.
/// - Dark toggle = rich emerald / black pine app with subtle celestial glow.
/// - Light toggle = soft ivory app, airy sage accents, pearl champagne, low-contrast cards.
/// - Avoid mustard yellow, neon purple, generic black/gray iOS dark mode, childish zodiac art, and heavy masculine styling.
enum Theme {
    static let midnightGreen = Color(red: 0.03, green: 0.10, blue: 0.09)       // #081917
    static let darkPine = Color(red: 0.04, green: 0.16, blue: 0.14)            // #0B2A26
    static let forestGreen = Color(red: 0.07, green: 0.24, blue: 0.21)         // #123C35
    static let emerald = Color(red: 0.06, green: 0.36, blue: 0.30)             // #0F5C4D
    static let softEmerald = Color(red: 0.22, green: 0.43, blue: 0.36)         // muted green
    static let sage = Color(red: 0.70, green: 0.76, blue: 0.71)                // soft sage
    static let paleSage = Color(red: 0.91, green: 0.94, blue: 0.91)            // #E8EFE9
    static let mistSage = Color(red: 0.94, green: 0.96, blue: 0.93)            // lighter sage wash
    static let ivory = Color(red: 0.97, green: 0.95, blue: 0.91)               // warm ivory
    static let cream = Color(red: 0.99, green: 0.98, blue: 0.95)               // soft cream
    static let pearl = Color(red: 0.93, green: 0.90, blue: 0.84)               // pearl beige
    static let champagne = Color(red: 0.76, green: 0.70, blue: 0.58)           // muted champagne, not yellow
    static let softChampagne = Color(red: 0.86, green: 0.81, blue: 0.70)       // pale champagne
    static let taupe = Color(red: 0.61, green: 0.56, blue: 0.49)               // grounded neutral
    static let stone = Color(red: 0.88, green: 0.86, blue: 0.80)               // stone border

    static let primary = Color(
        light: UIColor(red: 0.07, green: 0.24, blue: 0.21, alpha: 1),
        dark: UIColor(red: 0.86, green: 0.81, blue: 0.70, alpha: 1)
    )

    static let primaryText = Color(
        light: UIColor(red: 0.04, green: 0.16, blue: 0.14, alpha: 1),
        dark: UIColor(red: 0.97, green: 0.95, blue: 0.91, alpha: 1)
    )

    static let secondaryText = Color(
        light: UIColor(red: 0.34, green: 0.42, blue: 0.38, alpha: 1),
        dark: UIColor(red: 0.80, green: 0.83, blue: 0.77, alpha: 1)
    )

    static let cardFill = Color(
        light: UIColor(red: 0.99, green: 0.98, blue: 0.95, alpha: 0.98),
        dark: UIColor(red: 0.04, green: 0.16, blue: 0.14, alpha: 0.96)
    )

    static let cardStroke = Color(
        light: UIColor(red: 0.70, green: 0.76, blue: 0.71, alpha: 0.42),
        dark: UIColor(red: 0.86, green: 0.81, blue: 0.70, alpha: 0.28)
    )

    static let softPanel = Color(
        light: UIColor(red: 0.94, green: 0.96, blue: 0.93, alpha: 0.72),
        dark: UIColor(red: 0.06, green: 0.36, blue: 0.30, alpha: 0.18)
    )

    static let celestialAccent = Color(
        light: UIColor(red: 0.76, green: 0.70, blue: 0.58, alpha: 1),
        dark: UIColor(red: 0.86, green: 0.81, blue: 0.70, alpha: 1)
    )

    /// Backward-compatible aliases for older screens. These intentionally map to the refined green/ivory palette.
    static let plum = primary
    static let plumLight = softEmerald
    static let navy = darkPine
    static let gold = celestialAccent
    static let brass = taupe
    static let moss = sage
    static let mutedEmerald = softEmerald
    static let primaryAccent = celestialAccent

    static let appBackground = LinearGradient(
        colors: [
            Color(light: UIColor(red: 0.99, green: 0.98, blue: 0.95, alpha: 1), dark: UIColor(red: 0.03, green: 0.10, blue: 0.09, alpha: 1)),
            Color(light: UIColor(red: 0.94, green: 0.96, blue: 0.93, alpha: 1), dark: UIColor(red: 0.04, green: 0.16, blue: 0.14, alpha: 1))
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static func scoreColor(_ score: Int) -> Color {
        switch score {
        case ..<35: return taupe
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

struct OraliaHeader: View {
    let eyebrow: String
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(eyebrow.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(2.4)
                .foregroundStyle(Theme.celestialAccent)
            Text(title)
                .font(.system(size: 38, weight: .semibold, design: .serif))
                .foregroundStyle(Theme.primaryText)
                .lineSpacing(-4)
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
                .font(.system(.headline, design: .serif))
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
                .shadow(color: Theme.emerald.opacity(0.07), radius: 18, y: 8)
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
                Image(systemName: symbol)
                    .foregroundStyle(Theme.celestialAccent)
                    .frame(width: 24)
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
                Text("Light is the default ivory and sage Oralia design. Dark switches to the deep green version.")
                    .font(.caption)
                    .foregroundStyle(Theme.secondaryText)
            }
        }
    }
}

struct ScoreRing: View {
    let label: String
    let score: Int

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(Theme.stone.opacity(0.65), lineWidth: 7)
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
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
    }
}

struct ScoreBar: View {
    let label: String
    let score: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(label).font(.caption).foregroundStyle(Theme.primaryText)
                Spacer()
                Text("\(score)").font(.caption.bold()).foregroundStyle(Theme.scoreColor(score))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.stone.opacity(0.55))
                    Capsule()
                        .fill(Theme.scoreColor(score))
                        .frame(width: geo.size.width * CGFloat(score) / 100)
                }
            }
            .frame(height: 6)
        }
    }
}

struct ErrorBanner: View {
    let message: String
    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle")
            .font(.footnote)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 12).fill(.red.opacity(0.08)))
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
