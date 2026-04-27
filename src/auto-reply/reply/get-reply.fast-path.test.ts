import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { CarlitoConfig } from "../../config/config.js";
import {
  initFastReplySessionState,
  markCompleteReplyConfig,
  withFastReplyConfig,
} from "./get-reply-fast-path.js";
import {
  buildGetReplyCtx,
  createGetReplySessionState,
  expectResolvedTelegramTimezone,
  registerGetReplyRuntimeOverrides,
} from "./get-reply.test-fixtures.js";
import { loadGetReplyModuleForTest } from "./get-reply.test-loader.js";
import "./get-reply.test-runtime-mocks.js";

const mocks = vi.hoisted(() => ({
  ensureAgentWorkspace: vi.fn(),
  initSessionState: vi.fn(),
  resolveReplyDirectives: vi.fn(),
}));

vi.mock("../../agents/workspace.js", () => ({
  DEFAULT_AGENT_WORKSPACE_DIR: "/tmp/carlito-workspace",
  ensureAgentWorkspace: (...args: unknown[]) => mocks.ensureAgentWorkspace(...args),
}));
registerGetReplyRuntimeOverrides(mocks);

let getReplyFromConfig: typeof import("./get-reply.js").getReplyFromConfig;
let loadConfigMock: typeof import("../../config/config.js").loadConfig;
let runPreparedReplyMock: typeof import("./get-reply-run.js").runPreparedReply;

async function loadGetReplyRuntimeForTest() {
  ({ getReplyFromConfig } = await loadGetReplyModuleForTest({ cacheKey: import.meta.url }));
  ({ loadConfig: loadConfigMock } = await import("../../config/config.js"));
  ({ runPreparedReply: runPreparedReplyMock } = await import("./get-reply-run.js"));
}

