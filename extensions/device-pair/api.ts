export {
  approveDevicePairing,
  clearDeviceBootstrapTokens,
  issueDeviceBootstrapToken,
  PAIRING_SETUP_BOOTSTRAP_PROFILE,
  listDevicePairing,
  revokeDeviceBootstrapToken,
  type DeviceBootstrapProfile,
} from "carlito/plugin-sdk/device-bootstrap";
export { definePluginEntry, type CarlitoPluginApi } from "carlito/plugin-sdk/plugin-entry";
export {
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveTailnetHostWithRunner,
} from "carlito/plugin-sdk/core";
export {
  resolvePreferredCarlitoTmpDir,
  runPluginCommandWithTimeout,
} from "carlito/plugin-sdk/sandbox";
export { renderQrPngBase64, renderQrPngDataUrl, writeQrPngTempFile } from "./qr-image.js";
