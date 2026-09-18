const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const dir=__dirname,prefix='recovery/plenra-original/v0.5/';
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8'}).trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const rel=(d,f)=>path.relative(d,f).replaceAll('\\','/');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n+'.json'),'utf8'));
function validate({unsealed=false}={}){
 const root=git('rev-parse','--show-toplevel'),b=read('git_baseline'),s=read('source_register'),c=read('capability_registry'),a=read('agent_registry'),l=read('lineage_registry'),g=read('missing_source_register'),o=read('orchestration_registry'),p=read('product_governance_record');
 for(const f of walk(dir).filter(f=>f.endsWith('.json')))JSON.parse(fs.readFileSync(f,'utf8'));
 for(const d of [b,s,c,a,l,g,o,p]){assert.equal(d.SOURCE_COMPLETE,false);assert.equal(d.ACTIVE_CANON,false);}
 for(const pack of b.PROTECTED_PACKS){const folder=path.resolve(dir,'..',pack.VERSION),pr='recovery/plenra-original/'+pack.VERSION+'/';assert.deepEqual(walk(folder).map(f=>rel(folder,f)).sort(),pack.FILES.map(f=>f.PATH).sort());for(const f of pack.FILES){const bytes=fs.readFileSync(path.join(folder,f.PATH));assert.equal(hash(bytes),f.SHA256);assert(bytes.equals(cp.execFileSync('git',['show',b.BASE_COMMIT+':'+pr+f.PATH])),'Prior pack bytes changed '+pr+f.PATH);}}
 const refs=new Set(git('for-each-ref','--format=%(refname) %(objectname)').split('\n'));for(const r of b.REFS)assert(refs.has(r),'Baseline ref changed '+r);
 assert(b.REFS.some(r=>r.startsWith('refs/codex/turn-diffs/checkpoints/')));
 assert(b.REFS.some(r=>r.startsWith('refs/heads/preservation/belanar-')));
 assert.equal(git('stash','list'),b.STASH_LIST);assert.equal(git('branch','--show-current'),'preservation/plenra-original-recovery-v0.5');
 for(const line of git('diff','--name-status',b.BASE_COMMIT).split('\n').filter(Boolean)){const [status,name]=line.split('\t');assert.equal(status,'A');assert(name.startsWith(prefix),'Out-of-scope change '+name);}
 for(const name of git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean))assert(name.startsWith(prefix),'Out-of-scope untracked file '+name);
 // Also ensure committed scope is additions-only after commit.
 for(const line of git('diff','--name-status',b.BASE_COMMIT,'HEAD').split('\n').filter(Boolean)){const [status,name]=line.split('\t');assert.equal(status,'A');assert(name.startsWith(prefix));}
 const ids=new Set(s.SOURCES.map(r=>r.SOURCE_ID));assert.equal(ids.size,s.SOURCES.length);
 for(const r of s.SOURCES){assert.equal(hash(fs.readFileSync(path.join(dir,r.EVIDENCE_AVAILABLE.PACK_PATH))),r.EVIDENCE_AVAILABLE.SHA256);}
 for(const [key,rows] of [['CAPABILITY_ID',c.CAPABILITIES],['AGENT_ID',a.AGENTS],['LINEAGE_ID',l.LINEAGE],['MISSING_SOURCE_ID',g.MISSING_SOURCES],['ORCHESTRATION_ID',o.ORCHESTRATIONS]])assert.equal(new Set(rows.map(r=>r[key])).size,rows.length);
 for(const rows of [c.CAPABILITIES,a.AGENTS,l.LINEAGE,o.ORCHESTRATIONS,[p]])for(const r of rows)for(const e of r.SOURCE_EVIDENCE){assert(ids.has(e.SOURCE_ID));assert(fs.existsSync(path.join(dir,e.LOCATOR.split('#')[0])));}
 const source=id=>s.SOURCES.find(r=>r.SOURCE_ID===id);
 for(const id of ['SRC-034','SRC-035','SRC-036','SRC-037','SRC-038'])assert.equal(source(id).OWNERSHIP,'PLENRA_ORIGINAL_PRODUCT_IP');
 assert(source('SRC-038').CLASSIFICATION_MARKERS.includes('COMMERCIAL_ORCHESTRATION_EVOLUTION'));
 for(const id of ['SRC-034','SRC-035','SRC-036','SRC-037'])assert.equal(source(id).DATE_OR_PERIOD,null);
 assert.equal(o.ORCHESTRATIONS.length,3);
 for(const r of o.ORCHESTRATIONS){assert.equal(r.CURRENT_CLASSIFICATION,'PLENRA_ORIGINAL_PRODUCT_IP');assert.equal(r.PRODUCTION_EVIDENCE.STATUS,'NOT_VERIFIED');assert.equal(r.ACTIVE_CANON,false);assert.equal(r.AUTHORITY_MODEL.CURRENT_EXECUTION_AUTHORITY,false);}
 const [v2,v3,hub]=o.ORCHESTRATIONS;
 assert.equal(v2.PRODUCT_STAGE,'DESIGNED_CONCEPTUAL');assert.equal(v3.LINEAGE_MARKER,'COMMERCIAL_ORCHESTRATION_EVOLUTION');assert.equal(v3.ROUTING_MODEL.DIRECT_SATELLITE_TO_SATELLITE_COMMUNICATION,false);
 assert.equal(hub.PRODUCT_STAGE,'POC_IMPLEMENTATION_PLAN_EVIDENCE');assert.equal(hub.IMPLEMENTATION_EVIDENCE.END_TO_END_EXECUTION_VERIFIED,false);assert.equal(hub.IMPLEMENTATION_EVIDENCE.ORIGINAL_CONFIGURATION_RECOVERED,false);
 assert.equal(a.ORIGINAL_CENTRAL_AGENT_SYSTEM_PROMPT,'MISSING_ORIGINAL_SOURCE');
 for(const r of a.AGENTS){assert.equal(r.HISTORICAL_STATUS,'DESIGNED_CONCEPTUAL');assert.equal(r.PRODUCTION_HISTORY.STATUS,'NOT_PRODUCTION');assert.equal(r.ORIGINAL_PURPOSE,null);}
 for(const name of ['Central Agent','VP Marketing','VP Content','VP Conversion','VP Printables','VP Analytics']){const r=a.AGENTS.find(x=>x.NAME===name);assert.equal(r.CURRENT_CLASSIFICATION,'PLENRA_ORIGINAL_PRODUCT_IP');assert.equal(r.CURRENT_INTENT,'FUTURE_PRODUCTION_CANDIDATE');assert.equal(r.ORIGINAL_SYSTEM_PROMPT_STATUS,'MISSING_ORIGINAL_SOURCE');assert.equal(r.COMPLETE_ORIGINAL_DEFINITION_STATUS,'MISSING_ORIGINAL_SOURCE');}
 const old=path.resolve(dir,'../v0.4'),oldRead=n=>JSON.parse(fs.readFileSync(path.join(old,n+'.json'),'utf8'));
 for(const r of oldRead('agent_registry').AGENTS.filter(r=>r.CURRENT_INTENT==='FUTURE_PRODUCTION_CANDIDATE'))assert.equal(a.AGENTS.find(x=>x.AGENT_ID===r.AGENT_ID).CURRENT_INTENT,r.CURRENT_INTENT);
 for(const r of c.CAPABILITIES)assert.equal(r.PRODUCTION_EVIDENCE.STATUS,'NOT_ESTABLISHED');
 for(const r of c.CAPABILITIES.filter(r=>Number(r.CAPABILITY_ID.slice(4))>=29)){assert.equal(r.CURRENT_CLASSIFICATION,'PLENRA_ORIGINAL_PRODUCT_IP');assert.equal(r.HISTORICAL_STATUS,'DESIGNED_CONCEPTUAL');}
 assert.equal(p.ACTIVE_CANON,false);assert.equal(p.VALIDATION_REQUIRED,true);assert.equal(p.HISTORICAL_METRICS.length,3);for(const r of p.HISTORICAL_METRICS){assert.equal(r.STATUS,'HISTORICAL_UNVALIDATED');assert.equal(r.ACTIVE_CANON,false);assert.equal(r.VALIDATION_REQUIRED,true);}
 assert.deepEqual(p.HISTORICAL_METRICS.map(r=>r.TARGET_PERCENT.VALUE),[65,30,40]);assert.equal(p.HISTORICAL_METRICS[0].FREEZE_BELOW_PERCENT,50);assert.deepEqual(p.HISTORICAL_METRICS[2].RETURN_WINDOW_DAYS,{MIN:7,MAX:21,APPROXIMATE:true});
 assert.equal(v2.MEASUREMENT.STATUS,'HISTORICAL_UNVALIDATED');assert.equal(v3.MEASUREMENT.STATUS,'HISTORICAL_UNVALIDATED');
 assert.equal(l.PLENRA_ORIGINAL_IS_BELANAR,false);assert.deepEqual(l.MOSQUITO,oldRead('lineage_registry').MOSQUITO);assert.equal(l.MOSQUITO.CLASSIFICATION,'BELANAR_VERTICAL_VALIDATION_ENVIRONMENT');
 for(const r of l.LINEAGE){assert.equal(r.PRODUCT_MERGER,false);assert.equal(r.SHARED_RUNTIME_ESTABLISHED,false);}
 for(const [from,to] of [['PRODUCT_EMOTIONAL_ORCHESTRATION','COMMERCIAL_ORCHESTRATION_EVOLUTION'],['COMMERCIAL_ORCHESTRATION_EVOLUTION','GENERALIZATION'],['GENERALIZATION','PLENRA_DECISION_INTELLIGENCE'],['PLENRA_DECISION_INTELLIGENCE','PLENRA_DECISION_INFRASTRUCTURE'],['PLENRA_DECISION_INFRASTRUCTURE','BELANAR']])assert(l.LINEAGE.some(r=>r.FROM===from&&r.TO===to));
 for(const group of oldRead('lineage_registry').COMPONENT_CLASSIFICATIONS)assert(l.COMPONENT_CLASSIFICATIONS.some(r=>JSON.stringify(r)===JSON.stringify(group)));
 for(const r of g.MISSING_SOURCES)assert.equal(r.RECOVERY_STATUS,'OPEN');
 for(const r of oldRead('missing_source_register').MISSING_SOURCES)assert.deepEqual(g.MISSING_SOURCES.find(x=>x.MISSING_SOURCE_ID===r.MISSING_SOURCE_ID),r);
 for(const name of ['Original Central Agent system prompt','Original VP agent system prompts','Complete original agent definitions','Original plenra_master_flow.manus bytes/content','Original Plenra Autonomous Hub source/configuration','Original Make scenario/blueprint','Original Plenra_Master_Hook configuration','Source-level evidence for actual implementation state','ChatGPT Projects/Chats source-level extraction'])assert.equal(g.MISSING_SOURCES.find(r=>r.SOURCE_NAME===name).RECOVERY_PRIORITY,'P0');
 for(const f of walk(old).filter(f=>rel(old,f).startsWith('evidence/')||['user_recovery_evidence.md','v0_4_recovery_evidence.md','V0_3_TO_V0_4_DELTA.md'].includes(rel(old,f))))assert(fs.readFileSync(f).equals(fs.readFileSync(path.join(dir,rel(old,f)))));
 let manifestHash=null;
 if(!unsealed){const m=read('recovery_manifest');assert.equal(m.SOURCE_COMPLETE,false);assert.equal(m.ACTIVE_CANON,false);assert.equal(m.BASE_COMMIT,b.BASE_COMMIT);assert.deepEqual(walk(dir).map(f=>rel(dir,f)).sort(),m.FILES.map(f=>f.PATH).sort());for(const f of m.FILES){const bytes=fs.readFileSync(path.join(dir,f.PATH));if(f.PATH==='recovery_manifest.json')assert.equal(f.SHA256,null);else assert.equal(hash(bytes),f.SHA256,f.PATH);if(process.argv.includes('--staged'))assert(bytes.equals(cp.execFileSync('git',['show',':'+prefix+f.PATH])),'Staged bytes differ '+f.PATH);}manifestHash=hash(fs.readFileSync(path.join(dir,'recovery_manifest.json')));}
 const currentFiles=walk(dir).map(f=>rel(dir,f)),oldFiles=walk(old).map(f=>rel(old,f));
 const inherited=currentFiles.filter(f=>oldFiles.includes(f)&&fs.readFileSync(path.join(dir,f)).equals(fs.readFileSync(path.join(old,f))));
 return {VERIFICATION_STATUS:'PASS_LOCAL_PRESERVATION_INTEGRITY',SOURCE_RECORDS:s.SOURCES.length,CAPABILITY_RECORDS:c.CAPABILITIES.length,AGENT_RECORDS:a.AGENTS.length,ORCHESTRATION_RECORDS:o.ORCHESTRATIONS.length,LINEAGE_RECORDS:l.LINEAGE.length,MISSING_SOURCE_RECORDS:g.MISSING_SOURCES.length,P0_OPEN:g.MISSING_SOURCES.filter(r=>r.RECOVERY_PRIORITY==='P0').length,V0_3_IMMUTABILITY_VERIFIED:true,V0_4_IMMUTABILITY_VERIFIED:true,BELANAR_PRESERVATION_RETAINED:true,PRODUCTION_STATUS_INTEGRITY:true,FUTURE_AGENT_INTENT_PRESERVED:true,SOURCE_COMPLETE:false,ACTIVE_CANON:false,UNSUPPORTED_CLAIMS_FOUND:[],STASH_RETAINED:true,CHECKPOINT_RETAINED:true,REMOTE_CHANGES:'NONE_PERFORMED_LOCAL_REFS_UNCHANGED',APPLICATION_SOURCE_CHANGED:false,FILES_CREATED:currentFiles.length,FILES_INHERITED:inherited.length,FILES_CHANGED_FROM_V0_4:currentFiles.filter(f=>oldFiles.includes(f)&&!inherited.includes(f)),FILES_NEW_TO_V0_5:currentFiles.filter(f=>!oldFiles.includes(f)),RECOVERY_MANIFEST_HASH:manifestHash};
}
module.exports={validate};if(require.main===module)console.log(JSON.stringify(validate(),null,2));
