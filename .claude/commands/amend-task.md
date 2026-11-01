---
description: Update a cutover step
---

# Update a cutover step

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- amend-task --book=CHANGE-01 --ref=T1 --owner="Named owner" --actor="Operator"
```

Show the existing task first. Changes increment the plan revision and leave old run snapshots untouched.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
