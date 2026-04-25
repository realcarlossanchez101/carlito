import {
  DEFAULT_PULSECHECK_EVERY,
  resolvePulsecheckPrompt as resolvePulsecheckPromptText,
} from "../auto-reply/pulsecheck.js";
import { parseDurationMs } from "../cli/parse-duration.js";
import type { AgentDefaultsConfig } from "../config/types.agent-defaults.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import { normalizeAgentId } from "../routing/session-key.js";
import { normalizeOptionalString } from "../shared/string-coerce.js";
import { listAgentEntries, resolveAgentConfig, resolveDefaultAgentId } from "./agent-scope.js";

type PulsecheckConfig = AgentDefaultsConfig["pulsecheck"];

function resolvePulsecheckConfigForSystemPrompt(
  config?: OpenClawConfig,
  agentId?: string,
): PulsecheckConfig | undefined {
  const defaults = config?.agents?.defaults?.pulsecheck;
  if (!config || !agentId) {
    return defaults;
  }
  const overrides = resolveAgentConfig(config, agentId)?.pulsecheck;
  if (!defaults && !overrides) {
    return overrides;
  }
  return { ...defaults, ...overrides };
}

function isPulsecheckEnabledByAgentPolicy(config: OpenClawConfig, agentId: string): boolean {
  const resolvedAgentId = normalizeAgentId(agentId);
  const agents = listAgentEntries(config);
  const hasExplicitPulsecheckAgents = agents.some((entry) => Boolean(entry?.pulsecheck));
  if (hasExplicitPulsecheckAgents) {
    return agents.some(
      (entry) => Boolean(entry?.pulsecheck) && normalizeAgentId(entry.id) === resolvedAgentId,
    );
  }
  return resolvedAgentId === resolveDefaultAgentId(config);
}

function isPulsecheckCadenceEnabled(pulsecheck?: PulsecheckConfig): boolean {
  const rawEvery = pulsecheck?.every ?? DEFAULT_PULSECHECK_EVERY;
  const trimmedEvery = normalizeOptionalString(rawEvery) ?? "";
  if (!trimmedEvery) {
    return false;
  }
  try {
    return parseDurationMs(trimmedEvery, { defaultUnit: "m" }) > 0;
  } catch {
    return false;
  }
}

export function shouldIncludePulsecheckGuidanceForSystemPrompt(params: {
  config?: OpenClawConfig;
  agentId?: string;
  defaultAgentId?: string;
}): boolean {
  const defaultAgentId = params.defaultAgentId ?? resolveDefaultAgentId(params.config ?? {});
  const agentId = params.agentId ?? defaultAgentId;
  if (!agentId || normalizeAgentId(agentId) !== normalizeAgentId(defaultAgentId)) {
    return false;
  }
  if (params.config && !isPulsecheckEnabledByAgentPolicy(params.config, agentId)) {
    return false;
  }
  const pulsecheck = resolvePulsecheckConfigForSystemPrompt(params.config, agentId);
  if (pulsecheck?.includeSystemPromptSection === false) {
    return false;
  }
  return isPulsecheckCadenceEnabled(pulsecheck);
}

export function resolvePulsecheckPromptForSystemPrompt(params: {
  config?: OpenClawConfig;
  agentId?: string;
  defaultAgentId?: string;
}): string | undefined {
  const agentId =
    params.agentId ?? params.defaultAgentId ?? resolveDefaultAgentId(params.config ?? {});
  const pulsecheck = resolvePulsecheckConfigForSystemPrompt(params.config, agentId);
  if (!shouldIncludePulsecheckGuidanceForSystemPrompt(params)) {
    return undefined;
  }
  return resolvePulsecheckPromptText(pulsecheck?.prompt);
}
