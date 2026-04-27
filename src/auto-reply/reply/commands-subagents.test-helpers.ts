import type { SubagentRunRecord } from "../../agents/subagent-registry.types.js";
import type { CarlitoConfig } from "../../config/types.carlito.js";
import type { handleSubagentsSendAction } from "./commands-subagents/action-send.js";
import type { InlineDirectives } from "./directive-handling.js";

export function buildSubagentRun(): SubagentRunRecord {
  return {
    runId: "run-1",
    childSessionKey: "agent:main:subagent:abc",
    requesterSessionKey: "agent:main:main",
    requesterDisplayKey: "main",
    task: "do thing",
    cleanup: "keep",
    createdAt: 1000,
    startedAt: 1000,
  };
}

export function buildSubagentsSendContext(params?: {
  cfg?: CarlitoConfig;
  handledPrefix?: string;
  requesterKey?: string;
  runs?: SubagentRunRecord[];
  restTokens?: string[];
}) {
  return {
    params: {
      cfg:
        params?.cfg ??
        ({
          commands: { text: true },
          channels: { whatsapp: { allowFrom: ["*"] } },
        } as CarlitoConfig),
      ctx: {},
      command: {
        channel: "whatsapp",
        to: "test-bot",
      },
    },
    handledPrefix: params?.handledPrefix ?? "/subagents",
    requesterKey: params?.requesterKey ?? "agent:main:main",
    runs: params?.runs ?? [buildSubagentRun()],
    restTokens: params?.restTokens ?? [],
  } as Parameters<typeof handleSubagentsSendAction>[0];
}

export function createEmptyInlineDirectives(): InlineDirectives {
  return {
    cleaned: "",
    hasThinkDirective: false,
    hasVerboseDirective: false,
    hasFastDirective: false,
    hasReasoningDirective: false,
    hasTraceDirective: false,
    hasElevatedDirective: false,
    hasExecDirective: false,
    hasExecOptions: false,
    invalidExecHost: false,
    invalidExecSecurity: false,
    invalidExecAsk: false,
    invalidExecNode: false,
    hasStatusDirective: false,
    hasModelDirective: false,
    hasQueueDirective: false,
    queueReset: false,
    hasQueueOptions: false,
  };
}
