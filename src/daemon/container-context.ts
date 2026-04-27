import { normalizeOptionalString } from "../shared/string-coerce.js";

export function resolveDaemonContainerContext(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return (
    normalizeOptionalString(env.CARLITO_CONTAINER_HINT) ||
    normalizeOptionalString(env.CARLITO_CONTAINER) ||
    null
  );
}
