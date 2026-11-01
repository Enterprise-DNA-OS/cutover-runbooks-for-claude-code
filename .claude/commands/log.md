---
description: Log a coordination note
---

# Log a coordination note

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- log --book=CHANGE-01 --note="Supplied note" --actor="Operator"
```

Read the current runbook first. Preserve the supplied facts and actor.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
