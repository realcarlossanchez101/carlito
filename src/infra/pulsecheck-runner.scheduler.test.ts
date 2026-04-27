import { afterEach, describe, expect, it, vi } from "vitest";
import type { CarlitoConfig } from "../config/config.js";
import { startPulsecheckRunner } from "./pulsecheck-runner.js";
import {
  computeNextPulsecheckPhaseDueMs,
  resolvePulsecheckPhaseMs,
} from "./pulsecheck-schedule.js";
import { requestPulsecheckNow, resetPulsecheckWakeStateForTests } from "./pulsecheck-wake.js";

describe("startPulsecheckRunner", () => {
  type RunOnce = Parameters<typeof startPulsecheckRunner>[0]["runOnce"];
  const TEST_SCHEDULER_SEED = "pulsecheck-runner-test-seed";

  function useFakePulsecheckTime() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
  }

  function startDefaultRunner(runOnce: RunOnce) {
    return startPulsecheckRunner({
      cfg: pulsecheckConfig(),
      runOnce,
      stableSchedulerSeed: TEST_SCHEDULER_SEED,
    });
  }

  function pulsecheckConfig(
    list?: NonNullable<NonNullable<CarlitoConfig["agents"]>["list"]>,
  ): CarlitoConfig {
    return {
      agents: {
        defaults: { pulsecheck: { every: "30m" } },
        ...(list ? { list } : {}),
      },
    } as CarlitoConfig;
  }

  function resolveDueFromNow(nowMs: number, intervalMs: number, agentId: string) {
    return computeNextPulsecheckPhaseDueMs({
      nowMs,
      intervalMs,
      phaseMs: resolvePulsecheckPhaseMs({
        schedulerSeed: TEST_SCHEDULER_SEED,
        agentId,
        intervalMs,
      }),
    });
  }

  function createRequestsInFlightRunSpy(skipCount: number) {
    let callCount = 0;
    return vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= skipCount) {
        return { status: "skipped", reason: "requests-in-flight" } as const;
      }
      return { status: "ran", durationMs: 1 } as const;
    });
  }

  async function expectWakeDispatch(params: {
    cfg: CarlitoConfig;
    runSpy: RunOnce;
    wake: Parameters<typeof requestPulsecheckNow>[0];
    expectedCall: Record<string, unknown>;
  }) {
    const runner = startPulsecheckRunner({
      cfg: params.cfg,
      runOnce: params.runSpy,
      stableSchedulerSeed: TEST_SCHEDULER_SEED,
    });

    requestPulsecheckNow(params.wake);
    await vi.advanceTimersByTimeAsync(1);

    expect(params.runSpy).toHaveBeenCalledTimes(1);
    expect(params.runSpy).toHaveBeenCalledWith(expect.objectContaining(params.expectedCall));

    return runner;
  }

  afterEach(() => {
    resetPulsecheckWakeStateForTests();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("updates scheduling when config changes without restart", async () => {
    useFakePulsecheckTime();

    const runSpy = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });

    const runner = startDefaultRunner(runSpy);
    const firstDueMs = resolveDueFromNow(0, 30 * 60_000, "main");

    await vi.advanceTimersByTimeAsync(firstDueMs + 1);

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(runSpy.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ agentId: "main", reason: "interval" }),
    );

    runner.updateConfig({
      agents: {
        defaults: { pulsecheck: { every: "30m" } },
        list: [
          { id: "main", pulsecheck: { every: "10m" } },
          { id: "ops", pulsecheck: { every: "15m" } },
        ],
      },
    } as CarlitoConfig);

    const nowAfterReload = Date.now();
    const nextMainDueMs = resolveDueFromNow(nowAfterReload, 10 * 60_000, "main");
    const nextOpsDueMs = resolveDueFromNow(nowAfterReload, 15 * 60_000, "ops");
    const finalDueMs = Math.max(nextMainDueMs, nextOpsDueMs);

    await vi.advanceTimersByTimeAsync(finalDueMs - Date.now() + 1);

    expect(runSpy.mock.calls.slice(1).map((call) => call[0]?.agentId)).toEqual(
      expect.arrayContaining(["main", "ops"]),
    );
    expect(
      runSpy.mock.calls.some(
        (call) => call[0]?.agentId === "main" && call[0]?.pulsecheck?.every === "10m",
      ),
    ).toBe(true);
    expect(
      runSpy.mock.calls.some(
        (call) => call[0]?.agentId === "ops" && call[0]?.pulsecheck?.every === "15m",
      ),
    ).toBe(true);

    runner.stop();
  });

  it("continues scheduling after runOnce throws an unhandled error", async () => {
    useFakePulsecheckTime();

    let callCount = 0;
    const runSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First call throws (simulates crash during session compaction)
        throw new Error("session compaction error");
      }
      return { status: "ran", durationMs: 1 };
    });

    const runner = startDefaultRunner(runSpy);
    const firstDueMs = resolveDueFromNow(0, 30 * 60_000, "main");

    // First pulsecheck fires and throws
    await vi.advanceTimersByTimeAsync(firstDueMs + 1);
    expect(runSpy).toHaveBeenCalledTimes(1);

    // Second pulsecheck should still fire (scheduler must not be dead)
    await vi.advanceTimersByTimeAsync(30 * 60_000);
    expect(runSpy).toHaveBeenCalledTimes(2);

    runner.stop();
  });

  it("cleanup is idempotent and does not clear a newer runner's handler", async () => {
    useFakePulsecheckTime();

    const runSpy1 = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });
    const runSpy2 = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });

    const cfg = {
      agents: { defaults: { pulsecheck: { every: "30m" } } },
    } as CarlitoConfig;
    const firstDueMs = resolveDueFromNow(0, 30 * 60_000, "main");

    // Start runner A
    const runnerA = startPulsecheckRunner({
      cfg,
      runOnce: runSpy1,
      stableSchedulerSeed: TEST_SCHEDULER_SEED,
    });

    // Start runner B (simulates lifecycle reload)
    const runnerB = startPulsecheckRunner({
      cfg,
      runOnce: runSpy2,
      stableSchedulerSeed: TEST_SCHEDULER_SEED,
    });

    // Stop runner A (stale cleanup) — should NOT kill runner B's handler
    runnerA.stop();

    // Runner B should still fire
    await vi.advanceTimersByTimeAsync(firstDueMs + 1);
    expect(runSpy2).toHaveBeenCalledTimes(1);
    expect(runSpy1).not.toHaveBeenCalled();

    // Double-stop should be safe (idempotent)
    runnerA.stop();

    runnerB.stop();
  });

  it("run() returns skipped when runner is stopped", async () => {
    useFakePulsecheckTime();

    const runSpy = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });

    const runner = startDefaultRunner(runSpy);

    runner.stop();

    // After stopping, no pulsechecks should fire
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("reschedules timer when runOnce returns requests-in-flight", async () => {
    useFakePulsecheckTime();

    const runSpy = createRequestsInFlightRunSpy(1);

    const runner = startPulsecheckRunner({
      cfg: pulsecheckConfig(),
      runOnce: runSpy,
      stableSchedulerSeed: TEST_SCHEDULER_SEED,
    });
    const firstDueMs = resolveDueFromNow(0, 30 * 60_000, "main");

    // First pulsecheck returns requests-in-flight
    await vi.advanceTimersByTimeAsync(firstDueMs + 1);
    expect(runSpy).toHaveBeenCalledTimes(1);

    // The wake layer retries after DEFAULT_RETRY_MS (1 s).  No scheduleNext()
    // is called inside runOnce, so we must wait for the full cooldown.
    await vi.advanceTimersByTimeAsync(1_000);
    expect(runSpy).toHaveBeenCalledTimes(2);

    runner.stop();
  });

  it("does not push nextDueMs forward on repeated requests-in-flight skips", async () => {
    useFakePulsecheckTime();

    // Simulate a long-running pulsecheck: the first 5 calls return
    // requests-in-flight (retries from the wake layer), then the 6th succeeds.
    const callTimes: number[] = [];
    let callCount = 0;
    const runSpy = vi.fn().mockImplementation(async () => {
      callTimes.push(Date.now());
      callCount++;
      if (callCount <= 5) {
        return { status: "skipped", reason: "requests-in-flight" } as const;
      }
      return { status: "ran", durationMs: 1 } as const;
    });

    const runner = startPulsecheckRunner({
      cfg: pulsecheckConfig(),
      runOnce: runSpy,
      stableSchedulerSeed: TEST_SCHEDULER_SEED,
    });
    const intervalMs = 30 * 60_000;
    const firstDueMs = resolveDueFromNow(0, intervalMs, "main");

    // Trigger the first pulsecheck at the agent's first slot — returns requests-in-flight.
    await vi.advanceTimersByTimeAsync(firstDueMs + 1);
    expect(runSpy).toHaveBeenCalledTimes(1);

    // Simulate 4 more retries at short intervals (wake layer retries).
    for (let i = 0; i < 4; i++) {
      requestPulsecheckNow({ reason: "retry", coalesceMs: 0 });
      await vi.advanceTimersByTimeAsync(1_000);
    }
    expect(callTimes.some((time) => time >= firstDueMs + intervalMs)).toBe(false);

    // The next interval tick at the next scheduled slot should still fire —
    // the retries must not push the phase out by multiple intervals.
    await vi.advanceTimersByTimeAsync(firstDueMs + intervalMs - Date.now() + 1);
    expect(callTimes.some((time) => time >= firstDueMs + intervalMs)).toBe(true);

    runner.stop();
  });

  it("routes targeted wake requests to the requested agent/session", async () => {
    useFakePulsecheckTime();
    const runSpy = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });
    const runner = await expectWakeDispatch({
      cfg: {
        ...pulsecheckConfig([
          { id: "main", pulsecheck: { every: "30m" } },
          { id: "ops", pulsecheck: { every: "15m" } },
        ]),
      } as CarlitoConfig,
      runSpy,
      wake: {
        reason: "cron:job-123",
        agentId: "ops",
        sessionKey: "agent:ops:discord:channel:alerts",
        coalesceMs: 0,
      },
      expectedCall: {
        agentId: "ops",
        reason: "cron:job-123",
        sessionKey: "agent:ops:discord:channel:alerts",
      },
    });

    runner.stop();
  });

  it("merges targeted wake pulsecheck overrides onto the agent pulsecheck config", async () => {
    useFakePulsecheckTime();
    const runSpy = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });
    const runner = await expectWakeDispatch({
      cfg: {
        ...pulsecheckConfig([
          {
            id: "ops",
            pulsecheck: {
              every: "15m",
              prompt: "Ops prompt",
              directPolicy: "block",
              target: "discord:channel:ops",
            },
          },
        ]),
      } as CarlitoConfig,
      runSpy,
      wake: {
        reason: "cron:job-123",
        agentId: "ops",
        sessionKey: "agent:ops:discord:channel:alerts",
        pulsecheck: { target: "last" },
        coalesceMs: 0,
      },
      expectedCall: {
        agentId: "ops",
        reason: "cron:job-123",
        sessionKey: "agent:ops:discord:channel:alerts",
        pulsecheck: {
          every: "15m",
          prompt: "Ops prompt",
          directPolicy: "block",
          target: "last",
        },
      },
    });

    runner.stop();
  });

  it("does not fan out to unrelated agents for session-scoped exec wakes", async () => {
    useFakePulsecheckTime();
    const runSpy = vi.fn().mockResolvedValue({ status: "ran", durationMs: 1 });
    const runner = await expectWakeDispatch({
      cfg: {
        ...pulsecheckConfig([
          { id: "main", pulsecheck: { every: "30m" } },
          { id: "finance", pulsecheck: { every: "30m" } },
        ]),
      } as CarlitoConfig,
      runSpy,
      wake: {
        reason: "exec-event",
        sessionKey: "agent:main:main",
        coalesceMs: 0,
      },
      expectedCall: {
        agentId: "main",
        reason: "exec-event",
        sessionKey: "agent:main:main",
      },
    });
    expect(runSpy.mock.calls.some((call) => call[0]?.agentId === "finance")).toBe(false);

    runner.stop();
  });
});
