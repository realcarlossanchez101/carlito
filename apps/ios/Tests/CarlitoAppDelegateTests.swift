import Testing
@testable import Carlito

@Suite(.serialized) struct CarlitoAppDelegateTests {
    @Test @MainActor func resolvesRegistryModelBeforeViewTaskAssignsDelegateModel() {
        let registryModel = NodeAppModel()
        CarlitoAppModelRegistry.appModel = registryModel
        defer { CarlitoAppModelRegistry.appModel = nil }

        let delegate = CarlitoAppDelegate()

        #expect(delegate._test_resolvedAppModel() === registryModel)
    }

    @Test @MainActor func prefersExplicitDelegateModelOverRegistryFallback() {
        let registryModel = NodeAppModel()
        let explicitModel = NodeAppModel()
        CarlitoAppModelRegistry.appModel = registryModel
        defer { CarlitoAppModelRegistry.appModel = nil }

        let delegate = CarlitoAppDelegate()
        delegate.appModel = explicitModel

        #expect(delegate._test_resolvedAppModel() === explicitModel)
    }
}
