#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { getDb,REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { parseCutover } from './lib/import-cutover.mjs';
export const COMMANDS=['help','runbooks','tasks','attention','readiness','dependencies','critical-path','owner-load','rehearsal-history','compliance','activity','weekly-review','run-status','next-tasks','add-runbook','amend-runbook','add-task','amend-task','link','begin-run','record-task','close-run','abort-run','decide','log','import','export','draft-brief','draft-handover'];
const need=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
const num=(v)=>{const n=Number(v);if(!Number.isFinite(n)||n<0)throw Error('Duration must be a nonnegative number');return n;};
const bool=v=>{if(!['true','false'].includes(String(v)))throw Error('Boolean must be true or false');return String(v)==='true';};
const stamp=v=>{if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(v)||Number.isNaN(Date.parse(v)))throw Error('Timestamp requires ISO date, time and explicit UTC offset');const date=v.slice(0,10);if(new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||Number(v.slice(11,13))>23||Number(v.slice(14,16))>59||Number(v.slice(17,19).replace(/[^0-9]/g,'')||0)>59)throw Error('Invalid timestamp');return new Date(v).toISOString();};
async function one(db,tableName,ref,scope={}){
 const tables={runbooks:['code','name'],tasks:['code','title'],runs:['code','code']};
 const [code,name]=tables[tableName];if(!ref)throw Error(`A reference to ${tableName} is required`);
 let rows=await db.query(`select * from ${tableName}${scope.book?' where runbook_id=$1':''}`,scope.book?[scope.book]:[]);
 const exact=rows.filter(r=>[r.id,r[code]].some(v=>String(v).toLowerCase()===ref.toLowerCase()));
 rows=exact.length?exact:rows.filter(r=>String(r.id).startsWith(ref.toLowerCase())||String(r[name]).toLowerCase().includes(ref.toLowerCase()));
 if(rows.length!==1){const e=Error(rows.length?'Ambiguous reference: '+rows.map(r=>`${r[code]} (${r[name]}) ${r.id}`).join('; '):`No ${tableName} match ${ref}`);e.candidates=rows.map(r=>({id:r.id,code:r[code],name:r[name]}));throw e;}
 return rows[0];
}
async function note(db,book,action,actor,details){await db.query('insert into activity(runbook_id,action,actor,details) values($1,$2,$3,$4)',[book,action,actor,JSON.stringify(details)]);}
async function bump(db,id){await db.query('update runbooks set revision=revision+1 where id=$1',[id]);}
const q=(db,sql,p=[])=>db.query(sql,p);
async function graph(db,book){const tasks=await q(db,'select * from tasks where runbook_id=$1 order by code',[book]);const edges=await q(db,'select * from dependencies where runbook_id=$1',[book]);return {tasks,edges};}
export function schedule(tasks,edges){
 const map=new Map(tasks.map(t=>[t.id,t])),memo=new Map(),visiting=new Set();
 const visit=id=>{if(memo.has(id))return memo.get(id);if(visiting.has(id))throw Error('Dependency cycle');if(!map.has(id))throw Error('Missing task');visiting.add(id);
 const parents=edges.filter(e=>e.task_id===id).map(e=>visit(e.predecessor_id));
 const longest=parents.sort((a,b)=>b.finish_minutes-a.finish_minutes)[0];
 const start=longest?.finish_minutes||0;const t=map.get(id);const r={code:t.code,title:t.title,start_minutes:start,finish_minutes:start+Number(t.duration_minutes),path:[...(longest?.path||[]),t.code]};
 visiting.delete(id);memo.set(id,r);return r;};
 return tasks.map(t=>visit(t.id));
}
async function readiness(db,ref){
 const rows=await q(db,'select * from v_readiness order by code');let only=rows;if(ref){const b=await one(db,'runbooks',ref);only=rows.filter(r=>r.id===b.id);}
 return only.map(r=>{const reasons=[];if(!Number(r.tasks))reasons.push('no tasks');if(!r.owner)reasons.push('no runbook owner');if(Number(r.unowned))reasons.push(`${r.unowned} unowned`);if(Number(r.missing_rollback))reasons.push(`${r.missing_rollback} rollback gaps`);if(r.rehearsal!=='passed')reasons.push('current rehearsal not passed');if(r.decision!=='go')reasons.push('current go decision missing');if(!r.window_start||!r.window_end||!r.rollback_by)reasons.push('window or rollback deadline missing');if(r.window_end&&new Date(r.window_end)<new Date())reasons.push('window expired');
 return {code:r.code,revision:r.revision,tasks:Number(r.tasks),rehearsal:r.rehearsal||'none',decision:r.decision||'none',ready:!reasons.length,reason:reasons.join('; ')};});
}
export async function execute(db,cmd,o={},pos=[]){
 const allowed={
 help:[],runbooks:[],tasks:['book'],attention:[],readiness:['book'],dependencies:['book'],'critical-path':['book'],'owner-load':[],'rehearsal-history':[],compliance:[],activity:[],'weekly-review':[],
 'run-status':['run'],'next-tasks':['run'],
 'add-runbook':['code','name','owner','start','end','rollback-by','retention-review'],
 'amend-runbook':['book','name','owner','start','end','rollback-by','retention-review'],
 'add-task':['book','code','title','description','owner','stream','kind','minutes','due','rollback','critical'],
 'amend-task':['book','ref','title','description','owner','stream','kind','minutes','due','rollback','critical'],
 link:['book','ref','predecessor'],'begin-run':['book','mode','code'],'record-task':['run','ref','result','evidence'],'close-run':['run'],'abort-run':['run','evidence'],decide:['book','choice','evidence'],log:['book','note'],import:['book','name','owner','file','offset','dry-run'],export:['file'],'draft-brief':['book'],'draft-handover':['book']};
 for(const key of Object.keys(o))if(!['json','actor','help'].includes(key)&&!allowed[cmd]?.includes(key))throw Error(`Unknown option --${key} for ${cmd}`);
 if(!COMMANDS.includes(cmd))throw Error(`Unknown command ${cmd}. Use help.`);
 if(cmd==='help')return COMMANDS.map(command=>({command}));
 if(cmd==='runbooks')return q(db,'select code,name,owner,revision,window_start,window_end from runbooks order by code');
 if(cmd==='tasks'){const b=await one(db,'runbooks',need(o,'book'));return q(db,'select code,title,owner,stream,kind,duration_minutes,critical,rollback,due_at from tasks where runbook_id=$1 order by code',[b.id]);}
 if(cmd==='attention')return q(db,'select * from v_task_attention order by runbook,code');
 if(cmd==='owner-load')return q(db,'select * from v_owner_load order by planned_minutes desc,owner');
 if(cmd==='rehearsal-history')return q(db,'select * from v_rehearsals order by started_at desc,code');
 if(cmd==='activity')return q(db,'select a.seq,b.code as runbook,a.action,a.actor,a.details,a.created_at from activity a left join runbooks b on b.id=a.runbook_id order by a.seq desc');
 if(cmd==='readiness')return readiness(db,o.book);
 if(cmd==='dependencies'||cmd==='critical-path'){
 const b=await one(db,'runbooks',need(o,'book'));const g=await graph(db,b.id);
 if(cmd==='critical-path')return schedule(g.tasks,g.edges).map(r=>({...r,path:r.path.join(' > ')})).sort((a,b)=>b.finish_minutes-a.finish_minutes);
 return g.edges.map(e=>({task:g.tasks.find(t=>t.id===e.task_id).code,predecessor:g.tasks.find(t=>t.id===e.predecessor_id).code}));}
 if(cmd==='compliance'){
 const result=[];for(const r of await readiness(db))if(!r.ready)result.push({runbook:r.code,rule:'CM-3 / local change policy',finding:r.reason});
 for(const r of await q(db,"select code from runbooks where retention_review is null or retention_review<current_date"))result.push({runbook:r.code,rule:'AU-11 / local retention review',finding:'Review date missing or overdue'});
 return result;}
 if(cmd==='weekly-review')return {readiness:await execute(db,'readiness'),attention:await execute(db,'attention'),owners:await execute(db,'owner-load'),rehearsals:await execute(db,'rehearsal-history')};
 if(cmd==='run-status'||cmd==='next-tasks'){
 const r=await one(db,'runs',need(o,'run'));const rows=await q(db,'select code,title,owner,status,evidence,predecessors from run_tasks where run_id=$1 order by code',[r.id]);
 return cmd==='run-status'?rows:rows.filter(t=>r.status==='active'&&t.status==='pending'&&t.predecessors.every(code=>rows.some(p=>p.code===code&&p.status==='done')));}
 if(cmd==='export'){
 const data={format:'cutover-runbooks-v1',exported_at:new Date().toISOString()};
 for(const t of ['runbooks','tasks','dependencies','runs','run_tasks','decisions','activity','imports'])data[t]=await q(db,`select * from ${t} order by id`);
 if(o.file){const f=path.resolve(o.file);fs.mkdirSync(path.dirname(f),{recursive:true,mode:0o700});fs.writeFileSync(f,JSON.stringify(data,null,2)+'\n',{mode:0o600});fs.chmodSync(f,0o600);return {file:f,runbooks:data.runbooks.length,tasks:data.tasks.length};}return data;}
 if(cmd==='draft-brief'||cmd==='draft-handover'){
 const b=await one(db,'runbooks',need(o,'book'));const tasks=await execute(db,'tasks',{book:b.code});const ready=await readiness(db,b.code);
 const runs=await q(db,'select code,mode,status,revision,started_at,ended_at from runs where runbook_id=$1 order by created_at desc',[b.id]);
 const decisions=await q(db,'select revision,choice,actor,evidence from decisions where runbook_id=$1 order by created_at desc',[b.id]);
 const f=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`${b.code}-${cmd}-${randomUUID().slice(0,8)}.md`);fs.mkdirSync(path.dirname(f),{recursive:true,mode:0o700});
 fs.writeFileSync(f,`# DRAFT: ${b.name}\n\nGenerated ${new Date().toISOString()}. Revision ${b.revision}. Human review required.\n\n## Readiness\n\n${format(ready)}\n\n## Plan\n\n${format(tasks)}\n\n## Runs\n\n${format(runs)}\n\n## Decisions\n\n${format(decisions)}\n`,{mode:0o600});return {file:f,draft:true};}
 const actor=need(o,'actor');await db.exec('BEGIN');
 try{
 // All writers take the same database lock. This makes revision checks and decisions atomic across users.
 await db.exec('LOCK TABLE runbooks IN EXCLUSIVE MODE');
 let result;
 if(cmd==='add-runbook'){
 const code=need(o,'code').toUpperCase();const rows=await q(db,'insert into runbooks(code,name,owner,window_start,window_end,rollback_by,retention_review) values($1,$2,$3,$4,$5,$6,$7) returning *',[code,need(o,'name'),o.owner||'',o.start?stamp(o.start):null,o.end?stamp(o.end):null,o['rollback-by']?stamp(o['rollback-by']):null,o['retention-review']||null]);result=rows[0];await note(db,result.id,cmd,actor,{code});
 }else if(cmd==='amend-runbook'){
 const b=await one(db,'runbooks',need(o,'book'));
 const fields={name:'name',owner:'owner',start:'window_start',end:'window_end','rollback-by':'rollback_by','retention-review':'retention_review'};
 const vals={};for(const [key,col] of Object.entries(fields))if(o[key]!==undefined)vals[col]=['start','end','rollback-by'].includes(key)?stamp(o[key]):o[key];
 const keys=Object.keys(vals);if(!keys.length)throw Error('Provide at least one field to change');
 result=(await q(db,`update runbooks set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')},revision=revision+1 where id=$${keys.length+1} returning *`,[...Object.values(vals),b.id]))[0];await note(db,b.id,cmd,actor,{before:b,after:result});
 }else if(cmd==='add-task'||cmd==='amend-task'){
 const b=await one(db,'runbooks',need(o,'book'));const before=cmd==='amend-task'?await one(db,'tasks',need(o,'ref'),{book:b.id}):null;
 const fieldMap={title:'title',description:'description',owner:'owner',stream:'stream',kind:'kind',minutes:'duration_minutes',due:'due_at',rollback:'rollback',critical:'critical'};
 const vals={};for(const [key,col] of Object.entries(fieldMap))if(o[key]!==undefined)vals[col]=key==='minutes'?num(o[key]):key==='critical'?bool(o[key]):key==='due'?stamp(o[key]):o[key];
 if(cmd==='add-task'){need(o,'title');vals.code=need(o,'code');vals.runbook_id=b.id;const keys=Object.keys(vals);result=(await q(db,`insert into tasks(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1))}) returning *`,Object.values(vals)))[0];}
 else {const keys=Object.keys(vals);if(!keys.length)throw Error('Provide at least one field to change');result=(await q(db,`update tasks set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(vals),before.id]))[0];}
 await bump(db,b.id);await note(db,b.id,cmd,actor,{before,after:result});
 }else if(cmd==='link'){
 const b=await one(db,'runbooks',need(o,'book'));const t=await one(db,'tasks',need(o,'ref'),{book:b.id});const p=await one(db,'tasks',need(o,'predecessor'),{book:b.id});
 const inserted=await q(db,'insert into dependencies(runbook_id,task_id,predecessor_id) values($1,$2,$3) on conflict do nothing returning id',[b.id,t.id,p.id]);const g=await graph(db,b.id);schedule(g.tasks,g.edges);if(inserted.length){await bump(db,b.id);await note(db,b.id,cmd,actor,{task:t.code,predecessor:p.code});}result={task:t.code,predecessor:p.code,added:!!inserted.length};
 }else if(cmd==='decide'){
 const b=await one(db,'runbooks',need(o,'book'));const choice=need(o,'choice');if(!['go','no-go'].includes(choice))throw Error('Choice must be go or no-go');
 result=(await q(db,'insert into decisions(runbook_id,revision,choice,actor,evidence) values($1,$2,$3,$4,$5) returning *',[b.id,b.revision,choice,actor,need(o,'evidence')]))[0];await note(db,b.id,cmd,actor,result);
 }else if(cmd==='begin-run'){
 const b=await one(db,'runbooks',need(o,'book'));const mode=need(o,'mode');if(!['rehearsal','live'].includes(mode))throw Error('Mode must be rehearsal or live');
 if(mode==='live'){const [r]=await readiness(db,b.code);if(!r.ready)throw Error('Live run blocked: '+r.reason);if(new Date(b.window_start)>new Date())throw Error('Live run blocked: window has not started');if(new Date(b.rollback_by)<=new Date())throw Error('Live run blocked: rollback decision deadline passed');}
 const g=await graph(db,b.id);if(!g.tasks.length)throw Error('Runbook has no tasks');schedule(g.tasks,g.edges);
 const code=o.code||`${b.code}-${mode.toUpperCase()}-${randomUUID().slice(0,8)}`;
 result=(await q(db,'insert into runs(code,runbook_id,revision,mode,actor,snapshot) values($1,$2,$3,$4,$5,$6) returning *',[code,b.id,b.revision,mode,actor,JSON.stringify({runbook:b,...g})]))[0];
 for(const t of g.tasks){const predecessors=g.edges.filter(e=>e.task_id===t.id).map(e=>g.tasks.find(x=>x.id===e.predecessor_id).code);await q(db,'insert into run_tasks(run_id,task_id,code,title,owner,kind,stream,duration_minutes,rollback,critical,predecessors) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[result.id,t.id,t.code,t.title,t.owner,t.kind,t.stream,t.duration_minutes,t.rollback,t.critical,JSON.stringify(predecessors)]);}
 await note(db,b.id,cmd,actor,{run:code,revision:b.revision,mode});
 }else if(cmd==='record-task'){
 const r=await one(db,'runs',need(o,'run'));if(r.status!=='active')throw Error('Run is closed');
 if(r.mode==='live'){
 const b=await one(db,'runbooks',r.runbook_id);const decision=(await q(db,'select choice from decisions where runbook_id=$1 and revision=$2 order by seq desc limit 1',[b.id,r.revision]))[0];
 if(b.revision!==r.revision||decision?.choice!=='go')throw Error('Live recording paused: plan changed or go decision withdrawn');
 }
 const rows=await q(db,'select * from run_tasks where run_id=$1',[r.id]);const ref=need(o,'ref').toLowerCase();const exact=rows.filter(t=>t.code.toLowerCase()===ref||t.id===ref);const matches=exact.length?exact:rows.filter(t=>t.id.startsWith(ref)||t.title.toLowerCase().includes(ref));
 if(matches.length!==1)throw Error('Task reference must be unique: '+matches.map(t=>t.code).join(', '));const t=matches[0];
 if(t.status==='done')throw Error('Task is already done; create a new run to repeat it');
 if(t.predecessors.some(code=>!rows.some(p=>p.code===code&&p.status==='done')))throw Error('Predecessors are not complete');
 const status=need(o,'result');if(!['done','failed'].includes(status))throw Error('Result must be done or failed');
 result=(await q(db,'update run_tasks set status=$1,evidence=$2,actor=$3,completed_at=now() where id=$4 returning *',[status,need(o,'evidence'),actor,t.id]))[0];await note(db,r.runbook_id,cmd,actor,{run:r.code,task:t.code,before:t.status,result:status,evidence:result.evidence});
 }else if(cmd==='abort-run'){
 const r=await one(db,'runs',need(o,'run'));if(r.status!=='active')throw Error('Run is already closed');
 result=(await q(db,"update runs set status='failed',ended_at=now() where id=$1 returning *",[r.id]))[0];
 await note(db,r.runbook_id,cmd,actor,{run:r.code,evidence:need(o,'evidence')});
 }else if(cmd==='close-run'){
 const r=await one(db,'runs',need(o,'run'));if(r.status!=='active')throw Error('Run is already closed');const rows=await q(db,'select status from run_tasks where run_id=$1',[r.id]);
 const failed=rows.some(t=>t.status==='failed');if(!failed&&rows.some(t=>t.status!=='done'))throw Error('Pending tasks remain');
 result=(await q(db,'update runs set status=$1,ended_at=now() where id=$2 returning *',[failed?'failed':'passed',r.id]))[0];await note(db,r.runbook_id,cmd,actor,{run:r.code,status:result.status});
 }else if(cmd==='log'){
 const b=await one(db,'runbooks',need(o,'book'));await note(db,b.id,'operator-note',actor,{note:need(o,'note')});result={logged:true};
 }else if(cmd==='import'){
 if(pos[0]!=='cutover')throw Error('Use import cutover --book=CODE --file=export.csv --actor=NAME');
 const parsed=parseCutover(need(o,'file'),o.offset);const code=need(o,'book').toUpperCase();
 let b=(await q(db,'select * from runbooks where code=$1',[code]))[0];if(!b)b=(await q(db,'insert into runbooks(code,name,owner) values($1,$2,$3) returning *',[code,o.name||code,o.owner||'']))[0];
 let inserted=0;for(const r of parsed.mapped){const existing=(await q(db,'select * from tasks where runbook_id=$1 and source_id=$2',[b.id,r.code]))[0];
 if(existing){if(JSON.stringify(sortObj(existing.source_data))!==JSON.stringify(sortObj(r.source_data)))throw Error(`Changed source row ${r.code}; review and map changes explicitly before replacing records`);continue;}
 await q(db,'insert into tasks(runbook_id,code,title,description,owner,stream,kind,duration_minutes,due_at,source_id,source_data) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[b.id,r.code,r.title,r.description,r.owner,r.stream,r.kind,r.duration_minutes,r.due_at,r.code,JSON.stringify(r.source_data)]);inserted++;}
 const all=await q(db,'select id,source_id from tasks where runbook_id=$1',[b.id]);const ids=new Map(all.map(t=>[t.source_id,t.id]));let linked=0;
 for(const r of parsed.mapped)for(const p of r.predecessors){const a=await q(db,'insert into dependencies(runbook_id,task_id,predecessor_id) values($1,$2,$3) on conflict do nothing returning id',[b.id,ids.get(r.code),ids.get(p)]);linked+=a.length;}
 const g=await graph(db,b.id);schedule(g.tasks,g.edges);if(inserted||linked)await bump(db,b.id);
 await q(db,'insert into imports(runbook_id,filename,digest,row_count,actor) values($1,$2,$3,$4,$5) on conflict do nothing',[b.id,parsed.filename,parsed.digest,parsed.mapped.length,actor]);
 await note(db,b.id,cmd,actor,{digest:parsed.digest,inserted,linked,dry_run:!!o['dry-run']});
 result={book:b.code,inserted,unchanged:parsed.mapped.length-inserted,linked,dry_run:!!o['dry-run'],review:'Original columns retained. Review task kinds, owner assignment, rollback steps, dates and any integration fields before rehearsal.'};
 }else throw Error('Unsupported write command');
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
const sortObj=x=>Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)));
export function format(data){
 if(Array.isArray(data)){if(!data.length)return '  (none)';return table(data,Object.keys(data[0]).map(key=>({key,label:key,format:v=>v instanceof Date?v.toISOString():v&&typeof v==='object'?JSON.stringify(v):v,width:85})));}
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>Array.isArray(v)?`${k}\n${format(v)}`:`${k}: ${v&&typeof v==='object'?JSON.stringify(v):v}`).join('\n');return String(data);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2),o={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');o[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const cmd=pos.shift()||(o.help?'help':'help');let db;
 try{db=await getDb();const data=await execute(db,cmd,o,pos);console.log(o.json?JSON.stringify(data,null,2):format(data));}
 catch(e){console.error(o.json?JSON.stringify({error:e.message,candidates:e.candidates||[]}):e.message);process.exitCode=1;}
 finally{if(db)await db.close();}
}
