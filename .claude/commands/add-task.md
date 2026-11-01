---
description: Add a manual cutover step
---

# Add a manual cutover step

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- add-task --book=CHANGE-01 --code=T1 --title="Confirm restore evidence" --owner="Named owner" --actor="Operator"
```

Only add supplied work. --kind=validation, --minutes=20, --critical=true and --rollback="..." capture the agreed checks. No shell command in a record is executed.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
