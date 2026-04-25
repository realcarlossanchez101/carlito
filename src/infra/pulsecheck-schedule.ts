import { createHash } from "node:crypto";

function normalizeModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function resolvePulsecheckPhaseMs(params: {
  schedulerSeed: string;
  agentId: string;
  intervalMs: number;
}) {
  const intervalMs = Math.max(1, Math.floor(params.intervalMs));
  const digest = createHash("sha256").update(`${params.schedulerSeed}:${params.agentId}`).digest();
  return digest.readUInt32BE(0) % intervalMs;
}

export function computeNextPulsecheckPhaseDueMs(params: {
  nowMs: number;
  intervalMs: number;
  phaseMs: number;
}) {
  const intervalMs = Math.max(1, Math.floor(params.intervalMs));
  const nowMs = Math.floor(params.nowMs);
  const phaseMs = normalizeModulo(Math.floor(params.phaseMs), intervalMs);
  const cyclePositionMs = normalizeModulo(nowMs, intervalMs);
  let deltaMs = normalizeModulo(phaseMs - cyclePositionMs, intervalMs);
  if (deltaMs === 0) {
    deltaMs = intervalMs;
  }
  return nowMs + deltaMs;
}

export function resolveNextPulsecheckDueMs(params: {
  nowMs: number;
  intervalMs: number;
  phaseMs: number;
  prev?: {
    intervalMs: number;
    phaseMs: number;
    nextDueMs: number;
  };
}) {
  const intervalMs = Math.max(1, Math.floor(params.intervalMs));
  const phaseMs = normalizeModulo(Math.floor(params.phaseMs), intervalMs);
  const prev = params.prev;
  if (
    prev &&
    prev.intervalMs === intervalMs &&
    prev.phaseMs === phaseMs &&
    prev.nextDueMs > params.nowMs
  ) {
    return prev.nextDueMs;
  }
  return computeNextPulsecheckPhaseDueMs({
    nowMs: params.nowMs,
    intervalMs,
    phaseMs,
  });
}
