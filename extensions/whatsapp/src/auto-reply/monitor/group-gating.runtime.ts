export {
  implicitMentionKindWhen,
  resolveInboundMentionDecision,
} from "carlito/plugin-sdk/channel-inbound";
export { hasControlCommand } from "carlito/plugin-sdk/command-detection";
export { recordPendingHistoryEntryIfEnabled } from "carlito/plugin-sdk/reply-history";
export { parseActivationCommand } from "carlito/plugin-sdk/reply-runtime";
export { normalizeE164 } from "../../text-runtime.js";
