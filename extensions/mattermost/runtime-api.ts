// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  CarlitoConfig,
  CarlitoPluginApi,
  PluginRuntime,
} from "carlito/plugin-sdk/core";
export type { RuntimeEnv } from "carlito/plugin-sdk/runtime";
export type { ReplyPayload } from "carlito/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "carlito/plugin-sdk/command-auth";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "carlito/plugin-sdk/config-runtime";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "carlito/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "carlito/plugin-sdk/channel-status";
export { createAccountStatusSink } from "carlito/plugin-sdk/channel-lifecycle";
export { buildAgentMediaPayload } from "carlito/plugin-sdk/agent-media-payload";
export {
  buildModelsProviderData,
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "carlito/plugin-sdk/command-auth";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  isDangerousNameMatchingEnabled,
  loadSessionStore,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  resolveStorePath,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "carlito/plugin-sdk/config-runtime";
export { formatInboundFromLabel } from "carlito/plugin-sdk/channel-inbound";
export { logInboundDrop } from "carlito/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "carlito/plugin-sdk/channel-pairing";
export {
  DM_GROUP_ACCESS_REASON,
  readStoreAllowFromForDmPolicy,
  resolveDmGroupAccessWithLists,
  resolveEffectiveAllowFromLists,
} from "carlito/plugin-sdk/channel-policy";
export { evaluateSenderGroupAccessForPolicy } from "carlito/plugin-sdk/group-access";
export { createChannelReplyPipeline } from "carlito/plugin-sdk/channel-reply-pipeline";
export { logTypingFailure } from "carlito/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "carlito/plugin-sdk/outbound-media";
export { rawDataToString } from "carlito/plugin-sdk/browser-node-runtime";
export { chunkTextForOutbound } from "carlito/plugin-sdk/text-chunking";
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "carlito/plugin-sdk/reply-history";
export { normalizeAccountId, resolveThreadSessionKeys } from "carlito/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "carlito/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "carlito/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "carlito/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "carlito/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "carlito/plugin-sdk/media-runtime";
export { normalizeProviderId } from "carlito/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
