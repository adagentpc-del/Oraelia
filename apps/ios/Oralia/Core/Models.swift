import Foundation

// MARK: - Natal chart

struct ChartResponse: Decodable {
    let chart: NatalChart
    let approximateLocation: Bool?
}

struct NatalChart: Decodable {
    let isDayChart: Bool
    let houseSystem: String
    let houses: HouseData
    let bodies: [PlacedBody]
    let aspects: [Aspect]
    let patterns: [AspectPattern]
    let shape: ChartShape
    let balance: ChartBalance
    let chartRuler: String
    let ascendantSign: String
    let sunSign: String
    let moonSign: String
    let dominantPlanets: [DominantPlanet]
    let arabicParts: ArabicParts
    let moonPhase: MoonPhase
}

struct HouseData: Decodable {
    let system: String
    let cusps: [Double]
    let angles: Angles
}

struct Angles: Decodable {
    let ascendant: Double
    let midheaven: Double
    let descendant: Double
    let imumCoeli: Double
    let vertex: Double
}

struct PlacedBody: Decodable, Identifiable {
    let body: String
    let longitude: Double
    let speed: Double
    let retrograde: Bool
    let outOfBounds: Bool
    let sign: String
    let degreeInSign: Double
    let formatted: String
    let house: Int
    let dignity: String
    let angular: Bool
    let anaretic: Bool
    let criticalDegree: Bool
    let strength: Int

    var id: String { body }
}

struct Aspect: Decodable, Identifiable {
    let a: String
    let b: String
    let type: String
    let orb: Double
    let applying: Bool
    let intensity: Double
    let harmonyScore: Double
    let major: Bool

    var id: String { "\(a)-\(type)-\(b)" }
}

struct AspectPattern: Decodable, Identifiable {
    let type: String
    let bodies: [String]
    let focal: String?
    let description: String

    var id: String { "\(type)-\(bodies.joined(separator: ","))" }
}

struct ChartShape: Decodable {
    let shape: String
    let description: String
}

struct ChartBalance: Decodable {
    let elements: [String: Int]
    let modalities: [String: Int]
    let dominantElement: String
    let dominantModality: String
    let missingElements: [String]
}

struct DominantPlanet: Decodable, Identifiable {
    let body: String
    let score: Int
    var id: String { body }
}

struct ArabicParts: Decodable {
    let fortune: Double
    let spirit: Double
}

struct MoonPhase: Decodable {
    let angle: Double
    let name: String
    let illumination: Double
}

// MARK: - Forecast

struct CategoryScores: Decodable {
    let overall: Int
    let career: Int
    let relationships: Int
    let money: Int
    let health: Int
    let communication: Int
    let creativity: Int
    let luck: Int
    let productivity: Int
    let decisionScore: Int
    let emotionalEnergy: Int
}

struct PowerHour: Decodable, Identifiable {
    let hourIndex: Int
    let ruler: String
    let label: String
    let good: String
    var id: Int { hourIndex }
}

struct RetrogradeStatus: Decodable, Identifiable {
    let body: String
    let retrograde: Bool
    let sign: String
    var id: String { body }
}

struct Transit: Decodable, Identifiable {
    let transiting: String
    let natal: String
    let type: String
    let orb: Double
    let intensity: Double
    let harmonyScore: Double
    var id: String { "\(transiting)-\(type)-\(natal)" }
}

struct DailyForecast: Decodable {
    let date: String
    let scores: CategoryScores
    let powerHours: [PowerHour]
    let personalDay: Int
    let retrogrades: [RetrogradeStatus]
    let opportunities: [String]
    let risks: [String]
    let recommendedActions: [String]
    let avoid: [String]
    let transits: [Transit]
}

struct WeeklyDay: Decodable, Identifiable {
    let date: String
    let scores: CategoryScores
    var id: String { date }
}

struct WeeklyForecast: Decodable {
    let days: [WeeklyDay]
    let bestDays: [String: String]
    let momentum: String
}

struct Profection: Decodable {
    let age: Int
    let profectedHouse: Int
    let profectedSign: String
    let yearLord: String
    let theme: String
}

struct Lunation: Decodable, Identifiable {
    let date: String
    let type: String
    let sign: String
    let isEclipse: Bool
    let eclipseType: String?
    let natalHouse: Int?
    let guidance: String?
    var id: String { date + type }
}

struct MonthlyForecast: Decodable {
    let annualProfection: Profection
    let monthlyProfection: Profection
    let lunations: [Lunation]
    let retrogrades: [RetrogradeStatus]
    let bestFor: [String: String]
}

struct ProgressedPosition: Decodable, Identifiable {
    let body: String
    let sign: String
    let changedSign: Bool
    var id: String { body }
}

struct YearlyForecast: Decodable {
    let age: Int
    let profection: Profection
    let personalYear: Int
    let solarReturn: String
    let nextLunarReturn: String
    let progressions: [ProgressedPosition]
    let majorLessons: [String]
}

// MARK: - Astrocartography

