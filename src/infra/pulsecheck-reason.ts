import { normalizeOptionalString } from "../shared/string-coerce.js";

export type PulsecheckReasonKind =
  | "retry"
  | "interval"
  | "manual"
  | "exec-event"
  | "wake"
  | "cron"
  | "hook"
  | "other";

function trimReason(reason?: string): string {
  return normalizeOptionalString(reason) ?? "";
}

export function normalizePulsecheckWakeReason(reason?: string): string {
  const trimmed = trimReason(reason);
  return trimmed.length > 0 ? trimmed : "requested";
}

export function resolvePulsecheckReasonKind(reason?: string): PulsecheckReasonKind {
  const trimmed = trimReason(reason);
  if (trimmed === "retry") {
    return "retry";
  }
  if (trimmed === "interval") {
    return "interval";
  }
  if (trimmed === "manual") {
    return "manual";
  }
  if (trimmed === "exec-event") {
    return "exec-event";
  }
  if (trimmed === "wake") {
    return "wake";
  }
  if (trimmed.startsWith("acp:spawn:")) {
    return "wake";
  }
  if (trimmed.startsWith("cron:")) {
    return "cron";
  }
  if (trimmed.startsWith("hook:")) {
    return "hook";
  }
  return "other";
}

export function isPulsecheckEventDrivenReason(reason?: string): boolean {
  const kind = resolvePulsecheckReasonKind(reason);
  return kind === "exec-event" || kind === "cron" || kind === "wake" || kind === "hook";
}

export function isPulsecheckActionWakeReason(reason?: string): boolean {
  const kind = resolvePulsecheckReasonKind(reason);
  return kind === "manual" || kind === "exec-event" || kind === "hook";
}
