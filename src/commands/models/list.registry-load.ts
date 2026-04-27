import type { CarlitoConfig } from "../../config/types.carlito.js";
import { loadModelRegistry } from "./list.registry.js";
import { modelKey } from "./shared.js";

export async function loadListModelRegistry(
  cfg: CarlitoConfig,
  opts?: { providerFilter?: string },
) {
  const loaded = await loadModelRegistry(cfg, opts);
  return {
    ...loaded,
    discoveredKeys: new Set(loaded.models.map((model) => modelKey(model.provider, model.id))),
  };
}
