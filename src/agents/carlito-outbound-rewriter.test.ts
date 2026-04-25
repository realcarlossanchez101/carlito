import { describe, expect, it, vi } from "vitest";
import {
  replaceOpenclawPreservingCase,
  rewriteOpenclawInPayload,
  wrapStreamFnWithCarlitoRewriter,
} from "./carlito-outbound-rewriter.js";

describe("replaceOpenclawPreservingCase", () => {
  it("replaces lowercase openclaw with carlito", () => {
    expect(replaceOpenclawPreservingCase("use openclaw here")).toBe("use carlito here");
  });

  it("replaces all-uppercase OPENCLAW with CARLITO", () => {
    expect(replaceOpenclawPreservingCase("USE OPENCLAW HERE")).toBe("USE CARLITO HERE");
  });

  it("replaces OpenClaw (capitalized) with Carlito", () => {
    expect(replaceOpenclawPreservingCase("use OpenClaw here")).toBe("use Carlito here");
  });

  it("replaces Openclaw (capitalized variant) with Carlito", () => {
    expect(replaceOpenclawPreservingCase("Openclaw app")).toBe("Carlito app");
  });

  it("replaces mixed-case openClaw (starts lower) with carlito", () => {
    expect(replaceOpenclawPreservingCase("openClaw app")).toBe("carlito app");
  });

  it("replaces multiple occurrences in one string", () => {
    expect(replaceOpenclawPreservingCase("Run OpenClaw then openclaw and OPENCLAW")).toBe(
      "Run Carlito then carlito and CARLITO",
    );
  });

  it("leaves strings without openclaw untouched", () => {
    expect(replaceOpenclawPreservingCase("hello world")).toBe("hello world");
  });

  it("handles substring matches (openclawish)", () => {
    expect(replaceOpenclawPreservingCase("openclawish")).toBe("carlitoish");
  });
});

