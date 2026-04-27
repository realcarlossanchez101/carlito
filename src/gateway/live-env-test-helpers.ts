const COMMON_LIVE_ENV_NAMES = [
  "CARLITO_AGENT_RUNTIME",
  "CARLITO_CONFIG_PATH",
  "CARLITO_GATEWAY_TOKEN",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "CARLITO_SKIP_BROWSER_CONTROL_SERVER",
  "CARLITO_SKIP_CANVAS_HOST",
  "CARLITO_SKIP_CHANNELS",
  "CARLITO_SKIP_CRON",
  "CARLITO_SKIP_GMAIL_WATCHER",
  "CARLITO_STATE_DIR",
] as const;

export type LiveEnvSnapshot = Record<string, string | undefined>;

export function snapshotLiveEnv(extraNames: readonly string[] = []): LiveEnvSnapshot {
  const snapshot: LiveEnvSnapshot = {};
  for (const name of [...COMMON_LIVE_ENV_NAMES, ...extraNames]) {
    snapshot[name] = process.env[name];
  }
  return snapshot;
}

export function restoreLiveEnv(snapshot: LiveEnvSnapshot): void {
  for (const [name, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}
