import { definePluginEntry } from "carlito/plugin-sdk/plugin-entry";
import { createTokenjuiceCarlitoEmbeddedExtension } from "./runtime-api.js";

export default definePluginEntry({
  id: "tokenjuice",
  name: "tokenjuice",
  description: "Compacts exec and bash tool results with tokenjuice reducers.",
  register(api) {
    api.registerEmbeddedExtensionFactory(createTokenjuiceCarlitoEmbeddedExtension());
  },
});
