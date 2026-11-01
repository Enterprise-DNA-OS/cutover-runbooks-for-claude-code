---
description: Close a rehearsal or live record
---

# Close a rehearsal or live record

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- close-run --run=RUN-CODE --actor="Operator"
```

Fails if pending tasks remain without a failure. A run containing a failed task closes failed, even with pending successors.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
