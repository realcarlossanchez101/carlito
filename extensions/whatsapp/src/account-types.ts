import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<CarlitoConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
