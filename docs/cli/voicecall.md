---
summary: "CLI reference for `carlito voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|dtmf|status|tail|expose`
title: "Voicecall"
---

# `carlito voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
carlito voicecall status --call-id <id>
carlito voicecall call --to "+15555550123" --message "Hello" --mode notify
carlito voicecall continue --call-id <id> --message "Any questions?"
carlito voicecall dtmf --call-id <id> --digits "ww123456#"
carlito voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
carlito voicecall expose --mode serve
carlito voicecall expose --mode funnel
carlito voicecall expose --mode off
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
