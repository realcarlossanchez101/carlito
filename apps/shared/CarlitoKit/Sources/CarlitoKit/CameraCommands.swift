import Foundation

public enum CarlitoCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum CarlitoCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum CarlitoCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum CarlitoCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct CarlitoCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: CarlitoCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: CarlitoCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: CarlitoCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: CarlitoCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct CarlitoCameraClipParams: Codable, Sendable, Equatable {
    public var facing: CarlitoCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: CarlitoCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: CarlitoCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: CarlitoCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
