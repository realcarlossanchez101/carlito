import CoreLocation
import Foundation
import CarlitoKit
import UIKit

typealias CarlitoCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias CarlitoCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: CarlitoCameraSnapParams) async throws -> CarlitoCameraSnapResult
    func clip(params: CarlitoCameraClipParams) async throws -> CarlitoCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: CarlitoLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: CarlitoLocationGetParams,
        desiredAccuracy: CarlitoLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: CarlitoLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> CarlitoDeviceStatusPayload
    func info() -> CarlitoDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: CarlitoPhotosLatestParams) async throws -> CarlitoPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: CarlitoContactsSearchParams) async throws -> CarlitoContactsSearchPayload
    func add(params: CarlitoContactsAddParams) async throws -> CarlitoContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: CarlitoCalendarEventsParams) async throws -> CarlitoCalendarEventsPayload
    func add(params: CarlitoCalendarAddParams) async throws -> CarlitoCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: CarlitoRemindersListParams) async throws -> CarlitoRemindersListPayload
    func add(params: CarlitoRemindersAddParams) async throws -> CarlitoRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: CarlitoMotionActivityParams) async throws -> CarlitoMotionActivityPayload
    func pedometer(params: CarlitoPedometerParams) async throws -> CarlitoPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchExecApprovalResolveEvent: Sendable, Equatable {
    var replyId: String
    var approvalId: String
    var decision: CarlitoWatchExecApprovalDecision
    var sentAtMs: Int?
    var transport: String
}

struct WatchExecApprovalSnapshotRequestEvent: Sendable, Equatable {
    var requestId: String
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setStatusHandler(_ handler: (@Sendable (WatchMessagingStatus) -> Void)?)
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func setExecApprovalResolveHandler(_ handler: (@Sendable (WatchExecApprovalResolveEvent) -> Void)?)
    func setExecApprovalSnapshotRequestHandler(
        _ handler: (@Sendable (WatchExecApprovalSnapshotRequestEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: CarlitoWatchNotifyParams) async throws -> WatchNotificationSendResult
    func sendExecApprovalPrompt(
        _ message: CarlitoWatchExecApprovalPromptMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalResolved(
        _ message: CarlitoWatchExecApprovalResolvedMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalExpired(
        _ message: CarlitoWatchExecApprovalExpiredMessage) async throws -> WatchNotificationSendResult
    func syncExecApprovalSnapshot(
        _ message: CarlitoWatchExecApprovalSnapshotMessage) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
