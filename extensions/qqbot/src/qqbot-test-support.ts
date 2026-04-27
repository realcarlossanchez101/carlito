import type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";

export function makeQqbotSecretRefConfig(): CarlitoConfig {
  return {
    channels: {
      qqbot: {
        appId: "123456",
        clientSecret: {
          source: "env",
          provider: "default",
          id: "QQBOT_CLIENT_SECRET",
        },
      },
    },
  } as CarlitoConfig;
}

export function makeQqbotDefaultAccountConfig(): CarlitoConfig {
  return {
    channels: {
      qqbot: {
        defaultAccount: "bot2",
        accounts: {
          bot2: { appId: "123456" },
        },
      },
    },
  } as CarlitoConfig;
}
