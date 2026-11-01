---
description: Check the go-live record
---

# Check the go-live record

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- readiness
```

Ready means the recorded plan clears the local rules. It is not permission to operate infrastructure.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
