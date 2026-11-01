# Replace the owned runbook record from Cutover

## Export

In a Cutover runbook, use More Actions, then Export tasks. Choose CSV, all tasks and an explicit timezone. Keep the original export privately. The vendor documents Task ID, Title, Assigned Team (Name), Description, Planned Duration, Planned due date/time, Predecessor IDs, Stream and Task Type. Its help page currently contains mixed guidance about linked tasks and predecessor imports: validate the actual export rather than assuming links survived.

Official source, checked 1 November 2026: https://help.cutover.com/en/articles/3850069-export-and-import-tasks . This importer reads an export offline. It does not call the Cutover API or require vendor credentials.

## One command to bring a complete runbook across

```bash
npm run cutover -- import cutover --book=CHANGE-01 --name="Order service migration" --file=imports/cutover.csv --offset=+12:00 --actor="Your name" --dry-run
npm run cutover -- import cutover --book=CHANGE-01 --name="Order service migration" --file=imports/cutover.csv --offset=+12:00 --actor="Your name"
```

Replace the offset with the export's real UTC offset for these dates. Prefer exporting in UTC and using --offset=Z, especially across daylight-saving changes. Dates without an explicit known offset are rejected. Runbook creation and task import are one transaction. Dry run rolls back every record, including the newly created runbook. An empty file is rejected.

## Mapping and reconciliation

| Export | Owned record |
|---|---|
| Task ID | Stable source_id and task code, normalized to # followed by digits |
| Title, Description | Task title and description |
| Assigned Team (Name) | Owner text; multiple teams stay as supplied |
| Stream | Workstream label |
| Planned Duration | Minutes; days, hours, minutes and seconds accepted |
| Planned due date and time | UTC due timestamp after explicit offset conversion |
| Predecessor IDs | Dependencies within this complete runbook; unknown predecessors and cycles reject the whole import |
| Task Type | Validation and milestone map to those local kinds; every other type is a manual normal task |
| All columns, including custom and output fields | Preserved verbatim by field name in source_data; never executed |

A repeated identical row is unchanged. A changed row is rejected for reviewed mapping; it cannot silently overwrite locally edited tasks. Duplicate IDs and malformed rows fail the entire file. ID-less exports need a reviewed stable-ID mapping before import; row numbers are never used as identities. Check task count and dependency count against the export, then inspect tasks and dependencies commands.

Historical completion, approval history, comments, attachments, fixed start constraints, integration configurations, nested/linked runbooks, communications, user accounts and vendor automation are not activated by this import. Original columns remain available, but attachments need separate transfer. Imported tasks begin as unapproved planning records. Record critical flags, rollback instructions and named owners, set the change window, and rehearse before a real cutover. Bring a representative sample across and reconcile it before ending an incumbent subscription.

## Keep your data

`npm run cutover -- export --file=exports/cutover.json` exports all eight domain tables with original columns, decisions, activity and snapshots. This is a complete portable archive, not an automatic restore command. Back up the underlying database separately and test recovery. Keep exports, imports and evidence private.
