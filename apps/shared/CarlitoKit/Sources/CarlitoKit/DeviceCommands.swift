import Foundation

public enum CarlitoDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum CarlitoBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum CarlitoThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum CarlitoNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum CarlitoNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct CarlitoBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: CarlitoBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: CarlitoBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct CarlitoThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: CarlitoThermalState

    public init(state: CarlitoThermalState) {
        self.state = state
    }
}

public struct CarlitoStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct CarlitoNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: CarlitoNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [CarlitoNetworkInterfaceType]

    public init(
        status: CarlitoNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [CarlitoNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct CarlitoDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: CarlitoBatteryStatusPayload
    public var thermal: CarlitoThermalStatusPayload
    public var storage: CarlitoStorageStatusPayload
    public var network: CarlitoNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: CarlitoBatteryStatusPayload,
        thermal: CarlitoThermalStatusPayload,
        storage: CarlitoStorageStatusPayload,
        network: CarlitoNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct CarlitoDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
