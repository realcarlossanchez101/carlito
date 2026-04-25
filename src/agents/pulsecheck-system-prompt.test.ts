import { describe, expect, it } from "vitest";
import { resolvePulsecheckPromptForSystemPrompt } from "./pulsecheck-system-prompt.js";

describe("resolvePulsecheckPromptForSystemPrompt", () => {
  it("omits the pulsecheck section when disabled in defaults", () => {
    expect(
      resolvePulsecheckPromptForSystemPrompt({
        config: {
          agents: {
            defaults: {
              pulsecheck: {
                includeSystemPromptSection: false,
              },
            },
          },
        },
        agentId: "main",
        defaultAgentId: "main",
      }),
    ).toBeUndefined();
  });

  it("omits the pulsecheck section when the default cadence is disabled", () => {
    expect(
      resolvePulsecheckPromptForSystemPrompt({
        config: {
          agents: {
            defaults: {
              pulsecheck: {
                every: "0m",
              },
            },
          },
        },
        agentId: "main",
        defaultAgentId: "main",
      }),
    ).toBeUndefined();
  });

  it("omits the pulsecheck section when the default-agent override disables cadence", () => {
    expect(
      resolvePulsecheckPromptForSystemPrompt({
        config: {
          agents: {
            defaults: {
              pulsecheck: {
                every: "30m",
              },
            },
            list: [
              {
                id: "main",
                pulsecheck: {
                  every: "0m",
                },
              },
            ],
          },
        },
        agentId: "main",
        defaultAgentId: "main",
      }),
    ).toBeUndefined();
  });

  it("omits the pulsecheck section when only a non-default agent has explicit pulsecheck config", () => {
    expect(
      resolvePulsecheckPromptForSystemPrompt({
        config: {
          agents: {
            list: [
              { id: "main", default: true },
              {
                id: "ops",
                pulsecheck: {
                  every: "30m",
                },
              },
            ],
          },
        },
        agentId: "main",
        defaultAgentId: "main",
      }),
    ).toBeUndefined();
  });

  it("honors default-agent overrides for the prompt text", () => {
    expect(
      resolvePulsecheckPromptForSystemPrompt({
        config: {
          agents: {
            defaults: {
              pulsecheck: {
                prompt: "Default prompt",
              },
            },
            list: [
              {
                id: "main",
                pulsecheck: {
                  prompt: "  Ops check  ",
                },
              },
            ],
          },
        },
        agentId: "main",
        defaultAgentId: "main",
      }),
    ).toBe("Ops check");
  });

  it("does not inject the pulsecheck section for non-default agents", () => {
    expect(
      resolvePulsecheckPromptForSystemPrompt({
        config: {
          agents: {
            defaults: {
              pulsecheck: {
                prompt: "Default prompt",
              },
            },
            list: [
              {
                id: "ops",
                pulsecheck: {
                  prompt: "Ops prompt",
                },
              },
            ],
          },
        },
        agentId: "ops",
        defaultAgentId: "main",
      }),
    ).toBeUndefined();
  });
});
