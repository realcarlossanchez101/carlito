// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "carlito/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "carlito/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "carlito/plugin-sdk/channel-config-primitives";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "carlito/plugin-sdk/channel-contract";
export { missingTargetError } from "carlito/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "carlito/plugin-sdk/channel-lifecycle";
export { createChannelPairingController } from "carlito/plugin-sdk/channel-pairing";
export { createChannelReplyPipeline } from "carlito/plugin-sdk/channel-reply-pipeline";
export {
  evaluateGroupRouteAccessForPolicy,
  resolveDmGroupAccessWithLists,
  resolveSenderScopedGroupPolicy,
} from "carlito/plugin-sdk/channel-policy";
export { PAIRING_APPROVED_MESSAGE } from "carlito/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "carlito/plugin-sdk/text-chunking";
export type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  isDangerousNameMatchingEnabled,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "carlito/plugin-sdk/config-runtime";
export { fetchRemoteMedia, resolveChannelMediaMaxBytes } from "carlito/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "carlito/plugin-sdk/outbound-media";
export type { PluginRuntime } from "carlito/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "carlito/plugin-sdk/ssrf-runtime";
export {
  GoogleChatConfigSchema,
  type GoogleChatAccountConfig,
  type GoogleChatConfig,
} from "carlito/plugin-sdk/googlechat-runtime-shared";
export { extractToolSend } from "carlito/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "carlito/plugin-sdk/channel-inbound";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "carlito/plugin-sdk/inbound-envelope";
export { resolveWebhookPath } from "carlito/plugin-sdk/webhook-path";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "carlito/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "carlito/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
