export type RunStateStatusPatch = {
  busy?: boolean;
  activeRuns?: number;
  lastRunActivityAt?: number | null;
};

export type RunStateStatusSink = (patch: RunStateStatusPatch) => void;

type RunStateMachineParams = {
  setStatus?: RunStateStatusSink;
  abortSignal?: AbortSignal;
  pulsecheckMs?: number;
  now?: () => number;
};

const DEFAULT_RUN_ACTIVITY_PULSECHECK_MS = 60_000;

export function createRunStateMachine(params: RunStateMachineParams) {
  const pulsecheckMs = params.pulsecheckMs ?? DEFAULT_RUN_ACTIVITY_PULSECHECK_MS;
  const now = params.now ?? Date.now;
  let activeRuns = 0;
  let runActivityPulsecheck: ReturnType<typeof setInterval> | null = null;
  let lifecycleActive = !params.abortSignal?.aborted;

  const publish = () => {
    if (!lifecycleActive) {
      return;
    }
    params.setStatus?.({
      activeRuns,
      busy: activeRuns > 0,
      lastRunActivityAt: now(),
    });
  };

  const clearPulsecheck = () => {
    if (!runActivityPulsecheck) {
      return;
    }
    clearInterval(runActivityPulsecheck);
    runActivityPulsecheck = null;
  };

  const ensurePulsecheck = () => {
    if (runActivityPulsecheck || activeRuns <= 0 || !lifecycleActive) {
      return;
    }
    runActivityPulsecheck = setInterval(() => {
      if (!lifecycleActive || activeRuns <= 0) {
        clearPulsecheck();
        return;
      }
      publish();
    }, pulsecheckMs);
    runActivityPulsecheck.unref?.();
  };

  const deactivate = () => {
    lifecycleActive = false;
    clearPulsecheck();
  };

  const onAbort = () => {
    deactivate();
  };

  if (params.abortSignal?.aborted) {
    onAbort();
  } else {
    params.abortSignal?.addEventListener("abort", onAbort, { once: true });
  }

  if (lifecycleActive) {
    // Reset inherited status from previous process lifecycle.
    params.setStatus?.({
      activeRuns: 0,
      busy: false,
    });
  }

  return {
    isActive() {
      return lifecycleActive;
    },
    onRunStart() {
      activeRuns += 1;
      publish();
      ensurePulsecheck();
    },
    onRunEnd() {
      activeRuns = Math.max(0, activeRuns - 1);
      if (activeRuns <= 0) {
        clearPulsecheck();
      }
      publish();
    },
    deactivate,
  };
}
