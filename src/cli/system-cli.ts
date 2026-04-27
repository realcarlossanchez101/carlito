import type { Command } from "commander";
import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import { normalizeOptionalString } from "../shared/string-coerce.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";
import type { GatewayRpcOpts } from "./gateway-rpc.js";
import { addGatewayClientOptions, callGatewayFromCli } from "./gateway-rpc.js";

type SystemEventOpts = GatewayRpcOpts & { text?: string; mode?: string; json?: boolean };
type SystemGatewayOpts = GatewayRpcOpts & { json?: boolean };

const normalizeWakeMode = (raw: unknown) => {
  const mode = normalizeOptionalString(raw) ?? "";
  if (!mode) {
    return "next-pulsecheck" as const;
  }
  if (mode === "now" || mode === "next-pulsecheck") {
    return mode;
  }
  throw new Error("--mode must be now or next-pulsecheck");
};

async function runSystemGatewayCommand(
  opts: SystemGatewayOpts,
  action: () => Promise<unknown>,
  successText?: string,
): Promise<void> {
  try {
    const result = await action();
    if (opts.json || successText === undefined) {
      defaultRuntime.writeJson(result);
    } else {
      defaultRuntime.log(successText);
    }
  } catch (err) {
    defaultRuntime.error(danger(String(err)));
    defaultRuntime.exit(1);
  }
}

export function registerSystemCli(program: Command) {
  const system = program
    .command("system")
    .description("System tools (events, pulsecheck, presence)")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/system", "docs.carlito.ai/cli/system")}\n`,
    );

  addGatewayClientOptions(
    system
      .command("event")
      .description("Enqueue a system event and optionally trigger a pulsecheck")
      .requiredOption("--text <text>", "System event text")
      .option("--mode <mode>", "Wake mode (now|next-pulsecheck)", "next-pulsecheck")
      .option("--json", "Output JSON", false),
  ).action(async (opts: SystemEventOpts) => {
    await runSystemGatewayCommand(
      opts,
      async () => {
        const text = normalizeOptionalString(opts.text) ?? "";
        if (!text) {
          throw new Error("--text is required");
        }
        const mode = normalizeWakeMode(opts.mode);
        return await callGatewayFromCli("wake", opts, { mode, text }, { expectFinal: false });
      },
      "ok",
    );
  });

  const pulsecheck = system.command("pulsecheck").description("Pulsecheck controls");

  addGatewayClientOptions(
    pulsecheck
      .command("last")
      .description("Show the last pulsecheck event")
      .option("--json", "Output JSON", false),
  ).action(async (opts: SystemGatewayOpts) => {
    await runSystemGatewayCommand(opts, async () => {
      return await callGatewayFromCli("last-pulsecheck", opts, undefined, {
        expectFinal: false,
      });
    });
  });

  addGatewayClientOptions(
    pulsecheck
      .command("enable")
      .description("Enable pulsechecks")
      .option("--json", "Output JSON", false),
  ).action(async (opts: SystemGatewayOpts) => {
    await runSystemGatewayCommand(opts, async () => {
      return await callGatewayFromCli(
        "set-pulsechecks",
        opts,
        { enabled: true },
        { expectFinal: false },
      );
    });
  });

  addGatewayClientOptions(
    pulsecheck
      .command("disable")
      .description("Disable pulsechecks")
      .option("--json", "Output JSON", false),
  ).action(async (opts: SystemGatewayOpts) => {
    await runSystemGatewayCommand(opts, async () => {
      return await callGatewayFromCli(
        "set-pulsechecks",
        opts,
        { enabled: false },
        { expectFinal: false },
      );
    });
  });

  addGatewayClientOptions(
    system
      .command("presence")
      .description("List system presence entries")
      .option("--json", "Output JSON", false),
  ).action(async (opts: SystemGatewayOpts) => {
    await runSystemGatewayCommand(opts, async () => {
      return await callGatewayFromCli("system-presence", opts, undefined, {
        expectFinal: false,
      });
    });
  });
}