struct CityScoreValues: Decodable {
    let career: Int
    let love: Int
    let money: Int
    let creativity: Int
    let family: Int
    let health: Int
    let visibility: Int
    let spirituality: Int
    let adventure: Int
    let business: Int
    let overall: Int
}

struct LineInfluence: Decodable, Identifiable {
    let body: String
    let kind: String
    let orb: Double
    let strength: Int
    var id: String { "\(body)-\(kind)" }
}

struct CityScore: Decodable, Identifiable {
    let city: String
    let country: String
    let latitude: Double
    let longitude: Double
    let influences: [LineInfluence]
    let scores: CityScoreValues
    let relocatedAscendant: String
    let relocatedMidheaven: String
    let summary: String
    var id: String { city }
}

struct BestCity: Decodable, Identifiable {
    let city: String
    let country: String
    let score: Int
    var id: String { city }
}

struct AstroMapResponse: Decodable {
    let cities: [CityScore]
    let bestFor: [String: [BestCity]]
}

// MARK: - Synastry

struct SynastryScores: Decodable {
    let chemistry: Int
    let communication: Int
    let emotional: Int
    let longTermStability: Int
    let sharedPurpose: Int
    let passion: Int
    let friendship: Int
    let business: Int
    let conflictRisk: Int
    let growth: Int
    let overall: Int
}

struct SynastryData: Decodable {
    let scores: SynastryScores
    let greenFlags: [String]
    let redFlags: [String]
    let keyContacts: [String]
    let davisonDate: String
}

struct SynastryResponse: Decodable {
    let synastry: SynastryData
    let personName: String?
}

// MARK: - Numerology

struct CoreNumbers: Decodable {
    let lifePath: Int
    let lifePathKarmicDebt: Int?
    let expression: Int
    let soulUrge: Int
    let personality: Int
    let birthday: Int
    let maturity: Int
    let isMasterLifePath: Bool
}

struct NumberMeaning: Decodable {
    let title: String
    let strengths: String
    let shadow: String
    let career: String
}

struct PersonalCycles: Decodable {
    let personalYear: Int
    let personalMonth: Int
    let personalDay: Int
}

struct Pinnacle: Decodable, Identifiable {
    let number: Int
    let fromAge: Int
    let toAge: Int?
    var id: Int { fromAge }
}

struct NumerologyResponse: Decodable {
    let core: CoreNumbers
    let meanings: [String: NumberMeaning]
    let challenges: [Int]
    let pinnacles: [Pinnacle]
    let personal: PersonalCycles
}

struct NameScoreResponse: Decodable {
    let name: String
    let value: Int
    let isMaster: Bool
    let karmicDebt: Bool
    let rating: Int
    let notes: String
    let meaning: NumberMeaning?
}

struct LaunchDateScore: Decodable, Identifiable {
    let date: String
    let universalDay: Int
    let personalDay: Int
    let score: Int
    let reasons: [String]
    var id: String { date }
}

struct LaunchDatesResponse: Decodable {
    let best: [LaunchDateScore]
    let worst: [LaunchDateScore]
}

// MARK: - Human Design

struct HDChannel: Decodable, Identifiable {
    let gates: [Int]
    let name: String
    var id: String { name }
}

struct HumanDesign: Decodable {
    let type: String
    let strategy: String
    let authority: String
    let authorityGuidance: String
    let notSelfTheme: String
    let signature: String
    let profile: String
    let profileName: String
    let definition: String
    let definedCenters: [String]
    let undefinedCenters: [String]
    let channels: [HDChannel]
    let incarnationCross: String
    let digestion: String
    let environment: String
    let motivation: String
    let perspective: String
}

struct HumanDesignResponse: Decodable {
    let design: HumanDesign
    let note: String?
}

// MARK: - Decision engine

struct DecisionFactor: Decodable, Identifiable {
    let factor: String
    let impact: Int
    let explanation: String
    var id: String { factor + String(explanation.prefix(20)) }
}

struct DecisionWindow: Decodable, Identifiable {
    let date: String
    let score: Int
    let reason: String
    var id: String { date }
}

struct DecisionEvaluation: Decodable {
    let question: String
    let category: String
    let opportunityScore: Int
    let riskScore: Int
    let confidence: Int
    let recommendation: String
    let bestWindows: [DecisionWindow]
    let factors: [DecisionFactor]
}

struct DecisionResponse: Decodable {
    let evaluation: DecisionEvaluation
}

// MARK: - Life reports

struct ReportSection: Decodable, Identifiable {
    let heading: String
    let content: String
    var id: String { heading }
}

struct LifeReport: Decodable, Identifiable {
    let category: String
    let title: String
    let headline: String
    let sections: [ReportSection]
    let evidence: [String]
    let actions: [String]
    var id: String { category }
}

struct ReportsResponse: Decodable {
    let reports: [LifeReport]
}

// MARK: - Profile

struct UserProfile: Decodable {
    let fullName: String
    let birthday: String
    let birthTime: String?
    let birthCity: String?
    let birthLatitude: Double?
    let birthLongitude: Double?
    let birthUtcOffset: Double?
    let sunSign: String?
    let lifePathNumber: Int?
}
