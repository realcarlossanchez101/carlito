import {
  applyAgentDefaultModelPrimary,
  type CarlitoConfig,
} from "carlito/plugin-sdk/provider-onboard";

export const OPENCODE_GO_DEFAULT_MODEL_REF = "opencode-go/kimi-k2.5";

export function applyOpencodeGoProviderConfig(cfg: CarlitoConfig): CarlitoConfig {
  return cfg;
}

export function applyOpencodeGoConfig(cfg: CarlitoConfig): CarlitoConfig {
  return applyAgentDefaultModelPrimary(
    applyOpencodeGoProviderConfig(cfg),
    OPENCODE_GO_DEFAULT_MODEL_REF,
  );
}
