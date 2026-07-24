import SwiftUI

struct LifeEventsView: View {
    @StateObject private var loader = Loadable<LifeEventsResponse>()
    @State private var showingAdd = false

    var body: some View {
        Group {
            if let error = loader.error {
                ScrollView { ErrorBanner(message: error).padding() }
            } else if loader.isLoading {
                ProgressView()
            } else if let response = loader.value {
                List {
                    if response.events.isEmpty {
                        Text("Log major life events (moves, launches, relationships, milestones) and Oralia will show you what timing factors were active — and which ones repeat.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    ForEach(response.events) { event in
                        NavigationLink {
                            LifeEventDetailView(eventId: event.id)
                        } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(event.title).font(.subheadline.bold())
                                Text("\(event.eventDate) · \(event.eventType.replacingOccurrences(of: "_", with: " "))\(event.category.map { " · \($0)" } ?? "")")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            } else {
                Color.clear
            }
        }
        .navigationTitle("Life Events")
        .toolbar {
            Button { showingAdd = true } label: { Image(systemName: "plus") }
        }
        .sheet(isPresented: $showingAdd) {
            AddLifeEventView(eventTypes: loader.value?.eventTypes ?? []) {
                showingAdd = false
                load()
            }
        }
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/life-events") }
    }
}

struct AddLifeEventView: View {
    let eventTypes: [String]
    let onSaved: () -> Void

    @State private var title = ""
    @State private var eventType = "other"
    @State private var date = Date()
    @State private var category = "career"
    @State private var intensity = 5.0
    @State private var saving = false
    @State private var error: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                TextField("What happened?", text: $title)
                Picker("Type", selection: $eventType) {
                    ForEach(eventTypes.isEmpty ? ["other"] : eventTypes, id: \.self) {
                        Text($0.replacingOccurrences(of: "_", with: " ")).tag($0)
                    }
                }
                DatePicker("Date", selection: $date, displayedComponents: .date)
                Picker("Category", selection: $category) {
                    ForEach(["love", "career", "money", "family", "health", "visibility", "other"], id: \.self) {
                        Text($0.capitalized).tag($0)
                    }
                }
                VStack(alignment: .leading) {
                    Text("Significance: \(Int(intensity))/10").font(.caption)
                    Slider(value: $intensity, in: 1...10, step: 1)
                }
                if let error { Text(error).font(.caption).foregroundStyle(.red) }
            }
            .navigationTitle("Log Event")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(saving ? "Saving…" : "Save") { save() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || saving)
                }
            }
        }
    }

    private func save() {
        saving = true
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        let body: [String: Any] = [
            "title": title,
            "eventType": eventType,
            "eventDate": formatter.string(from: date),
            "category": category,
            "intensity": Int(intensity),
        ]
        Task { @MainActor in
            do {
                let _: LifeEventModel = try await APIClient.shared.post("/life-events", body: body)
                onSaved()
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            saving = false
        }
    }
}

struct LifeEventDetailView: View {
    let eventId: Int
    @StateObject private var loader = Loadable<LifeEventAnalysisResponse>()

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if let error = loader.error { ErrorBanner(message: error) }
                if loader.isLoading { ProgressView().padding(40) }
                if let response = loader.value {
                    SectionCard(title: response.event.title, subtitle: "\(response.event.eventDate) · age \(response.analysis.ageAtEvent)") {
                        Text("Profection: house \(response.analysis.profection.profectedHouse) year (\(response.analysis.profection.profectedSign), lord \(response.analysis.profection.yearLord))")
                            .font(.footnote)
                        Text("Personal year \(response.analysis.personalCycles.personalYear), month \(response.analysis.personalCycles.personalMonth), day \(response.analysis.personalCycles.personalDay)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if !response.analysis.activeTransits.isEmpty {
                        SectionCard(title: "Transits Active That Day") {
                            ForEach(response.analysis.activeTransits) { transit in
                                HStack {
                                    Text("\(transit.transiting) \(transit.type) \(transit.natal)").font(.caption)
                                    Spacer()
                                    Circle()
                                        .fill(transit.harmonyScore >= 0 ? Color.green.opacity(0.6) : Color.red.opacity(0.55))
                                        .frame(width: 8, height: 8)
                                }
                            }
                        }
                    }
                    if !response.analysis.retrogradesAtEvent.isEmpty {
                        SectionCard(title: "Retrograde at the Time") {
                            ForEach(response.analysis.retrogradesAtEvent) { retro in
                                Text("\(retro.body) ℞ in \(retro.sign)").font(.caption)
                            }
                        }
                    }
                    if let note = response.analysis.note {
                        Text(note).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Event Analysis")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if loader.value == nil { load() } }
    }

    private func load() {
        loader.run { try await APIClient.shared.get("/life-events/\(eventId)/analysis") }
    }
}
