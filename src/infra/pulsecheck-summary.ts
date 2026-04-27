import { resolveAgentConfig, resolveDefaultAgentId } from "../agents/agent-scope.js";
import {
  DEFAULT_PULSECHECK_ACK_MAX_CHARS,
  DEFAULT_PULSECHECK_EVERY,
  resolvePulsecheckPrompt as resolvePulsecheckPromptText,
} from "../auto-reply/pulsecheck.js";
import { parseDurationMs } from "../cli/parse-duration.js";
import type { AgentDefaultsConfig } from "../config/types.agent-defaults.js";
import type { CarlitoConfig } from "../config/types.carlito.js";
import { normalizeAgentId } from "../routing/session-key.js";
import { normalizeOptionalString } from "../shared/string-coerce.js";

type PulsecheckConfig = AgentDefaultsConfig["pulsecheck"];

export type PulsecheckSummary = {
  enabled: boolean;
  every: string;
  everyMs: number | null;
  prompt: string;
  target: string;
  model?: string;
  ackMaxChars: number;
};

const DEFAULT_PULSECHECK_TARGET = "none";

function hasExplicitPulsecheckAgents(cfg: CarlitoConfig) {
  const list = cfg.agents?.list ?? [];
  return list.some((entry) => Boolean(entry?.pulsecheck));
}

export function isPulsecheckEnabledForAgent(cfg: CarlitoConfig, agentId?: string): boolean {
  const resolvedAgentId = normalizeAgentId(agentId ?? resolveDefaultAgentId(cfg));
  const list = cfg.agents?.list ?? [];
  const hasExplicit = hasExplicitPulsecheckAgents(cfg);
  if (hasExplicit) {
    return list.some(
      (entry) => Boolean(entry?.pulsecheck) && normalizeAgentId(entry?.id) === resolvedAgentId,
    );
  }
  return resolvedAgentId === resolveDefaultAgentId(cfg);
}

export function resolvePulsecheckIntervalMs(
  cfg: CarlitoConfig,
  overrideEvery?: string,
  pulsecheck?: PulsecheckConfig,
) {
  const raw =
    overrideEvery ??
    pulsecheck?.every ??
    cfg.agents?.defaults?.pulsecheck?.every ??
    DEFAULT_PULSECHECK_EVERY;
  if (!raw) {
    return null;
  }
  const trimmed = normalizeOptionalString(raw) ?? "";
  if (!trimmed) {
    return null;
  }
  let ms: number;
  try {
    ms = parseDurationMs(trimmed, { defaultUnit: "m" });
  } catch {
    return null;
  }
  if (ms <= 0) {
    return null;
  }
  return ms;
}

export function resolvePulsecheckSummaryForAgent(
  cfg: CarlitoConfig,
  agentId?: string,
): PulsecheckSummary {
  const defaults = cfg.agents?.defaults?.pulsecheck;
  const overrides = agentId ? resolveAgentConfig(cfg, agentId)?.pulsecheck : undefined;
  const enabled = isPulsecheckEnabledForAgent(cfg, agentId);

  if (!enabled) {
    return {
      enabled: false,
      every: "disabled",
      everyMs: null,
      prompt: resolvePulsecheckPromptText(defaults?.prompt),
      target: defaults?.target ?? DEFAULT_PULSECHECK_TARGET,
      model: defaults?.model,
      ackMaxChars: Math.max(0, defaults?.ackMaxChars ?? DEFAULT_PULSECHECK_ACK_MAX_CHARS),
    };
  }

  const merged = defaults || overrides ? { ...defaults, ...overrides } : undefined;
  const every = merged?.every ?? defaults?.every ?? overrides?.every ?? DEFAULT_PULSECHECK_EVERY;
  const everyMs = resolvePulsecheckIntervalMs(cfg, undefined, merged);
  const prompt = resolvePulsecheckPromptText(
    merged?.prompt ?? defaults?.prompt ?? overrides?.prompt,
  );
  const target =
    merged?.target ?? defaults?.target ?? overrides?.target ?? DEFAULT_PULSECHECK_TARGET;
  const model = merged?.model ?? defaults?.model ?? overrides?.model;
  const ackMaxChars = Math.max(
    0,
    merged?.ackMaxChars ??
      defaults?.ackMaxChars ??
      overrides?.ackMaxChars ??
      DEFAULT_PULSECHECK_ACK_MAX_CHARS,
  );

  return {
    enabled: true,
    every,
    everyMs,
    prompt,
    target,
    model,
    ackMaxChars,
  };
}
