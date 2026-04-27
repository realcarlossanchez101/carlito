import Foundation
import Testing
@testable import Carlito

@Suite(.serialized) struct NodeServiceManagerTests {
    @Test func `builds node service commands with current CLI shape`() async throws {
        try await TestIsolation.withUserDefaultsValues(["carlito.gatewayProjectRootPath": nil]) {
            let tmp = try makeTempDirForTests()
            CommandResolver.setProjectRoot(tmp.path)

            let carlitoPath = tmp.appendingPathComponent("node_modules/.bin/carlito")
            try makeExecutableForTests(at: carlitoPath)

            let start = NodeServiceManager._testServiceCommand(["start"])
            #expect(start == [carlitoPath.path, "node", "start", "--json"])

            let stop = NodeServiceManager._testServiceCommand(["stop"])
            #expect(stop == [carlitoPath.path, "node", "stop", "--json"])
        }
    }
}
