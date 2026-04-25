import fs from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as replyModule from "../auto-reply/reply.js";
import type { OpenClawConfig } from "../config/config.js";
import { resolveMainSessionKey } from "../config/sessions.js";
import { runPulsecheckOnce } from "./pulsecheck-runner.js";
import { seedSessionStore, withTempPulsecheckSandbox } from "./pulsecheck-runner.test-utils.js";
import {
  enqueueSystemEvent,
  peekSystemEventEntries,
  resetSystemEventsForTest,
} from "./system-events.js";

vi.mock("./outbound/deliver.js", () => ({
  deliverOutboundPayloads: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  vi.restoreAllMocks();
  resetSystemEventsForTest();
});

describe("runPulsecheckOnce – isolated session key stability (#59493)", () => {
  /**
   * Simulates the wake-request feedback loop:
   *   1. Normal pulsecheck tick produces sessionKey "agent:main:main:pulsecheck"
   *   2. An exec/subagent event during that tick calls requestPulsecheckNow()
   *      with the already-suffixed key "agent:main:main:pulsecheck"
   *   3. The wake handler passes that key back into runPulsecheckOnce(sessionKey: ...)
   *
   * Before the fix, step 3 would append another ":pulsecheck" producing
   * "agent:main:main:pulsecheck:pulsecheck". After the fix, the key remains
   * stable at "agent:main:main:pulsecheck".
   */
  async function runIsolatedPulsecheck(params: {
    tmpDir: string;
    storePath: string;
    cfg: OpenClawConfig;
    sessionKey: string;
  }) {
    await seedSessionStore(params.storePath, params.sessionKey, {
      lastChannel: "whatsapp",
      lastProvider: "whatsapp",
      lastTo: "+1555",
    });

    const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
    replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

    await runPulsecheckOnce({
      cfg: params.cfg,
      sessionKey: params.sessionKey,
      deps: {
        getQueueSize: () => 0,
        nowMs: () => Date.now(),
      },
    });

    expect(replySpy).toHaveBeenCalledTimes(1);
    return replySpy.mock.calls[0]?.[0];
  }

  function makeIsolatedPulsecheckConfig(tmpDir: string, storePath: string): OpenClawConfig {
    return {
      agents: {
        defaults: {
          workspace: tmpDir,
          pulsecheck: {
            every: "5m",
            target: "whatsapp",
            isolatedSession: true,
          },
        },
      },
      channels: { whatsapp: { allowFrom: ["*"] } },
      session: { store: storePath },
    };
  }

  function makeNamedIsolatedPulsecheckConfig(
    tmpDir: string,
    storePath: string,
    pulsecheckSession: string,
  ): OpenClawConfig {
    return {
      agents: {
        defaults: {
          workspace: tmpDir,
          pulsecheck: {
            every: "5m",
            target: "whatsapp",
            isolatedSession: true,
            session: pulsecheckSession,
          },
        },
      },
      channels: { whatsapp: { allowFrom: ["*"] } },
      session: { store: storePath },
    };
  }

  it("does not accumulate :pulsecheck suffix when wake passes an already-suffixed key", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const baseSessionKey = resolveMainSessionKey(cfg);

      // Simulate wake-request path: key already has :pulsecheck from a previous tick.
      const alreadySuffixedKey = `${baseSessionKey}:pulsecheck`;
      await fs.writeFile(
        storePath,
        JSON.stringify({
          [alreadySuffixedKey]: {
            sessionId: "sid",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "+1555",
            pulsecheckIsolatedBaseSessionKey: baseSessionKey,
          },
        }),
        "utf-8",
      );
      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        sessionKey: alreadySuffixedKey,
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      // Key must remain stable — no double :pulsecheck suffix.
      expect(replySpy.mock.calls[0]?.[0]?.SessionKey).toBe(`${baseSessionKey}:pulsecheck`);
    });
  });

  it("appends :pulsecheck exactly once from a clean base key", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const baseSessionKey = resolveMainSessionKey(cfg);

      const ctx = await runIsolatedPulsecheck({
        tmpDir,
        storePath,
        cfg,
        sessionKey: baseSessionKey,
      });

      expect(ctx?.SessionKey).toBe(`${baseSessionKey}:pulsecheck`);
    });
  });

  it("stays stable even with multiply-accumulated suffixes", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const baseSessionKey = resolveMainSessionKey(cfg);

      // Simulate a key that already accumulated several :pulsecheck suffixes
      // (from an unpatched gateway running for many ticks).
      const deeplyAccumulatedKey = `${baseSessionKey}:pulsecheck:pulsecheck:pulsecheck`;

      const ctx = await runIsolatedPulsecheck({
        tmpDir,
        storePath,
        cfg,
        sessionKey: deeplyAccumulatedKey,
      });

      // After the fix, ALL trailing :pulsecheck suffixes are stripped by the
      // (:pulsecheck)+$ regex in a single pass, then exactly one is re-appended.
      // A deeply accumulated key converges to "<base>:pulsecheck" in one call.
      expect(ctx?.SessionKey).toBe(`${baseSessionKey}:pulsecheck`);

      const store = JSON.parse(await fs.readFile(storePath, "utf-8")) as Record<
        string,
        { pulsecheckIsolatedBaseSessionKey?: string }
      >;
      expect(store[deeplyAccumulatedKey]).toBeUndefined();
      expect(store[`${baseSessionKey}:pulsecheck`]).toMatchObject({
        pulsecheckIsolatedBaseSessionKey: baseSessionKey,
      });
    });
  });

  it("keeps isolated keys distinct when the configured base key already ends with :pulsecheck", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeNamedIsolatedPulsecheckConfig(tmpDir, storePath, "alerts:pulsecheck");
      const baseSessionKey = "agent:main:alerts:pulsecheck";

      const ctx = await runIsolatedPulsecheck({
        tmpDir,
        storePath,
        cfg,
        sessionKey: baseSessionKey,
      });

      expect(ctx?.SessionKey).toBe(`${baseSessionKey}:pulsecheck`);
    });
  });

  it("consumes base-session cron events when isolated pulsecheck runs on a :pulsecheck session", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const baseSessionKey = resolveMainSessionKey(cfg);
      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy
        .mockResolvedValueOnce({ text: "Relay this cron update now" })
        .mockResolvedValueOnce({ text: "PULSECHECK_OK" });

      enqueueSystemEvent("Cron: QMD maintenance completed", {
        sessionKey: baseSessionKey,
        contextKey: "cron:qmd-maintenance",
      });

      await runPulsecheckOnce({
        cfg,
        agentId: "main",
        reason: "interval",
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      expect(peekSystemEventEntries(baseSessionKey)).toEqual([]);

      await runPulsecheckOnce({
        cfg,
        agentId: "main",
        reason: "interval",
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      expect(replySpy).toHaveBeenCalledTimes(2);
      const firstCtx = replySpy.mock.calls[0]?.[0] as {
        Body?: string;
        Provider?: string;
        SessionKey?: string;
      };
      const secondCtx = replySpy.mock.calls[1]?.[0] as {
        Body?: string;
        Provider?: string;
        SessionKey?: string;
      };

      expect(firstCtx.SessionKey).toBe(`${baseSessionKey}:pulsecheck`);
      expect(firstCtx.Provider).toBe("cron-event");
      expect(firstCtx.Body).toContain("Cron: QMD maintenance completed");
      expect(secondCtx.SessionKey).toBe(`${baseSessionKey}:pulsecheck`);
      expect(secondCtx.Body).not.toContain("Cron: QMD maintenance completed");
    });
  });

  it("stays stable for wake re-entry when the configured base key already ends with :pulsecheck", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeNamedIsolatedPulsecheckConfig(tmpDir, storePath, "alerts:pulsecheck");
      const baseSessionKey = "agent:main:alerts:pulsecheck";
      const alreadyIsolatedKey = `${baseSessionKey}:pulsecheck`;
      await fs.writeFile(
        storePath,
        JSON.stringify({
          [alreadyIsolatedKey]: {
            sessionId: "sid",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "+1555",
            pulsecheckIsolatedBaseSessionKey: baseSessionKey,
          },
        }),
        "utf-8",
      );
      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        sessionKey: alreadyIsolatedKey,
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      expect(replySpy.mock.calls[0]?.[0]?.SessionKey).toBe(alreadyIsolatedKey);
    });
  });

  it("classifies hook:wake exec events when they are queued on the active isolated session", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const baseSessionKey = resolveMainSessionKey(cfg);
      const isolatedSessionKey = `${baseSessionKey}:pulsecheck`;
      await fs.writeFile(
        storePath,
        JSON.stringify({
          [isolatedSessionKey]: {
            sessionId: "sid",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "+1555",
            pulsecheckIsolatedBaseSessionKey: baseSessionKey,
          },
        }),
        "utf-8",
      );
      enqueueSystemEvent("exec finished: deploy succeeded", { sessionKey: isolatedSessionKey });
      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy.mockResolvedValue({ text: "Handled internally" });

      const result = await runPulsecheckOnce({
        cfg,
        sessionKey: isolatedSessionKey,
        reason: "hook:wake",
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      expect(result.status).toBe("ran");
      const calledCtx = replySpy.mock.calls[0]?.[0] as {
        SessionKey?: string;
        Provider?: string;
        ForceSenderIsOwnerFalse?: boolean;
      };
      expect(calledCtx.SessionKey).toBe(isolatedSessionKey);
      expect(calledCtx.Provider).toBe("exec-event");
      expect(calledCtx.ForceSenderIsOwnerFalse).toBe(true);
    });
  });

  it("keeps a forced real :pulsecheck session distinct from the pulsecheck-isolated sibling", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const realSessionKey = "agent:main:alerts:pulsecheck";

      const ctx = await runIsolatedPulsecheck({
        tmpDir,
        storePath,
        cfg,
        sessionKey: realSessionKey,
      });

      expect(ctx?.SessionKey).toBe(`${realSessionKey}:pulsecheck`);
    });
  });

  it("stays stable when a forced real :pulsecheck session re-enters through its isolated sibling", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const realSessionKey = "agent:main:alerts:pulsecheck";
      const isolatedSessionKey = `${realSessionKey}:pulsecheck`;

      await fs.writeFile(
        storePath,
        JSON.stringify({
          [isolatedSessionKey]: {
            sessionId: "sid",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "+1555",
            pulsecheckIsolatedBaseSessionKey: realSessionKey,
          },
        }),
        "utf-8",
      );

      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        sessionKey: isolatedSessionKey,
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      expect(replySpy).toHaveBeenCalledTimes(1);
      expect(replySpy.mock.calls[0]?.[0]?.SessionKey).toBe(isolatedSessionKey);
    });
  });

  it("does not create an isolated session when task-based pulsecheck skips for no-tasks-due", async () => {
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg: OpenClawConfig = {
        agents: {
          defaults: {
            workspace: tmpDir,
            pulsecheck: {
              isolatedSession: true,
              target: "whatsapp",
            },
          },
        },
        channels: { whatsapp: { allowFrom: ["*"] } },
        session: { store: storePath },
      };
      const baseSessionKey = resolveMainSessionKey(cfg);
      const isolatedSessionKey = `${baseSessionKey}:pulsecheck`;
      await fs.writeFile(
        `${tmpDir}/PULSECHECK.md`,
        `tasks:
  - name: daily-check
    interval: 1d
    prompt: "Check status"
`,
        "utf-8",
      );

      await fs.writeFile(
        storePath,
        JSON.stringify({
          [baseSessionKey]: {
            sessionId: "sid",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "+1555",
            pulsecheckTaskState: {
              "daily-check": 1,
            },
          },
        }),
        "utf-8",
      );
      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      const result = await runPulsecheckOnce({
        cfg,
        sessionKey: baseSessionKey,
        deps: {
          getQueueSize: () => 0,
          nowMs: () => 2,
        },
      });

      expect(result).toEqual({ status: "skipped", reason: "no-tasks-due" });
      expect(replySpy).not.toHaveBeenCalled();

      const store = JSON.parse(await fs.readFile(storePath, "utf-8")) as Record<string, unknown>;
      expect(store[isolatedSessionKey]).toBeUndefined();
    });
  });

  it("converges a legacy isolated key that lacks the stored marker (single :pulsecheck suffix)", async () => {
    // Regression for: when an isolated session was created before
    // pulsecheckIsolatedBaseSessionKey was introduced, sessionKey already equals
    // "<base>:pulsecheck" but the stored entry has no marker. The fallback used to
    // treat "<base>:pulsecheck" as the new base and persist it as the marker, so
    // the next wake re-entry would stabilise at "<base>:pulsecheck:pulsecheck"
    // instead of converging back to "<base>:pulsecheck".
    await withTempPulsecheckSandbox(async ({ tmpDir, storePath }) => {
      const cfg = makeIsolatedPulsecheckConfig(tmpDir, storePath);
      const baseSessionKey = resolveMainSessionKey(cfg);
      const legacyIsolatedKey = `${baseSessionKey}:pulsecheck`;

      // Legacy entry: has :pulsecheck suffix but no pulsecheckIsolatedBaseSessionKey marker.
      await fs.writeFile(
        storePath,
        JSON.stringify({
          [legacyIsolatedKey]: {
            sessionId: "sid",
            updatedAt: Date.now(),
            lastChannel: "whatsapp",
            lastProvider: "whatsapp",
            lastTo: "+1555",
          },
        }),
        "utf-8",
      );
      const replySpy = vi.spyOn(replyModule, "getReplyFromConfig");
      replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

      await runPulsecheckOnce({
        cfg,
        sessionKey: legacyIsolatedKey,
        deps: {
          getQueueSize: () => 0,
          nowMs: () => Date.now(),
        },
      });

      // Must converge to the same canonical isolated key, not produce :pulsecheck:pulsecheck.
      expect(replySpy.mock.calls[0]?.[0]?.SessionKey).toBe(legacyIsolatedKey);
    });
  });
});
