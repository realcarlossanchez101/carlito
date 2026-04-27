---
summary: "Updating Carlito safely (global install or source), plus rollback strategy"
read_when:
  - Updating Carlito
  - Something breaks after an update
title: "Updating"
---

Keep Carlito up to date.

## Recommended: `carlito update`

The fastest way to update. It detects your install type (npm or git), fetches the latest version, runs `carlito doctor`, and restarts the gateway.

```bash
carlito update
```

To switch channels or target a specific version:

```bash
carlito update --channel beta
carlito update --tag main
carlito update --dry-run   # preview without applying
```

`--channel beta` prefers beta, but the runtime falls back to stable/latest when
the beta tag is missing or older than the latest stable release. Use `--tag beta`
if you want the raw npm beta dist-tag for a one-off package update.

See [Development channels](/install/development-channels) for channel semantics.

## Alternative: re-run the installer

```bash
curl -fsSL https://carlito.ai/install.sh | bash
```

Add `--no-onboard` to skip onboarding. For source installs, pass `--install-method git --no-onboard`.

## Alternative: manual npm, pnpm, or bun

```bash
npm i -g carlito@latest
```

```bash
pnpm add -g carlito@latest
```

```bash
bun add -g carlito@latest
```

### Root-owned global npm installs

Some Linux npm setups install global packages under root-owned directories such as
`/usr/lib/node_modules/carlito`. Carlito supports that layout: the installed
package is treated as read-only at runtime, and bundled plugin runtime
dependencies are staged into a writable runtime directory instead of mutating the
package tree.

For hardened systemd units, set a writable stage directory that is included in
`ReadWritePaths`:

```ini
Environment=CARLITO_PLUGIN_STAGE_DIR=/var/lib/carlito/plugin-runtime-deps
ReadWritePaths=/var/lib/carlito /home/carlito/.carlito /tmp
```

If `CARLITO_PLUGIN_STAGE_DIR` is not set, Carlito uses `$STATE_DIRECTORY` when
systemd provides it, then falls back to `~/.carlito/plugin-runtime-deps`.

## Auto-updater

The auto-updater is off by default. Enable it in `~/.carlito/carlito.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Behavior                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Waits `stableDelayHours`, then applies with deterministic jitter across `stableJitterHours` (spread rollout). |
| `beta`   | Checks every `betaCheckIntervalHours` (default: hourly) and applies immediately.                              |
| `dev`    | No automatic apply. Use `carlito update` manually.                                                            |

The gateway also logs an update hint on startup (disable with `update.checkOnStart: false`).

## After updating

<Steps>

### Run doctor

```bash
carlito doctor
```

Migrates config, audits DM policies, and checks gateway health. Details: [Doctor](/gateway/doctor)

### Restart the gateway

```bash
carlito gateway restart
```

### Verify

```bash
carlito health
```

</Steps>

## Rollback

### Pin a version (npm)

```bash
npm i -g carlito@<version>
carlito doctor
carlito gateway restart
```

Tip: `npm view carlito version` shows the current published version.

### Pin a commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
carlito gateway restart
```

To return to latest: `git checkout main && git pull`.

## If you are stuck

- Run `carlito doctor` again and read the output carefully.
- For `carlito update --channel dev` on source checkouts, the updater auto-bootstraps `pnpm` when needed. If you see a pnpm/corepack bootstrap error, install `pnpm` manually (or re-enable `corepack`) and rerun the update.
- Check: [Troubleshooting](/gateway/troubleshooting)
- Ask in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Related

- [Install Overview](/install) — all installation methods
- [Doctor](/gateway/doctor) — health checks after updates
- [Migrating](/install/migrating) — major version migration guides
