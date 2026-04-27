import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-carlito writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.carlito.mac"
let gatewayLaunchdLabel = "ai.carlito.gateway"
let onboardingVersionKey = "carlito.onboardingVersion"
let onboardingSeenKey = "carlito.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "carlito.pauseEnabled"
let iconAnimationsEnabledKey = "carlito.iconAnimationsEnabled"
let swabbleEnabledKey = "carlito.swabbleEnabled"
let swabbleTriggersKey = "carlito.swabbleTriggers"
let voiceWakeTriggerChimeKey = "carlito.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "carlito.voiceWakeSendChime"
let showDockIconKey = "carlito.showDockIcon"
let defaultVoiceWakeTriggers = ["carlito"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "carlito.voiceWakeMicID"
let voiceWakeMicNameKey = "carlito.voiceWakeMicName"
let voiceWakeLocaleKey = "carlito.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "carlito.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "carlito.voicePushToTalkEnabled"
let voiceWakeTriggersTalkModeKey = "carlito.voiceWakeTriggersTalkMode"
let talkEnabledKey = "carlito.talkEnabled"
let iconOverrideKey = "carlito.iconOverride"
let connectionModeKey = "carlito.connectionMode"
let remoteTargetKey = "carlito.remoteTarget"
let remoteIdentityKey = "carlito.remoteIdentity"
let remoteProjectRootKey = "carlito.remoteProjectRoot"
let remoteCliPathKey = "carlito.remoteCliPath"
let canvasEnabledKey = "carlito.canvasEnabled"
let cameraEnabledKey = "carlito.cameraEnabled"
let systemRunPolicyKey = "carlito.systemRunPolicy"
let systemRunAllowlistKey = "carlito.systemRunAllowlist"
let systemRunEnabledKey = "carlito.systemRunEnabled"
let locationModeKey = "carlito.locationMode"
let locationPreciseKey = "carlito.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "carlito.peekabooBridgeEnabled"
let deepLinkKeyKey = "carlito.deepLinkKey"
let modelCatalogPathKey = "carlito.modelCatalogPath"
let modelCatalogReloadKey = "carlito.modelCatalogReload"
let cliInstallPromptedVersionKey = "carlito.cliInstallPromptedVersion"
let pulsechecksEnabledKey = "carlito.pulsechecksEnabled"
let debugPaneEnabledKey = "carlito.debugPaneEnabled"
let debugFileLogEnabledKey = "carlito.debug.fileLogEnabled"
let appLogLevelKey = "carlito.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
