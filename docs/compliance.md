# Change-control record checks

Checked 1 November 2026. These checks support a change-control process; they do not certify compliance or authorize a production change. NIST is a control framework, not a statement that NZ or AU businesses must follow every control. The operator selects applicable obligations and retention periods.

| Check | Source | Implemented rule |
|---|---|---|
| Reviewed change decision | NIST SP 800-53 Rev. 5, CM-3 | Current revision must have a recorded go decision with actor and evidence before a live record can start. Latest no-go supersedes go. |
| Test and validate changes | NIST CM-3(2) | Latest rehearsal of this revision must have passed. Every task outcome has evidence; failures block a pass. |
| Change owner and recovery preparation | NIST CM-3 and CP-10 | Runbook and tasks need owners; tasks explicitly marked critical need rollback instructions. Window and rollback decision deadline are mandatory for live start. These completeness rules are our local policy interpretation. |
| Event details | NIST AU-3 | Writes log actor, action, time and details. Plan revisions and run snapshots retain the evidence context. |
| Retention review | NIST AU-11 | A missing or overdue operator-set retention_review date is flagged. No period is invented and no records are deleted automatically. |

Source: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final . The page links the current 5.2.0 release and the official control catalog. Control IDs above identify the relevant process requirements; the exact CLI checks are local design decisions.

Readiness does not check external backups, validate a restore, verify an evidence URL, authenticate the named actor or test infrastructure. Evidence strings record what the operator supplied. Database administrators can change records and history. This is not an electronic-signature or immutable audit service. RLS denies public access; a trusted database owner runs the CLI. Configure hosting, roles, backups, access restrictions and retention before real use.
