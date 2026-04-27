export const CARLITO_CLI_ENV_VAR = "CARLITO_CLI";
export const CARLITO_CLI_ENV_VALUE = "1";

export function markCarlitoExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [CARLITO_CLI_ENV_VAR]: CARLITO_CLI_ENV_VALUE,
  };
}

export function ensureCarlitoExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[CARLITO_CLI_ENV_VAR] = CARLITO_CLI_ENV_VALUE;
  return env;
}
