---
summary: "CLI reference for `carlito tasks` (background task ledger and Task Flow state)"
read_when:
  - You want to inspect, audit, or cancel background task records
  - You are documenting Task Flow commands under `carlito tasks flow`
title: "`carlito tasks`"
---

Inspect durable background tasks and Task Flow state. With no subcommand,
`carlito tasks` is equivalent to `carlito tasks list`.

See [Background Tasks](/automation/tasks) for the lifecycle and delivery model.

## Usage

```bash
carlito tasks
carlito tasks list
carlito tasks list --runtime acp
carlito tasks list --status running
carlito tasks show <lookup>
carlito tasks notify <lookup> state_changes
carlito tasks cancel <lookup>
carlito tasks audit
carlito tasks maintenance
carlito tasks maintenance --apply
carlito tasks flow list
carlito tasks flow show <lookup>
carlito tasks flow cancel <lookup>
```

## Root Options

- `--json`: output JSON.
- `--runtime <name>`: filter by kind: `subagent`, `acp`, `cron`, or `cli`.
- `--status <name>`: filter by status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, or `lost`.

## Subcommands

### `list`

```bash
carlito tasks list [--runtime <name>] [--status <name>] [--json]
```

Lists tracked background tasks newest first.

### `show`

```bash
carlito tasks show <lookup> [--json]
```

Shows one task by task ID, run ID, or session key.

### `notify`

```bash
carlito tasks notify <lookup> <done_only|state_changes|silent>
```

Changes the notification policy for a running task.

### `cancel`

```bash
carlito tasks cancel <lookup>
```

Cancels a running background task.

### `audit`

```bash
carlito tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Surfaces stale, lost, delivery-failed, or otherwise inconsistent task and Task Flow records.

### `maintenance`

```bash
carlito tasks maintenance [--apply] [--json]
```

Previews or applies task and Task Flow reconciliation, cleanup stamping, and pruning.

### `flow`

```bash
carlito tasks flow list [--status <name>] [--json]
carlito tasks flow show <lookup> [--json]
carlito tasks flow cancel <lookup>
```

Inspects or cancels durable Task Flow state under the task ledger.
