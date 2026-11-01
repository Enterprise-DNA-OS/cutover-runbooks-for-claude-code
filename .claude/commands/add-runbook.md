---
description: Create a cutover plan
---

# Create a cutover plan

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- add-runbook --code=CHANGE-01 --name="Service migration" --owner="Named owner" --actor="Operator"
```

Use the real supplied name and operator. Set start, end and rollback-by to ISO timestamps with explicit offsets; use amend-runbook when agreed later.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
