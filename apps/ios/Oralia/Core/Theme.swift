import SwiftUI

/// Oralia's luxury mystical palette.
///
/// Brand direction:
/// - Gender neutral, luxury, professional, subtly mystical
/// - Green dominant, not purple/plum dominant
/// - Light mode: soft ivory, pale sage, muted emerald, moss, champagne gold
/// - Dark mode: deep emerald, forest green, dark pine, soft glow, champagne gold
/// - Avoid neon purple, childish zodiac/cartoon visuals, cheap tarot styling, and overly feminine pink/peach dominance.
enum Theme {
    static let midnightGreen = Color(red: 0.03, green: 0.10, blue: 0.09)       // #081917
    static let darkPine = Color(red: 0.04, green: 0.16, blue: 0.14)            // #0B2A26
    static let forestGreen = Color(red: 0.07, green: 0.24, blue: 0.21)         // #123C35
    static let emerald = Color(red: 0.06, green: 0.36, blue: 0.30)             // #0F5C4D
    static let mutedEmerald = Color(red: 0.18, green: 0.42, blue: 0.35)
    static let moss = Color(red: 0.49, green: 0.57, blue: 0.53)                // #7E9186
    static let sage = Color(red: 0.66, green: 0.73, blue: 0.68)                // #A9B9AE
    static let champagne = Color(red: 0.78, green: 0.66, blue: 0.42)           // #C8A96B
    static let brass = Color(red: 0.72, green: 0.56, blue: 0.33)               // #B89054
    static let ivory = Color(red: 0.96, green: 0.95, blue: 0.91)               // #F6F2E9
    static let stone = Color(red: 0.87, green: 0.84, blue: 0.78)               // #DDD6C8

    /// Primary brand color for text and navigation in light contexts.
    static let primary = emerald

    /// Primary high-emphasis accent for dark contexts and call-to-action highlights.
    static let primaryAccent = champagne

    /// Backward-compatible aliases for older screens. These intentionally map to the new green luxury palette.
    static let plum = emerald
    static let plumLight = mutedEmerald
    static let navy = darkPine
    static let gold = champagne

    static let appBackground = LinearGradient(
        colors: [ivory, Color(red: 0.91, green: 0.94, blue: 0.91)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let darkAppBackground = LinearGradient(
        colors: [midnightGreen, darkPine],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static func scoreColor(_ score: Int) -> Color {
        switch score {
        case ..<35: return Color(red: 0.62, green: 0.25, blue: 0.20)
        case ..<55: return brass
        case ..<75: return champagne
        default: return mutedEmerald
        }
    }
}

struct OraliaHeader: View {
    let eyebrow: String
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(2.2)
                .foregroundStyle(Theme.champagne)
            Text(title)
                .font(.system(size: 38, weight: .semibold, design: .serif))
                .foregroundStyle(Theme.primary)
                .lineSpacing(-4)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
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
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(.headline, design: .serif))
                .foregroundStyle(Theme.primary)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color(.systemBackground).opacity(0.96))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Theme.champagne.opacity(0.22), lineWidth: 1)
                )
                .shadow(color: Theme.emerald.opacity(0.10), radius: 10, y: 4)
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
                    .foregroundStyle(Theme.champagne)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 6) {
                    Text(value)
                        .font(.footnote)
                    if let footnote {
                        Text(footnote)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
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
                    .stroke(Theme.stone, lineWidth: 7)
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
                    .stroke(Theme.scoreColor(score), style: StrokeStyle(lineWidth: 7, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(score)")
                    .font(.system(.subheadline, design: .serif).bold())
                    .foregroundStyle(Theme.darkPine)
            }
            .frame(width: 58, height: 58)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
    }
}

struct ScoreBar: View {
    let label: String
    let score: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label).font(.caption)
                Spacer()
                Text("\(score)").font(.caption.bold()).foregroundStyle(Theme.scoreColor(score))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.stone.opacity(0.75))
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
            .background(RoundedRectangle(cornerRadius: 10).fill(.red.opacity(0.1)))
    }
}

struct SafetyFootnote: View {
    var body: some View {
        Text("Oralia is for reflection, self-knowledge, and planning. It describes tendencies and timing patterns, not fixed fate or medical, legal, financial, or mental health advice.")
            .font(.caption2)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 4)
    }
}
