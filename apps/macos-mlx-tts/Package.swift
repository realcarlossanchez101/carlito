// swift-tools-version: 6.2
// Isolated MLX TTS helper package. Keep this out of apps/macos/Package.swift so
// normal macOS app tests do not compile the full MLX audio stack.

import PackageDescription

let package = Package(
    name: "CarlitoMLXTTS",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .executable(name: "carlito-mlx-tts", targets: ["CarlitoMLXTTSHelper"]),
    ],
    dependencies: [
        .package(url: "https://github.com/Blaizzy/mlx-audio-swift", exact: "0.1.2"),
    ],
    targets: [
        .executableTarget(
            name: "CarlitoMLXTTSHelper",
            dependencies: [
                .product(name: "MLXAudioTTS", package: "mlx-audio-swift"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
    ])
