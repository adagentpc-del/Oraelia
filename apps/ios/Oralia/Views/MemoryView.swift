import SwiftUI

struct MemoryView: View {
    @StateObject private var loader = Loadable<MemorySummaryResponse>()
    @StateObject private var remindersLoader = Loadable<RemindersResponse>()
    @State private var selectedArea = "all"

    private var filteredMemories: [MemoryItemModel] {
        guard let recent = loader.value?.recent else { return [] }
        if selectedArea == "all" { return recent }
        return recent.filter { $0.lifeArea == selectedArea }
    }

    var body: some View {
        ZStack {
            CelestialBackground()
            ScrollView {
                VStack(spacing: 18) {
                    OraliaHeader(
                        eyebrow: "Memory",
                        title: "Your living pattern record.",
                        subtitle: "Brain dumps, moves, relationships, goals, address shifts, trips, and decisions become editable memory that Oralia can cross-reference with timing."
                    )

                    if let error = loader.error {
                        ErrorBanner(message: error)
                    }

                    if loader.isLoading {
                        HeroOracleCard(title: "Reading memory", subtitle: "Loading the current pattern record.") {
                            ProgressView().frame(maxWidth: .infinity).padding(.vertical, 16)
                        }
                    }

                    if let summary = loader.value {
                        HeroOracleCard(title: "Pattern Index", subtitle: "\(summary.total) active memories saved") {
                            VStack(alignment: .leading, spacing: 12) {
                                areaPills(summary.byArea)
                                Text("Memory is not hidden magic. Each recommendation should eventually cite which memories influenced it so the user can confirm, edit, or delete the record.")
                                    .font(.caption)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                        }

                        SectionCard(title: "Recent Memory") {
                            if filteredMemories.isEmpty {
                                Text("Use the brain-dump card on Today or log life events to start building your pattern record.")
                                    .font(.footnote)
                                    .foregroundStyle(Theme.secondaryText)
                            } else {
                                VStack(alignment: .leading, spacing: 12) {
                                    ForEach(filteredMemories) { memory in
                                        memoryRow(memory)
                                        if memory.id != filteredMemories.last?.id {
                                            Divider().opacity(0.35)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    SectionCard(title: "Reminder Loop", subtitle: "In-app notification intents. iOS local notification scheduling comes next.") {
                        if let reminders = remindersLoader.value?.reminders, !reminders.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                ForEach(reminders.prefix(5)) { reminder in
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(reminder.localTimeLabel).font(.caption.monospacedDigit()).foregroundStyle(Theme.accent)
                                        Text(reminder.title).font(.footnote.bold()).foregroundStyle(Theme.primaryText)
                                        Text(reminder.body).font(.caption2).foregroundStyle(Theme.secondaryText)
                                    }
                                }
                            }
                        } else {
                            Text("Power-hour reminders will live here once the user saves them from Today.")
                                .font(.footnote)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }

                    SafetyFootnote()
                }
                .padding()
            }
        }
        .navigationTitle("Memory")
        .toolbar {
            Button { load() } label: { Image(systemName: "arrow.clockwise") }
        }
        .onAppear { load() }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/memory/summary") }
        remindersLoader.run { try await APIClient.shared.get("/reminders") }
    }

    @ViewBuilder
    private func areaPills(_ byArea: [String: Int]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                memoryPill("all", count: byArea.values.reduce(0, +))
                ForEach(byArea.keys.sorted(), id: \.self) { area in
                    memoryPill(area, count: byArea[area] ?? 0)
                }
            }
        }
    }

    private func memoryPill(_ area: String, count: Int) -> some View {
        Button {
            withAnimation(.easeOut(duration: 0.2)) { selectedArea = area }
        } label: {
            Text("\(area.replacingOccurrences(of: "_", with: " ").capitalized) · \(count)")
                .font(.caption.bold())
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(
                    Capsule().fill(selectedArea == area ? Theme.primary.opacity(0.16) : Theme.softPanel)
                )
                .foregroundStyle(selectedArea == area ? Theme.primaryText : Theme.secondaryText)
        }
        .buttonStyle(.plain)
    }

    private func memoryRow(_ memory: MemoryItemModel) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(memory.title)
                        .font(.system(.headline, design: .serif))
                        .foregroundStyle(Theme.primaryText)
                    Text(memory.summary)
                        .font(.caption)
                        .foregroundStyle(Theme.secondaryText)
                }
                Spacer()
                Text("\(memory.confidence)%")
                    .font(.caption2.monospacedDigit().bold())
                    .foregroundStyle(Theme.accent)
            }
            HStack(spacing: 6) {
                Text(memory.lifeArea.capitalized)
                if let eventDate = memory.eventDate { Text(eventDate) }
                if let emotion = memory.emotion { Text(emotion.capitalized) }
            }
            .font(.caption2)
            .foregroundStyle(Theme.secondaryText)
        }
        .padding(.vertical, 3)
    }
}
