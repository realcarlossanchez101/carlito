---
summary: "CLI reference for `carlito proxy`, the local debug proxy and capture inspector"
read_when:
  - You need to capture Carlito transport traffic locally for debugging
  - You want to inspect debug proxy sessions, blobs, or built-in query presets
title: "Proxy"
---

# `carlito proxy`

Run the local explicit debug proxy and inspect captured traffic.

This is a debugging command for transport-level investigation. It can start a
local proxy, run a child command with capture enabled, list capture sessions,
query common traffic patterns, read captured blobs, and purge local capture
data.

## Commands

```bash
carlito proxy start [--host <host>] [--port <port>]
carlito proxy run [--host <host>] [--port <port>] -- <cmd...>
carlito proxy coverage
carlito proxy sessions [--limit <count>]
carlito proxy query --preset <name> [--session <id>]
carlito proxy blob --id <blobId>
carlito proxy purge
```

## Query presets

`carlito proxy query --preset <name>` accepts:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notes

- `start` defaults to `127.0.0.1` unless `--host` is set.
- `run` starts a local debug proxy and then runs the command after `--`.
- Captures are local debugging data; use `carlito proxy purge` when finished.
