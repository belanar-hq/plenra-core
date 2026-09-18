const fs=require('fs'),crypto=require('crypto'),assert=require('assert');
const R='recovery/plenra-original/',O=R+'v0.7/',C='canon-candidate/plenra-original/v1/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(p+e.name+'/'):[p+e.name]).sort();
const baseline=read(O+'preservation_baseline.json');
for(const f of [...baseline.files,...baseline.tracked_files]) assert.equal(hash(f.path),f.sha256,'Preservation mismatch: '+f.path);
assert.deepEqual(baseline.protected_roots.flatMap(r=>files(R+r+'/')).sort(),baseline.files.map(f=>f.path).sort(),'Protected inventory changed');
for(const [root,name] of [[O,'recovery_manifest.json'],[C,'manifest.json']]) {const m=read(root+name);assert.deepEqual(files(root).filter(p=>p!==root+name),m.files.map(f=>f.path));for(const f of m.files)assert.equal(hash(f.path),f.sha256,f.path);}
assert.equal(hash(O+'historical_conflicts_preserved.json'),hash(R+'v0.6/historical_conflict_register.json'));
const closure=read(O+'closure.json'),r=read(C+'rules.json'),status=read(C+'status.json');
assert.equal(closure.ACTIVE_RECOVERY_STATUS,'CLOSED');assert.equal(closure.SOURCE_COMPLETE,false);assert.equal(closure.FULL_SYSTEM_RESTORATION,false);assert.equal(closure.HISTORICAL_RECOVERY_SUFFICIENT_FOR_PRODUCT_DECISION_MAKING,true);assert.equal(closure.REOPEN_ONLY_IF.length,3);
for(const x of [closure,r,status]) assert.equal(x.ACTIVE_CANON,false);assert.equal(r.STATUS,'CANDIDATE');assert.equal(status.PRODUCTION_READY,false);
const ids=new Set(r.RULES.map(x=>x.RULE_ID));assert.equal(ids.size,r.RULES.length);
for(const x of r.RULES){for(const key of ['RULE_ID','RULE','AUTHORITY_SOURCE','EVIDENCE','VALIDATION_STATUS','PRODUCTION_STATUS','SUPERSESSION_RELATIONSHIP','NOTES'])assert.ok(x[key],x.RULE_ID+': '+key);assert.ok(['RECOVERED_HISTORICAL_IP','NEW_2026_PRODUCT_DECISION','DERIVED_ARCHITECTURAL_RULE'].includes(x.AUTHORITY_SOURCE));assert.equal(x.PRODUCTION_STATUS,'NOT_PRODUCTION');for(const e of x.EVIDENCE){const p=typeof e==='string'?e:e.path||e.LOCATOR;if(!p||p.startsWith('http')||ids.has(p))continue;const base=p.split('#')[0];assert.ok(fs.existsSync(base)||fs.existsSync(C+base),'Missing evidence '+p);}}
for(const id of ['FD-R1','FD-R2','FD-R3','FD-R4'])assert.equal(r.RULES.find(x=>x.RULE_ID===id).AUTHORITY_SOURCE,'NEW_2026_PRODUCT_DECISION');
assert.equal(r.RULES.filter(x=>x.AUTHORITY_SOURCE==='NEW_2026_PRODUCT_DECISION').length,4);
const by=id=>r.RULES.find(x=>x.RULE_ID===id).RULE;
for(const [id,terms] of Object.entries({'FD-R1':['qualified professional','never independently replace'],'FD-R2':['not the permanent default','DURABLE THERAPIST SUMMARY','HYPOTHESIS_TO_VALIDATE'],'FD-R3':['approved_by','approved_scope','artifact/intervention_version','timestamp','renewed professional approval'],'FD-R4':['WITHHOLD CORE PROMISED RESULT','prohibited'],'D-CAPABILITY':['AMOS_DOES_NOT_SELECT_AGENTS_BY_DEFAULT','Grok Bot','CAPABILITY ≠ PROVIDER'],'D-PAYPAL':['PayPal','do not casually substitute'],'D-OUTCOMES':['OUTCOME_EXISTS ≠ BELANAR_CAUSED_OUTCOME'],'D-DEBT':['NO MATERIAL DECISION SHOULD REMAIN AMBIGUOUS BY DEFAULT']}))for(const term of terms)assert.ok(by(id).includes(term),term);
const outcomes=read(C+'outcome_governance.json');assert.equal(Object.keys(outcomes.CLASSES).length,5);assert.equal(outcomes.REQUIRED_FIELDS.length,12);assert.deepEqual(Object.keys(outcomes.COUNTERS),Object.keys(outcomes.CLASSES));assert.equal(outcomes.RECORDS.length,0);
const debt=read(C+'decision_debt.json');assert.equal(debt.DECIDED.length,4);assert.equal(debt.UNRESOLVED.length,7);for(const d of debt.UNRESOLVED){assert.equal(d.STATUS,'DEFERRED_WITH_TRIGGER');for(const key of ['DECISION','WHY_DEFERRED','EVIDENCE_NEEDED','ACTIVATION_TRIGGER','OWNER'])assert.ok(d[key]);}
for(let i=1;i<=10;i++)assert.ok(debt.UNRESOLVED.some(d=>d.LINKED_PROVENANCE.includes('CON-'+String(i).padStart(3,'0'))));
assert.equal(read(C+'capability_catalog.json').ACTIVATED,false);
console.log(JSON.stringify({VERIFICATION_STATUS:'PASS',protected_files:baseline.files.length,tracked_files_unchanged:baseline.tracked_files.length,RECOVERY_MANIFEST_HASH:hash(O+'recovery_manifest.json'),CANON_CANDIDATE_MANIFEST_HASH:hash(C+'manifest.json'),...status.COUNTS},null,2));
