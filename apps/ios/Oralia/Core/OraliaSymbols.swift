import SwiftUI

enum OraliaSymbolKind {
    case natal
    case places
    case numerology
    case humanDesign
    case memory
    case timing
    case relationship
    case chakra
    case voice
    case reminder
    case location
    case transit
    case address
}

/// Custom Oralia symbol language. Avoids generic SF Symbols so the app does not look template-built.
struct OraliaSymbol: View {
    let kind: OraliaSymbolKind
    var size: CGFloat = 36
    var active: Bool = false

    var body: some View {
        Canvas { context, canvasSize in
            let w = canvasSize.width
            let h = canvasSize.height
            let center = CGPoint(x: w / 2, y: h / 2)
            let r = min(w, h) * 0.40
            let stroke = active ? Theme.primary : Theme.accent
            let faint = Theme.cardStroke
            let strong = Theme.primaryText

            func circle(_ radius: CGFloat, color: Color = faint, width: CGFloat = 1) {
                context.stroke(Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)), with: .color(color), lineWidth: width)
            }

            func line(_ a: CGPoint, _ b: CGPoint, color: Color = stroke, width: CGFloat = 1) {
                var p = Path()
                p.move(to: a)
                p.addLine(to: b)
                context.stroke(p, with: .color(color), lineWidth: width)
            }

            func dot(_ p: CGPoint, radius: CGFloat = 2.2, color: Color = stroke) {
                context.fill(Path(ellipseIn: CGRect(x: p.x - radius, y: p.y - radius, width: radius * 2, height: radius * 2)), with: .color(color))
            }

