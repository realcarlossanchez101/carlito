import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<CarlitoConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
