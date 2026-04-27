// Private runtime barrel for the bundled Zalo Personal extension.
// Keep this barrel thin and aligned with the local extension surface.

export * from "./api.js";
export { setZalouserRuntime } from "./src/runtime.js";
export type { ReplyPayload } from "carlito/plugin-sdk/reply-runtime";
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionAdapter,
  ChannelStatusIssue,
} from "carlito/plugin-sdk/channel-contract";
export type {
  CarlitoConfig,
  GroupToolPolicyConfig,
  MarkdownTableMode,
} from "carlito/plugin-sdk/config-runtime";
export type {
  PluginRuntime,
  AnyAgentTool,
  ChannelPlugin,
  CarlitoPluginToolContext,
} from "carlito/plugin-sdk/core";
export type { RuntimeEnv } from "carlito/plugin-sdk/runtime";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  normalizeAccountId,
} from "carlito/plugin-sdk/core";
export { chunkTextForOutbound } from "carlito/plugin-sdk/text-chunking";
export {
  isDangerousNameMatchingEnabled,
  resolveDefaultGroupPolicy,
  resolveOpenProviderRuntimeGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "carlito/plugin-sdk/config-runtime";
export {
  mergeAllowlist,
  summarizeMapping,
  formatAllowFromLowercase,
} from "carlito/plugin-sdk/allow-from";
export { resolveInboundMentionDecision } from "carlito/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "carlito/plugin-sdk/channel-pairing";
export { createChannelReplyPipeline } from "carlito/plugin-sdk/channel-reply-pipeline";
export { buildBaseAccountStatusSnapshot } from "carlito/plugin-sdk/status-helpers";
export { resolveSenderCommandAuthorization } from "carlito/plugin-sdk/command-auth";
export {
  evaluateGroupRouteAccessForPolicy,
  resolveSenderScopedGroupPolicy,
} from "carlito/plugin-sdk/group-access";
export { loadOutboundMediaFromUrl } from "carlito/plugin-sdk/outbound-media";
export {
  deliverTextOrMediaReply,
  isNumericTargetId,
  resolveSendableOutboundReplyParts,
  sendPayloadWithChunkedTextAndMedia,
  type OutboundReplyPayload,
} from "carlito/plugin-sdk/reply-payload";
export { resolvePreferredCarlitoTmpDir } from "carlito/plugin-sdk/browser-security-runtime";
