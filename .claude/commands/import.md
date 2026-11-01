---
description: Bring a Cutover export across
---

# Bring a Cutover export across

Read CLAUDE.md. Replace example values with the operator's supplied records.

```bash
npm run cutover -- import cutover --book=IMPORTED-01 --file=imports/cutover.csv --offset=+12:00 --actor="Operator" --dry-run
```

Read docs/replace-cutover.md. Use the real export offset, not this example. Show the preview, then repeat without --dry-run when import is authorised. Unknown columns stay in source_data.

For machine output append --json. Read before writing. Never invent an actor, approval or result.
