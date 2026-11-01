---
description: Change the window or plan owner
---

# Change the window or plan owner

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- amend-runbook --book=CHANGE-01 --owner="Named owner" --actor="Operator"
```

Changing the plan increments its revision and invalidates earlier rehearsal and decision readiness. Never pick a change window for the operator.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
