import type { CarlitoConfig } from "./runtime-api.js";
import { inspectTelegramAccount } from "./src/account-inspect.js";

export function inspectTelegramReadOnlyAccount(cfg: CarlitoConfig, accountId?: string | null) {
  return inspectTelegramAccount({ cfg, accountId });
}
