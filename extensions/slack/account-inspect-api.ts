import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
import { inspectSlackAccount } from "./src/account-inspect.js";

export function inspectSlackReadOnlyAccount(cfg: CarlitoConfig, accountId?: string | null) {
  return inspectSlackAccount({ cfg, accountId });
}
