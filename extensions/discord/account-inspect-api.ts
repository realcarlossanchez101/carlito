import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
import { inspectDiscordAccount } from "./src/account-inspect.js";

export function inspectDiscordReadOnlyAccount(cfg: CarlitoConfig, accountId?: string | null) {
  return inspectDiscordAccount({ cfg, accountId });
}
