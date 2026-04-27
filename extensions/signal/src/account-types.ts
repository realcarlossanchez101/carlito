import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";

export type SignalAccountConfig = Omit<
  Exclude<NonNullable<CarlitoConfig["channels"]>["signal"], undefined>,
  "accounts"
>;
