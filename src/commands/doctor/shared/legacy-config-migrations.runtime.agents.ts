import {
  defineLegacyConfigMigration,
  ensureRecord,
  getRecord,
  mergeMissing,
  type LegacyConfigMigrationSpec,
  type LegacyConfigRule,
} from "../../../config/legacy.shared.js";
import { isBlockedObjectKey } from "../../../config/prototype-keys.js";

const AGENT_PULSECHECK_KEYS = new Set([
  "every",
  "activeHours",
  "model",
  "session",
  "includeReasoning",
  "target",
  "directPolicy",
  "to",
  "accountId",
  "prompt",
  "ackMaxChars",
  "suppressToolErrorWarnings",
  "lightContext",
  "isolatedSession",
]);

const CHANNEL_PULSECHECK_KEYS = new Set(["showOk", "showAlerts", "useIndicator"]);

const MEMORY_SEARCH_RULE: LegacyConfigRule = {
  path: ["memorySearch"],
  message:
    'top-level memorySearch was moved; use agents.defaults.memorySearch instead. Run "carlito doctor --fix".',
};

const PULSECHECK_RULE: LegacyConfigRule = {
  path: ["pulsecheck"],
  message:
    "top-level pulsecheck is not a valid config path; use agents.defaults.pulsecheck (cadence/target/model settings) or channels.defaults.pulsecheck (showOk/showAlerts/useIndicator).",
};

const LEGACY_SANDBOX_SCOPE_RULES: LegacyConfigRule[] = [
  {
    path: ["agents", "defaults", "sandbox"],
    message:
      'agents.defaults.sandbox.perSession is legacy; use agents.defaults.sandbox.scope instead. Run "carlito doctor --fix".',
    match: (value) => hasLegacySandboxPerSession(value),
  },
  {
    path: ["agents", "list"],
    message:
      'agents.list[].sandbox.perSession is legacy; use agents.list[].sandbox.scope instead. Run "carlito doctor --fix".',
    match: (value) => hasLegacyAgentListSandboxPerSession(value),
  },
];

function sandboxScopeFromPerSession(perSession: boolean): "session" | "shared" {
  return perSession ? "session" : "shared";
}

function splitLegacyPulsecheck(legacyPulsecheck: Record<string, unknown>): {
  agentPulsecheck: Record<string, unknown> | null;
  channelPulsecheck: Record<string, unknown> | null;
} {
  const agentPulsecheck: Record<string, unknown> = {};
  const channelPulsecheck: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(legacyPulsecheck)) {
    if (isBlockedObjectKey(key)) {
      continue;
    }
    if (CHANNEL_PULSECHECK_KEYS.has(key)) {
      channelPulsecheck[key] = value;
      continue;
    }
    if (AGENT_PULSECHECK_KEYS.has(key)) {
      agentPulsecheck[key] = value;
      continue;
    }
    agentPulsecheck[key] = value;
  }

  return {
    agentPulsecheck: Object.keys(agentPulsecheck).length > 0 ? agentPulsecheck : null,
    channelPulsecheck: Object.keys(channelPulsecheck).length > 0 ? channelPulsecheck : null,
  };
}

function mergeLegacyIntoDefaults(params: {
  raw: Record<string, unknown>;
  rootKey: "agents" | "channels";
  fieldKey: string;
  legacyValue: Record<string, unknown>;
  changes: string[];
  movedMessage: string;
  mergedMessage: string;
}) {
  const root = ensureRecord(params.raw, params.rootKey);
  const defaults = ensureRecord(root, "defaults");
  const existing = getRecord(defaults[params.fieldKey]);
  if (!existing) {
    defaults[params.fieldKey] = params.legacyValue;
    params.changes.push(params.movedMessage);
  } else {
    const merged = structuredClone(existing);
    mergeMissing(merged, params.legacyValue);
    defaults[params.fieldKey] = merged;
    params.changes.push(params.mergedMessage);
  }

  root.defaults = defaults;
  params.raw[params.rootKey] = root;
}

function hasLegacySandboxPerSession(value: unknown): boolean {
  const sandbox = getRecord(value);
  return Boolean(sandbox && Object.prototype.hasOwnProperty.call(sandbox, "perSession"));
}

function hasLegacyAgentListSandboxPerSession(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.some((agent) => hasLegacySandboxPerSession(getRecord(agent)?.sandbox));
}

