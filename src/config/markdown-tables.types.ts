import type { MarkdownTableMode } from "./types.base.js";
import type { CarlitoConfig } from "./types.carlito.js";

export type ResolveMarkdownTableModeParams = {
  cfg?: Partial<CarlitoConfig>;
  channel?: string | null;
  accountId?: string | null;
};

export type ResolveMarkdownTableMode = (
  params: ResolveMarkdownTableModeParams,
) => MarkdownTableMode;
