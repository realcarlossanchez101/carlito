import fs from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { runPulsecheckOnce, type PulsecheckDeps } from "./pulsecheck-runner.js";
import { installPulsecheckRunnerTestRuntime } from "./pulsecheck-runner.test-harness.js";
import {
  type PulsecheckReplySpy,
  seedMainSessionStore,
  withTempPulsecheckSandbox,
  withTempTelegramPulsecheckSandbox,
} from "./pulsecheck-runner.test-utils.js";

installPulsecheckRunnerTestRuntime();

describe("runPulsecheckOnce ack handling", () => {
  const WHATSAPP_GROUP = "120363140186826074@g.us";
  const TELEGRAM_GROUP = "-1001234567890";

  function createPulsecheckConfig(params: {
    tmpDir: string;
    storePath: string;
    pulsecheck: Record<string, unknown>;
    channels: Record<string, unknown>;
    messages?: Record<string, unknown>;
  }): OpenClawConfig {
    return {
      agents: {
        defaults: {
          workspace: params.tmpDir,
          pulsecheck: params.pulsecheck as never,
        },
      },
      channels: params.channels as never,
      ...(params.messages ? { messages: params.messages as never } : {}),
      session: { store: params.storePath },
    };
  }

  function makeWhatsAppDeps(
    params: {
      sendWhatsApp?: ReturnType<typeof vi.fn>;
      getQueueSize?: () => number;
      nowMs?: () => number;
      webAuthExists?: () => Promise<boolean>;
      hasActiveWebListener?: () => boolean;
    } = {},
  ) {
    return {
      ...(params.sendWhatsApp ? { whatsapp: params.sendWhatsApp as unknown } : {}),
      getQueueSize: params.getQueueSize ?? (() => 0),
      nowMs: params.nowMs ?? (() => 0),
      webAuthExists: params.webAuthExists ?? (async () => true),
      hasActiveWebListener: params.hasActiveWebListener ?? (() => true),
    } satisfies PulsecheckDeps;
  }

  function makeTelegramDeps(
    params: {
      sendTelegram?: ReturnType<typeof vi.fn>;
      getQueueSize?: () => number;
      nowMs?: () => number;
    } = {},
  ) {
    return {
      ...(params.sendTelegram ? { telegram: params.sendTelegram as unknown } : {}),
      getQueueSize: params.getQueueSize ?? (() => 0),
      nowMs: params.nowMs ?? (() => 0),
    } satisfies PulsecheckDeps;
  }

  function createMessageSendSpy(extra: Record<string, unknown> = {}) {
    return vi.fn().mockResolvedValue({
      messageId: "m1",
      toJid: "jid",
      ...extra,
    });
  }

  async function runTelegramPulsecheckWithDefaults(params: {
    tmpDir: string;
    storePath: string;
    replySpy: PulsecheckReplySpy;
    replyText: string;
    messages?: Record<string, unknown>;
    telegramOverrides?: Record<string, unknown>;
  }) {
    const cfg = createPulsecheckConfig({
      tmpDir: params.tmpDir,
      storePath: params.storePath,
      pulsecheck: { every: "5m", target: "telegram" },
      channels: {
        telegram: {
          token: "test-token",
          allowFrom: ["*"],
          pulsecheck: { showOk: false },
          ...params.telegramOverrides,
        },
      },
      ...(params.messages ? { messages: params.messages } : {}),
    });

    await seedMainSessionStore(params.storePath, cfg, {
      lastChannel: "telegram",
      lastProvider: "telegram",
      lastTo: TELEGRAM_GROUP,
    });

    params.replySpy.mockResolvedValue({ text: params.replyText });
    const sendTelegram = createMessageSendSpy();
    await runPulsecheckOnce({
      cfg,
      deps: {
        ...makeTelegramDeps({ sendTelegram }),
        getReplyFromConfig: params.replySpy,
      },
    });
    return sendTelegram;
  }

  function createWhatsAppPulsecheckConfig(params: {
    tmpDir: string;
    storePath: string;
    pulsecheck?: Record<string, unknown>;
    visibility?: Record<string, unknown>;
  }): OpenClawConfig {
    return createPulsecheckConfig({
      tmpDir: params.tmpDir,
      storePath: params.storePath,
      pulsecheck: {
        every: "5m",
        target: "whatsapp",
        ...params.pulsecheck,
      },
      channels: {
        whatsapp: {
          allowFrom: ["*"],
          ...(params.visibility ? { pulsecheck: params.visibility } : {}),
        },
      },
    });
  }

  async function createSeededWhatsAppPulsecheckConfig(params: {
    tmpDir: string;
    storePath: string;
    pulsecheck?: Record<string, unknown>;
    visibility?: Record<string, unknown>;
  }): Promise<OpenClawConfig> {
    const cfg = createWhatsAppPulsecheckConfig(params);
    await seedMainSessionStore(params.storePath, cfg, {
      lastChannel: "whatsapp",
      lastProvider: "whatsapp",
      lastTo: WHATSAPP_GROUP,
    });
    return cfg;
  }

  it("respects ackMaxChars for pulsecheck acks", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg = createWhatsAppPulsecheckConfig({
        tmpDir,
        storePath,
        pulsecheck: { ackMaxChars: 0 },
      });

      await seedMainSessionStore(storePath, cfg, {
        lastChannel: "whatsapp",
        lastProvider: "whatsapp",
        lastTo: WHATSAPP_GROUP,
      });

      replySpy.mockResolvedValue({ text: "PULSECHECK_OK 🦞" });
      const sendWhatsApp = createMessageSendSpy();

      await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeWhatsAppDeps({ sendWhatsApp }),
          getReplyFromConfig: replySpy,
        },
      });

      expect(sendWhatsApp).toHaveBeenCalled();
    });
  });

  it("sends PULSECHECK_OK when visibility.showOk is true", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg = createWhatsAppPulsecheckConfig({
        tmpDir,
        storePath,
        visibility: { showOk: true },
      });

      await seedMainSessionStore(storePath, cfg, {
        lastChannel: "whatsapp",
        lastProvider: "whatsapp",
        lastTo: WHATSAPP_GROUP,
      });

      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });
      const sendWhatsApp = createMessageSendSpy();

      await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeWhatsAppDeps({ sendWhatsApp }),
          getReplyFromConfig: replySpy,
        },
      });

      expect(sendWhatsApp).toHaveBeenCalledTimes(1);
      expect(sendWhatsApp).toHaveBeenCalledWith(
        WHATSAPP_GROUP,
        "PULSECHECK_OK",
        expect.any(Object),
      );
    });
  });

  it.each([
    {
      title: "does not deliver PULSECHECK_OK to telegram when showOk is false",
      replyText: "PULSECHECK_OK",
      expectedCalls: 0,
    },
    {
      title: "strips responsePrefix before PULSECHECK_OK detection and suppresses short ack text",
      replyText: "[openclaw] PULSECHECK_OK all good",
      messages: { responsePrefix: "[openclaw]" },
      expectedCalls: 0,
    },
    {
      title: "does not strip alphanumeric responsePrefix from larger words",
      replyText: "History check complete",
      messages: { responsePrefix: "Hi" },
      expectedCalls: 1,
      expectedText: "History check complete",
    },
  ])("$title", async ({ replyText, messages, expectedCalls, expectedText }) => {
    await withTempTelegramPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const sendTelegram = await runTelegramPulsecheckWithDefaults({
        tmpDir,
        storePath,
        replySpy,
        replyText,
        messages,
      });

      expect(sendTelegram).toHaveBeenCalledTimes(expectedCalls);
      if (expectedText) {
        expect(sendTelegram).toHaveBeenCalledWith(TELEGRAM_GROUP, expectedText, expect.any(Object));
      }
    });
  });

  it("skips pulsecheck LLM calls when visibility disables all output", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg = createWhatsAppPulsecheckConfig({
        tmpDir,
        storePath,
        visibility: { showOk: false, showAlerts: false, useIndicator: false },
      });

      await seedMainSessionStore(storePath, cfg, {
        lastChannel: "whatsapp",
        lastProvider: "whatsapp",
        lastTo: WHATSAPP_GROUP,
      });

      const sendWhatsApp = createMessageSendSpy();

      const result = await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeWhatsAppDeps({ sendWhatsApp }),
          getReplyFromConfig: replySpy,
        },
      });

      expect(replySpy).not.toHaveBeenCalled();
      expect(sendWhatsApp).not.toHaveBeenCalled();
      expect(result).toEqual({ status: "skipped", reason: "alerts-disabled" });
    });
  });

  it("skips delivery for markup-wrapped PULSECHECK_OK", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg = await createSeededWhatsAppPulsecheckConfig({
        tmpDir,
        storePath,
      });

      replySpy.mockResolvedValue({ text: "<b>PULSECHECK_OK</b>" });
      const sendWhatsApp = createMessageSendSpy();

      await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeWhatsAppDeps({ sendWhatsApp }),
          getReplyFromConfig: replySpy,
        },
      });

      expect(sendWhatsApp).not.toHaveBeenCalled();
    });
  });

  it("does not regress updatedAt when restoring pulsecheck sessions", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const originalUpdatedAt = 1000;
      const bumpedUpdatedAt = 2000;
      const cfg = createWhatsAppPulsecheckConfig({
        tmpDir,
        storePath,
      });

      const sessionKey = await seedMainSessionStore(storePath, cfg, {
        updatedAt: originalUpdatedAt,
        lastChannel: "whatsapp",
        lastProvider: "whatsapp",
        lastTo: WHATSAPP_GROUP,
      });

      replySpy.mockImplementationOnce(async () => {
        const raw = await fs.readFile(storePath, "utf-8");
        const parsed = JSON.parse(raw) as Record<string, { updatedAt?: number } | undefined>;
        if (parsed[sessionKey]) {
          parsed[sessionKey] = {
            ...parsed[sessionKey],
            updatedAt: bumpedUpdatedAt,
          };
        }
        await fs.writeFile(storePath, JSON.stringify(parsed, null, 2));
        return { text: "" };
      });

      await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeWhatsAppDeps(),
          getReplyFromConfig: replySpy,
        },
      });

      const finalStore = JSON.parse(await fs.readFile(storePath, "utf-8")) as Record<
        string,
        { updatedAt?: number } | undefined
      >;
      expect(finalStore[sessionKey]?.updatedAt).toBe(bumpedUpdatedAt);
    });
  });

  it("skips WhatsApp delivery when not linked or running", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg = await createSeededWhatsAppPulsecheckConfig({
        tmpDir,
        storePath,
      });

      replySpy.mockResolvedValue({ text: "Pulsecheck alert" });
      const sendWhatsApp = createMessageSendSpy();

      const res = await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeWhatsAppDeps({
            sendWhatsApp,
            webAuthExists: async () => false,
            hasActiveWebListener: () => false,
          }),
          getReplyFromConfig: replySpy,
        },
      });

      expect(res.status).toBe("skipped");
      expect(res).toMatchObject({ reason: "whatsapp-not-linked" });
      expect(sendWhatsApp).not.toHaveBeenCalled();
    });
  });

  async function expectTelegramPulsecheckAccountId(params: {
    pulsecheck: Record<string, unknown>;
    telegram: Record<string, unknown>;
    expectedAccountId: string | undefined;
  }): Promise<void> {
    await withTempTelegramPulsecheckSandbox(async ({ tmpDir, storePath, replySpy }) => {
      const cfg = createPulsecheckConfig({
        tmpDir,
        storePath,
        pulsecheck: params.pulsecheck,
        channels: { telegram: params.telegram },
      });
      await seedMainSessionStore(storePath, cfg, {
        lastChannel: "telegram",
        lastProvider: "telegram",
        lastTo: TELEGRAM_GROUP,
      });

      replySpy.mockResolvedValue({ text: "Hello from pulsecheck" });
      const sendTelegram = createMessageSendSpy({ chatId: TELEGRAM_GROUP });

      await runPulsecheckOnce({
        cfg,
        deps: {
          ...makeTelegramDeps({ sendTelegram }),
          getReplyFromConfig: replySpy,
        },
      });

      expect(sendTelegram).toHaveBeenCalledTimes(1);
      expect(sendTelegram).toHaveBeenCalledWith(
        TELEGRAM_GROUP,
        "Hello from pulsecheck",
        expect.objectContaining({ accountId: params.expectedAccountId, verbose: false }),
      );
    });
  }

  it.each([
    {
      title: "passes through accountId for telegram pulsechecks",
      pulsecheck: { every: "5m", target: "telegram" },
      telegram: { botToken: "test-bot-token-123" },
      expectedAccountId: undefined,
    },
    {
      title: "does not pre-resolve telegram accountId (allows config-only account tokens)",
      pulsecheck: { every: "5m", target: "telegram" },
      telegram: {
        accounts: {
          work: { botToken: "test-bot-token-123" },
        },
      },
      expectedAccountId: undefined,
    },
    {
      title: "uses explicit pulsecheck accountId for telegram delivery",
      pulsecheck: { every: "5m", target: "telegram", accountId: "work" },
      telegram: {
        accounts: {
          work: { botToken: "test-bot-token-123" },
        },
      },
      expectedAccountId: "work",
    },
  ])("$title", async ({ pulsecheck, telegram, expectedAccountId }) => {
    await expectTelegramPulsecheckAccountId({ pulsecheck, telegram, expectedAccountId });
  });
});
