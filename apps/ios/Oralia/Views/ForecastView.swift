import SwiftUI

struct ForecastView: View {
    @State private var horizon = "Weekly"
    @StateObject private var weekly = Loadable<WeeklyForecast>()
    @StateObject private var monthly = Loadable<MonthlyForecast>()
    @StateObject private var quarterly = Loadable<QuarterlyForecastModel>()
    @StateObject private var yearly = Loadable<YearlyForecast>()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Picker("Horizon", selection: $horizon) {
                    ForEach(["Weekly", "Monthly", "Quarterly", "Yearly"], id: \.self) { Text($0) }
                }
                .pickerStyle(.segmented)

                switch horizon {
                case "Monthly": monthlyContent
                case "Quarterly": quarterlyContent
                case "Yearly": yearlyContent
                default: weeklyContent
                }
            }
            .padding()
        }
        .background(Theme.ivory)
        .navigationTitle("Forecasts")
        .onAppear { loadAll() }
    }

    private func loadAll() {
        if weekly.value == nil { weekly.run { try await APIClient.shared.get("/forecast/weekly") } }
        if monthly.value == nil { monthly.run { try await APIClient.shared.get("/forecast/monthly") } }
        if quarterly.value == nil { quarterly.run { try await APIClient.shared.get("/forecast/quarterly") } }
        if yearly.value == nil { yearly.run { try await APIClient.shared.get("/forecast/yearly") } }
    }

    @ViewBuilder
    private var quarterlyContent: some View {
        if let error = quarterly.error { ErrorBanner(message: error) }
        if quarterly.isLoading { ProgressView().padding(40) }
        if let forecast = quarterly.value {
            SectionCard(title: "Strategic Theme", subtitle: "\(forecast.startDate) → \(forecast.endDate)") {
                Text(forecast.strategicTheme).font(.footnote)
            }
            SectionCard(title: "Month by Month") {
                ForEach(forecast.monthlyThemes) { month in
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(month.month) — house \(month.profectedHouse)").font(.caption.bold())
                        Text(month.theme).font(.caption2).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 3)
                }
            }
            SectionCard(title: "Launch Windows") {
                ForEach(forecast.launchWindows, id: \.self) { window in
                    Label(window, systemImage: "arrow.up.forward.circle").font(.caption)
                }
            }
            SectionCard(title: "Caution Windows") {
                ForEach(forecast.cautionWindows, id: \.self) { window in
                    Label(window, systemImage: "exclamationmark.triangle").font(.caption).foregroundStyle(.secondary)
                }
            }
            if !forecast.exactTransits.isEmpty {
                SectionCard(title: "Exact Transit Hits") {
                    ForEach(forecast.exactTransits) { event in
                        HStack {
                            Text(event.date).font(.caption2.monospacedDigit()).frame(width: 78, alignment: .leading)
                            Text("\(event.transiting) \(event.aspect) \(event.natal)").font(.caption)
                            if event.retrograde { Text("℞").font(.caption2).foregroundStyle(Theme.plumLight) }
                            if event.pass > 1 { Text("pass \(event.pass)").font(.caption2).foregroundStyle(Theme.gold) }
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var weeklyContent: some View {
        if let error = weekly.error { ErrorBanner(message: error) }
        if weekly.isLoading { ProgressView().padding(40) }
        if let forecast = weekly.value {
            SectionCard(title: "Momentum") {
                Text(forecast.momentum).font(.footnote)
            }
            SectionCard(title: "Best Days") {
                ForEach(forecast.bestDays.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                    HStack {
                        Text(key.capitalized).font(.caption.bold())
                        Spacer()
                        Text(value).font(.caption.monospacedDigit()).foregroundStyle(Theme.gold)
                    }
                    .padding(.vertical, 2)
                }
            }
            SectionCard(title: "Day by Day") {
                ForEach(forecast.days) { day in
                    HStack(spacing: 10) {
                        Text(String(day.date.suffix(5)))
                            .font(.caption.monospacedDigit())
                            .frame(width: 44, alignment: .leading)
                        ScoreBar(label: "", score: day.scores.overall)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var monthlyContent: some View {
        if let error = monthly.error { ErrorBanner(message: error) }
        if monthly.isLoading { ProgressView().padding(40) }
        if let forecast = monthly.value {
            SectionCard(title: "Year Theme (Profection)", subtitle: "Age \(forecast.annualProfection.age) — \(forecast.annualProfection.profectedHouse)th house year, lord \(forecast.annualProfection.yearLord)") {
                Text(forecast.annualProfection.theme).font(.footnote)
            }
            SectionCard(title: "This Month's Focus", subtitle: "\(forecast.monthlyProfection.profectedHouse)th house · \(forecast.monthlyProfection.profectedSign)") {
                Text(forecast.monthlyProfection.theme).font(.footnote)
            }
            SectionCard(title: "Lunations Ahead") {
                ForEach(forecast.lunations) { lunation in
                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            Text("\(lunation.type) in \(lunation.sign)").font(.caption.bold())
                            if lunation.isEclipse {
                                Text(lunation.eclipseType ?? "Eclipse")
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 6)
                                    .background(Capsule().fill(Theme.gold.opacity(0.25)))
                            }
                            Spacer()
                            Text(String(lunation.date.prefix(10))).font(.caption2).foregroundStyle(.secondary)
                        }
                        if let guidance = lunation.guidance {
                            Text(guidance).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 3)
                }
            }
            SectionCard(title: "Timing Guide") {
                ForEach(forecast.bestFor.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(key.capitalized).font(.caption.bold())
                        Text(value).font(.caption2).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }

    @ViewBuilder
    private var yearlyContent: some View {
        if let error = yearly.error { ErrorBanner(message: error) }
        if yearly.isLoading { ProgressView().padding(40) }
        if let forecast = yearly.value {
            SectionCard(title: "Age \(forecast.age) · Personal Year \(forecast.personalYear)") {
                Text(forecast.profection.theme).font(.footnote)
                Text("Solar return: \(String(forecast.solarReturn.prefix(10))) · Next lunar return: \(String(forecast.nextLunarReturn.prefix(10)))")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            SectionCard(title: "Major Lessons") {
                ForEach(forecast.majorLessons, id: \.self) { lesson in
                    Label(lesson, systemImage: "graduationcap").font(.footnote)
                }
            }
            SectionCard(title: "Progressed Positions") {
                ForEach(forecast.progressions) { progression in
                    HStack {
                        Text(progression.body).font(.caption.bold())
                        Text("in \(progression.sign)").font(.caption)
                        if progression.changedSign {
                            Text("new sign").font(.caption2).foregroundStyle(Theme.gold)
                        }
                        Spacer()
                    }
                }
            }
        }
    }
}
