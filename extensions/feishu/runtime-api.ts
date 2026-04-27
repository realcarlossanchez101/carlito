// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  CarlitoConfig,
  CarlitoPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "carlito/plugin-sdk/core";
export type { CarlitoConfig as ClawdbotConfig } from "carlito/plugin-sdk/core";
export type { RuntimeEnv } from "carlito/plugin-sdk/runtime";
export type { GroupToolPolicyConfig } from "carlito/plugin-sdk/config-runtime";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "carlito/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "carlito/plugin-sdk/channel-status";
export { buildAgentMediaPayload } from "carlito/plugin-sdk/agent-media-payload";
export { createChannelPairingController } from "carlito/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "carlito/plugin-sdk/channel-reply-pipeline";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "carlito/plugin-sdk/config-runtime";
export { loadSessionStore, resolveSessionStoreEntry } from "carlito/plugin-sdk/config-runtime";
export { readJsonFileWithFallback } from "carlito/plugin-sdk/json-store";
export { createPersistentDedupe } from "carlito/plugin-sdk/persistent-dedupe";
export { normalizeAgentId } from "carlito/plugin-sdk/routing";
export { chunkTextForOutbound } from "carlito/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "carlito/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
