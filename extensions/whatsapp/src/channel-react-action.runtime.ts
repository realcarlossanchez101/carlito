import { readStringOrNumberParam, readStringParam } from "carlito/plugin-sdk/channel-actions";
import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";

export { resolveReactionMessageId } from "carlito/plugin-sdk/channel-actions";
export { handleWhatsAppAction } from "./action-runtime.js";
export { isWhatsAppGroupJid, normalizeWhatsAppTarget } from "./normalize.js";
export { readStringOrNumberParam, readStringParam, type CarlitoConfig };
