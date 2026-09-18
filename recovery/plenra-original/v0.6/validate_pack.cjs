// Run from repository root. --seal creates the validation report then the manifest.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const root=__dirname,repo=path.resolve(root,'../../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const load=n=>read(path.join(root,n+'.json'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const rel=p=>path.relative(root,p).replaceAll('\\','/');
const git=(...a)=>cp.execFileSync('git',a,{cwd:repo,encoding:'utf8'}).trim();
const checks=[];
const check=(name,fn)=>{fn();checks.push({CHECK:name,STATUS:'PASS'});};
const baseline=load('git_baseline');
check('Original V0.3/V0.4/V0.5 and both deep-source passes unchanged',()=>{
  for(const r of baseline.PROTECTED_FILES)assert.equal(hash(path.join(repo,r.PATH)),r.SHA256,r.PATH);
  for(const folder of ['v0.3','v0.4','v0.5','deep-source-recovery']){
    const expected=baseline.PROTECTED_FILES.filter(r=>r.PATH.startsWith('recovery/plenra-original/'+folder+'/')).map(r=>r.PATH).sort();
    const actual=walk(path.join(root,'..',folder)).map(p=>path.relative(repo,p).replaceAll('\\','/')).sort();assert.deepEqual(actual,expected);
  }
});
check('Snapshots retain byte parity with originals',()=>{
  for(const [src,dest] of [['../v0.5','evidence/v0.5'],['../deep-source-recovery','evidence/deep-source-recovery']]){
    const source=path.join(root,src),target=path.join(root,dest);
    assert.equal(walk(source).length,walk(target).length);
    for(const p of walk(source))assert.equal(hash(p),hash(path.join(target,path.relative(source,p))),p);
  }
});
check('All V0.6 JSON parses, including inherited evidence',()=>{for(const p of walk(root).filter(p=>p.endsWith('.json')))read(p);});
const sources=load('source_register'),agents=load('agent_registry'),caps=load('capability_registry'),orch=load('orchestration_registry'),behaviors=load('product_behavior_registry'),conflicts=load('historical_conflict_register'),missing=load('missing_source_register'),gate=load('recovery_sufficiency_gate');
const allowed=new Set(sources.PARITY_POLICY.APPLICABLE_STATES),sourceIds=new Set(sources.SOURCES.map(s=>s.SOURCE_ID));
check('Source record schema, parity, hashes and unique IDs',()=>{
  assert.equal(sourceIds.size,sources.SOURCES.length);
  for(const s of sources.SOURCES){
    for(const k of ['SOURCE_PARITY','RECOVERY_METHOD','CHATGPT_PROJECT','CHAT_TITLE','DATE_OR_PERIOD','LINEAGE','EVIDENCE_LIMITATIONS'])assert(k in s,s.SOURCE_ID+' '+k);
    assert(allowed.has(s.SOURCE_PARITY),s.SOURCE_ID);
    if(s.EVIDENCE_AVAILABLE?.PACK_PATH){const p=path.join(root,s.EVIDENCE_AVAILABLE.PACK_PATH);assert(fs.existsSync(p),p);if(s.EVIDENCE_AVAILABLE.SHA256)assert.equal(hash(p),s.EVIDENCE_AVAILABLE.SHA256.toLowerCase());}
  }
});
const pass=read(path.join(root,'../deep-source-recovery/PASS2_SOURCE_PARITY.json'));
check('Pass 2 block and artifact parity not upgraded',()=>{
  for(const b of pass.blocks)assert.equal(sources.SOURCES.find(s=>s.SOURCE_ID==='DS2-'+b.id).SOURCE_PARITY,b.parity);
  for(const a of pass.artifacts){const s=sources.SOURCES.find(s=>s.SOURCE_ID==='ART-'+a.id);assert.equal(s.ARTIFACT_STATUS,a.status);if(a.status==='FILE_REFERENCE_ONLY'){assert.equal(s.SOURCE_PARITY,'REFERENCE_ONLY');assert.equal(s.ORIGINAL_ARTIFACT_STATUS,'ORIGINAL_ARTIFACT_NOT_RECOVERED');}}
  for(const id of ['DS2-F02','DS2-F03'])assert.equal(sources.SOURCES.find(s=>s.SOURCE_ID===id).SOURCE_PARITY,'DERIVED_SUMMARY');
});
const topFiles=fs.readdirSync(root).filter(n=>n.endsWith('.json')&&!['recovery_manifest.json','validation_report.json','git_baseline.json'].includes(n));
check('All current registry source references resolve',()=>{
  function scan(x){if(Array.isArray(x)){x.forEach(scan);return;}if(!x||typeof x!=='object')return;if(x.SOURCE_ID)assert(sourceIds.has(x.SOURCE_ID),'Unknown source '+x.SOURCE_ID);if(x.LOCATOR&&!x.LOCATOR.startsWith('http'))assert(fs.existsSync(path.join(root,x.LOCATOR.split('#')[0])),x.LOCATOR);Object.values(x).forEach(scan);}
  for(const n of topFiles)scan(read(path.join(root,n)));
});
check('No partial agent upgraded, historical production and future intent preserved',()=>{
  const old=read(path.join(root,'../v0.5/agent_registry.json'));
  for(const a of agents.AGENTS){assert.equal(a.PRODUCTION_STATUS,'NOT PRODUCTION / NOT VERIFIED');assert.equal(a.PRODUCTION_HISTORY.STATUS,'NOT_PRODUCTION');assert.equal(a.COMPLETE_ORIGINAL_DEFINITION_STATUS,'NOT_RECOVERED');assert.notEqual(a.FULL_SYSTEM_PROMPT_RECOVERED,true);const p=old.AGENTS.find(p=>p.AGENT_ID===a.AGENT_ID);if(p){assert.equal(a.CURRENT_INTENT,p.CURRENT_INTENT);assert.equal(a.HISTORICAL_STATUS,p.HISTORICAL_STATUS);}}
  for(const t of pass.targets)assert.equal(agents.AGENTS.find(a=>a.NAME===t.name).RECOVERY_STATUS,t.status);
  assert.equal(agents.AGENTS.find(a=>a.NAME==='Evaluator').SOURCE_PARITY,'REFERENCE_ONLY');
});
check('No duplicate capabilities, original intent retained',()=>{
  const old=read(path.join(root,'../v0.5/capability_registry.json'));
  assert.equal(caps.CAPABILITIES.length,old.CAPABILITIES.length);assert.equal(new Set(caps.CAPABILITIES.map(c=>c.CAPABILITY_ID)).size,caps.CAPABILITIES.length);
  for(const c of caps.CAPABILITIES){const p=old.CAPABILITIES.find(p=>p.CAPABILITY_ID===c.CAPABILITY_ID);assert.equal(c.NAME,p.NAME);assert.equal(c.CURRENT_INTENT,p.CURRENT_INTENT);assert.equal(c.HISTORICAL_STATUS,p.HISTORICAL_STATUS);}
});
check('Behavior and conflict schema; conflicts stay unresolved',()=>{
  const ids=new Set(conflicts.CONFLICTS.map(c=>c.CONFLICT_ID));assert.equal(ids.size,conflicts.CONFLICTS.length);
  for(const c of conflicts.CONFLICTS){for(const k of ['CONFLICT_ID','RULE_A','SOURCE_A','RULE_B','SOURCE_B','PRODUCT_IMPACT','CURRENT_STATUS','MATERIALITY','RECOMMENDED_RECONCILIATION_EVIDENCE'])assert(k in c);assert.equal(c.CURRENT_STATUS,'UNRESOLVED');}
  for(const b of behaviors.BEHAVIORS){for(const k of ['BEHAVIOR_ID','PURPOSE','INPUT','DECISION_OR_RULE','ACTION_OR_OUTPUT','SOURCE_EVIDENCE','SOURCE_PARITY','HISTORICAL_STATUS','CURRENT_AUTHORITY','VALIDATION_REQUIRED','CONFLICTS','NOTES'])assert(k in b);assert.equal(b.ACTIVE_CANON,false);assert.equal(b.CURRENT_AUTHORITY,'EVIDENCE_PRESERVATION_ONLY');b.CONFLICTS.forEach(id=>assert(ids.has(id)));}
});
const missingRows=Object.values(missing).find(Array.isArray);
check('Gap classes separate product from source/runtime gaps',()=>{
  const classes=['MATERIAL_PRODUCT_GAP','SOURCE_PARITY_GAP','HISTORICAL_IMPLEMENTATION_GAP','LOW_VALUE_PROVENANCE_GAP'];
  for(const m of missingRows)assert(classes.includes(m.GAP_CLASS));
  assert.equal(missingRows.find(m=>m.SOURCE_NAME==='Evaluator full behavior and original source').GAP_CLASS,'MATERIAL_PRODUCT_GAP');
  for(const id of ['MISS-042','MISS-043','MISS-044','MISS-045']){const m=missingRows.find(m=>m.MISSING_SOURCE_ID===id);assert.equal(m.PRODUCT_BLOCKER,false);assert.notEqual(m.GAP_CLASS,'MATERIAL_PRODUCT_GAP');}
});
check('Distinct orchestration generations and lineage preserved',()=>{
  assert.equal(new Set(orch.ORCHESTRATIONS.slice(0,3).map(o=>o.GENERATION)).size,3);
  assert.equal(load('lineage_registry').BOUNDARIES.PLENRA_ORIGINAL_DISTINCT_FROM_BELANAR,true);assert.equal(load('lineage_registry').BOUNDARIES.MOSQUITO,'BELANAR_VERTICAL');
});
check('Preservation gate, SOURCE_COMPLETE=false and ACTIVE_CANON=false',()=>{
  for(const n of topFiles){const x=read(path.join(root,n));assert.equal(x.SOURCE_COMPLETE,false,n);assert.equal(x.ACTIVE_CANON,false,n);}
  for(const k of ['PRODUCT_IDENTITY_SUFFICIENT','PRODUCT_ARCHITECTURE_SUFFICIENT','BEHAVIORAL_IP_SUFFICIENT','AGENT_IP_SUFFICIENT','ORCHESTRATION_IP_SUFFICIENT','SOURCE_PARITY_COMPLETE','FAITHFUL_FULL_SYSTEM_RESTORATION_POSSIBLE','PRODUCT_CANONIZATION_READY'])assert.equal(typeof gate[k],'boolean');
  for(const k of ['SOURCE_PARITY_COMPLETE','FAITHFUL_FULL_SYSTEM_RESTORATION_POSSIBLE','PRODUCT_CANONIZATION_READY','NO_MATERIAL_PRODUCT_UNKNOWN_REMAINS','PRODUCT_CANONIZATION_AUTHORIZED'])assert.equal(gate[k],false);
  assert.equal(gate.GOVERNING_FUTURE_STOP_CONDITION,'NO_MATERIAL_PRODUCT_UNKNOWN_REMAINS');
});
check('Baseline refs, checkpoint, stash and remote-tracking refs unchanged',()=>{
  const refs=new Set(git('for-each-ref','--format=%(refname) %(objectname)').split('\n'));
  for(const ref of baseline.REFS)assert(refs.has(ref),ref);
  assert.equal(git('stash','list'),baseline.STASH_LIST);
  assert.equal(git('branch','--show-current'),'preservation/plenra-original-recovery-v0.6');
});
check('No application source or unrelated tracked changes',()=>{
  const prefix='recovery/plenra-original/';
  const allowed=p=>p.startsWith(prefix+'v0.6/')||p.startsWith(prefix+'deep-source-recovery/');
  const changed=git('diff','--name-only',baseline.BASE_COMMIT).split('\n').filter(Boolean);
  changed.forEach(p=>assert(allowed(p),p));
  const untracked=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);untracked.forEach(p=>assert(allowed(p),p));
});
const report={SOURCE_COMPLETE:false,ACTIVE_CANON:false,VERIFICATION_STATUS:'PASS_EVIDENCE_PRESERVATION',CHECKS:checks,V0_3_IMMUTABILITY_VERIFIED:true,V0_4_IMMUTABILITY_VERIFIED:true,V0_5_IMMUTABILITY_VERIFIED:true,DEEP_SOURCE_EVIDENCE_INTEGRITY:true,STASH_RETAINED:true,CHECKPOINT_RETAINED:true,REMOTE_CHANGES:'NONE_PERFORMED; local remote-tracking refs unchanged; no remote network audit',UNSUPPORTED_CLAIMS_FOUND:{NEW_ADOPTED_FACTUAL_CLAIMS:0,HISTORICAL_UNVERIFIED_CLAIMS_PRESENT:true,DISPOSITION:'Preserved with HISTORICAL_CLAIM / OUTCOME_NOT_VERIFIED; no independent runtime, clinical/legal, security or business-outcome verification'},COUNTS:{SOURCE_RECORDS:sources.SOURCES.length,CAPABILITY_RECORDS:caps.CAPABILITIES.length,AGENT_RECORDS:agents.AGENTS.length,ORCHESTRATION_RECORDS:orch.ORCHESTRATIONS.length,PRODUCT_BEHAVIOR_RECORDS:behaviors.BEHAVIORS.length,CONFLICT_RECORDS:conflicts.CONFLICTS.length,MISSING_SOURCE_RECORDS:missingRows.length},GAP_COUNTS:Object.fromEntries(['MATERIAL_PRODUCT_GAP','SOURCE_PARITY_GAP','HISTORICAL_IMPLEMENTATION_GAP','LOW_VALUE_PROVENANCE_GAP'].map(k=>[k,missingRows.filter(m=>m.GAP_CLASS===k).length])),VALIDATION_LIMITATIONS:['Semantic classifications reviewed against preserved evidence; automated checks cannot prove whole-chat completeness or factual truth of historical claims.','No original executable export was run; no prompts reconstructed.','Git staging/committed blob parity is verified separately during delivery.']};
if(process.argv.includes('--seal')){
  fs.writeFileSync(path.join(root,'validation_report.json'),JSON.stringify(report,null,2)+'\n');
  const files=walk(root).filter(p=>rel(p)!=='recovery_manifest.json').sort().map(p=>({PATH:rel(p),BYTES:fs.statSync(p).size,SHA256:hash(p)}));
  const manifest={PACK_VERSION:'0.6',DERIVED_FROM_VERSION:'0.5',BASE_COMMIT:baseline.BASE_COMMIT,SOURCE_COMPLETE:false,ACTIVE_CANON:false,CURRENT_AUTHORITY:'EVIDENCE_PRESERVATION_ONLY',RECOVERY_SUFFICIENCY_FOR_PRESERVATION:true,FAITHFUL_FULL_SYSTEM_RESTORATION_POSSIBLE:false,PRODUCT_CANONIZATION_AUTHORIZED:false,NO_RECONSTRUCTION:true,FILES:files,HASH_ALGORITHM:'SHA-256',HASH_SCOPE:'All pack files except recovery_manifest.json; circular self-hash supplied externally by validator and delivery report',TOTAL_PACK_FILES:files.length+1,COUNTS:report.COUNTS,GAP_COUNTS:report.GAP_COUNTS};
  fs.writeFileSync(path.join(root,'recovery_manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
check('Manifest covers every pack file and hashes match',()=>{
  const m=load('recovery_manifest');assert.equal(m.SOURCE_COMPLETE,false);assert.equal(m.ACTIVE_CANON,false);
  assert.deepEqual(m.FILES.map(r=>r.PATH).sort(),walk(root).map(rel).filter(p=>p!=='recovery_manifest.json').sort());
  for(const r of m.FILES)assert.equal(hash(path.join(root,r.PATH)),r.SHA256,r.PATH);
});
console.log(JSON.stringify({...report,FILES_CREATED:walk(root).length,RECOVERY_MANIFEST_HASH:hash(path.join(root,'recovery_manifest.json'))},null,2));
