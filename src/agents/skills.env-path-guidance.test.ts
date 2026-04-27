import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

type GuidanceCase = {
  file: string;
  required?: string[];
  forbidden?: string[];
};

const CASES: GuidanceCase[] = [
  {
    file: "skills/session-logs/SKILL.md",
    required: ["CARLITO_STATE_DIR"],
    forbidden: [
      "for f in ~/.carlito/agents/<agentId>/sessions/*.jsonl",
      'rg -l "phrase" ~/.carlito/agents/<agentId>/sessions/*.jsonl',
      "~/.carlito/agents/<agentId>/sessions/<id>.jsonl",
    ],
  },
  {
    file: "skills/gh-issues/SKILL.md",
    required: ["CARLITO_CONFIG_PATH"],
    forbidden: ["cat ~/.carlito/carlito.json"],
  },
  {
    file: "skills/canvas/SKILL.md",
    required: ["CARLITO_CONFIG_PATH"],
    forbidden: ["cat ~/.carlito/carlito.json"],
  },
  {
    file: "skills/openai-whisper-api/SKILL.md",
    required: ["CARLITO_CONFIG_PATH"],
  },
  {
    file: "skills/sherpa-onnx-tts/SKILL.md",
    required: [
      "CARLITO_STATE_DIR",
      "CARLITO_CONFIG_PATH",
      'STATE_DIR="${CARLITO_STATE_DIR:-$HOME/.carlito}"',
    ],
    forbidden: [
      'SHERPA_ONNX_RUNTIME_DIR: "~/.carlito/tools/sherpa-onnx-tts/runtime"',
      'SHERPA_ONNX_MODEL_DIR: "~/.carlito/tools/sherpa-onnx-tts/models/vits-piper-en_US-lessac-high"',
      "<state-dir>",
    ],
  },
  {
    file: "skills/coding-agent/SKILL.md",
    required: ["CARLITO_STATE_DIR"],
    forbidden: ["NEVER start Codex in ~/.carlito/"],
  },
];

describe("bundled skill env-path guidance", () => {
  it.each(CASES)(
    "keeps $file aligned with CARLITO env overrides",
    ({ file, required, forbidden }) => {
      const content = fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
      for (const needle of required ?? []) {
        expect(content).toContain(needle);
      }
      for (const needle of forbidden ?? []) {
        expect(content).not.toContain(needle);
      }
    },
  );
});
