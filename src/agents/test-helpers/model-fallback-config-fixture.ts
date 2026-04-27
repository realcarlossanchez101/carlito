import type { CarlitoConfig } from "../../config/types.carlito.js";

export function makeModelFallbackCfg(overrides: Partial<CarlitoConfig> = {}): CarlitoConfig {
  return {
    agents: {
      defaults: {
        model: {
          primary: "openai/gpt-4.1-mini",
          fallbacks: ["anthropic/claude-haiku-3-5"],
        },
      },
    },
    ...overrides,
  } as CarlitoConfig;
}
