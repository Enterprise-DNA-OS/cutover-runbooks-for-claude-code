---
description: Add a predecessor
---

# Add a predecessor

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- link --book=CHANGE-01 --ref=T2 --predecessor=T1 --actor="Operator"
```

Show both tasks before linking. Cross-plan links and cycles are rejected.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
