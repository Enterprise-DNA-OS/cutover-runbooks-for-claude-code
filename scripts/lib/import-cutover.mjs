import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseCsv,pick } from './csv.mjs';
export function duration(value) {
 if(!String(value).trim())return 60;
 if(String(value).trim()==='0')return 0;
 const s=String(value).toLowerCase().replace(/\s/g,'');
 const matches=[...s.matchAll(/(\d+(?:\.\d+)?)(min|d|h|m|s)/g)];
 if(!matches.length||matches.map(x=>x[0]).join('')!==s)throw Error(`Invalid planned duration: ${value}`);
 return Math.round(matches.reduce((sum,m)=>sum+Number(m[1])*({d:1440,h:60,m:1,min:1,s:1/60}[m[2]]),0)*100)/100;
}
export function due(row,offset) {
 let date=pick(row,'Planned due date').trim();if(!date)return null;
 if(/^\d{2}\/\d{2}\/\d{4}$/.test(date)){const [d,m,y]=date.split('/');date=`${y}-${m}-${d}`;}
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Due date must be YYYY-MM-DD or DD/MM/YYYY');
 const key=Object.keys(row).find(k=>/^Planned due time(?:\s*\(.*\))?$/i.test(k));
 const time=(key?row[key]:'').trim()||'23:59:59';
 if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(time))throw Error('Due time must be HH:MM or HH:MM:SS');
 const zone=offset || (/\(UTC\)$/i.test(key||'')?'Z':'');
 if(!zone||! /^(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(zone))throw Error('Provide --offset=+12:00 (the export UTC offset); ambiguous local dates are not guessed');
 const d=new Date(`${date}T${time.length===5?time+':00':time}${zone}`);
 if(Number.isNaN(d.getTime())||Number(time.slice(0,2))>23||Number(time.slice(3,5))>59||Number(time.slice(6,8)||0)>59)throw Error('Invalid due time');
 return d.toISOString();
}
export function parseCutover(file,offset) {
 const text=readFileSync(file,'utf8'),rows=parseCsv(text);
 if(!rows.length)throw Error('Import file has no task rows');
 const seen=new Set();const mapped=rows.map((row,i)=>{
 const title=pick(row,'Title').trim(),sourceId=pick(row,'Task ID').trim();
 if(!title)throw Error(`Row ${i+2}: Title is required`);
 // Export task IDs are needed for stable repeat imports. Never infer identity from row order.
 if(!/^#?\d+$/.test(sourceId))throw Error(`Row ${i+2}: Task ID must be numeric, optionally prefixed with #`);
 const code='#'+sourceId.replace(/^#/,'');if(seen.has(code))throw Error(`Duplicate Task ID ${code}`);seen.add(code);
 const rawType=pick(row,'Task Type').toLowerCase();
 const kind=rawType.includes('validation')?'validation':rawType.includes('milestone')?'milestone':'normal';
 const predecessors=pick(row,'Predecessor IDs').split(/[,;\s]+/).filter(Boolean).map(x=>'#'+x.replace(/^#/,''));
 return {code,title,description:pick(row,'Description'),owner:pick(row,'Assigned Team (Name)','Assigned Team'),stream:pick(row,'Stream')||'Primary',kind,duration_minutes:duration(pick(row,'Planned Duration')),due_at:due(row,offset),predecessors,source_data:row};
 });
 for(const r of mapped)for(const p of r.predecessors)if(!seen.has(p))throw Error(`Missing predecessor ${p} for ${r.code}; export the complete runbook`);
 // Cycle and self-link checks before writing anything.
 const visiting=new Set(),done=new Set(),byCode=new Map(mapped.map(r=>[r.code,r]));
 const visit=c=>{if(visiting.has(c))throw Error(`Dependency cycle at ${c}`);if(done.has(c))return;visiting.add(c);for(const p of byCode.get(c).predecessors)visit(p);visiting.delete(c);done.add(c);};
 mapped.forEach(r=>visit(r.code));
 return {mapped,digest:createHash('sha256').update(text).digest('hex'),filename:path.basename(file)};
}
