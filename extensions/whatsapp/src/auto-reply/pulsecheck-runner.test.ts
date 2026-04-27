import { redactIdentifier } from "carlito/plugin-sdk/logging-core";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { sendMessageWhatsApp } from "../send.js";
import type { getReplyFromConfig } from "./pulsecheck-runner.runtime.js";

const PULSECHECK_TOKEN = "PULSECHECK_OK";

const state = vi.hoisted(() => ({
  visibility: { showAlerts: true, showOk: true, useIndicator: false },
  store: {} as Record<string, { updatedAt?: number; sessionId?: string }>,
  snapshot: {
    key: "k",
    entry: { sessionId: "s1", updatedAt: 123 },
    fresh: false,
    resetPolicy: { mode: "none", atHour: null, idleMinutes: null },
    dailyResetAt: null as number | null,
    idleExpiresAt: null as number | null,
  },
  events: [] as unknown[],
  loggerInfoCalls: [] as unknown[][],
  loggerWarnCalls: [] as unknown[][],
  pulsecheckInfoLogs: [] as string[],
  pulsecheckWarnLogs: [] as string[],
}));

vi.mock("./pulsecheck-runner.runtime.js", () => {
  const logger = {
    child: () => logger,
    info: (...args: unknown[]) => state.loggerInfoCalls.push(args),
    warn: (...args: unknown[]) => state.loggerWarnCalls.push(args),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    DEFAULT_PULSECHECK_ACK_MAX_CHARS: 32,
    PULSECHECK_TOKEN,
    appendCronStyleCurrentTimeLine: (body: string) =>
      `${body}\nCurrent time: 2026-02-15T00:00:00Z (mock)`,
    canonicalizeMainSessionAlias: ({ sessionKey }: { sessionKey: string }) => sessionKey,
    emitPulsecheckEvent: (event: unknown) => state.events.push(event),
    formatError: (err: unknown) => `ERR:${String(err)}`,
    getChildLogger: () => logger,
    getReplyFromConfig: vi.fn(async () => undefined),
    hasOutboundReplyContent: (payload: { text?: string } | undefined) =>
      Boolean(payload?.text?.trim()),
    loadConfig: () => ({ agents: { defaults: {} }, session: {} }),
    loadSessionStore: () => state.store,
    normalizeMainKey: () => null,
    redactIdentifier,
    resolvePulsecheckPrompt: (prompt?: string) => prompt || "Pulsecheck",
    resolvePulsecheckReplyPayload: (reply: unknown) => reply,
    resolvePulsecheckVisibility: () => state.visibility,
    resolveIndicatorType: (status: string) => `indicator:${status}`,
    resolveSendableOutboundReplyParts: (payload: { text?: string }) => ({
      text: payload.text ?? "",
      hasMedia: false,
    }),
    resolveSessionKey: () => "k",
    resolveStorePath: () => "/tmp/store.json",
    resolveWhatsAppPulsecheckRecipients: () => [],
    sendMessageWhatsApp: vi.fn(async () => ({ messageId: "m1" })),
    stripPulsecheckToken: (text: string) => {
      const trimmed = text.trim();
      if (trimmed === PULSECHECK_TOKEN) {
        return { shouldSkip: true, text: "" };
      }
      return { shouldSkip: false, text: trimmed };
    },
    updateSessionStore: async (_path: string, updater: (store: typeof state.store) => void) => {
      updater(state.store);
    },
    whatsappPulsecheckLog: {
      info: (msg: string) => state.pulsecheckInfoLogs.push(msg),
      warn: (msg: string) => state.pulsecheckWarnLogs.push(msg),
    },
  };
});

vi.mock("./session-snapshot.js", () => ({
  getSessionSnapshot: () => state.snapshot,
}));

vi.mock("../reconnect.js", () => ({
  newConnectionId: () => "run-1",
}));

