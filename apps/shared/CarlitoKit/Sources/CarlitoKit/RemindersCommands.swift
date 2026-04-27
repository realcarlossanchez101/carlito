import Foundation

public enum CarlitoRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum CarlitoReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct CarlitoRemindersListParams: Codable, Sendable, Equatable {
    public var status: CarlitoReminderStatusFilter?
    public var limit: Int?

    public init(status: CarlitoReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct CarlitoRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct CarlitoReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct CarlitoRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [CarlitoReminderPayload]

    public init(reminders: [CarlitoReminderPayload]) {
        self.reminders = reminders
    }
}

public struct CarlitoRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: CarlitoReminderPayload

    public init(reminder: CarlitoReminderPayload) {
        self.reminder = reminder
    }
}
