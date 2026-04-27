import { resolveActiveTalkProviderConfig } from "../../config/talk.js";
import type { CarlitoConfig } from "../../config/types.js";

export { resolveActiveTalkProviderConfig };

export function getRuntimeConfigSnapshot(): CarlitoConfig | null {
  return null;
}
