import { requestPulsecheckNow } from "../../infra/pulsecheck-wake.js";
import { enqueueSystemEvent } from "../../infra/system-events.js";
import { runCommandWithTimeout } from "../../process/exec.js";
import { createLazyRuntimeMethod, createLazyRuntimeModule } from "../../shared/lazy-runtime.js";
import { formatNativeDependencyHint } from "./native-deps.js";
import type { RunPulsecheckOnceOptions } from "./types-core.js";
import type { PluginRuntime } from "./types.js";

const loadPulsecheckRunnerRuntime = createLazyRuntimeModule(
  () => import("../../infra/pulsecheck-runner.js"),
);
const runPulsecheckOnceInternal = createLazyRuntimeMethod(
  loadPulsecheckRunnerRuntime,
  (runtime) => runtime.runPulsecheckOnce,
);

export function createRuntimeSystem(): PluginRuntime["system"] {
  return {
    enqueueSystemEvent,
    requestPulsecheckNow,
    runPulsecheckOnce: (opts?: RunPulsecheckOnceOptions) => {
      // Destructure to forward only the plugin-safe subset; prevent cfg/deps injection at runtime.
      const { reason, agentId, sessionKey, pulsecheck } = opts ?? {};
      return runPulsecheckOnceInternal({
        reason,
        agentId,
        sessionKey,
        pulsecheck: pulsecheck ? { target: pulsecheck.target } : undefined,
      });
    },
    runCommandWithTimeout,
    formatNativeDependencyHint,
  };
}