describe("getReplyFromConfig fast test bootstrap", () => {
  beforeAll(async () => {
    await loadGetReplyRuntimeForTest();
  });

  beforeEach(() => {
    vi.stubEnv("CARLITO_TEST_FAST", "1");
    mocks.ensureAgentWorkspace.mockReset();
    mocks.initSessionState.mockReset();
    mocks.resolveReplyDirectives.mockReset();
    vi.mocked(loadConfigMock).mockReset();
    vi.mocked(runPreparedReplyMock).mockReset();
    vi.mocked(loadConfigMock).mockReturnValue({});
    mocks.resolveReplyDirectives.mockResolvedValue({ kind: "reply", reply: { text: "ok" } });
    vi.mocked(runPreparedReplyMock).mockResolvedValue({ text: "ok" });
    mocks.initSessionState.mockResolvedValue(createGetReplySessionState());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails fast on unmarked config overrides in strict fast-test mode", async () => {
    await expect(
      getReplyFromConfig(buildGetReplyCtx(), undefined, {} as CarlitoConfig),
    ).rejects.toThrow(/withFastReplyConfig\(\)\/markCompleteReplyConfig\(\)/);
    expect(vi.mocked(loadConfigMock)).not.toHaveBeenCalled();
  });

  it("skips loadConfig, workspace bootstrap, and session bootstrap for marked test configs", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "carlito-fast-reply-"));
    const cfg = markCompleteReplyConfig({
      agents: {
        defaults: {
          model: "anthropic/claude-opus-4-6",
          workspace: path.join(home, "carlito"),
        },
      },
      channels: { telegram: { allowFrom: ["*"] } },
      session: { store: path.join(home, "sessions.json") },
    } as CarlitoConfig);

    await expect(getReplyFromConfig(buildGetReplyCtx(), undefined, cfg)).resolves.toEqual({
      text: "ok",
    });
    expect(vi.mocked(loadConfigMock)).not.toHaveBeenCalled();
    expect(mocks.ensureAgentWorkspace).not.toHaveBeenCalled();
    expect(mocks.initSessionState).not.toHaveBeenCalled();
    expect(mocks.resolveReplyDirectives).not.toHaveBeenCalled();
    expect(vi.mocked(runPreparedReplyMock)).toHaveBeenCalledWith(
      expect.objectContaining({
        cfg,
      }),
    );
  });

  it("still merges partial config overrides against loadConfig()", async () => {
    vi.stubEnv("CARLITO_ALLOW_SLOW_REPLY_TESTS", "1");
    vi.mocked(loadConfigMock).mockReturnValue({
      channels: {
        telegram: {
          botToken: "resolved-telegram-token",
        },
      },
    } satisfies CarlitoConfig);

    await getReplyFromConfig(buildGetReplyCtx(), undefined, {
      agents: {
        defaults: {
          userTimezone: "America/New_York",
        },
      },
    } as CarlitoConfig);

    expect(vi.mocked(loadConfigMock)).toHaveBeenCalledOnce();
    expect(mocks.initSessionState).toHaveBeenCalledOnce();
    expectResolvedTelegramTimezone(mocks.resolveReplyDirectives);
  });

  it("marks configs through withFastReplyConfig()", async () => {
    const cfg = withFastReplyConfig({ session: { store: "/tmp/sessions.json" } } as CarlitoConfig);

    await expect(getReplyFromConfig(buildGetReplyCtx(), undefined, cfg)).resolves.toEqual({
      text: "ok",
    });
    expect(vi.mocked(loadConfigMock)).not.toHaveBeenCalled();
    expect(mocks.resolveReplyDirectives).not.toHaveBeenCalled();
    expect(vi.mocked(runPreparedReplyMock)).toHaveBeenCalledOnce();
  });

  it("uses native command target session keys during fast bootstrap", () => {
    const result = initFastReplySessionState({
      ctx: buildGetReplyCtx({
        SessionKey: "telegram:slash:123",
        CommandSource: "native",
        CommandTargetSessionKey: "agent:main:main",
      }),
      cfg: { session: { store: "/tmp/sessions.json" } } as CarlitoConfig,
      agentId: "main",
      commandAuthorized: true,
      workspaceDir: "/tmp/workspace",
    });

    expect(result.sessionKey).toBe("agent:main:main");
    expect(result.sessionCtx.SessionKey).toBe("agent:main:main");
  });

  it("keeps the existing session for /reset newline soft during fast bootstrap", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "carlito-fast-reset-newline-soft-"));
    const storePath = path.join(home, "sessions.json");
    const sessionKey = "agent:main:telegram:123";
    await fs.writeFile(
      storePath,
      JSON.stringify({
        [sessionKey]: {
          sessionId: "existing-fast-reset-newline-soft",
          updatedAt: Date.now(),
        },
      }),
      "utf8",
    );

    const result = initFastReplySessionState({
      ctx: buildGetReplyCtx({
        Body: "/reset \nsoft",
        RawBody: "/reset \nsoft",
        CommandBody: "/reset \nsoft",
        SessionKey: sessionKey,
      }),
      cfg: { session: { store: storePath } } as CarlitoConfig,
      agentId: "main",
      commandAuthorized: true,
      workspaceDir: home,
    });

    expect(result.resetTriggered).toBe(false);
    expect(result.isNewSession).toBe(false);
    expect(result.sessionId).toBe("existing-fast-reset-newline-soft");
  });

  it("keeps the existing session for /reset: soft during fast bootstrap", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "carlito-fast-reset-colon-soft-"));
    const storePath = path.join(home, "sessions.json");
    const sessionKey = "agent:main:telegram:123";
    await fs.writeFile(
      storePath,
      JSON.stringify({
        [sessionKey]: {
          sessionId: "existing-fast-reset-colon-soft",
          updatedAt: Date.now(),
        },
      }),
      "utf8",
    );

    const result = initFastReplySessionState({
      ctx: buildGetReplyCtx({
        Body: "/reset: soft",
        RawBody: "/reset: soft",
        CommandBody: "/reset: soft",
        SessionKey: sessionKey,
      }),
      cfg: { session: { store: storePath } } as CarlitoConfig,
      agentId: "main",
      commandAuthorized: true,
      workspaceDir: home,
    });

    expect(result.resetTriggered).toBe(false);
    expect(result.isNewSession).toBe(false);
    expect(result.sessionId).toBe("existing-fast-reset-colon-soft");
  });
});
