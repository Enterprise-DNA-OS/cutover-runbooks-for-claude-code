# Cutover Runbooks for Claude Code

Know who owns each cutover step, what blocks it and whether the latest plan has actually been rehearsed. Keep the plan, human decisions and run evidence in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Run the demo and import a runbook. | Your change rules, exports, fields and documents. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=cutover) · [Instead of Cutover](https://enterprisedna.co/omni/instead-of/cutover?utm_source=github&utm_medium=readme&utm_campaign=cutover)

## Start with a cutover review

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/cutover-runbooks-for-claude-code.git
cd cutover-runbooks-for-claude-code
npm install
npm run demo
npm run cutover -- weekly-review
npm run docs
npm run view
```

Open this folder in Claude Code, Codex, OpenCode or Cursor. Ask /readiness, then /attention. All agents share CLAUDE.md, AGENTS.md and the recipes in .claude/commands.

Local PGlite needs no separate server. DATABASE_URL selects PostgreSQL through the shared adapter; DATA_DIR selects a local data directory. Use a trusted database owner, separate databases per business, private backups and access restrictions. No application front end or infrastructure execution is included.

The fictional Kauri Migration Services demo has two planned migrations, an overdue restore check without rollback instructions, an unowned acceptance step and an overdue retention review. Repeated seeding preserves records. Never seed production; PostgreSQL seeding requires ALLOW_DEMO_SEED=yes on a disposable database.

## The five weekly rituals

| Ritual | Commands |
|---|---|
| Review this week's changes | /weekly-review, /readiness, /attention |
| Check the sequence and owners | /cutover-plan, /dependencies, /critical-path, /owner-load |
| Rehearse and capture evidence | /begin-run, /next-tasks, /record-task, /close-run |
| Record the change owner's decision | /decide, /compliance, /activity |
| Hand the record over | /draft-brief, /draft-handover, /docs |

29 CLI commands and 33 executable slash-command recipes cover the full record. Run `npm run cutover -- help`. Every command supports --json. Use exact codes, case-insensitive names or a unique ID prefix. Ambiguous names list candidates and exit 1. Unknown flags fail rather than being ignored.

Additional commands: /runbooks, /rehearsal-history, /run-status, /add-runbook, /amend-runbook, /add-task, /amend-task, /link, /abort-run, /log, /import, /export, /view, /customise, /new-view and /help. /cutover-plan invokes the tasks CLI command.

## A changed plan needs fresh evidence

Each plan edit increments its revision. A run snapshots its tasks and dependencies. Later edits cannot rewrite that run's evidence. A live coordination record requires a current passing rehearsal, an explicit current go decision, task owners, critical rollback instructions and a valid change window. The latest rehearsal counts, including failures. A later no-go pauses live task recording. An edit also pauses recording against an old live snapshot; abort that record and rehearse the new version.

Task completion requires predecessor completion and operator-supplied evidence. Failed tasks can be retried; completed tasks need a new run to repeat. A run with failed tasks closes failed. Otherwise it cannot close until every task is done. /abort-run closes an abandoned record as failed without altering infrastructure.

These are coordination records, not a deployment engine. Starting a run never moves data, changes DNS, sends a message or executes a stored instruction. Go/no-go remains a human decision. Evidence references are recorded, not independently verified. The named actor is supplied by a trusted operator. Administrators can edit the database, so the history is not tamper-proof. [Rules and cited controls](docs/compliance.md).

## Ten questions this build answers

These are tested questions about your owned record, not unsupported claims that Cutover cannot answer them.

1. Which cutovers lack a current rehearsal or go decision? `readiness`
2. Which critical tasks have no rollback instructions? `attention`
3. Which acceptance steps still have no owner? `attention`
4. What is the longest chain using planned durations? `critical-path --book=MIG-01`
5. Who carries the most planned minutes across migrations? `owner-load`
6. Which tasks can be recorded next after their predecessors pass? `next-tasks --run=RUN-CODE`
7. Which rehearsal results belong to an older plan revision? `rehearsal-history`
8. Who changed a task, and what did it say before? `activity`
9. Which cutover records need a retention review? `compliance`
10. What evidence was supplied for each task in a specific run? `run-status --run=RUN-CODE`

The critical-path estimate assumes unlimited parallel resources and uses only durations and dependencies. It does not schedule people or honour imported fixed-start constraints.

## Bring your runbook across in one command

Export all Cutover tasks as CSV. A new destination plan and its tasks are imported together:

```bash
npm run cutover -- import cutover --book=CHANGE-01 --file=imports/cutover.csv --offset=Z --actor="Your name" --dry-run
npm run cutover -- import cutover --book=CHANGE-01 --file=imports/cutover.csv --offset=Z --actor="Your name"
```

Use Z only for a UTC export. The importer preserves original columns, rejects broken dependencies and cycles, and leaves repeat imports unchanged. Changed source rows require reviewed mapping. Vendor integrations and historical approvals do not become active behavior. [Export steps and mapping](docs/replace-cutover.md).

`npm run cutover -- export --file=exports/cutover.json` produces the full portable record. Keep it private. This is an archive, not an automatic restore utility.

## Your documents and read-only views

Change brand.json once. `npm run docs` renders cutover plans, decision records and run evidence as branded HTML. Print reviewed documents to PDF. `npm run view` renders the week, workload and rehearsal snapshots. These are private files and stay out of version control. [What a dedicated screen adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our business name and logo on the change plan.
2. Preview one export without saving anything.
3. Compare the imported task and dependency counts.
4. Assign our real change owner.
5. Set the change window in our timezone.
6. Mark the steps that need rollback instructions.
7. Add our service acceptance reference.
8. Group overdue checks by workstream.
9. Rehearse the plan with supplied test evidence.
10. Draft the handover with the actual go or no-go decision.

/customise writes and tests a migration for your fields or rules. /new-view adds a read-only report from the existing data.

## Price context and scope

Cutover's current pricing page requires a tailored quote. An older vendor-branded cloud migration package sheet lists a five-figure annual package, but it does not establish today's price or a typical NZ/AU customer bill. We verified no customer Cutover invoice. The public page uses no numeric price. [Sources and six selection scores](docs/research.md).

The free base is for teams that need the owned plan, human decisions and evidence record. Cutover's automation, failover and integrated communications require separate implementation and validation. Enterprise DNA scopes those connections, any web front end and a different stack around the business's needs.

## Verification

`npm test` creates a temporary database and exercises all 29 commands. It checks idempotent migrations and seed, stale evidence, latest failure precedence, go/no-go, snapshots, dependency cycles and order, CSV transactions, repeat imports, original fields, exports, drafts, escaped HTML and CLI failure output. It leaves working data untouched.

The manual GitHub workflow defines Node 22 on Windows and Linux plus PostgreSQL 17. TEST_DATABASE_URL must be an empty disposable PostgreSQL database. Read actual workflow results before claiming those environments passed.

## Built and run for you

Omni by Enterprise DNA brings across your agreed Cutover records, fits the rules to your change process, produces your paperwork and runs the system for you. One setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=cutover).

MIT. Not affiliated with Cutover or Anthropic. Hosting and agent usage have their own costs.
