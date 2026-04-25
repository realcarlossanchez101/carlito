import { beforeEach } from "vitest";
import {
  pulsecheckRunnerSlackPlugin,
  pulsecheckRunnerTelegramPlugin,
  pulsecheckRunnerWhatsAppPlugin,
} from "../../test/helpers/infra/pulsecheck-runner-channel-plugins.js";
import { setActivePluginRegistry } from "../plugins/runtime.js";
import { createTestRegistry } from "../test-utils/channel-plugins.js";

export function installPulsecheckRunnerTestRuntime(params?: { includeSlack?: boolean }): void {
  beforeEach(() => {
    if (params?.includeSlack) {
      setActivePluginRegistry(
        createTestRegistry([
          { pluginId: "slack", plugin: pulsecheckRunnerSlackPlugin, source: "test" },
          { pluginId: "whatsapp", plugin: pulsecheckRunnerWhatsAppPlugin, source: "test" },
          { pluginId: "telegram", plugin: pulsecheckRunnerTelegramPlugin, source: "test" },
        ]),
      );
      return;
    }
    setActivePluginRegistry(
      createTestRegistry([
        { pluginId: "whatsapp", plugin: pulsecheckRunnerWhatsAppPlugin, source: "test" },
        { pluginId: "telegram", plugin: pulsecheckRunnerTelegramPlugin, source: "test" },
      ]),
    );
  });
}
