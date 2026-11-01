---
description: Record a human task outcome
---

# Record a human task outcome

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- record-task --run=RUN-CODE --ref=T1 --result=done --evidence="Supplied evidence reference" --actor="Operator"
```

Never invent success or evidence. Use --result=failed for a supplied failure. Failed tasks can be retried; completed tasks need a new run to repeat. Predecessors must be done.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
