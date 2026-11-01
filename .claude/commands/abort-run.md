---
description: Record an abandoned rehearsal or live run
---

# Abort a coordination record

Read the run status first. Only record the operator's explicit decision to abandon it.

```bash
npm run cutover -- abort-run --run=RUN-CODE --evidence="Reason supplied by the operator" --actor="Operator"
```

The run closes as failed. Task evidence and the original snapshot remain. This command does not roll back infrastructure or notify anyone. Present the next human action here.
