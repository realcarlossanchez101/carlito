// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "carlito/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "carlito/plugin-sdk/channel-core";
export type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
export type { PluginRuntime } from "carlito/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "carlito/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "carlito/plugin-sdk/config-runtime";
export type { OutboundReplyPayload } from "carlito/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "carlito/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "carlito/plugin-sdk/channel-config-primitives";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "carlito/plugin-sdk/channel-status";
export { createChannelPairingController } from "carlito/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "carlito/plugin-sdk/channel-lifecycle";
export {
  readStoreAllowFromForDmPolicy,
  resolveEffectiveAllowFromLists,
} from "carlito/plugin-sdk/channel-policy";
export { resolveControlCommandGate } from "carlito/plugin-sdk/command-auth";
export { dispatchInboundReplyWithBase } from "carlito/plugin-sdk/inbound-reply-dispatch";
export { chunkTextForOutbound } from "carlito/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "carlito/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  isDangerousNameMatchingEnabled,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "carlito/plugin-sdk/config-runtime";
export { logInboundDrop } from "carlito/plugin-sdk/channel-inbound";
