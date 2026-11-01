---
description: Find the longest dependency chain
---

# Find the longest dependency chain

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- critical-path --book=MIG-01
```

Report the maximum finish_minutes and path. This is a duration-only estimate with unlimited parallel people; it excludes fixed dates, resource contention and vendor automation.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
