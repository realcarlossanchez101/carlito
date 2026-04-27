---
summary: "CLI reference for `carlito browser` (lifecycle, profiles, tabs, actions, state, and debugging)"
read_when:
  - You use `carlito browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to attach to your local signed-in Chrome via Chrome MCP
title: "Browser"
---

# `carlito browser`

Manage Carlito's browser control surface and run browser actions (lifecycle, profiles, tabs, snapshots, screenshots, navigation, input, state emulation, and debugging).

Related:

- Browser tool + API: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--expect-final`: wait for a final Gateway response.
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
carlito browser profiles
carlito browser --browser-profile carlito start
carlito browser --browser-profile carlito open https://example.com
carlito browser --browser-profile carlito snapshot
```

## Quick troubleshooting

If `start` fails with `not reachable after start`, troubleshoot CDP readiness first. If `start` and `tabs` succeed but `open` or `navigate` fails, the browser control plane is healthy and the failure is usually navigation SSRF policy.

Minimal sequence:

```bash
carlito browser --browser-profile carlito start
carlito browser --browser-profile carlito tabs
carlito browser --browser-profile carlito open https://example.com
```

Detailed guidance: [Browser troubleshooting](/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Lifecycle

```bash
carlito browser status
carlito browser start
carlito browser stop
carlito browser --browser-profile carlito reset-profile
```

Notes:

- For `attachOnly` and remote CDP profiles, `carlito browser stop` closes the
  active control session and clears temporary emulation overrides even when
  Carlito did not launch the browser process itself.
- For local managed profiles, `carlito browser stop` stops the spawned browser
  process.

## If the command is missing

If `carlito browser` is an unknown command, check `plugins.allow` in
`~/.carlito/carlito.json`.

When `plugins.allow` is present, the bundled browser plugin must be listed
explicitly:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` does not restore the CLI subcommand when the plugin
allowlist excludes `browser`.

Related: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profiles

Profiles are named browser routing configs. In practice:

- `carlito`: launches or attaches to a dedicated Carlito-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- custom CDP profiles: point at a local or remote CDP endpoint.

```bash
carlito browser profiles
carlito browser create-profile --name work --color "#FF5A36"
carlito browser create-profile --name chrome-live --driver existing-session
carlito browser create-profile --name remote --cdp-url https://browser-host.example.com
carlito browser delete-profile --name work
```

Use a specific profile:

```bash
carlito browser --browser-profile work tabs
```

## Tabs

```bash
carlito browser tabs
carlito browser tab new
carlito browser tab select 2
carlito browser tab close 2
carlito browser open https://docs.carlito.ai
carlito browser focus <targetId>
carlito browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
carlito browser snapshot
```

Screenshot:

```bash
carlito browser screenshot
carlito browser screenshot --full-page
carlito browser screenshot --ref e12
```

Notes:

- `--full-page` is for page captures only; it cannot be combined with `--ref`
  or `--element`.
- `existing-session` / `user` profiles support page screenshots and `--ref`
  screenshots from snapshot output, but not CSS `--element` screenshots.

Navigate/click/type (ref-based UI automation):

```bash
carlito browser navigate https://example.com
carlito browser click <ref>
carlito browser type <ref> "hello"
carlito browser press Enter
carlito browser hover <ref>
carlito browser scrollintoview <ref>
carlito browser drag <startRef> <endRef>
carlito browser select <ref> OptionA OptionB
carlito browser fill --fields '[{"ref":"1","value":"Ada"}]'
carlito browser wait --text "Done"
carlito browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

File + dialog helpers:

```bash
carlito browser upload /tmp/carlito/uploads/file.pdf --ref <ref>
carlito browser waitfordownload
carlito browser download <ref> report.pdf
carlito browser dialog --accept
```

## State and storage

Viewport + emulation:

```bash
carlito browser resize 1280 720
carlito browser set viewport 1280 720
carlito browser set offline on
carlito browser set media dark
carlito browser set timezone Europe/London
carlito browser set locale en-GB
carlito browser set geo 51.5074 -0.1278 --accuracy 25
carlito browser set device "iPhone 14"
carlito browser set headers '{"x-test":"1"}'
carlito browser set credentials myuser mypass
```

Cookies + storage:

```bash
carlito browser cookies
carlito browser cookies set session abc123 --url https://example.com
carlito browser cookies clear
carlito browser storage local get
carlito browser storage local set token abc123
carlito browser storage session clear
```

## Debugging

```bash
carlito browser console --level error
carlito browser pdf
carlito browser responsebody "**/api"
carlito browser highlight <ref>
carlito browser errors --clear
carlito browser requests --filter api
carlito browser trace start
carlito browser trace stop --out trace.zip
```

## Existing Chrome via MCP

Use the built-in `user` profile, or create your own `existing-session` profile:

```bash
carlito browser --browser-profile user tabs
carlito browser create-profile --name chrome-live --driver existing-session
carlito browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
carlito browser --browser-profile chrome-live tabs
```

This path is host-only. For Docker, headless servers, Browserless, or other remote setups, use a CDP profile instead.

Current existing-session limits:

- snapshot-driven actions use refs, not CSS selectors
- `click` is left-click only
- `type` does not support `slowly=true`
- `press` does not support `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, and `evaluate` reject
  per-call timeout overrides
- `select` supports one value only
- `wait --load networkidle` is not supported
- file uploads require `--ref` / `--input-ref`, do not support CSS
  `--element`, and currently support one file at a time
- dialog hooks do not support `--timeout`
- screenshots support page captures and `--ref`, but not CSS `--element`
- `responsebody`, download interception, PDF export, and batch actions still
  require a managed browser or raw CDP profile

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