            switch kind {
            case .natal:
                circle(r, color: stroke, width: 1.2)
                circle(r * 0.62, color: faint, width: 1)
                for i in 0..<12 {
                    let a = CGFloat(i) * .pi * 2 / 12 - .pi / 2
                    line(CGPoint(x: center.x + cos(a) * r * 0.62, y: center.y + sin(a) * r * 0.62), CGPoint(x: center.x + cos(a) * r, y: center.y + sin(a) * r), color: faint, width: 0.7)
                }
                dot(center, radius: 2.5, color: strong)
            case .places:
                circle(r, color: stroke, width: 1.2)
                for i in 0..<4 {
                    let y = h * (0.28 + CGFloat(i) * 0.15)
                    var p = Path()
                    p.move(to: CGPoint(x: w * 0.20, y: y))
                    p.addCurve(to: CGPoint(x: w * 0.82, y: y + CGFloat(i % 2 == 0 ? 9 : -9)), control1: CGPoint(x: w * 0.38, y: y - 20), control2: CGPoint(x: w * 0.62, y: y + 20))
                    context.stroke(p, with: .color(i == 1 ? stroke : faint), lineWidth: i == 1 ? 1.4 : 0.8)
                }
                dot(CGPoint(x: w * 0.58, y: h * 0.48), radius: 3.5, color: stroke)
            case .numerology:
                circle(r, color: faint, width: 1)
                context.draw(Text("9").font(.system(size: size * 0.42, weight: .semibold, design: .serif)).foregroundStyle(strong), at: center)
                dot(CGPoint(x: w * 0.28, y: h * 0.28), color: stroke)
                dot(CGPoint(x: w * 0.72, y: h * 0.72), color: stroke)
            case .humanDesign:
                let top = CGPoint(x: center.x, y: h * 0.15)
                let throat = CGPoint(x: center.x, y: h * 0.31)
                let g = CGPoint(x: center.x, y: h * 0.49)
                let sacral = CGPoint(x: center.x, y: h * 0.66)
                let root = CGPoint(x: center.x, y: h * 0.84)
                [top, throat, g, sacral, root].forEach { dot($0, radius: 3, color: stroke) }
                line(top, throat, color: faint)
                line(throat, g, color: faint)
                line(g, sacral, color: faint)
                line(sacral, root, color: faint)
                line(CGPoint(x: w * 0.30, y: h * 0.44), g, color: faint)
                line(CGPoint(x: w * 0.70, y: h * 0.44), g, color: faint)
                dot(CGPoint(x: w * 0.30, y: h * 0.44), radius: 3, color: active ? stroke : faint)
                dot(CGPoint(x: w * 0.70, y: h * 0.44), radius: 3, color: active ? stroke : faint)
            case .memory:
                for i in 0..<4 {
                    let p = CGPoint(x: w * (0.24 + CGFloat(i) * 0.17), y: h * (i.isMultiple(of: 2) ? 0.40 : 0.62))
                    dot(p, radius: 3, color: i == 3 ? stroke : faint)
                    if i > 0 {
                        let prev = CGPoint(x: w * (0.24 + CGFloat(i - 1) * 0.17), y: h * ((i - 1).isMultiple(of: 2) ? 0.40 : 0.62))
                        line(prev, p, color: faint)
                    }
                }
            case .timing:
                circle(r, color: stroke, width: 1.2)
                line(center, CGPoint(x: center.x, y: center.y - r * 0.7), color: strong, width: 1.2)
                line(center, CGPoint(x: center.x + r * 0.54, y: center.y + r * 0.36), color: stroke, width: 1.2)
                dot(center, radius: 2.3, color: strong)
            case .relationship:
                circle(r * 0.72, color: faint, width: 1)
                circle(r * 0.72, color: faint, width: 1)
                let a = CGPoint(x: w * 0.38, y: center.y)
                let b = CGPoint(x: w * 0.62, y: center.y)
                dot(a, radius: 4, color: stroke)
                dot(b, radius: 4, color: strong)
                line(a, b, color: faint)
            case .chakra:
                for i in 0..<7 {
                    dot(CGPoint(x: center.x, y: h * (0.18 + CGFloat(i) * 0.105)), radius: CGFloat(2 + i % 3), color: i == 3 ? stroke : faint)
                }
                line(CGPoint(x: center.x, y: h * 0.16), CGPoint(x: center.x, y: h * 0.86), color: faint)
            case .voice:
                var p = Path()
                for i in 0..<5 {
                    let x = w * (0.25 + CGFloat(i) * 0.12)
                    p.move(to: CGPoint(x: x, y: h * 0.50))
                    p.addLine(to: CGPoint(x: x, y: h * (0.40 + CGFloat(abs(2 - i)) * 0.04)))
                    p.move(to: CGPoint(x: x, y: h * 0.50))
                    p.addLine(to: CGPoint(x: x, y: h * (0.60 - CGFloat(abs(2 - i)) * 0.04)))
                }
                context.stroke(p, with: .color(stroke), lineWidth: 2)
            case .reminder:
                circle(r * 0.82, color: stroke, width: 1.2)
                line(center, CGPoint(x: center.x, y: center.y - r * 0.45), color: strong)
                line(center, CGPoint(x: center.x + r * 0.38, y: center.y), color: strong)
                var arc = Path()
                arc.addArc(center: center, radius: r * 1.04, startAngle: .degrees(215), endAngle: .degrees(325), clockwise: false)
                context.stroke(arc, with: .color(faint), lineWidth: 1)
            case .location:
                circle(r * 0.68, color: faint, width: 1)
                dot(center, radius: 4.5, color: stroke)
                line(CGPoint(x: center.x, y: center.y + 5), CGPoint(x: center.x, y: h * 0.82), color: stroke)
            case .transit:
                circle(r, color: faint, width: 1)
                circle(r * 0.55, color: faint, width: 1)
                line(CGPoint(x: w * 0.22, y: h * 0.62), CGPoint(x: w * 0.78, y: h * 0.38), color: stroke, width: 1.3)
                dot(CGPoint(x: w * 0.22, y: h * 0.62), color: strong)
                dot(CGPoint(x: w * 0.78, y: h * 0.38), color: stroke)
            case .address:
                var p = Path()
                p.move(to: CGPoint(x: w * 0.24, y: h * 0.48))
                p.addLine(to: CGPoint(x: w * 0.50, y: h * 0.25))
                p.addLine(to: CGPoint(x: w * 0.76, y: h * 0.48))
                p.addLine(to: CGPoint(x: w * 0.76, y: h * 0.78))
                p.addLine(to: CGPoint(x: w * 0.24, y: h * 0.78))
                p.closeSubpath()
                context.stroke(p, with: .color(stroke), lineWidth: 1.3)
                dot(center, radius: 2.8, color: strong)
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

struct OraliaGlyphButton<Content: View>: View {
    let kind: OraliaSymbolKind
    let title: String
    let subtitle: String?
    let action: () -> Void
    @ViewBuilder var trailing: Content

    init(kind: OraliaSymbolKind, title: String, subtitle: String? = nil, action: @escaping () -> Void, @ViewBuilder trailing: () -> Content = { EmptyView() }) {
        self.kind = kind
        self.title = title
        self.subtitle = subtitle
        self.action = action
        self.trailing = trailing()
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                OraliaSymbol(kind: kind, size: 38)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Theme.primaryText)
                    if let subtitle {
                        Text(subtitle)
                            .font(.caption2)
                            .foregroundStyle(Theme.secondaryText)
                            .lineLimit(2)
                    }
                }
                Spacer()
                trailing
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Theme.softPanel.opacity(0.72)))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Theme.cardStroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}
