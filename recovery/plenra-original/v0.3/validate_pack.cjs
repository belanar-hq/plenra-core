const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), cp=require('node:child_process'), assert=require('node:assert/strict');
const dir=__dirname, prefix='recovery/plenra-original/v0.3/';
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8'}).trim();
const root=git('rev-parse','--show-toplevel');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const f of walk(dir).filter(x=>x.endsWith('.json')))JSON.parse(fs.readFileSync(f,'utf8'));
const m=read('recovery_manifest.json'), s=read('source_register.json'), c=read('capability_registry.json'), a=read('agent_registry.json'), l=read('lineage_registry.json'), gaps=read('missing_source_register.json'), b=read('git_baseline.json');
for(const r of [m,s,c,a,l,gaps,b]){assert.equal(r.SOURCE_COMPLETE,false);assert.equal(r.ACTIVE_CANON,false);}
assert.deepEqual(walk(dir).map(p=>path.relative(dir,p).replaceAll('\\','/')).sort(),m.FILES.map(f=>f.PATH).sort());
for(const f of m.FILES){if(f.PATH==='recovery_manifest.json'){assert.equal(f.SHA256,null);continue;}assert.equal(hash(path.join(dir,f.PATH)),f.SHA256,f.PATH);}
if(process.argv.includes('--staged'))for(const f of m.FILES){const bytes=cp.execFileSync('git',['show',':'+prefix+f.PATH]);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hash(path.join(dir,f.PATH)),'Staged bytes differ: '+f.PATH);}
const ids=new Set(s.SOURCES.map(x=>x.SOURCE_ID));assert.equal(ids.size,s.SOURCES.length);
for(const x of s.SOURCES){assert.equal(hash(path.join(dir,x.EVIDENCE_AVAILABLE.PACK_PATH)),x.EVIDENCE_AVAILABLE.SHA256);if(x.EVIDENCE_AVAILABLE.ORIGINAL_LOCAL_PATH)assert.equal(hash(path.join(root,x.EVIDENCE_AVAILABLE.ORIGINAL_LOCAL_PATH)),x.EVIDENCE_AVAILABLE.SHA256);}
for(const x of [...c.CAPABILITIES,...a.AGENTS,...l.LINEAGE])for(const e of x.SOURCE_EVIDENCE)assert(ids.has(e.SOURCE_ID));
assert.equal(c.CAPABILITIES.length,22);assert.equal(a.AGENTS.length,15);assert.equal(l.LINEAGE.length,3);
for(const x of c.CAPABILITIES){assert.equal(x.PRODUCTION_EVIDENCE.STATUS,'NOT_ESTABLISHED');assert.equal(x.PURPOSE,null);assert.equal(x.DEPENDENCIES,null);assert.equal(x.CURRENT_CLASSIFICATION,'PLENRA_PRODUCT_IP');}
for(const x of a.AGENTS){assert.equal(x.HISTORICAL_STATUS,'DESIGNED_CONCEPTUAL');assert.equal(x.PRODUCTION_HISTORY.STATUS,'NOT_PRODUCTION');assert.equal(x.ORIGINAL_PURPOSE,null);}
for(const x of a.AGENTS.slice(0,8)){assert.equal(x.CURRENT_CLASSIFICATION,'PLENRA_PRODUCT_IP');assert.equal(x.CURRENT_INTENT,'FUTURE_PRODUCTION_CANDIDATE');}
assert.equal(l.PLENRA_ORIGINAL_IS_BELANAR,false);assert.equal(l.MOSQUITO.IS_BELANAR_CORE,false);assert.equal(l.MOSQUITO.CLASSIFICATION,'BELANAR_VERTICAL_VALIDATION_ENVIRONMENT');
assert.deepEqual(l.LINEAGE.map(x=>[x.FROM,x.TO]),[['PLENRA ORIGINAL','PLENRA DECISION INTELLIGENCE'],['PLENRA DECISION INTELLIGENCE','PLENRA DECISION INFRASTRUCTURE'],['PLENRA DECISION INFRASTRUCTURE','BELANAR']]);
for(const x of l.LINEAGE){assert.equal(x.PRODUCT_MERGER,false);assert.equal(x.DATE_OR_PERIOD,null);assert.deepEqual(x.CAPABILITY_MAPPINGS,[]);}
const current=new Set(git('for-each-ref','--format=%(refname) %(objectname)').split('\n'));
for(const ref of b.REFS)assert(current.has(ref),'Changed or missing existing ref: '+ref);
assert.equal(git('stash','list'),b.STASH_LIST);
assert.equal(git('branch','--show-current'),'preservation/plenra-original-recovery-v0.3');
for(const line of git('diff','--name-status',b.BASE_COMMIT).split('\n').filter(Boolean)){const [status,p]=line.split('\t');assert.equal(status,'A');assert(p.startsWith(prefix));}
for(const p of git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean))assert(p.startsWith(prefix));
const required={SOURCES:['SOURCE_ID','SOURCE_NAME','SOURCE_TYPE','DATE_OR_PERIOD','EVIDENCE_AVAILABLE','EVIDENCE_LEVEL','PRODUCT_STAGE','OWNERSHIP','RECOVERY_STATUS','NOTES'],CAPABILITIES:['CAPABILITY_ID','NAME','PURPOSE','SOURCE_EVIDENCE','HISTORICAL_STATUS','CURRENT_CLASSIFICATION','CURRENT_INTENT','PRODUCTION_EVIDENCE','VALIDATION_REQUIRED','DEPENDENCIES','NOTES'],AGENTS:['AGENT_ID','NAME','ORIGINAL_PURPOSE','SOURCE_EVIDENCE','HISTORICAL_STATUS','PRODUCTION_HISTORY','CURRENT_CLASSIFICATION','CURRENT_INTENT','VALIDATION_REQUIRED','POTENTIAL_CONSOLIDATION','NOTES'],MISSING_SOURCES:['WHY_IT_MATTERS','KNOWN_EVIDENCE','MISSING_EVIDENCE','RECOVERY_PRIORITY']};
for(const obj of [s,c,a,gaps])for(const [key,fields]of Object.entries(required))if(obj[key])for(const row of obj[key])for(const field of fields)assert(Object.hasOwn(row,field),field);
console.log(JSON.stringify({VERIFICATION_STATUS:'PASS_LOCAL_PRESERVATION_INTEGRITY',SOURCE_COMPLETE:false,ACTIVE_CANON:false,FILES:m.FILES.length,SOURCE_RECORDS:s.SOURCES.length,CAPABILITY_RECORDS:c.CAPABILITIES.length,AGENT_RECORDS:a.AGENTS.length,LINEAGE_RECORDS:l.LINEAGE.length,MISSING_SOURCE_RECORDS:gaps.MISSING_SOURCES.length,RECOVERY_MANIFEST_HASH:hash(path.join(dir,'recovery_manifest.json')),EXISTING_REFS_RETAINED:true,EXISTING_STASH_RETAINED:true,ONLY_PACK_ADDITIONS:true},null,2));
