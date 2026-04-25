import { describe, expect, it } from "vitest";
import {
  DEFAULT_PULSECHECK_ACK_MAX_CHARS,
  isPulsecheckContentEffectivelyEmpty,
  parsePulsecheckTasks,
  stripPulsecheckToken,
} from "./pulsecheck.js";
import { PULSECHECK_TOKEN } from "./tokens.js";

describe("stripPulsecheckToken", () => {
  it("skips empty or token-only replies", () => {
    expect(stripPulsecheckToken(undefined, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: false,
    });
    expect(stripPulsecheckToken("  ", { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: false,
    });
    expect(stripPulsecheckToken(PULSECHECK_TOKEN, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("drops pulsechecks with small junk in pulsecheck mode", () => {
    expect(stripPulsecheckToken("PULSECHECK_OK 🦞", { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
    expect(stripPulsecheckToken(`🦞 ${PULSECHECK_TOKEN}`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("drops short remainder in pulsecheck mode", () => {
    expect(stripPulsecheckToken(`ALERT ${PULSECHECK_TOKEN}`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("keeps pulsecheck replies when remaining content exceeds threshold", () => {
    const long = "A".repeat(DEFAULT_PULSECHECK_ACK_MAX_CHARS + 1);
    expect(stripPulsecheckToken(`${long} ${PULSECHECK_TOKEN}`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: false,
      text: long,
      didStrip: true,
    });
  });

  it("strips token at edges for normal messages", () => {
    expect(stripPulsecheckToken(`${PULSECHECK_TOKEN} hello`, { mode: "message" })).toEqual({
      shouldSkip: false,
      text: "hello",
      didStrip: true,
    });
    expect(stripPulsecheckToken(`hello ${PULSECHECK_TOKEN}`, { mode: "message" })).toEqual({
      shouldSkip: false,
      text: "hello",
      didStrip: true,
    });
  });

  it("does not touch token in the middle", () => {
    expect(
      stripPulsecheckToken(`hello ${PULSECHECK_TOKEN} there`, {
        mode: "message",
      }),
    ).toEqual({
      shouldSkip: false,
      text: `hello ${PULSECHECK_TOKEN} there`,
      didStrip: false,
    });
  });

  it("strips HTML-wrapped pulsecheck tokens", () => {
    expect(stripPulsecheckToken(`<b>${PULSECHECK_TOKEN}</b>`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("strips markdown-wrapped pulsecheck tokens", () => {
    expect(stripPulsecheckToken(`**${PULSECHECK_TOKEN}**`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("removes markup-wrapped token and keeps trailing content", () => {
    expect(
      stripPulsecheckToken(`<code>${PULSECHECK_TOKEN}</code> all good`, {
        mode: "message",
      }),
    ).toEqual({
      shouldSkip: false,
      text: "all good",
      didStrip: true,
    });
  });

  it("strips trailing punctuation only when directly after the token", () => {
    expect(stripPulsecheckToken(`${PULSECHECK_TOKEN}.`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
    expect(stripPulsecheckToken(`${PULSECHECK_TOKEN}!!!`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
    expect(stripPulsecheckToken(`${PULSECHECK_TOKEN}---`, { mode: "pulsecheck" })).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("strips a sentence-ending token and keeps trailing punctuation", () => {
    expect(
      stripPulsecheckToken(`I should not respond ${PULSECHECK_TOKEN}.`, {
        mode: "message",
      }),
    ).toEqual({
      shouldSkip: false,
      text: `I should not respond.`,
      didStrip: true,
    });
  });

  it("strips sentence-ending token with emphasis punctuation in pulsecheck mode", () => {
    expect(
      stripPulsecheckToken(
        `There is nothing todo, so i should respond with ${PULSECHECK_TOKEN} !!!`,
        {
          mode: "pulsecheck",
        },
      ),
    ).toEqual({
      shouldSkip: true,
      text: "",
      didStrip: true,
    });
  });

  it("preserves trailing punctuation on text before the token", () => {
    expect(stripPulsecheckToken(`All clear. ${PULSECHECK_TOKEN}`, { mode: "message" })).toEqual({
      shouldSkip: false,
      text: "All clear.",
      didStrip: true,
    });
  });
});

describe("isPulsecheckContentEffectivelyEmpty", () => {
  it("returns false for undefined/null (missing file should not skip)", () => {
    expect(isPulsecheckContentEffectivelyEmpty(undefined)).toBe(false);
    expect(isPulsecheckContentEffectivelyEmpty(null)).toBe(false);
  });

  it("returns true for empty string", () => {
    expect(isPulsecheckContentEffectivelyEmpty("")).toBe(true);
  });

  it("returns true for whitespace only", () => {
    expect(isPulsecheckContentEffectivelyEmpty("   ")).toBe(true);
    expect(isPulsecheckContentEffectivelyEmpty("\n\n\n")).toBe(true);
    expect(isPulsecheckContentEffectivelyEmpty("  \n  \n  ")).toBe(true);
    expect(isPulsecheckContentEffectivelyEmpty("\t\t")).toBe(true);
  });

  it("returns true for header-only content", () => {
    expect(isPulsecheckContentEffectivelyEmpty("# PULSECHECK.md")).toBe(true);
    expect(isPulsecheckContentEffectivelyEmpty("# PULSECHECK.md\n")).toBe(true);
    expect(isPulsecheckContentEffectivelyEmpty("# PULSECHECK.md\n\n")).toBe(true);
  });

  it("returns true for comments only", () => {
    expect(isPulsecheckContentEffectivelyEmpty("# Header\n# Another comment")).toBe(true);
    expect(isPulsecheckContentEffectivelyEmpty("## Subheader\n### Another")).toBe(true);
  });

  it("returns false when a template includes plain instructional prose", () => {
    const defaultTemplate = `# PULSECHECK.md

Keep this file empty unless you want a tiny checklist. Keep it small.
    `;
    expect(isPulsecheckContentEffectivelyEmpty(defaultTemplate)).toBe(false);
  });

  it("returns true for the current fenced pulsecheck template body (#61690)", () => {
    const content = `# PULSECHECK.md Template

\`\`\`markdown
# Keep this file empty (or with only comments) to skip pulsecheck API calls.

# Add tasks below when you want the agent to check something periodically.
\`\`\`
`;
    expect(isPulsecheckContentEffectivelyEmpty(content)).toBe(true);
  });

  it("returns false when fenced pulsecheck content includes a real task", () => {
    const content = `\`\`\`markdown
# Keep this file empty when you want to skip.

- Check email
\`\`\`
`;
    expect(isPulsecheckContentEffectivelyEmpty(content)).toBe(false);
  });

  it("returns false when a code fence wraps plain instructional prose", () => {
    const content = `\`\`\`markdown
Keep this file empty unless you want a tiny checklist.
\`\`\`
`;
    expect(isPulsecheckContentEffectivelyEmpty(content)).toBe(false);
  });

  it("returns true for header with only empty lines", () => {
    expect(isPulsecheckContentEffectivelyEmpty("# PULSECHECK.md\n\n\n")).toBe(true);
  });

  it("returns false when actionable content exists", () => {
    expect(isPulsecheckContentEffectivelyEmpty("- Check email")).toBe(false);
    expect(isPulsecheckContentEffectivelyEmpty("# PULSECHECK.md\n- Task 1")).toBe(false);
    expect(isPulsecheckContentEffectivelyEmpty("Remind me to call mom")).toBe(false);
  });

  it("returns false for content with tasks after header", () => {
    const content = `# PULSECHECK.md

- Task 1
- Task 2
`;
    expect(isPulsecheckContentEffectivelyEmpty(content)).toBe(false);
  });

  it("returns false for mixed content with non-comment text", () => {
    const content = `# PULSECHECK.md
## Tasks
Check the server logs
`;
    expect(isPulsecheckContentEffectivelyEmpty(content)).toBe(false);
  });

  it("treats markdown headers as comments (effectively empty)", () => {
    const content = `# PULSECHECK.md
## Section 1
### Subsection
`;
    expect(isPulsecheckContentEffectivelyEmpty(content)).toBe(true);
  });
});

describe("parsePulsecheckTasks", () => {
  it("does not bleed top-level interval/prompt fields into task parsing", () => {
    const content = `tasks:
  - name: email-check
    interval: 30m
    prompt: Check for urgent emails
interval: should-not-bleed
`;
    expect(parsePulsecheckTasks(content)).toEqual([
      {
        name: "email-check",
        interval: "30m",
        prompt: "Check for urgent emails",
      },
    ]);
  });
});
