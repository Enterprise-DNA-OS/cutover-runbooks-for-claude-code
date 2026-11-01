---
description: Export the full owned record
---

# Export the full owned record

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- export --file=exports/cutover.json
```

Keep the private file out of version control. It contains evidence, history, snapshots and original columns.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