describe("rewriteOpenclawInPayload", () => {
  it("rewrites string values in a flat object", () => {
    const payload = { system: "You are openclaw", model: "claude-opus-4-7" };
    rewriteOpenclawInPayload(payload);
    expect(payload).toEqual({ system: "You are carlito", model: "claude-opus-4-7" });
  });

  it("rewrites strings inside arrays", () => {
    const payload = {
      messages: [
        { role: "user", content: "tell me about OpenClaw" },
        { role: "assistant", content: "OpenClaw is..." },
      ],
    };
    rewriteOpenclawInPayload(payload);
    expect(payload.messages[0].content).toBe("tell me about Carlito");
    expect(payload.messages[1].content).toBe("Carlito is...");
  });

  it("rewrites deeply nested strings", () => {
    const payload = {
      tools: [
        {
          name: "openclaw_search",
          description: "Search OpenClaw docs",
          input_schema: {
            type: "object",
            properties: { query: { type: "string", description: "openclaw query" } },
          },
        },
      ],
    };
    rewriteOpenclawInPayload(payload);
    expect(payload.tools[0].name).toBe("carlito_search");
    expect(payload.tools[0].description).toBe("Search Carlito docs");
    expect(
      (payload.tools[0].input_schema.properties.query as { description: string }).description,
    ).toBe("carlito query");
  });

  it("rewrites object keys that contain openclaw", () => {
    const payload: Record<string, unknown> = { openclaw_field: "value" };
    rewriteOpenclawInPayload(payload);
    expect(Object.keys(payload)).toEqual(["carlito_field"]);
    expect(payload.carlito_field).toBe("value");
  });

  it("rewrites keys and values together without losing data", () => {
    const payload = {
      openclaw_session_id: "abc",
      OPENCLAW_TURN: 123,
      normal_field: "OpenClaw-value",
    };
    rewriteOpenclawInPayload(payload);
    expect(payload).toEqual({
      carlito_session_id: "abc",
      CARLITO_TURN: 123,
      normal_field: "Carlito-value",
    });
  });

  it("does not touch non-string primitives", () => {
    const payload = {
      max_tokens: 4096,
      stream: true,
      thinking: null,
      budget: 0,
    };
    rewriteOpenclawInPayload(payload);
    expect(payload).toEqual({ max_tokens: 4096, stream: true, thinking: null, budget: 0 });
  });

  it("handles arrays of primitives", () => {
    const payload = { tags: ["openclaw", "other", "OPENCLAW"] };
    rewriteOpenclawInPayload(payload);
    expect(payload.tags).toEqual(["carlito", "other", "CARLITO"]);
  });

  it("handles payloads with no matching strings", () => {
    const payload = { system: "hello", messages: [{ role: "user", content: "hi" }] };
    const snapshot = JSON.parse(JSON.stringify(payload));
    rewriteOpenclawInPayload(payload);
    expect(payload).toEqual(snapshot);
  });

  it("rewrites the shapes observed in a real leaked Anthropic payload", () => {
    const payload = {
      model: "claude-opus-4-7",
      system: [
        { type: "text", text: "You are Claude Code." },
        {
          type: "text",
          text: [
            "You are a personal assistant running inside Carlito.",
            "Carlito docs: /Users/carlos/projects/carlito/docs",
            "Your working directory is: /Users/carlos/.openclaw/workspace",
            "<!-- OPENCLAW_CACHE_BOUNDARY -->",
            "Use `openclaw doctor` for diagnostics.",
            'Example avatar: "avatars/openclaw.png".',
          ].join("\n"),
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "## /Users/carlos/.openclaw/workspace/AGENTS.md\nSee OpenClaw behavior.",
            },
          ],
        },
      ],
      tools: [
        {
          name: "browser",
          description: "Control the browser via OpenClaw's browser control server.",
        },
        {
          name: "agents_list",
          description: "List OpenClaw agent ids you can target.",
        },
      ],
      metadata: { schema: "openclaw.inbound_meta.v2" },
    };
    rewriteOpenclawInPayload(payload);
    const serialized = JSON.stringify(payload);
    expect(serialized.toLowerCase()).not.toContain("openclaw");
    expect(payload.system[1].text).toContain("/Users/carlos/.carlito/workspace");
    expect(payload.system[1].text).toContain("<!-- CARLITO_CACHE_BOUNDARY -->");
    expect(payload.system[1].text).toContain("Use `carlito doctor`");
    expect(payload.system[1].text).toContain("avatars/carlito.png");
    expect(payload.messages[0].content[0].text).toContain(
      "/Users/carlos/.carlito/workspace/AGENTS.md",
    );
    expect(payload.messages[0].content[0].text).toContain("See Carlito behavior");
    expect(payload.tools[0].description).toBe(
      "Control the browser via Carlito's browser control server.",
    );
    expect(payload.tools[1].description).toBe("List Carlito agent ids you can target.");
    expect(payload.metadata.schema).toBe("carlito.inbound_meta.v2");
  });
});

describe("wrapStreamFnWithCarlitoRewriter", () => {
  it("mutates payload via onPayload before handing off to the underlying stream", () => {
    const captured: Record<string, unknown> = {};
    const underlying = vi.fn((_model, _context, options) => {
      const payload: Record<string, unknown> = {
        system: "You are OpenClaw",
        messages: [{ role: "user", content: "about openclaw" }],
      };
      options?.onPayload?.(payload, _model);
      Object.assign(captured, payload);
      return {} as never;
    });

    const wrapped = wrapStreamFnWithCarlitoRewriter(underlying as never);
    void wrapped(
      { provider: "anthropic", id: "claude-opus-4-7" } as never,
      {} as never,
      {} as never,
    );

    expect(captured.system).toBe("You are Carlito");
    const messages = captured.messages as Array<{ content: string }>;
    expect(messages[0].content).toBe("about carlito");
  });

  it("still forwards to an outer onPayload after mutating", () => {
    const outerOnPayload = vi.fn();
    const underlying = vi.fn((_model, _context, options) => {
      options?.onPayload?.({ system: "openclaw" }, _model);
      return {} as never;
    });

    const wrapped = wrapStreamFnWithCarlitoRewriter(underlying as never);
    void wrapped(
      { provider: "anthropic", id: "claude-opus-4-7" } as never,
      {} as never,
      { onPayload: outerOnPayload } as never,
    );

    expect(outerOnPayload).toHaveBeenCalledOnce();
    const [payloadArg] = outerOnPayload.mock.calls[0];
    expect((payloadArg as { system: string }).system).toBe("carlito");
  });
});
