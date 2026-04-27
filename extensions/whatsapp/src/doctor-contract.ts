import type { ChannelDoctorConfigMutation } from "carlito/plugin-sdk/channel-contract";
import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
import { normalizeCompatibilityConfig as normalizeCompatibilityConfigImpl } from "./doctor.js";

export function normalizeCompatibilityConfig({
  cfg,
}: {
  cfg: CarlitoConfig;
}): ChannelDoctorConfigMutation {
  return normalizeCompatibilityConfigImpl({ cfg });
}
