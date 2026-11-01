---
description: Record an explicit go or no-go decision
---

# Record an explicit go or no-go decision

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- decide --book=CHANGE-01 --choice=no-go --evidence="Decision reference" --actor="Decision owner"
```

A human supplies the decision and evidence. Never infer go from a passing rehearsal. A later no-go supersedes a go and pauses live task recording.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
