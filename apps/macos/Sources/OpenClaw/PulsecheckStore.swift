import Foundation
import Observation
import SwiftUI

@MainActor
@Observable
final class PulsecheckStore {
    static let shared = PulsecheckStore()

    private(set) var lastEvent: ControlPulsecheckEvent?

    private var observer: NSObjectProtocol?

    private init() {
        self.observer = NotificationCenter.default.addObserver(
            forName: .controlPulsecheck,
            object: nil,
            queue: .main)
        { [weak self] note in
            guard let data = note.object as? Data else { return }
            if let decoded = try? JSONDecoder().decode(ControlPulsecheckEvent.self, from: data) {
                Task { @MainActor in self?.lastEvent = decoded }
            }
        }

        Task {
            if self.lastEvent == nil {
                if let evt = try? await ControlChannel.shared.lastPulsecheck() {
                    self.lastEvent = evt
                }
            }
        }
    }

    @MainActor
    deinit {
        if let observer { NotificationCenter.default.removeObserver(observer) }
    }
}
