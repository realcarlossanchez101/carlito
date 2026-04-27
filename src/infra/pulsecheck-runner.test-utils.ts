import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import { pulsecheckRunnerTelegramPlugin } from "../../test/helpers/infra/pulsecheck-runner-channel-plugins.js";
import { resolveMainSessionKey } from "../config/sessions.js";
import type { CarlitoConfig } from "../config/types.carlito.js";
import { setActivePluginRegistry } from "../plugins/runtime.js";
import { createTestRegistry } from "../test-utils/channel-plugins.js";
import type { PulsecheckDeps } from "./pulsecheck-runner.js";

export type PulsecheckSessionSeed = {
  sessionId?: string;
  updatedAt?: number;
  lastChannel: string;
  lastProvider: string;
  lastTo: string;
};

export type PulsecheckReplyFn = NonNullable<PulsecheckDeps["getReplyFromConfig"]>;
export type PulsecheckReplySpy = ReturnType<typeof vi.fn<PulsecheckReplyFn>>;

export function createPulsecheckReplySpy(): PulsecheckReplySpy {
  const replySpy: PulsecheckReplySpy = vi.fn<PulsecheckReplyFn>();
  replySpy.mockResolvedValue({ text: "ok" });
  return replySpy;
}

export async function seedSessionStore(
  storePath: string,
  sessionKey: string,
  session: PulsecheckSessionSeed,
): Promise<void> {
  let existingStore: Record<string, unknown> = {};
  try {
    existingStore = JSON.parse(await fs.readFile(storePath, "utf-8")) as Record<string, unknown>;
  } catch {
    existingStore = {};
  }
  await fs.writeFile(
    storePath,
    JSON.stringify({
      ...existingStore,
      [sessionKey]: {
        sessionId: session.sessionId ?? "sid",
        updatedAt: session.updatedAt ?? Date.now(),
        ...session,
      },
    }),
  );
}

export async function seedMainSessionStore(
  storePath: string,
  cfg: CarlitoConfig,
  session: PulsecheckSessionSeed,
): Promise<string> {
  const sessionKey = resolveMainSessionKey(cfg);
  await seedSessionStore(storePath, sessionKey, session);
  return sessionKey;
}

export async function withTempPulsecheckSandbox<T>(
  fn: (ctx: { tmpDir: string; storePath: string; replySpy: PulsecheckReplySpy }) => Promise<T>,
  options?: {
    prefix?: string;
    unsetEnvVars?: string[];
  },
): Promise<T> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), options?.prefix ?? "carlito-hb-"));
  await fs.writeFile(path.join(tmpDir, "PULSECHECK.md"), "- Check status\n", "utf-8");
  const storePath = path.join(tmpDir, "sessions.json");
  const replySpy = createPulsecheckReplySpy();
  const previousEnv = new Map<string, string | undefined>();
  for (const envName of options?.unsetEnvVars ?? []) {
    previousEnv.set(envName, process.env[envName]);
    process.env[envName] = "";
  }
  try {
    return await fn({ tmpDir, storePath, replySpy });
  } finally {
    replySpy.mockReset();
    for (const [envName, previousValue] of previousEnv.entries()) {
      if (previousValue === undefined) {
        delete process.env[envName];
      } else {
        process.env[envName] = previousValue;
      }
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

export async function withTempTelegramPulsecheckSandbox<T>(
  fn: (ctx: { tmpDir: string; storePath: string; replySpy: PulsecheckReplySpy }) => Promise<T>,
  options?: {
    prefix?: string;
  },
): Promise<T> {
  return withTempPulsecheckSandbox(fn, {
    prefix: options?.prefix,
    unsetEnvVars: ["TELEGRAM_BOT_TOKEN"],
  });
}

export function setupTelegramPulsecheckPluginRuntimeForTests() {
  setActivePluginRegistry(
    createTestRegistry([
      { pluginId: "telegram", plugin: pulsecheckRunnerTelegramPlugin, source: "test" },
    ]),
  );
}
