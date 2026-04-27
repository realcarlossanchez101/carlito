// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "CarlitoKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "CarlitoProtocol", targets: ["CarlitoProtocol"]),
        .library(name: "CarlitoKit", targets: ["CarlitoKit"]),
        .library(name: "CarlitoChatUI", targets: ["CarlitoChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "CarlitoProtocol",
            path: "Sources/CarlitoProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "CarlitoKit",
            dependencies: [
                "CarlitoProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/CarlitoKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "CarlitoChatUI",
            dependencies: [
                "CarlitoKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/CarlitoChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "CarlitoKitTests",
            dependencies: ["CarlitoKit", "CarlitoChatUI"],
            path: "Tests/CarlitoKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
