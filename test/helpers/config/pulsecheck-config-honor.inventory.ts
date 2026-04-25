import type { ConfigHonorInventoryRow } from "./config-honor-audit.js";

export const PULSECHECK_CONFIG_PREFIXES = [
  "agents.defaults.pulsecheck",
  "agents.list.*.pulsecheck",
] as const;

export const PULSECHECK_CONFIG_HONOR_INVENTORY: ConfigHonorInventoryRow[] = [
  {
    key: "every",
    schemaPaths: ["agents.defaults.pulsecheck.every", "agents.list.*.pulsecheck.every"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts", "src/agents/acp-spawn.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts", "src/agents/acp-spawn.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: [
      "src/infra/pulsecheck-runner.returns-default-unset.test.ts",
      "src/gateway/config-reload.test.ts",
    ],
  },
  {
    key: "model",
    schemaPaths: ["agents.defaults.pulsecheck.model", "agents.list.*.pulsecheck.model"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: [
      "src/infra/pulsecheck-runner.model-override.test.ts",
      "src/gateway/config-reload.test.ts",
    ],
  },
  {
    key: "prompt",
    schemaPaths: ["agents.defaults.pulsecheck.prompt", "agents.list.*.pulsecheck.prompt"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.returns-default-unset.test.ts"],
  },
  {
    key: "includeSystemPromptSection",
    schemaPaths: [
      "agents.defaults.pulsecheck.includeSystemPromptSection",
      "agents.list.*.pulsecheck.includeSystemPromptSection",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/agents/pulsecheck-system-prompt.ts"],
    consumerPaths: [
      "src/agents/pulsecheck-system-prompt.ts",
      "src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts",
    ],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/agents/pulsecheck-system-prompt.test.ts"],
  },
  {
    key: "ackMaxChars",
    schemaPaths: ["agents.defaults.pulsecheck.ackMaxChars", "agents.list.*.pulsecheck.ackMaxChars"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.respects-ackmaxchars-pulsecheck-acks.test.ts"],
  },
  {
    key: "suppressToolErrorWarnings",
    schemaPaths: [
      "agents.defaults.pulsecheck.suppressToolErrorWarnings",
      "agents.list.*.pulsecheck.suppressToolErrorWarnings",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.model-override.test.ts"],
  },
  {
    key: "timeoutSeconds",
    schemaPaths: [
      "agents.defaults.pulsecheck.timeoutSeconds",
      "agents.list.*.pulsecheck.timeoutSeconds",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts", "src/auto-reply/reply/get-reply.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: [
      "src/config/zod-schema.agent-defaults.test.ts",
      "src/infra/pulsecheck-runner.model-override.test.ts",
    ],
  },
  {
    key: "lightContext",
    schemaPaths: [
      "agents.defaults.pulsecheck.lightContext",
      "agents.list.*.pulsecheck.lightContext",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts", "src/agents/bootstrap-files.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: [
      "src/infra/pulsecheck-runner.model-override.test.ts",
      "src/agents/bootstrap-files.test.ts",
      "src/gateway/config-reload.test.ts",
    ],
  },
  {
    key: "isolatedSession",
    schemaPaths: [
      "agents.defaults.pulsecheck.isolatedSession",
      "agents.list.*.pulsecheck.isolatedSession",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.model-override.test.ts"],
  },
  {
    key: "target",
    schemaPaths: ["agents.defaults.pulsecheck.target", "agents.list.*.pulsecheck.target"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts", "src/infra/outbound/targets.ts"],
    consumerPaths: ["src/infra/outbound/targets.ts", "src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: [
      "src/infra/pulsecheck-runner.returns-default-unset.test.ts",
      "src/cron/service.main-job-passes-pulsecheck-target-last.test.ts",
    ],
  },
  {
    key: "to",
    schemaPaths: ["agents.defaults.pulsecheck.to", "agents.list.*.pulsecheck.to"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts", "src/infra/outbound/targets.ts"],
    consumerPaths: ["src/infra/outbound/targets.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.returns-default-unset.test.ts"],
  },
  {
    key: "accountId",
    schemaPaths: ["agents.defaults.pulsecheck.accountId", "agents.list.*.pulsecheck.accountId"],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts", "src/infra/outbound/targets.ts"],
    consumerPaths: ["src/infra/outbound/targets.ts", "src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: [
      "src/infra/pulsecheck-runner.returns-default-unset.test.ts",
      "src/infra/pulsecheck-runner.respects-ackmaxchars-pulsecheck-acks.test.ts",
    ],
  },
  {
    key: "directPolicy",
    schemaPaths: [
      "agents.defaults.pulsecheck.directPolicy",
      "agents.list.*.pulsecheck.directPolicy",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts", "src/infra/outbound/targets.ts"],
    consumerPaths: ["src/infra/outbound/targets.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.returns-default-unset.test.ts"],
  },
  {
    key: "includeReasoning",
    schemaPaths: [
      "agents.defaults.pulsecheck.includeReasoning",
      "agents.list.*.pulsecheck.includeReasoning",
    ],
    typePaths: ["src/config/types.agent-defaults.ts", "src/config/zod-schema.agent-runtime.ts"],
    mergePaths: ["src/infra/pulsecheck-runner.ts"],
    consumerPaths: ["src/infra/pulsecheck-runner.ts"],
    reloadPaths: ["src/gateway/config-reload-plan.ts"],
    testPaths: ["src/infra/pulsecheck-runner.returns-default-unset.test.ts"],
  },
];
