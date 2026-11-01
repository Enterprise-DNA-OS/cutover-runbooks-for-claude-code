---
description: Open a rehearsal or live coordination record
---

# Open a rehearsal or live coordination record

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- begin-run --book=CHANGE-01 --mode=rehearsal --actor="Operator"
```

Use rehearsal unless the operator explicitly asks for a live record. Live requires a current passing rehearsal, go decision, valid window, owners and critical rollback steps. Starting a record performs no external action.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
