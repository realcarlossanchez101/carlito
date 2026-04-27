// swift-tools-version: 6.2
// Package manifest for the Carlito macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Carlito",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "CarlitoIPC", targets: ["CarlitoIPC"]),
        .library(name: "CarlitoDiscovery", targets: ["CarlitoDiscovery"]),
        .executable(name: "Carlito", targets: ["Carlito"]),
        .executable(name: "carlito-mac", targets: ["CarlitoMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.4.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.10.1"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.9.0"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/CarlitoKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "CarlitoIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "CarlitoDiscovery",
            dependencies: [
                .product(name: "CarlitoKit", package: "CarlitoKit"),
            ],
            path: "Sources/CarlitoDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Carlito",
            dependencies: [
                "CarlitoIPC",
                "CarlitoDiscovery",
                .product(name: "CarlitoKit", package: "CarlitoKit"),
                .product(name: "CarlitoChatUI", package: "CarlitoKit"),
                .product(name: "CarlitoProtocol", package: "CarlitoKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/Carlito.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "CarlitoMacCLI",
            dependencies: [
                "CarlitoDiscovery",
                .product(name: "CarlitoKit", package: "CarlitoKit"),
                .product(name: "CarlitoProtocol", package: "CarlitoKit"),
            ],
            path: "Sources/CarlitoMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "CarlitoIPCTests",
            dependencies: [
                "CarlitoIPC",
                "Carlito",
                "CarlitoDiscovery",
                .product(name: "CarlitoProtocol", package: "CarlitoKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
