---
summary: "CLI reference for `carlito system` (system events, pulsecheck, presence)"
read_when:
  - You want to enqueue a system event without creating a cron job
  - You need to enable or disable pulsechecks
  - You want to inspect system presence entries
title: "System"
---

# `carlito system`

System-level helpers for the Gateway: enqueue system events, control pulsechecks,
and view presence.

All `system` subcommands use Gateway RPC and accept the shared client flags:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Common commands

```bash
carlito system event --text "Check for urgent follow-ups" --mode now
carlito system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$CARLITO_GATEWAY_TOKEN"
carlito system pulsecheck enable
carlito system pulsecheck last
carlito system presence
```

## `system event`

Enqueue a system event on the **main** session. The next pulsecheck will inject
it as a `System:` line in the prompt. Use `--mode now` to trigger the pulsecheck
immediately; `next-pulsecheck` waits for the next scheduled tick.

Flags:

- `--text <text>`: required system event text.
- `--mode <mode>`: `now` or `next-pulsecheck` (default).
- `--json`: machine-readable output.
- `--url`, `--token`, `--timeout`, `--expect-final`: shared Gateway RPC flags.

## `system pulsecheck last|enable|disable`

Pulsecheck controls:

- `last`: show the last pulsecheck event.
- `enable`: turn pulsechecks back on (use this if they were disabled).
- `disable`: pause pulsechecks.

Flags:

- `--json`: machine-readable output.
- `--url`, `--token`, `--timeout`, `--expect-final`: shared Gateway RPC flags.

## `system presence`

List the current system presence entries the Gateway knows about (nodes,
instances, and similar status lines).

Flags:

- `--json`: machine-readable output.
- `--url`, `--token`, `--timeout`, `--expect-final`: shared Gateway RPC flags.

## Notes

- Requires a running Gateway reachable by your current config (local or remote).
- System events are ephemeral and not persisted across restarts.
