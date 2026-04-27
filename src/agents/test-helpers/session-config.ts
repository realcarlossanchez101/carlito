import type { CarlitoConfig } from "../../config/types.carlito.js";

export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<CarlitoConfig["session"]>> = {},
): NonNullable<CarlitoConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
