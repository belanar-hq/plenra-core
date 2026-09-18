const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const dir=__dirname,prefix='recovery/plenra-original/v0.4/',oldPrefix='recovery/plenra-original/v0.3/';
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8'}).trim(),root=git('rev-parse','--show-toplevel');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const relative=(d,f)=>path.relative(d,f).replaceAll('\\','/');
for(const f of walk(dir).filter(f=>f.endsWith('.json')))JSON.parse(fs.readFileSync(f,'utf8'));
const m=read('recovery_manifest.json'),s=read('source_register.json'),c=read('capability_registry.json'),a=read('agent_registry.json'),l=read('lineage_registry.json'),g=read('missing_source_register.json'),b=read('git_baseline.json');
for(const d of [m,s,c,a,l,g,b]){assert.equal(d.SOURCE_COMPLETE,false);assert.equal(d.ACTIVE_CANON,false);}
assert.deepEqual(walk(dir).map(f=>relative(dir,f)).sort(),m.FILES.map(f=>f.PATH).sort());
for(const f of m.FILES){const bytes=fs.readFileSync(path.join(dir,f.PATH));if(f.PATH==='recovery_manifest.json')assert.equal(f.SHA256,null);else assert.equal(hash(bytes),f.SHA256,f.PATH);if(process.argv.includes('--staged'))assert(bytes.equals(cp.execFileSync('git',['show',':'+prefix+f.PATH])),'staged bytes '+f.PATH);}
const old=path.resolve(dir,'../v0.3');
const oldPaths=git('ls-tree','-r','--name-only',b.REMOTE_PRESERVED_COMMIT,'--',oldPrefix).split('\n').filter(Boolean);
assert.deepEqual(walk(old).map(f=>oldPrefix+relative(old,f)).sort(),oldPaths.sort());
assert.equal(git('rev-parse',b.REMOTE_PRESERVED_REF),b.REMOTE_PRESERVED_COMMIT);
for(const p of oldPaths)assert(fs.readFileSync(path.join(root,p)).equals(cp.execFileSync('git',['show',b.REMOTE_PRESERVED_COMMIT+':'+p])),'V0.3 changed '+p);
const current=new Set(git('for-each-ref','--format=%(refname) %(objectname)').split('\n'));
for(const r of b.REFS)assert(current.has(r),'Missing/changed baseline ref '+r);
assert.equal(git('stash','list'),b.STASH_LIST);
assert.equal(git('branch','--show-current'),'preservation/plenra-original-recovery-v0.4');
for(const line of git('diff','--name-status',b.BASE_COMMIT).split('\n').filter(Boolean)){const [status,p]=line.split('\t');assert.equal(status,'A');assert(p.startsWith(prefix),'Outside V0.4 '+p);}
for(const p of git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean))assert(p.startsWith(prefix));
const ids=new Set(s.SOURCES.map(r=>r.SOURCE_ID));assert.equal(ids.size,s.SOURCES.length);
for(const r of s.SOURCES){for(const field of ['OWNERSHIP','PRODUCT_STAGE','EVIDENCE_LEVEL','RECOVERY_STATUS','SOURCE_PARITY_STATUS','NOTES'])assert(Object.hasOwn(r,field));assert.equal(hash(fs.readFileSync(path.join(dir,r.EVIDENCE_AVAILABLE.PACK_PATH))),r.EVIDENCE_AVAILABLE.SHA256);if(r.EVIDENCE_AVAILABLE.ORIGINAL_LOCAL_PATH){const p=r.EVIDENCE_AVAILABLE.ORIGINAL_LOCAL_PATH;const snapshot=fs.readFileSync(path.join(dir,r.EVIDENCE_AVAILABLE.PACK_PATH));assert(snapshot.equals(fs.readFileSync(path.join(root,p))),'Snapshot differs from local original '+p);const blob=cp.execFileSync('git',['show',r.EVIDENCE_AVAILABLE.BASE_COMMIT+':'+p]);assert.equal(snapshot.toString('utf8').replaceAll('\r\n','\n'),blob.toString('utf8').replaceAll('\r\n','\n'),'Git source content differs '+p);}}
for(const arr of [c.CAPABILITIES,a.AGENTS,l.LINEAGE])for(const r of arr){for(const e of r.SOURCE_EVIDENCE)assert(ids.has(e.SOURCE_ID));assert.notEqual(r.CURRENT_CLASSIFICATION,'SHARED');}
for(const group of l.COMPONENT_CLASSIFICATIONS)for(const id of group.SOURCE_IDS)assert(ids.has(id));
const v3=s.SOURCES.find(r=>r.SOURCE_ID==='SRC-023');assert.equal(v3.OWNERSHIP,'MIXED_TRANSITION_SOURCE');assert.equal(v3.MONOLITHIC_OWNERSHIP_ALLOWED,false);assert.equal(v3.ARCHIVE_BYTES_RECOVERED,false);assert.equal(v3.SOURCE_PARITY_STATUS,'SYNTHETIC_RECONSTRUCTION_NOT_VERIFIED_ORIGINAL_PRODUCTION_SOURCE');
for(const id of ['SRC-003','SRC-024','SRC-026','SRC-028','SRC-029','SRC-030','SRC-031','SRC-032'])assert.equal(s.SOURCES.find(r=>r.SOURCE_ID===id).OWNERSHIP,'BELANAR_PRECURSOR');
assert.equal(s.SOURCES.find(r=>r.SOURCE_ID==='SRC-025').OWNERSHIP,'PLENRA_ORIGINAL_PRODUCT_IP');
for(const name of ['Session2Printable','Evaluator','Emotional Layer / Emotional Engine']){const r=c.CAPABILITIES.find(r=>r.NAME===name);assert.equal(r.CURRENT_CLASSIFICATION,'PLENRA_ORIGINAL_PRODUCT_IP');assert.equal(r.CURRENT_INTENT,'FUTURE_PRODUCTION_CANDIDATE');}
for(const name of ['Budget Increase Decision Gate','Generic execution contracts and adapters','Generic Decision Infrastructure'])assert.equal(c.CAPABILITIES.find(r=>r.NAME===name).CURRENT_CLASSIFICATION,'BELANAR_PRECURSOR');
for(const r of c.CAPABILITIES){assert.equal(r.PRODUCTION_EVIDENCE.STATUS,'NOT_ESTABLISHED');assert.equal(r.PURPOSE,null);assert.equal(r.DEPENDENCIES,null);}
for(const r of a.AGENTS){assert.equal(r.HISTORICAL_STATUS,'DESIGNED_CONCEPTUAL');assert.equal(r.PRODUCTION_HISTORY.STATUS,'NOT_PRODUCTION');assert.equal(r.ORIGINAL_PURPOSE,null);}
for(const name of ['VP Marketing','VP Content','VP Distribution','Session2Printable','Evaluator']){const r=a.AGENTS.find(r=>r.NAME===name);assert.equal(r.CURRENT_CLASSIFICATION,'PLENRA_ORIGINAL_PRODUCT_IP');assert.equal(r.CURRENT_INTENT,'FUTURE_PRODUCTION_CANDIDATE');}
const oldAgents=JSON.parse(fs.readFileSync(path.join(old,'agent_registry.json'),'utf8')).AGENTS;
for(const r of oldAgents.filter(r=>r.CURRENT_INTENT==='FUTURE_PRODUCTION_CANDIDATE'))assert.equal(a.AGENTS.find(x=>x.AGENT_ID===r.AGENT_ID).CURRENT_INTENT,r.CURRENT_INTENT);
assert.deepEqual(l.LINEAGE.map(r=>[r.FROM,r.TO]),[['PLENRA_ORIGINAL','GENERALIZATION'],['GENERALIZATION','PLENRA_DECISION_INTELLIGENCE'],['PLENRA_DECISION_INTELLIGENCE','PLENRA_DECISION_INFRASTRUCTURE'],['PLENRA_DECISION_INFRASTRUCTURE','BELANAR']]);
assert.equal(l.PLENRA_ORIGINAL_IS_BELANAR,false);assert.equal(l.MOSQUITO.IS_BELANAR_CORE,false);assert.equal(l.MOSQUITO.CLASSIFICATION,'BELANAR_VERTICAL_VALIDATION_ENVIRONMENT');
for(const r of l.LINEAGE){assert.equal(r.PRODUCT_MERGER,false);assert.equal(r.SHARED_RUNTIME_ESTABLISHED,false);assert.equal(r.DATE_OR_PERIOD,null);assert.deepEqual(r.CAPABILITY_MAPPINGS,[]);}
for(const r of g.MISSING_SOURCES)assert.equal(r.RECOVERY_STATUS,'OPEN');
for(const name of ['Exact original prompt texts','Complete original agent definitions','Original plenra_v3_pack.zip bytes','Source-parity verification','October 2025 AgentKit / Session2Printable architecture','Plenra Python v3 System Build','Legacy Custom GPT inventory','ChatGPT Projects/Chats source-level extraction'])assert.equal(g.MISSING_SOURCES.find(r=>r.SOURCE_NAME===name).RECOVERY_PRIORITY,'P0');
for(const [key,rows]of [['CAPABILITY_ID',c.CAPABILITIES],['AGENT_ID',a.AGENTS],['LINEAGE_ID',l.LINEAGE],['MISSING_SOURCE_ID',g.MISSING_SOURCES]])assert.equal(new Set(rows.map(r=>r[key])).size,rows.length);
const oldManifest=JSON.parse(fs.readFileSync(path.join(old,'recovery_manifest.json'),'utf8'));
for(const f of oldManifest.FILES.filter(f=>f.PATH.startsWith('evidence/')||f.PATH==='user_recovery_evidence.md'))assert.equal(hash(fs.readFileSync(path.join(dir,f.PATH))),f.SHA256);
const inherited=m.FILES.filter(f=>fs.existsSync(path.join(old,f.PATH))&&fs.readFileSync(path.join(dir,f.PATH)).equals(fs.readFileSync(path.join(old,f.PATH)))).length;
console.log(JSON.stringify({VERIFICATION_STATUS:'PASS_LOCAL_PRESERVATION_INTEGRITY',FILES_CREATED:m.FILES.length,FILES_INHERITED_BYTE_IDENTICAL:inherited,FILES_CHANGED_FROM_V0_3:m.FILES.filter(f=>fs.existsSync(path.join(old,f.PATH))).length-inherited,SOURCE_RECORDS:s.SOURCES.length,CAPABILITY_RECORDS:c.CAPABILITIES.length,AGENT_RECORDS:a.AGENTS.length,LINEAGE_RECORDS:l.LINEAGE.length,MISSING_SOURCE_RECORDS:g.MISSING_SOURCES.length,P0_OPEN:g.MISSING_SOURCES.filter(r=>r.RECOVERY_PRIORITY==='P0').length,V0_3_IMMUTABILITY_VERIFIED:'BYTE_IDENTICAL_TO_LOCAL_REMOTE_PRESERVATION_COMMIT',REMOTE_VERIFICATION_SCOPE:b.REMOTE_VERIFICATION_SCOPE,FUTURE_AGENT_INTENT_PRESERVED:true,PRODUCTION_STATUS_INTEGRITY:true,SOURCE_COMPLETE:false,ACTIVE_CANON:false,EXISTING_REFS_AND_STASH_RETAINED:true,ONLY_V0_4_ADDITIONS:true,RECOVERY_MANIFEST_HASH:hash(fs.readFileSync(path.join(dir,'recovery_manifest.json')))},null,2));
