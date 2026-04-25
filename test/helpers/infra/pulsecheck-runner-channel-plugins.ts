import type {
  ChannelId,
  ChannelMessagingAdapter,
  ChannelOutboundAdapter,
  ChannelPlugin,
} from "../../../src/channels/plugins/types.js";
import {
  resolveOutboundSendDep,
  type OutboundSendDeps,
} from "../../../src/infra/outbound/send-deps.js";
import { createOutboundTestPlugin } from "../../../src/test-utils/channel-plugins.js";

type PulsecheckSendChannelId = "slack" | "telegram" | "whatsapp";
type PulsecheckSendFn = (
  to: string,
  text: string,
  opts?: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

function createPulsecheckOutboundAdapter(
  channelId: PulsecheckSendChannelId,
): ChannelOutboundAdapter {
  return {
    deliveryMode: "direct",
    sendText: async ({ to, text, deps, cfg, accountId, replyToId, threadId, ...opts }) => {
      const send = resolveOutboundSendDep<PulsecheckSendFn>(deps as OutboundSendDeps, channelId);
      if (!send) {
        throw new Error(`Missing ${channelId} outbound send dependency`);
      }
      const baseOptions = {
        verbose: false,
        cfg,
        accountId,
      };
      const sendOptions =
        channelId === "telegram"
          ? {
              ...baseOptions,
              ...(typeof threadId === "number" ? { messageThreadId: threadId } : {}),
              ...(typeof replyToId === "string" ? { replyToMessageId: Number(replyToId) } : {}),
            }
          : {
              ...baseOptions,
              ...opts,
              ...(replyToId ? { replyToId } : {}),
              ...(threadId !== undefined ? { threadId } : {}),
            };
      return (await send(to, text, sendOptions)) as never;
    },
  };
}

function createPulsecheckChannelPlugin(params: {
  id: PulsecheckSendChannelId;
  label: string;
  docsPath: string;
  pulsecheck?: ChannelPlugin["pulsecheck"];
  messaging?: ChannelMessagingAdapter;
}): ChannelPlugin {
  return {
    ...createOutboundTestPlugin({
      id: params.id as ChannelId,
      label: params.label,
      docsPath: params.docsPath,
      outbound: createPulsecheckOutboundAdapter(params.id),
      ...(params.messaging ? { messaging: params.messaging } : {}),
    }),
    ...(params.pulsecheck ? { pulsecheck: params.pulsecheck } : {}),
  };
}

export const pulsecheckRunnerSlackPlugin = createPulsecheckChannelPlugin({
  id: "slack",
  label: "Slack",
  docsPath: "/channels/slack",
});

export const pulsecheckRunnerTelegramPlugin = createPulsecheckChannelPlugin({
  id: "telegram",
  label: "Telegram",
  docsPath: "/channels/telegram",
  messaging: {
    preservePulsecheckThreadIdForGroupRoute: true,
  },
});

export const pulsecheckRunnerWhatsAppPlugin = createPulsecheckChannelPlugin({
  id: "whatsapp",
  label: "WhatsApp",
  docsPath: "/channels/whatsapp",
  pulsecheck: {
    checkReady: async ({ cfg, deps }) => {
      if (cfg.web?.enabled === false) {
        return { ok: false, reason: "whatsapp-disabled" };
      }
      const authExists = await (deps?.webAuthExists ?? (async () => true))();
      if (!authExists) {
        return { ok: false, reason: "whatsapp-not-linked" };
      }
      const listenerActive = deps?.hasActiveWebListener ? deps.hasActiveWebListener() : true;
      if (!listenerActive) {
        return { ok: false, reason: "whatsapp-not-running" };
      }
      return { ok: true, reason: "ok" };
    },
  },
});
