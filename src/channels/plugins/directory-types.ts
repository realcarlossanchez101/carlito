import type { CarlitoConfig } from "../../config/types.js";

export type DirectoryConfigParams = {
  cfg: CarlitoConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};
