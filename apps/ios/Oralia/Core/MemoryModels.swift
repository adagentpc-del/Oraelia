import Foundation

// MARK: - Persistent memory

struct MemoryItemModel: Decodable, Identifiable {
    let id: Int
    let sourceType: String
    let sourceId: Int?
    let memoryType: String
    let lifeArea: String
    let title: String
    let summary: String
    let eventDate: String?
    let emotion: String?
    let people: [String]
    let places: [String]
    let goals: [String]
    let tags: [String]
    let confidence: Int
    let active: Bool
    let userConfirmed: Bool
}

struct MemoryResponse: Decodable {
    let memories: [MemoryItemModel]
}

struct MemorySummaryResponse: Decodable {
    let total: Int
    let byArea: [String: Int]
    let recent: [MemoryItemModel]
    let note: String?
}

struct BrainDumpModel: Decodable, Identifiable {
    let id: Int
    let date: String
    let inputMode: String
    let rawText: String
    let extractedSummary: String
    let primaryLifeArea: String
    let emotion: String?
    let urgency: String
    let extractedGoals: [String]
    let extractedPeople: [String]
    let extractedPlaces: [String]
    let shouldCreateMemory: Bool
}

struct BrainDumpExtraction: Decodable {
    let summary: String
    let lifeArea: String
    let emotion: String?
    let urgency: String
    let goals: [String]
    let people: [String]
    let places: [String]
    let tags: [String]
}

struct SuggestedReminderModel: Decodable {
    let title: String
    let body: String
    let relatedLifeArea: String
    let reminderType: String
}

struct BrainDumpResponse: Decodable {
    let brainDump: BrainDumpModel
    let memory: MemoryItemModel
    let extraction: BrainDumpExtraction
    let todayAdjustment: String
    let suggestedReminder: SuggestedReminderModel?
}

// MARK: - Reminders

struct OraliaReminderModel: Decodable, Identifiable {
    let id: Int
    let title: String
    let body: String
    let scheduledAt: String
    let localTimeLabel: String
    let reminderType: String
    let relatedGoalId: Int?
    let relatedMemoryId: Int?
    let relatedLifeArea: String
    let sound: String
    let repeatRule: String?
    let enabled: Bool
}

struct RemindersResponse: Decodable {
    let reminders: [OraliaReminderModel]
}

// MARK: - Address numerology

struct AddressProfileModel: Decodable, Identifiable {
    let id: Int
    let label: String
    let addressInput: String
    let addressNumber: Int
    let context: String
    let locationType: String
    let startDate: String?
    let endDate: String?
    let bestUse: String?
    let focusToday: String?
    let watchOut: String?
}

struct AddressProfilesResponse: Decodable {
    let addresses: [AddressProfileModel]
}

struct AddressScoreModel: Decodable {
    let input: String?
    let context: String?
    let value: Int
    let isMaster: Bool?
    let karmicDebt: Bool?
    let rating: Int?
    let notes: String?
}

struct AddressTodayModel: Decodable {
    let personalDay: Int
    let focus: String?
}

struct AddressCreateResponse: Decodable {
    let address: AddressProfileModel
    let memory: MemoryItemModel
    let score: AddressScoreModel
    let meaning: NumberMeaning?
    let today: AddressTodayModel
}
