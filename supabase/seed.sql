insert into runbooks(id,code,name,owner,window_start,window_end,rollback_by,retention_review) values
('10000000-0000-0000-0000-000000000001','MIG-01','Kauri order service migration','Mara Chen',now()+interval '3 days',now()+interval '3 days 4 hours',now()+interval '3 days 3 hours',current_date+30),
('10000000-0000-0000-0000-000000000002','MIG-02','Kauri reporting migration','Ari Patel',now()+interval '5 days',now()+interval '5 days 2 hours',now()+interval '5 days 1 hour',current_date-5)
on conflict do nothing;
insert into tasks(id,runbook_id,code,title,owner,stream,kind,duration_minutes,due_at,critical,rollback) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','T1','Confirm restore evidence','Mara Chen','Preflight','validation',20,now()-interval '2 days',true,''),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','T2','Reconcile order totals','Ari Patel','Validation','validation',30,now()+interval '3 days',true,'Return to prior order service after operator approval'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','T3','Record owner acceptance','','Handover','milestone',0,now()+interval '3 days',false,''),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','R1','Check reporting extract','Ari Patel','Preflight','normal',25,now()-interval '1 day',false,'')
on conflict do nothing;
insert into dependencies(runbook_id,task_id,predecessor_id) values
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002') on conflict do nothing;
