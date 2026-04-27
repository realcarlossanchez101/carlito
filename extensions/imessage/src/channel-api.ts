import { formatTrimmedAllowFromEntries } from "carlito/plugin-sdk/channel-config-helpers";
import type { ChannelStatusIssue } from "carlito/plugin-sdk/channel-contract";
import { PAIRING_APPROVED_MESSAGE } from "carlito/plugin-sdk/channel-status";
import {
  DEFAULT_ACCOUNT_ID,
  getChatChannelMeta,
  type ChannelPlugin,
  type CarlitoConfig,
} from "carlito/plugin-sdk/core";
import { resolveChannelMediaMaxBytes } from "carlito/plugin-sdk/media-runtime";
import { collectStatusIssuesFromLastError } from "carlito/plugin-sdk/status-helpers";
import {
  resolveIMessageConfigAllowFrom,
  resolveIMessageConfigDefaultTo,
} from "./config-accessors.js";
import { looksLikeIMessageTargetId, normalizeIMessageMessagingTarget } from "./normalize.js";
export { chunkTextForOutbound } from "carlito/plugin-sdk/text-chunking";

export {
  collectStatusIssuesFromLastError,
  DEFAULT_ACCOUNT_ID,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  looksLikeIMessageTargetId,
  normalizeIMessageMessagingTarget,
  PAIRING_APPROVED_MESSAGE,
  resolveChannelMediaMaxBytes,
  resolveIMessageConfigAllowFrom,
  resolveIMessageConfigDefaultTo,
};

export type { ChannelPlugin, ChannelStatusIssue, CarlitoConfig };
