import SwiftUI

/// Oralia's luxury mystical palette: ivory/champagne ground, deep plum
/// primary, navy accents, gold highlights.
enum Theme {
    static let plum = Color(red: 0.29, green: 0.12, blue: 0.31)
    static let plumLight = Color(red: 0.45, green: 0.24, blue: 0.47)
    static let navy = Color(red: 0.11, green: 0.15, blue: 0.29)
    static let gold = Color(red: 0.78, green: 0.62, blue: 0.28)
    static let champagne = Color(red: 0.97, green: 0.94, blue: 0.88)
    static let ivory = Color(red: 0.99, green: 0.98, blue: 0.95)

    static func scoreColor(_ score: Int) -> Color {
        switch score {
        case ..<35: return Color(red: 0.65, green: 0.25, blue: 0.22)
        case ..<55: return Color(red: 0.72, green: 0.52, blue: 0.2)
        case ..<75: return gold
        default: return Color(red: 0.27, green: 0.51, blue: 0.32)
        }
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
                .foregroundStyle(Theme.plum)
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
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: Theme.plum.opacity(0.08), radius: 8, y: 3)
        )
    }
}

struct ScoreRing: View {
    let label: String
    let score: Int

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(Theme.champagne, lineWidth: 7)
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
                    .stroke(Theme.scoreColor(score), style: StrokeStyle(lineWidth: 7, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(score)")
                    .font(.system(.subheadline, design: .serif).bold())
                    .foregroundStyle(Theme.navy)
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
                    Capsule().fill(Theme.champagne)
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