describe("runWebPulsecheckOnce", () => {
  let senderMock: ReturnType<typeof vi.fn>;
  let sender: typeof sendMessageWhatsApp;
  let replyResolverMock: ReturnType<typeof vi.fn>;
  let replyResolver: typeof getReplyFromConfig;
  let runWebPulsecheckOnce: typeof import("./pulsecheck-runner.js").runWebPulsecheckOnce;

  const buildRunArgs = (overrides: Record<string, unknown> = {}) => ({
    cfg: { agents: { defaults: {} }, session: {} } as never,
    to: "+123",
    sender,
    replyResolver,
    ...overrides,
  });

  beforeAll(async () => {
    ({ runWebPulsecheckOnce } = await import("./pulsecheck-runner.js"));
  });

  beforeEach(() => {
    state.visibility = { showAlerts: true, showOk: true, useIndicator: false };
    state.store = { k: { updatedAt: 999, sessionId: "s1" } };
    state.snapshot = {
      key: "k",
      entry: { sessionId: "s1", updatedAt: 123 },
      fresh: false,
      resetPolicy: { mode: "none", atHour: null, idleMinutes: null },
      dailyResetAt: null,
      idleExpiresAt: null,
    };
    state.events = [];
    state.loggerInfoCalls = [];
    state.loggerWarnCalls = [];
    state.pulsecheckInfoLogs = [];
    state.pulsecheckWarnLogs = [];

    senderMock = vi.fn(async () => ({ messageId: "m1" }));
    sender = senderMock as unknown as typeof sendMessageWhatsApp;
    replyResolverMock = vi.fn(async () => undefined);
    replyResolver = replyResolverMock as unknown as typeof getReplyFromConfig;
  });

  it("supports manual override body dry-run without sending", async () => {
    await runWebPulsecheckOnce(buildRunArgs({ overrideBody: "hello", dryRun: true }));
    expect(senderMock).not.toHaveBeenCalled();
    expect(state.events).toHaveLength(0);
  });

  it("sends PULSECHECK_OK when reply is empty and showOk is enabled", async () => {
    await runWebPulsecheckOnce(buildRunArgs());
    expect(senderMock).toHaveBeenCalledWith(
      "+123",
      PULSECHECK_TOKEN,
      expect.objectContaining({ verbose: false, cfg: expect.any(Object) }),
    );
    expect(state.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "ok-empty", silent: false })]),
    );
  });

  it("injects a cron-style Current time line into the pulsecheck prompt", async () => {
    await runWebPulsecheckOnce(
      buildRunArgs({
        cfg: {
          agents: { defaults: { pulsecheck: { prompt: "Ops check" } } },
          session: {},
        } as never,
        dryRun: true,
      }),
    );
    expect(replyResolver).toHaveBeenCalledTimes(1);
    const ctx = replyResolverMock.mock.calls[0]?.[0];
    expect(ctx?.Body).toContain("Ops check");
    expect(ctx?.Body).toContain("Current time: 2026-02-15T00:00:00Z (mock)");
  });

  it("treats pulsecheck token-only replies as ok-token and preserves session updatedAt", async () => {
    replyResolverMock.mockResolvedValue({ text: PULSECHECK_TOKEN });
    await runWebPulsecheckOnce(buildRunArgs());
    expect(state.store.k?.updatedAt).toBe(123);
    expect(senderMock).toHaveBeenCalledWith(
      "+123",
      PULSECHECK_TOKEN,
      expect.objectContaining({ verbose: false, cfg: expect.any(Object) }),
    );
    expect(state.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "ok-token", silent: false })]),
    );
  });

  it("skips sending alerts when showAlerts is disabled but still emits a skipped event", async () => {
    state.visibility = { showAlerts: false, showOk: true, useIndicator: true };
    replyResolverMock.mockResolvedValue({ text: "ALERT" });
    await runWebPulsecheckOnce(buildRunArgs());
    expect(senderMock).not.toHaveBeenCalled();
    expect(state.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "skipped", reason: "alerts-disabled", preview: "ALERT" }),
      ]),
    );
  });

  it("emits failed events when sending throws and rethrows the error", async () => {
    replyResolverMock.mockResolvedValue({ text: "ALERT" });
    senderMock.mockRejectedValueOnce(new Error("nope"));
    await expect(runWebPulsecheckOnce(buildRunArgs())).rejects.toThrow("nope");
    expect(state.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "failed", reason: "ERR:Error: nope" }),
      ]),
    );
  });

  it("redacts recipient and omits body preview in pulsecheck logs", async () => {
    replyResolverMock.mockResolvedValue({ text: "sensitive pulsecheck body" });
    await runWebPulsecheckOnce(buildRunArgs({ dryRun: true }));

    const expected = redactIdentifier("+123");
    const pulsecheckLogs = state.pulsecheckInfoLogs.join("\n");
    const childLoggerLogs = state.loggerInfoCalls.map((entry) => JSON.stringify(entry)).join("\n");

    expect(pulsecheckLogs).toContain(expected);
    expect(pulsecheckLogs).not.toContain("+123");
    expect(pulsecheckLogs).not.toContain("sensitive pulsecheck body");

    expect(childLoggerLogs).toContain(expected);
    expect(childLoggerLogs).not.toContain("+123");
    expect(childLoggerLogs).not.toContain("sensitive pulsecheck body");
    expect(childLoggerLogs).not.toContain('"preview"');
  });
});
