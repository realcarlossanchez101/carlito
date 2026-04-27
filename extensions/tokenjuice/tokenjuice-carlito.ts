// tokenjuice@0.6.1 ships an `openclaw` subpath. The string "openclaw" here is a
// third-party export name and must not be rebranded.
declare module "tokenjuice/openclaw" {
  export function createTokenjuiceOpenClawEmbeddedExtension(): Parameters<
    import("carlito/plugin-sdk/plugin-entry").CarlitoPluginApi["registerEmbeddedExtensionFactory"]
  >[0];
}
