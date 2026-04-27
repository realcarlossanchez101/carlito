---
summary: "Pulsecheck polling messages and notification rules"
read_when:
  - Adjusting pulsecheck cadence or messaging
  - Deciding between pulsecheck and cron for scheduled tasks
title: "Pulsecheck"
---

# Pulsecheck (Gateway)

> **Pulsecheck vs Cron?** See [Automation & Tasks](/automation) for guidance on when to use each.

Pulsecheck runs **periodic agent turns** in the main session so the model can
surface anything that needs attention without spamming you.

Pulsecheck is a scheduled main-session turn — it does **not** create [background task](/automation/tasks) records.
Task records are for detached work (ACP runs, subagents, isolated cron jobs).

Troubleshooting: [Scheduled Tasks](/automation/cron-jobs#troubleshooting)

## Quick start (beginner)

1. Leave pulsechecks enabled (default is `30m`, or `1h` for Anthropic OAuth/token auth, including Claude CLI reuse) or set your own cadence.
2. Create a tiny `PULSECHECK.md` checklist or `tasks:` block in the agent workspace (optional but recommended).
3. Decide where pulsecheck messages should go (`target: "none"` is the default; set `target: "last"` to route to the last contact).
4. Optional: enable pulsecheck reasoning delivery for transparency.
5. Optional: use lightweight bootstrap context if pulsecheck runs only need `PULSECHECK.md`.
6. Optional: enable isolated sessions to avoid sending full conversation history each pulsecheck.
7. Optional: restrict pulsechecks to active hours (local time).

Example config:

```json5
{
  agents: {
    defaults: {
      pulsecheck: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject PULSECHECK.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Defaults

- Interval: `30m` (or `1h` when Anthropic OAuth/token auth is the detected auth mode, including Claude CLI reuse). Set `agents.defaults.pulsecheck.every` or per-agent `agents.list[].pulsecheck.every`; use `0m` to disable.
- Prompt body (configurable via `agents.defaults.pulsecheck.prompt`):
  `Read PULSECHECK.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply PULSECHECK_OK.`
- The pulsecheck prompt is sent **verbatim** as the user message. The system
  prompt includes a “Pulsecheck” section only when pulsechecks are enabled for the
  default agent, and the run is flagged internally.
- When pulsechecks are disabled with `0m`, normal runs also omit `PULSECHECK.md`
  from bootstrap context so the model does not see pulsecheck-only instructions.
- Active hours (`pulsecheck.activeHours`) are checked in the configured timezone.
  Outside the window, pulsechecks are skipped until the next tick inside the window.

## What the pulsecheck prompt is for

The default prompt is intentionally broad:

- **Background tasks**: “Consider outstanding tasks” nudges the agent to review
  follow-ups (inbox, calendar, reminders, queued work) and surface anything urgent.
- **Human check-in**: “Checkup sometimes on your human during day time” nudges an
  occasional lightweight “anything you need?” message, but avoids night-time spam
  by using your configured local timezone (see [/concepts/timezone](/concepts/timezone)).

Pulsecheck can react to completed [background tasks](/automation/tasks), but a pulsecheck run itself does not create a task record.

If you want a pulsecheck to do something very specific (e.g. “check Gmail PubSub
stats” or “verify gateway health”), set `agents.defaults.pulsecheck.prompt` (or
`agents.list[].pulsecheck.prompt`) to a custom body (sent verbatim).

## Response contract

- If nothing needs attention, reply with **`PULSECHECK_OK`**.
- During pulsecheck runs, Carlito treats `PULSECHECK_OK` as an ack when it appears
  at the **start or end** of the reply. The token is stripped and the reply is
  dropped if the remaining content is **≤ `ackMaxChars`** (default: 300).
- If `PULSECHECK_OK` appears in the **middle** of a reply, it is not treated
  specially.
- For alerts, **do not** include `PULSECHECK_OK`; return only the alert text.

Outside pulsechecks, stray `PULSECHECK_OK` at the start/end of a message is stripped
and logged; a message that is only `PULSECHECK_OK` is dropped.

## Config

```json5
{
  agents: {
    defaults: {
      pulsecheck: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only PULSECHECK.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each pulsecheck in a fresh session (no conversation history)
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read PULSECHECK.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply PULSECHECK_OK.",
        ackMaxChars: 300, // max chars allowed after PULSECHECK_OK
      },
    },
  },
}
```

### Scope and precedence

- `agents.defaults.pulsecheck` sets global pulsecheck behavior.
- `agents.list[].pulsecheck` merges on top; if any agent has a `pulsecheck` block, **only those agents** run pulsechecks.
- `channels.defaults.pulsecheck` sets visibility defaults for all channels.
- `channels.<channel>.pulsecheck` overrides channel defaults.
- `channels.<channel>.accounts.<id>.pulsecheck` (multi-account channels) overrides per-channel settings.

### Per-agent pulsechecks

If any `agents.list[]` entry includes a `pulsecheck` block, **only those agents**
run pulsechecks. The per-agent block merges on top of `agents.defaults.pulsecheck`
(so you can set shared defaults once and override per agent).

Example: two agents, only the second agent runs pulsechecks.

```json5
{
  agents: {
    defaults: {
      pulsecheck: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        pulsecheck: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read PULSECHECK.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply PULSECHECK_OK.",
        },
      },
    ],
  },
}
```

### Active hours example

Restrict pulsechecks to business hours in a specific timezone:

```json5
{
  agents: {
    defaults: {
      pulsecheck: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Outside this window (before 9am or after 10pm Eastern), pulsechecks are skipped. The next scheduled tick inside the window will run normally.

### 24/7 setup

If you want pulsechecks to run all day, use one of these patterns:

- Omit `activeHours` entirely (no time-window restriction; this is the default behavior).
- Set a full-day window: `activeHours: { start: "00:00", end: "24:00" }`.

Do not set the same `start` and `end` time (for example `08:00` to `08:00`).
That is treated as a zero-width window, so pulsechecks are always skipped.

### Multi account example

Use `accountId` to target a specific account on multi-account channels like Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        pulsecheck: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Field notes

- `every`: pulsecheck interval (duration string; default unit = minutes).
- `model`: optional model override for pulsecheck runs (`provider/model`).
- `includeReasoning`: when enabled, also deliver the separate `Reasoning:` message when available (same shape as `/reasoning on`).
- `lightContext`: when true, pulsecheck runs use lightweight bootstrap context and keep only `PULSECHECK.md` from workspace bootstrap files.
- `isolatedSession`: when true, each pulsecheck runs in a fresh session with no prior conversation history. Uses the same isolation pattern as cron `sessionTarget: "isolated"`. Dramatically reduces per-pulsecheck token cost. Combine with `lightContext: true` for maximum savings. Delivery routing still uses the main session context.
- `session`: optional session key for pulsecheck runs.
  - `main` (default): agent main session.
  - Explicit session key (copy from `carlito sessions --json` or the [sessions CLI](/cli/sessions)).
  - Session key formats: see [Sessions](/concepts/session) and [Groups](/channels/groups).
- `target`:
  - `last`: deliver to the last used external channel.
  - explicit channel: any configured channel or plugin id, for example `discord`, `matrix`, `telegram`, or `whatsapp`.
  - `none` (default): run the pulsecheck but **do not deliver** externally.
- `directPolicy`: controls direct/DM delivery behavior:
  - `allow` (default): allow direct/DM pulsecheck delivery.
  - `block`: suppress direct/DM delivery (`reason=dm-blocked`).
- `to`: optional recipient override (channel-specific id, e.g. E.164 for WhatsApp or a Telegram chat id). For Telegram topics/threads, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: optional account id for multi-account channels. When `target: "last"`, the account id applies to the resolved last channel if it supports accounts; otherwise it is ignored. If the account id does not match a configured account for the resolved channel, delivery is skipped.
- `prompt`: overrides the default prompt body (not merged).
- `ackMaxChars`: max chars allowed after `PULSECHECK_OK` before delivery.
- `suppressToolErrorWarnings`: when true, suppresses tool error warning payloads during pulsecheck runs.
- `activeHours`: restricts pulsecheck runs to a time window. Object with `start` (HH:MM, inclusive; use `00:00` for start-of-day), `end` (HH:MM exclusive; `24:00` allowed for end-of-day), and optional `timezone`.
  - Omitted or `"user"`: uses your `agents.defaults.userTimezone` if set, otherwise falls back to the host system timezone.
  - `"local"`: always uses the host system timezone.
  - Any IANA identifier (e.g. `America/New_York`): used directly; if invalid, falls back to the `"user"` behavior above.
  - `start` and `end` must not be equal for an active window; equal values are treated as zero-width (always outside the window).
  - Outside the active window, pulsechecks are skipped until the next tick inside the window.

## Delivery behavior

- Pulsechecks run in the agent’s main session by default (`agent:<id>:<mainKey>`),
  or `global` when `session.scope = "global"`. Set `session` to override to a
  specific channel session (Discord/WhatsApp/etc.).
- `session` only affects the run context; delivery is controlled by `target` and `to`.
- To deliver to a specific channel/recipient, set `target` + `to`. With
  `target: "last"`, delivery uses the last external channel for that session.
- Pulsecheck deliveries allow direct/DM targets by default. Set `directPolicy: "block"` to suppress direct-target sends while still running the pulsecheck turn.
- If the main queue is busy, the pulsecheck is skipped and retried later.
- If `target` resolves to no external destination, the run still happens but no
  outbound message is sent.
- If `showOk`, `showAlerts`, and `useIndicator` are all disabled, the run is skipped up front as `reason=alerts-disabled`.
- If only alert delivery is disabled, Carlito can still run the pulsecheck, update due-task timestamps, restore the session idle timestamp, and suppress the outward alert payload.
- If the resolved pulsecheck target supports typing, Carlito shows typing while
  the pulsecheck run is active. This uses the same target the pulsecheck would
  send chat output to, and it is disabled by `typingMode: "never"`.
- Pulsecheck-only replies do **not** keep the session alive; the last `updatedAt`
  is restored so idle expiry behaves normally.
- Detached [background tasks](/automation/tasks) can enqueue a system event and wake pulsecheck when the main session should notice something quickly. That wake does not make the pulsecheck run a background task.

## Visibility controls

By default, `PULSECHECK_OK` acknowledgments are suppressed while alert content is
delivered. You can adjust this per channel or per account:

```yaml
channels:
  defaults:
    pulsecheck:
      showOk: false # Hide PULSECHECK_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    pulsecheck:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        pulsecheck:
          showAlerts: false # Suppress alert delivery for this account
```

Precedence: per-account → per-channel → channel defaults → built-in defaults.

### What each flag does

- `showOk`: sends a `PULSECHECK_OK` acknowledgment when the model returns an OK-only reply.
- `showAlerts`: sends the alert content when the model returns a non-OK reply.
- `useIndicator`: emits indicator events for UI status surfaces.

If **all three** are false, Carlito skips the pulsecheck run entirely (no model call).

### Per-channel vs per-account examples

```yaml
channels:
  defaults:
    pulsecheck:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    pulsecheck:
      showOk: true # all Slack accounts
    accounts:
      ops:
        pulsecheck:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    pulsecheck:
      showOk: true
```

### Common patterns

| Goal                                     | Config                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Default behavior (silent OKs, alerts on) | _(no config needed)_                                                                      |
| Fully silent (no messages, no indicator) | `channels.defaults.pulsecheck: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicator-only (no messages)             | `channels.defaults.pulsecheck: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs in one channel only                  | `channels.telegram.pulsecheck: { showOk: true }`                                          |

## PULSECHECK.md (optional)

If a `PULSECHECK.md` file exists in the workspace, the default prompt tells the
agent to read it. Think of it as your “pulsecheck checklist”: small, stable, and
safe to include every 30 minutes.

On normal runs, `PULSECHECK.md` is only injected when pulsecheck guidance is
enabled for the default agent. Disabling the pulsecheck cadence with `0m` or
setting `includeSystemPromptSection: false` omits it from normal bootstrap
context.

If `PULSECHECK.md` exists but is effectively empty (only blank lines and markdown
headers like `# Heading`), Carlito skips the pulsecheck run to save API calls.
That skip is reported as `reason=empty-pulsecheck-file`.
If the file is missing, the pulsecheck still runs and the model decides what to do.

Keep it tiny (short checklist or reminders) to avoid prompt bloat.

Example `PULSECHECK.md`:

```md
# Pulsecheck checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` blocks

`PULSECHECK.md` also supports a small structured `tasks:` block for interval-based
checks inside pulsecheck itself.

Example:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply PULSECHECK_OK.
```

Behavior:

- Carlito parses the `tasks:` block and checks each task against its own `interval`.
- Only **due** tasks are included in the pulsecheck prompt for that tick.
- If no tasks are due, the pulsecheck is skipped entirely (`reason=no-tasks-due`) to avoid a wasted model call.
- Non-task content in `PULSECHECK.md` is preserved and appended as additional context after the due-task list.
- Task last-run timestamps are stored in session state (`pulsecheckTaskState`), so intervals survive normal restarts.
- Task timestamps are only advanced after a pulsecheck run completes its normal reply path. Skipped `empty-pulsecheck-file` / `no-tasks-due` runs do not mark tasks as completed.

Task mode is useful when you want one pulsecheck file to hold several periodic checks without paying for all of them every tick.

### Can the agent update PULSECHECK.md?

Yes — if you ask it to.

`PULSECHECK.md` is just a normal file in the agent workspace, so you can tell the
agent (in a normal chat) something like:

- “Update `PULSECHECK.md` to add a daily calendar check.”
- “Rewrite `PULSECHECK.md` so it’s shorter and focused on inbox follow-ups.”

If you want this to happen proactively, you can also include an explicit line in
your pulsecheck prompt like: “If the checklist becomes stale, update PULSECHECK.md
with a better one.”

Safety note: don’t put secrets (API keys, phone numbers, private tokens) into
`PULSECHECK.md` — it becomes part of the prompt context.

## Manual wake (on-demand)

You can enqueue a system event and trigger an immediate pulsecheck with:

```bash
carlito system event --text "Check for urgent follow-ups" --mode now
```

If multiple agents have `pulsecheck` configured, a manual wake runs each of those
agent pulsechecks immediately.

Use `--mode next-pulsecheck` to wait for the next scheduled tick.

## Reasoning delivery (optional)

By default, pulsechecks deliver only the final “answer” payload.

If you want transparency, enable:

- `agents.defaults.pulsecheck.includeReasoning: true`

When enabled, pulsechecks will also deliver a separate message prefixed
`Reasoning:` (same shape as `/reasoning on`). This can be useful when the agent
is managing multiple sessions/codexes and you want to see why it decided to ping
you — but it can also leak more internal detail than you want. Prefer keeping it
off in group chats.

## Cost awareness

Pulsechecks run full agent turns. Shorter intervals burn more tokens. To reduce cost:

- Use `isolatedSession: true` to avoid sending full conversation history (~100K tokens down to ~2-5K per run).
- Use `lightContext: true` to limit bootstrap files to just `PULSECHECK.md`.
- Set a cheaper `model` (e.g. `ollama/llama3.2:1b`).
- Keep `PULSECHECK.md` small.
- Use `target: "none"` if you only want internal state updates.

## Related

- [Automation & Tasks](/automation) — all automation mechanisms at a glance
- [Background Tasks](/automation/tasks) — how detached work is tracked
- [Timezone](/concepts/timezone) — how timezone affects pulsecheck scheduling
- [Troubleshooting](/automation/cron-jobs#troubleshooting) — debugging automation issues
