import { resolveGlobalSingleton } from "../shared/global-singleton.js";
import { notifyListeners, registerListener } from "../shared/listeners.js";

export type PulsecheckIndicatorType = "ok" | "alert" | "error";

export type PulsecheckEventPayload = {
  ts: number;
  status: "sent" | "ok-empty" | "ok-token" | "skipped" | "failed";
  to?: string;
  accountId?: string;
  preview?: string;
  durationMs?: number;
  hasMedia?: boolean;
  reason?: string;
  /** The channel this pulsecheck was sent to. */
  channel?: string;
  /** Whether the message was silently suppressed (showOk: false). */
  silent?: boolean;
  /** Indicator type for UI status display. */
  indicatorType?: PulsecheckIndicatorType;
};

export function resolveIndicatorType(
  status: PulsecheckEventPayload["status"],
): PulsecheckIndicatorType | undefined {
  switch (status) {
    case "ok-empty":
    case "ok-token":
      return "ok";
    case "sent":
      return "alert";
    case "failed":
      return "error";
    case "skipped":
      return undefined;
  }
  throw new Error("Unsupported pulsecheck status");
}

type PulsecheckEventState = {
  lastPulsecheck: PulsecheckEventPayload | null;
  listeners: Set<(evt: PulsecheckEventPayload) => void>;
};

const PULSECHECK_EVENT_STATE_KEY = Symbol.for("openclaw.pulsecheckEvents.state");

const state = resolveGlobalSingleton<PulsecheckEventState>(PULSECHECK_EVENT_STATE_KEY, () => ({
  lastPulsecheck: null,
  listeners: new Set<(evt: PulsecheckEventPayload) => void>(),
}));

export function emitPulsecheckEvent(evt: Omit<PulsecheckEventPayload, "ts">) {
  const enriched: PulsecheckEventPayload = { ts: Date.now(), ...evt };
  state.lastPulsecheck = enriched;
  notifyListeners(state.listeners, enriched);
}

export function onPulsecheckEvent(listener: (evt: PulsecheckEventPayload) => void): () => void {
  return registerListener(state.listeners, listener);
}

export function getLastPulsecheckEvent(): PulsecheckEventPayload | null {
  return state.lastPulsecheck;
}

export function resetPulsecheckEventsForTest(): void {
  state.lastPulsecheck = null;
  state.listeners.clear();
}
