---
summary: "CLI reference for `carlito docs` (search the live docs index)"
read_when:
  - You want to search the live Carlito docs from the terminal
title: "Docs"
---

# `carlito docs`

Search the live docs index.

Arguments:

- `[query...]`: search terms to send to the live docs index

Examples:

```bash
carlito docs
carlito docs browser existing-session
carlito docs sandbox allowHostControl
carlito docs gateway token secretref
```

Notes:

- With no query, `carlito docs` opens the live docs search entrypoint.
- Multi-word queries are passed through as one search request.
