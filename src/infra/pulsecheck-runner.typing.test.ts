import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChannelPlugin } from "../channels/plugins/types.public.js";
import type { CarlitoConfig } from "../config/config.js";
import { setActivePluginRegistry } from "../plugins/runtime.js";
import { createOutboundTestPlugin, createTestRegistry } from "../test-utils/channel-plugins.js";
import { runPulsecheckOnce } from "./pulsecheck-runner.js";
import { seedMainSessionStore, withTempPulsecheckSandbox } from "./pulsecheck-runner.test-utils.js";

const TELEGRAM_TARGET = "-1001234567890";

function installPulsecheckTypingPlugin(params: {
  sendTyping: NonNullable<NonNullable<ChannelPlugin["pulsecheck"]>["sendTyping"]>;
  clearTyping?: NonNullable<ChannelPlugin["pulsecheck"]>["clearTyping"];
}) {
  const plugin: ChannelPlugin = {
    ...createOutboundTestPlugin({
      id: "telegram",
      label: "Telegram",
      docsPath: "/channels/telegram",
      outbound: {
        deliveryMode: "direct",
        sendText: async () => ({ channel: "telegram", messageId: "m1" }),
      },
    }),
    pulsecheck: {
      sendTyping: params.sendTyping,
      ...(params.clearTyping ? { clearTyping: params.clearTyping } : {}),
    },
  };
  setActivePluginRegistry(createTestRegistry([{ pluginId: "telegram", plugin, source: "test" }]));
}

function createPulsecheckConfig(params: {
  tmpDir: string;
  storePath: string;
  session?: CarlitoConfig["session"];
  channelPulsecheck?: Record<string, unknown>;
}): CarlitoConfig {
  return {
    agents: {
      defaults: {
        workspace: params.tmpDir,
        pulsecheck: { every: "5m", target: "telegram" },
      },
    },
    channels: {
      telegram: {
        allowFrom: ["*"],
        ...(params.channelPulsecheck ? { pulsecheck: params.channelPulsecheck } : {}),
      },
    },
    session: {
      store: params.storePath,
      ...params.session,
    },
  } as CarlitoConfig;
}

async function seedTelegramSession(storePath: string, cfg: CarlitoConfig) {
  await seedMainSessionStore(storePath, cfg, {
    lastChannel: "telegram",
    lastProvider: "telegram",
    lastTo: TELEGRAM_TARGET,
  });
}

describe("runPulsecheckOnce pulsecheck typing", () => {
  beforeEach(() => {
    setActivePluginRegistry(createTestRegistry());
  });

  it("starts and clears typing around a pulsecheck run", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const sendTyping = vi.fn(async () => undefined);
      const clearTyping = vi.fn(async () => undefined);
      installPulsecheckTypingPlugin({ sendTyping, clearTyping });
      const cfg = createPulsecheckConfig({ tmpDir, storePath });
      await seedTelegramSession(storePath, cfg);
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        deps: {
          getReplyFromConfig: replySpy,
          getQueueSize: () => 0,
          nowMs: () => 0,
        },
      });

      expect(sendTyping).toHaveBeenCalledWith(
        expect.objectContaining({
          cfg,
          to: TELEGRAM_TARGET,
        }),
      );
      expect(clearTyping).toHaveBeenCalledWith(
        expect.objectContaining({
          cfg,
          to: TELEGRAM_TARGET,
        }),
      );
      expect(sendTyping.mock.invocationCallOrder[0]).toBeLessThan(
        replySpy.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
      );
    });
  });

  it("clears typing when the pulsecheck run fails", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const sendTyping = vi.fn(async () => undefined);
      const clearTyping = vi.fn(async () => undefined);
      installPulsecheckTypingPlugin({ sendTyping, clearTyping });
      const cfg = createPulsecheckConfig({ tmpDir, storePath });
      await seedTelegramSession(storePath, cfg);
      replySpy.mockRejectedValue(new Error("model unavailable"));

      const result = await runPulsecheckOnce({
        cfg,
        deps: {
          getReplyFromConfig: replySpy,
          getQueueSize: () => 0,
          nowMs: () => 0,
        },
      });

      expect(result.status).toBe("failed");
      expect(sendTyping).toHaveBeenCalledTimes(1);
      expect(clearTyping).toHaveBeenCalledTimes(1);
    });
  });

  it("does not type when typingMode is never", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const sendTyping = vi.fn(async () => undefined);
      installPulsecheckTypingPlugin({ sendTyping });
      const cfg = createPulsecheckConfig({
        tmpDir,
        storePath,
        session: { typingMode: "never" },
      });
      await seedTelegramSession(storePath, cfg);
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        deps: {
          getReplyFromConfig: replySpy,
          getQueueSize: () => 0,
          nowMs: () => 0,
        },
      });

      expect(sendTyping).not.toHaveBeenCalled();
    });
  });

  it("does not type when chat pulsecheck delivery is disabled", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const sendTyping = vi.fn(async () => undefined);
      installPulsecheckTypingPlugin({ sendTyping });
      const cfg = createPulsecheckConfig({
        tmpDir,
        storePath,
        channelPulsecheck: { showAlerts: false, showOk: false, useIndicator: true },
      });
      await seedTelegramSession(storePath, cfg);
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        deps: {
          getReplyFromConfig: replySpy,
          getQueueSize: () => 0,
          nowMs: () => 0,
        },
      });

      expect(sendTyping).not.toHaveBeenCalled();
    });
  });
});
