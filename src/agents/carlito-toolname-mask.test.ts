import { describe, expect, it, vi } from "vitest";
import {
  applyToolNameAliasInPayload,
  applyToolNameAliasToString,
  canonicalFromAlias,
  TOOL_NAME_ALIAS_MAP,
  wrapStreamFnWithToolNameMask,
} from "./carlito-toolname-mask.js";

describe("applyToolNameAliasToString", () => {
  it("rewrites canonical tool names with word boundaries", () => {
    expect(applyToolNameAliasToString("call sessions_spawn here")).toBe("call helper_start here");
  });

  it("leaves substrings of canonical names untouched", () => {
    expect(applyToolNameAliasToString("xsessions_spawnx")).toBe("xsessions_spawnx");
  });

  it("rewrites multiple canonical names in one string", () => {
    expect(applyToolNameAliasToString("use sessions_spawn then sessions_yield")).toBe(
      "use helper_start then helper_yield",
    );
  });

  it("handles canonical names inside backticks", () => {
    expect(applyToolNameAliasToString("Run `subagents` to inspect")).toBe(
      "Run `helper_manage` to inspect",
    );
  });

  it("rewrites distinct canonical names with overlapping prefixes correctly", () => {
    expect(applyToolNameAliasToString("sessions_send and sessions_history")).toBe(
      "helper_send and helper_history",
    );
  });

  it("leaves strings without any canonical name untouched", () => {
    expect(applyToolNameAliasToString("hello world")).toBe("hello world");
  });
});

describe("canonicalFromAlias", () => {
  it("returns canonical for a known alias", () => {
    expect(canonicalFromAlias("helper_start")).toBe("sessions_spawn");
  });

  it("returns undefined for an unknown alias", () => {
    expect(canonicalFromAlias("not_a_tool")).toBeUndefined();
  });

  it("returns undefined for a canonical name (does not round-trip)", () => {
    expect(canonicalFromAlias("sessions_spawn")).toBeUndefined();
  });

  it("covers every entry in TOOL_NAME_ALIAS_MAP", () => {
    for (const [canonical, alias] of Object.entries(TOOL_NAME_ALIAS_MAP)) {
      expect(canonicalFromAlias(alias)).toBe(canonical);
    }
  });
});

describe("applyToolNameAliasInPayload", () => {
  it("rewrites tool names in tools[]", () => {
    const payload = {
      tools: [
        { name: "sessions_spawn", description: "spawn a sub-agent" },
        { name: "sessions_yield", description: "end your turn" },
      ],
    };
    applyToolNameAliasInPayload(payload);
    expect(payload.tools[0].name).toBe("helper_start");
    expect(payload.tools[1].name).toBe("helper_yield");
  });

  it("rewrites canonical names referenced inside descriptions", () => {
    const payload = {
      tools: [
        {
          name: "agents_list",
          description: "List agent ids you can target with `sessions_spawn`.",
        },
      ],
    };
    applyToolNameAliasInPayload(payload);
    expect(payload.tools[0].name).toBe("helper_catalog");
    expect(payload.tools[0].description).toBe("List agent ids you can target with `helper_start`.");
  });

  it("rewrites tool name references inside system prompt blocks", () => {
    const payload = {
      system: [
        {
          type: "text",
          text: "- sessions_spawn: spawn helpers\n- sessions_yield: end your turn",
        },
      ],
    };
    applyToolNameAliasInPayload(payload);
    expect(payload.system[0].text).toContain("- helper_start: spawn helpers");
    expect(payload.system[0].text).toContain("- helper_yield: end your turn");
  });

  it("rewrites tool_use blocks in message history", () => {
    const payload = {
      messages: [
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "toolu_1", name: "sessions_spawn", input: {} },
            { type: "tool_use", id: "toolu_2", name: "subagents", input: {} },
          ],
        },
      ],
    };
    applyToolNameAliasInPayload(payload);
    expect(payload.messages[0].content[0].name).toBe("helper_start");
    expect(payload.messages[0].content[1].name).toBe("helper_manage");
  });

  it("does not mutate non-string primitives", () => {
    const payload = { max_tokens: 4096, stream: true, thinking: null };
    applyToolNameAliasInPayload(payload);
    expect(payload).toEqual({ max_tokens: 4096, stream: true, thinking: null });
  });

  it("rewrites every alias in a realistic Anthropic payload shape", () => {
    const payload = {
      tools: [
        { name: "sessions_spawn", description: "Spawn a sub-agent" },
        { name: "sessions_yield", description: "End your turn" },
        { name: "subagents", description: "List, kill, or steer sub-agents" },
        { name: "agents_list", description: "List agent ids" },
        { name: "session_status", description: "Show status card" },
        { name: "canvas", description: "Control node canvases" },
        { name: "nodes", description: "Discover and control paired nodes" },
        { name: "gateway", description: "Restart the gateway" },
      ],
      system: [
        {
          type: "text",
          text: "Use sessions_spawn to start helpers, sessions_yield to end the turn, and subagents to manage them.",
        },
      ],
    };
    applyToolNameAliasInPayload(payload);
    const serialized = JSON.stringify(payload);
    for (const canonical of Object.keys(TOOL_NAME_ALIAS_MAP)) {
      expect(serialized).not.toMatch(new RegExp(`\\b${canonical}\\b`));
    }
    expect(payload.tools.map((t) => t.name)).toEqual([
      "helper_start",
      "helper_yield",
      "helper_manage",
      "helper_catalog",
      "runtime_info",
      "display_panel",
      "paired_devices",
      "runtime_control",
    ]);
  });
});

describe("wrapStreamFnWithToolNameMask", () => {
  it("mutates the payload via onPayload before the underlying stream runs", () => {
    const captured: Record<string, unknown> = {};
    const underlying = vi.fn((_model, _context, options) => {
      const payload: Record<string, unknown> = {
        tools: [{ name: "sessions_spawn", description: "use sessions_spawn here" }],
      };
      options?.onPayload?.(payload, _model);
      Object.assign(captured, payload);
      return {} as never;
    });

    const wrapped = wrapStreamFnWithToolNameMask(underlying as never);
    void wrapped(
      { provider: "anthropic", id: "claude-opus-4-7" } as never,
      {} as never,
      {} as never,
    );

    const tools = captured.tools as Array<{ name: string; description: string }>;
    expect(tools[0].name).toBe("helper_start");
    expect(tools[0].description).toBe("use helper_start here");
  });
});
