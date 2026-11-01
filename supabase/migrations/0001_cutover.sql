create table runbooks (
 id uuid primary key default gen_random_uuid(), code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_-]*$'),
 name text not null check (length(trim(name))>0), owner text not null default '',
 window_start timestamptz, window_end timestamptz, rollback_by timestamptz,
 revision integer not null default 1, retention_review date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (window_end is null or window_start is null or window_end>window_start),
 check (rollback_by is null or window_end is null or rollback_by<=window_end),
 check (rollback_by is null or window_start is null or rollback_by>window_start)
);
create table tasks (
 id uuid primary key default gen_random_uuid(), runbook_id uuid not null references runbooks(id),
 code text not null, title text not null check(length(trim(title))>0), description text not null default '',
 owner text not null default '', stream text not null default 'Primary',
 kind text not null default 'normal' check(kind in ('normal','validation','milestone')),
 duration_minutes numeric(10,2) not null default 60 check(duration_minutes>=0),
 due_at timestamptz, rollback text not null default '', critical boolean not null default false,
 source_id text, source_data jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(runbook_id,code), unique(runbook_id,source_id), unique(runbook_id,id)
);
create table dependencies (
 id uuid primary key default gen_random_uuid(), runbook_id uuid not null references runbooks(id),
 task_id uuid not null, predecessor_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(runbook_id,task_id) references tasks(runbook_id,id),
 foreign key(runbook_id,predecessor_id) references tasks(runbook_id,id),
 unique(task_id,predecessor_id), check(task_id<>predecessor_id)
);
create table runs (
 seq bigint generated always as identity,
 id uuid primary key default gen_random_uuid(), code text not null unique,
 runbook_id uuid not null references runbooks(id), revision integer not null,
 mode text not null check(mode in ('rehearsal','live')),
 status text not null default 'active' check(status in ('active','passed','failed')),
 actor text not null check(length(trim(actor))>0), snapshot jsonb not null,
 started_at timestamptz not null default now(), ended_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_live on runs(runbook_id) where mode='live' and status='active';
create table run_tasks (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references runs(id), task_id uuid not null,
 code text not null, title text not null, owner text not null, kind text not null, stream text not null,
 duration_minutes numeric(10,2) not null, rollback text not null, critical boolean not null,
 predecessors jsonb not null default '[]', status text not null default 'pending' check(status in ('pending','done','failed')),
 evidence text not null default '', actor text not null default '', completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(run_id,task_id),unique(run_id,code)
);
create table decisions (
 seq bigint generated always as identity,
 id uuid primary key default gen_random_uuid(), runbook_id uuid not null references runbooks(id), revision integer not null,
 choice text not null check(choice in ('go','no-go')), actor text not null check(length(trim(actor))>0),
 evidence text not null check(length(trim(evidence))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), seq bigint generated always as identity,
 runbook_id uuid references runbooks(id), action text not null, actor text not null check(length(trim(actor))>0),
 details jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), runbook_id uuid not null references runbooks(id),
 filename text not null, digest text not null, row_count integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(runbook_id,digest)
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare n text; begin foreach n in array array['runbooks','tasks','dependencies','runs','run_tasks','decisions','activity','imports'] loop
 execute format('create trigger touch_updated before update on %I for each row execute function touch_updated()',n);
 execute format('alter table %I enable row level security',n);
 execute format('revoke all on %I from public',n);
end loop; end $$;
create view v_task_attention as
select b.code as runbook,t.code,t.title,t.owner,t.stream,
 concat_ws('; ',case when t.owner='' then 'No owner' end,
 case when t.critical and t.rollback='' then 'Critical task has no rollback' end,
 case when t.due_at<now() then 'Planned date overdue' end) as reason
from tasks t join runbooks b on b.id=t.runbook_id
where t.owner='' or (t.critical and t.rollback='') or t.due_at<now();
create view v_owner_load as
select coalesce(nullif(owner,''),'Unassigned') as owner,count(*) as tasks,
 count(*) filter(where critical) as critical_tasks,
 count(*) filter(where due_at<now()) as overdue_tasks,sum(duration_minutes) as planned_minutes
from tasks group by owner;
create view v_rehearsals as
select b.code as runbook,r.code,r.revision,b.revision as current_revision,r.status,r.started_at,r.ended_at,
 (select count(*) from run_tasks rt where rt.run_id=r.id and rt.status='failed') as failed_tasks
from runs r join runbooks b on b.id=r.runbook_id where r.mode='rehearsal';
create view v_readiness as
select b.id,b.code,b.name,b.revision,
 (select count(*) from tasks t where t.runbook_id=b.id) as tasks,
 (select count(*) from tasks t where t.runbook_id=b.id and t.owner='') as unowned,
 (select count(*) from tasks t where t.runbook_id=b.id and t.critical and t.rollback='') as missing_rollback,
 (select r.status from runs r where r.runbook_id=b.id and r.mode='rehearsal' and r.revision=b.revision order by r.seq desc limit 1) as rehearsal,
 (select d.choice from decisions d where d.runbook_id=b.id and d.revision=b.revision order by d.seq desc limit 1) as decision,
 b.owner,b.window_start,b.window_end,b.rollback_by
from runbooks b;
revoke all on v_task_attention,v_owner_load,v_rehearsals,v_readiness from public;
