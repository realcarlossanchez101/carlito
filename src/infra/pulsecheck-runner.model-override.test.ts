import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { resolveAgentMainSessionKey, resolveMainSessionKey } from "../config/sessions.js";
import { runPulsecheckOnce } from "./pulsecheck-runner.js";
import {
  seedSessionStore,
  type PulsecheckReplySpy,
  withTempPulsecheckSandbox,
} from "./pulsecheck-runner.test-utils.js";

vi.mock("./outbound/deliver.js", () => ({
  deliverOutboundPayloads: vi.fn().mockResolvedValue(undefined),
}));

type SeedSessionInput = {
  lastChannel: string;
  lastTo: string;
  updatedAt?: number;
};
type AgentDefaultsConfig = NonNullable<NonNullable<OpenClawConfig["agents"]>["defaults"]>;
type PulsecheckConfig = NonNullable<AgentDefaultsConfig["pulsecheck"]>;

async function withPulsecheckFixture(
  run: (ctx: {
    tmpDir: string;
    storePath: string;
    replySpy: PulsecheckReplySpy;
    seedSession: (sessionKey: string, input: SeedSessionInput) => Promise<void>;
  }) => Promise<unknown>,
): Promise<unknown> {
  return withTempPulsecheckSandbox(
    async ({ tmpDir, storePath, replySpy }) => {
      const seedSession = async (sessionKey: string, input: SeedSessionInput) => {
        await seedSessionStore(storePath, sessionKey, {
          updatedAt: input.updatedAt,
          lastChannel: input.lastChannel,
          lastProvider: input.lastChannel,
          lastTo: input.lastTo,
        });
      };
      return run({ tmpDir, storePath, replySpy, seedSession });
    },
    { prefix: "openclaw-hb-model-" },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runPulsecheckOnce – pulsecheck model override", () => {
  async function runPulsecheckWithSeed(params: {
    seedSession: (sessionKey: string, input: SeedSessionInput) => Promise<void>;
    cfg: OpenClawConfig;
    sessionKey: string;
    replySpy: PulsecheckReplySpy;
    agentId?: string;
  }) {
    await params.seedSession(params.sessionKey, { lastChannel: "whatsapp", lastTo: "+1555" });

    params.replySpy.mockResolvedValue({ text: "PULSECHECK_OK" });

    await runPulsecheckOnce({
      cfg: params.cfg,
      agentId: params.agentId,
      deps: {
        getReplyFromConfig: params.replySpy,
        getQueueSize: () => 0,
        nowMs: () => 0,
      },
    });

    expect(params.replySpy).toHaveBeenCalledTimes(1);
    return {
      ctx: params.replySpy.mock.calls[0]?.[0],
      opts: params.replySpy.mock.calls[0]?.[1],
      replySpy: params.replySpy,
    };
  }

  async function runDefaultsPulsecheck(params: {
    model?: string;
    suppressToolErrorWarnings?: boolean;
    timeoutSeconds?: number;
    lightContext?: boolean;
    isolatedSession?: boolean;
  }) {
    return withPulsecheckFixture(async ({ tmpDir, storePath, replySpy, seedSession }) => {
      const cfg: OpenClawConfig = {
        agents: {
          defaults: {
            workspace: tmpDir,
            pulsecheck: {
              every: "5m",
              target: "whatsapp",
              model: params.model,
              suppressToolErrorWarnings: params.suppressToolErrorWarnings,
              timeoutSeconds: params.timeoutSeconds,
              lightContext: params.lightContext,
              isolatedSession: params.isolatedSession,
            },
          },
        },
        channels: { whatsapp: { allowFrom: ["*"] } },
        session: { store: storePath },
      };
      const sessionKey = resolveMainSessionKey(cfg);
      const result = await runPulsecheckWithSeed({
        seedSession,
        cfg,
        sessionKey,
        replySpy,
      });
      return result.opts;
    });
  }

  async function expectPerAgentPulsecheckOverride(params: {
    defaultsPulsecheck: Partial<PulsecheckConfig>;
    expectedOptions: Record<string, unknown>;
    pulsecheck: Partial<PulsecheckConfig>;
  }): Promise<void> {
    await withPulsecheckFixture(async ({ tmpDir, storePath, replySpy, seedSession }) => {
      const cfg: OpenClawConfig = {
        agents: {
          defaults: {
            pulsecheck: {
              every: "30m",
              ...params.defaultsPulsecheck,
            },
          },
          list: [
            { id: "main", default: true },
            {
              id: "ops",
              workspace: tmpDir,
              pulsecheck: {
                every: "5m",
                target: "whatsapp",
                ...params.pulsecheck,
              },
            },
          ],
        },
        channels: { whatsapp: { allowFrom: ["*"] } },
        session: { store: storePath },
      };
      const sessionKey = resolveAgentMainSessionKey({ cfg, agentId: "ops" });
      const result = await runPulsecheckWithSeed({
        seedSession,
        cfg,
        agentId: "ops",
        sessionKey,
        replySpy,
      });

      expect(result.replySpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          isPulsecheck: true,
          ...params.expectedOptions,
        }),
        cfg,
      );
    });
  }

  it("passes pulsecheckModelOverride from defaults pulsecheck config", async () => {
    const replyOpts = await runDefaultsPulsecheck({ model: "ollama/llama3.2:1b" });
    expect(replyOpts).toEqual(
      expect.objectContaining({
        isPulsecheck: true,
        pulsecheckModelOverride: "ollama/llama3.2:1b",
        suppressToolErrorWarnings: false,
      }),
    );
  });

  it("passes suppressToolErrorWarnings when configured", async () => {
    const replyOpts = await runDefaultsPulsecheck({ suppressToolErrorWarnings: true });
    expect(replyOpts).toEqual(
      expect.objectContaining({
        isPulsecheck: true,
        suppressToolErrorWarnings: true,
      }),
    );
  });

  it("passes pulsecheck timeoutSeconds as a reply-run timeout override", async () => {
    const replyOpts = await runDefaultsPulsecheck({ timeoutSeconds: 45 });
    expect(replyOpts).toEqual(
      expect.objectContaining({
        isPulsecheck: true,
        timeoutOverrideSeconds: 45,
      }),
    );
  });

  it("passes bootstrapContextMode when pulsecheck lightContext is enabled", async () => {
    const replyOpts = await runDefaultsPulsecheck({ lightContext: true });
    expect(replyOpts).toEqual(
      expect.objectContaining({
        isPulsecheck: true,
        bootstrapContextMode: "lightweight",
      }),
    );
  });

  it("uses isolated session key when isolatedSession is enabled", async () => {
    await withPulsecheckFixture(async ({ tmpDir, storePath, replySpy, seedSession }) => {
      const cfg: OpenClawConfig = {
        agents: {
          defaults: {
            workspace: tmpDir,
            pulsecheck: {
              every: "5m",
              target: "whatsapp",
              isolatedSession: true,
            },
          },
        },
        channels: { whatsapp: { allowFrom: ["*"] } },
        session: { store: storePath },
      };
      const sessionKey = resolveMainSessionKey(cfg);
      const result = await runPulsecheckWithSeed({
        seedSession,
        cfg,
        sessionKey,
        replySpy,
      });

      // Isolated pulsecheck runs use a dedicated session key with :pulsecheck suffix
      expect(result.ctx?.SessionKey).toBe(`${sessionKey}:pulsecheck`);
    });
  });

  it("uses main session key when isolatedSession is not set", async () => {
    await withPulsecheckFixture(async ({ tmpDir, storePath, replySpy, seedSession }) => {
      const cfg: OpenClawConfig = {
        agents: {
          defaults: {
            workspace: tmpDir,
            pulsecheck: {
              every: "5m",
              target: "whatsapp",
            },
          },
        },
        channels: { whatsapp: { allowFrom: ["*"] } },
        session: { store: storePath },
      };
      const sessionKey = resolveMainSessionKey(cfg);
      const result = await runPulsecheckWithSeed({
        seedSession,
        cfg,
        sessionKey,
        replySpy,
      });

      expect(result.ctx?.SessionKey).toBe(sessionKey);
    });
  });

  it("passes per-agent pulsecheck model override (merged with defaults)", async () => {
    await expectPerAgentPulsecheckOverride({
      defaultsPulsecheck: { model: "openai/gpt-5.4" },
      pulsecheck: { model: "ollama/llama3.2:1b" },
      expectedOptions: {
        pulsecheckModelOverride: "ollama/llama3.2:1b",
      },
    });
  });

  it("passes per-agent pulsecheck lightContext override after merging defaults", async () => {
    await expectPerAgentPulsecheckOverride({
      defaultsPulsecheck: { lightContext: false },
      pulsecheck: { lightContext: true },
      expectedOptions: {
        bootstrapContextMode: "lightweight",
      },
    });
  });

  it("passes per-agent pulsecheck timeout override after merging defaults", async () => {
    await expectPerAgentPulsecheckOverride({
      defaultsPulsecheck: { timeoutSeconds: 120 },
      pulsecheck: { timeoutSeconds: 45 },
      expectedOptions: {
        timeoutOverrideSeconds: 45,
      },
    });
  });

  it("does not pass pulsecheckModelOverride when no pulsecheck model is configured", async () => {
    const replyOpts = await runDefaultsPulsecheck({ model: undefined });
    expect(replyOpts).toEqual(
      expect.objectContaining({
        isPulsecheck: true,
      }),
    );
  });

  it("trims pulsecheck model override before passing it downstream", async () => {
    const replyOpts = await runDefaultsPulsecheck({ model: "  ollama/llama3.2:1b  " });
    expect(replyOpts).toEqual(
      expect.objectContaining({
        isPulsecheck: true,
        pulsecheckModelOverride: "ollama/llama3.2:1b",
      }),
    );
  });
});