function migrateLegacySandboxPerSession(
  sandbox: Record<string, unknown>,
  pathLabel: string,
  changes: string[],
): void {
  if (!Object.prototype.hasOwnProperty.call(sandbox, "perSession")) {
    return;
  }
  const rawPerSession = sandbox.perSession;
  if (typeof rawPerSession !== "boolean") {
    return;
  }
  if (sandbox.scope === undefined) {
    sandbox.scope = sandboxScopeFromPerSession(rawPerSession);
    changes.push(`Moved ${pathLabel}.perSession → ${pathLabel}.scope (${String(sandbox.scope)}).`);
  } else {
    changes.push(`Removed ${pathLabel}.perSession (${pathLabel}.scope already set).`);
  }
  delete sandbox.perSession;
}

export const LEGACY_CONFIG_MIGRATIONS_RUNTIME_AGENTS: LegacyConfigMigrationSpec[] = [
  defineLegacyConfigMigration({
    id: "agents.sandbox.perSession->scope",
    describe: "Move legacy agent sandbox perSession aliases to sandbox.scope",
    legacyRules: LEGACY_SANDBOX_SCOPE_RULES,
    apply: (raw, changes) => {
      const agents = getRecord(raw.agents);
      const defaults = getRecord(agents?.defaults);
      const defaultSandbox = getRecord(defaults?.sandbox);
      if (defaultSandbox) {
        migrateLegacySandboxPerSession(defaultSandbox, "agents.defaults.sandbox", changes);
      }

      if (!Array.isArray(agents?.list)) {
        return;
      }
      for (const [index, agent] of agents.list.entries()) {
        const sandbox = getRecord(getRecord(agent)?.sandbox);
        if (!sandbox) {
          continue;
        }
        migrateLegacySandboxPerSession(sandbox, `agents.list.${index}.sandbox`, changes);
      }
    },
  }),
  defineLegacyConfigMigration({
    id: "memorySearch->agents.defaults.memorySearch",
    describe: "Move top-level memorySearch to agents.defaults.memorySearch",
    legacyRules: [MEMORY_SEARCH_RULE],
    apply: (raw, changes) => {
      const legacyMemorySearch = getRecord(raw.memorySearch);
      if (!legacyMemorySearch) {
        return;
      }

      mergeLegacyIntoDefaults({
        raw,
        rootKey: "agents",
        fieldKey: "memorySearch",
        legacyValue: legacyMemorySearch,
        changes,
        movedMessage: "Moved memorySearch → agents.defaults.memorySearch.",
        mergedMessage:
          "Merged memorySearch → agents.defaults.memorySearch (filled missing fields from legacy; kept explicit agents.defaults values).",
      });
      delete raw.memorySearch;
    },
  }),
  defineLegacyConfigMigration({
    id: "pulsecheck->agents.defaults.pulsecheck",
    describe:
      "Move top-level pulsecheck to agents.defaults.pulsecheck/channels.defaults.pulsecheck",
    legacyRules: [PULSECHECK_RULE],
    apply: (raw, changes) => {
      const legacyPulsecheck = getRecord(raw.pulsecheck);
      if (!legacyPulsecheck) {
        return;
      }

      const { agentPulsecheck, channelPulsecheck } = splitLegacyPulsecheck(legacyPulsecheck);

      if (agentPulsecheck) {
        mergeLegacyIntoDefaults({
          raw,
          rootKey: "agents",
          fieldKey: "pulsecheck",
          legacyValue: agentPulsecheck,
          changes,
          movedMessage: "Moved pulsecheck → agents.defaults.pulsecheck.",
          mergedMessage:
            "Merged pulsecheck → agents.defaults.pulsecheck (filled missing fields from legacy; kept explicit agents.defaults values).",
        });
      }

      if (channelPulsecheck) {
        mergeLegacyIntoDefaults({
          raw,
          rootKey: "channels",
          fieldKey: "pulsecheck",
          legacyValue: channelPulsecheck,
          changes,
          movedMessage: "Moved pulsecheck visibility → channels.defaults.pulsecheck.",
          mergedMessage:
            "Merged pulsecheck visibility → channels.defaults.pulsecheck (filled missing fields from legacy; kept explicit channels.defaults values).",
        });
      }

      if (!agentPulsecheck && !channelPulsecheck) {
        changes.push("Removed empty top-level pulsecheck.");
      }
      delete raw.pulsecheck;
    },
  }),
];
