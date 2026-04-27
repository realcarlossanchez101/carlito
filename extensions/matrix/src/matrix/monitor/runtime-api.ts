// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "carlito/plugin-sdk/channel-location";
export type { PluginRuntime, RuntimeLogger } from "carlito/plugin-sdk/plugin-runtime";
export type { BlockReplyContext, ReplyPayload } from "carlito/plugin-sdk/reply-runtime";
export type { MarkdownTableMode, CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
export type { RuntimeEnv } from "carlito/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  formatAllowlistMatchMeta,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "carlito/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "carlito/plugin-sdk/channel-reply-options-runtime";
export { formatLocationText, toLocationContext } from "carlito/plugin-sdk/channel-location";
export { getAgentScopedMediaLocalRoots } from "carlito/plugin-sdk/agent-media-payload";
export { logInboundDrop, logTypingFailure } from "carlito/plugin-sdk/channel-logging";
export { resolveAckReaction } from "carlito/plugin-sdk/channel-feedback";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "carlito/plugin-sdk/channel-targets";
