import type { EmbeddedRunTrigger } from "./params.js";

type EmbeddedRunTriggerPolicy = {
  injectPulsecheckPrompt: boolean;
};

const DEFAULT_EMBEDDED_RUN_TRIGGER_POLICY: EmbeddedRunTriggerPolicy = {
  injectPulsecheckPrompt: true,
};

const EMBEDDED_RUN_TRIGGER_POLICY: Partial<Record<EmbeddedRunTrigger, EmbeddedRunTriggerPolicy>> = {
  cron: {
    injectPulsecheckPrompt: false,
  },
};

export function shouldInjectPulsecheckPromptForTrigger(trigger?: EmbeddedRunTrigger): boolean {
  return (
    (trigger ? EMBEDDED_RUN_TRIGGER_POLICY[trigger] : undefined)?.injectPulsecheckPrompt ??
    DEFAULT_EMBEDDED_RUN_TRIGGER_POLICY.injectPulsecheckPrompt
  );
}
