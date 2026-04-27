export type { ChannelPlugin, CarlitoPluginApi, PluginRuntime } from "carlito/plugin-sdk/core";
export type { CarlitoConfig } from "carlito/plugin-sdk/config-runtime";
export type {
  CarlitoPluginService,
  CarlitoPluginServiceContext,
  PluginLogger,
} from "carlito/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/bridge/runtime.js";
