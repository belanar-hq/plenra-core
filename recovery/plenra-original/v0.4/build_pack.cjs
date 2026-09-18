// Preservation construction only. Refuses to overwrite a finalized manifest.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const dir=__dirname, old=path.resolve(dir,'../v0.3');
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8'}).trim();
const root=git('rev-parse','--show-toplevel');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const read=n=>JSON.parse(fs.readFileSync(path.join(old,n),'utf8'));
const write=(n,d)=>fs.writeFileSync(path.join(dir,n),typeof d==='string'?d:JSON.stringify(d,null,2)+'\n');
assert(!fs.existsSync(path.join(dir,'recovery_manifest.json')),'Finalized packs are immutable');
const base=git('rev-parse','refs/heads/preservation/plenra-original-recovery-v0.3');
const remoteRef='refs/remotes/origin/preservation/plenra-original-recovery-v0.3';
assert.equal(git('rev-parse',remoteRef),base);
for(const f of walk(old)) {
  const rel=path.relative(old,f).replaceAll('\\','/');
  assert(fs.readFileSync(f).equals(cp.execFileSync('git',['show',remoteRef+':recovery/plenra-original/v0.3/'+rel])),'V0.3 remote-tracking bytes: '+rel);
  if(['build_pack.cjs','validate_pack.cjs','recovery_manifest.json'].includes(rel))continue;
  fs.mkdirSync(path.dirname(path.join(dir,rel)),{recursive:true});fs.copyFileSync(f,path.join(dir,rel));
}
write('git_baseline.json',{SOURCE_COMPLETE:false,ACTIVE_CANON:false,BASE_COMMIT:base,ORIGINAL_BRANCH:'preservation/plenra-original-recovery-v0.3',INITIAL_WORKTREE_STATUS:'CLEAN before V0.4 creation',REFS:git('for-each-ref','--format=%(refname) %(objectname)').split('\n').filter(x=>!x.startsWith('refs/heads/preservation/plenra-original-recovery-v0.4 ')),STASH_LIST:git('stash','list'),REMOTE_PRESERVED_REF:remoteRef,REMOTE_PRESERVED_COMMIT:base,REMOTE_VERIFICATION_SCOPE:'Byte comparison with locally available remote-tracking commit; no network access or live remote refresh under local-only authority.'});
write('v0_4_recovery_evidence.md',`# V0.4 attributed recovery evidence

Source: user-supplied PLENRA ORIGINAL RECOVERY V0.4 instruction in this session. This is a preservation transcription of supplied facts, not an original historical chat export or recovered archive. Dates are approximate. No exact prompt, threshold value or missing file body is reconstructed here.

## A — Plenra Python v3
On/around March 27, 2026 a Plenra V3 pack was specified/generated containing real prompt texts as intended content, exact thresholds, TypeScript / JSON / YAML configuration, agent descriptions, tool contracts, architecture documentation, Python/code artifacts, separate .prompt.txt files, thresholds.yaml, PLENRA_ARCHITECTURE.md and loader/configuration layers. The historical artifact plenra_v3_pack.zip was generated/referenced.
The pack was a SYNTHETIC RECONSTRUCTION, NOT a verified source-parity copy of an original production repository. plenra_v3_pack.zip is not verified original production source. This statement does not recover its bytes or prove that local similarly named files match it.

## B — March/April 2026 implementation
Reported artifacts include app/prompts/intake_budget_increase_prompt.py, app/services/intake_schemas.py, run_intake_to_decision_flow.py, decision_gate_service.py, app/api/intake.py, app/main.py, and parser/testing evidence. Reported mechanisms include current_budget, target_budget, ROI, CPC, conversion, trend, portfolio ROI and budget_delta_percent, with validation, deterministic handling and safe fallback behavior. These decision-infrastructure components are primarily PLENRA_DECISION_INFRASTRUCTURE → BELANAR_PRECURSOR. Their historical name does not make them Plenra Original product IP. Reported implementation does not verify production or outcomes.

## C — October 2025 product architecture
Approximately October 28, 2025: ChatKit → Agent Builder → AgentKit → Supabase / Stripe / Drive / S3 / Make. Named agents/capabilities: VP Marketing, VP Content, VP Distribution, Session2Printable, Evaluator. Flows: After-Lead Marketing, Emotional Layer, Session2Printable Pipeline.
Agent Builder was planned/pending; ChatKit UI was planned, not verified implemented; Supabase/Stripe/Drive connectors were not yet configured; Make/n8n was a manual bridge. Recommendation at the time: initially implement only 1–2 agents. S3 configuration status is not supplied. This architecture is PLENRA_ORIGINAL_PRODUCT_IP. Agents/capabilities remain DESIGNED / CONCEPTUAL historically, NOT PRODUCTION historically, FUTURE_PRODUCTION_CANDIDATE currently where applicable. This is not BUILD_NOW authority.

## D — Lineage correction
Plenra Python v3 is MIXED_TRANSITION_SOURCE requiring component-level lineage: PLENRA_ORIGINAL → GENERALIZATION → PLENRA_DECISION_INTELLIGENCE → PLENRA_DECISION_INFRASTRUCTURE → BELANAR. The original product itself did not become Belanar. A lineage relationship does not establish a shared runtime or actual dual consumers.

## E — Additional P0 references
Plenra - Decision Infrastructure System Documentation: primarily BELANAR_PRECURSOR.
הסוכן המרכזי 4 לווינים: lineage evidence distinguishing emotional Plenra from broader diagnostic/system architecture; ownership beyond that distinction remains unresolved.
Plenra Execution Agent: execution contracts, adapters, fail-closed behavior; primarily BELANAR_PRECURSOR.
Budget Increase Decision Gate POC: Intake → validation → decision → action → API/UI/observability; BELANAR_PRECURSOR.
October 2025 AgentKit / Session2Printable architecture: PLENRA_ORIGINAL_PRODUCT_IP; P0 recovery priority.

## Preservation boundaries
DESIGNED ≠ IMPLEMENTED; IMPLEMENTED ≠ PRODUCTION; PRODUCTION ≠ VERIFIED OUTCOME; SYNTHETIC RECONSTRUCTION ≠ ORIGINAL SOURCE; HISTORICAL NAME ≠ CURRENT OWNERSHIP; FUTURE_PRODUCTION_CANDIDATE ≠ BUILD_NOW; BELANAR_PRECURSOR ≠ PLENRA_ORIGINAL_PRODUCT; LINEAGE RELATIONSHIP ≠ SHARED RUNTIME.
Exact original prompts, complete original agent definitions, full V3 extraction, original zip bytes, source parity, remaining ChatGPT extraction and relevant legacy GPT reconciliation remain unresolved. Summary evidence does not close them. SOURCE_COMPLETE: false. ACTIVE_CANON: false.
`);
const s=read('source_register.json'), c=read('capability_registry.json'), a=read('agent_registry.json'), l=read('lineage_registry.json'), gaps=read('missing_source_register.json');
for(const r of s.SOURCES)r.SOURCE_PARITY_STATUS='UNVERIFIED_ORIGINAL_SOURCE_PARITY';
Object.assign(s.SOURCES.find(r=>r.SOURCE_ID==='SRC-003'),{OWNERSHIP:'BELANAR_PRECURSOR',COMPONENT_OF:'SRC-023',NOTES:'The preserved local architecture explicitly describes decision authorization infrastructure. Component classification only; the broader Plenra Python v3 source is MIXED_TRANSITION_SOURCE. Local bytes are not verified against plenra_v3_pack.zip or an original production repository.'});
const ep='v0_4_recovery_evidence.md', eh=hash(fs.readFileSync(path.join(dir,ep)));
function src(id,name,ownership,stage,period,section,notes){const r={SOURCE_ID:id,SOURCE_NAME:name,SOURCE_TYPE:'USER_REPORTED_HISTORICAL_SOURCE_REFERENCE',DATE_OR_PERIOD:period,EVIDENCE_AVAILABLE:{PACK_PATH:ep,SHA256:eh,SECTION:section},EVIDENCE_LEVEL:'ATTRIBUTED_USER_RECOVERY_EVIDENCE_NOT_ORIGINAL_SOURCE_BYTES',PRODUCT_STAGE:stage,OWNERSHIP:ownership,RECOVERY_STATUS:'REFERENCE_PRESERVED_SOURCE_EXTRACTION_INCOMPLETE',SOURCE_PARITY_STATUS:'UNVERIFIED_ORIGINAL_SOURCE_PARITY',RECOVERY_PRIORITY:'P0',NOTES:notes};s.SOURCES.push(r);return r;}
src('SRC-022','V0.4 authoritative recovery statement','PLENRA_ORIGINAL_AND_LINEAGE_BOUNDARY_STATEMENTS','RECOVERY_STATEMENT',null,'A–E','Session-supplied evidence; no independent historical source export.');
const v3=src('SRC-023','Plenra Python v3 / plenra_v3_pack.zip','MIXED_TRANSITION_SOURCE','SYNTHETIC_RECONSTRUCTION','On/around March 27, 2026','A','Specified/generated pack with intended prompt texts, exact thresholds, TypeScript/JSON/YAML configuration, agent descriptions, tool contracts, architecture, Python/code, separate .prompt.txt files, thresholds.yaml, PLENRA_ARCHITECTURE.md and loaders. No missing texts or numeric values reconstructed. Component-level ownership required.');
Object.assign(v3,{SOURCE_PARITY_STATUS:'SYNTHETIC_RECONSTRUCTION_NOT_VERIFIED_ORIGINAL_PRODUCTION_SOURCE',ARCHIVE_BYTES_RECOVERED:false,MONOLITHIC_OWNERSHIP_ALLOWED:false});
const impl=src('SRC-024','March/April 2026 Decision Infrastructure implementation evidence','BELANAR_PRECURSOR','IMPLEMENTATION_REPORTED_NOT_PRODUCTION_VERIFIED','March/April 2026 (approximate)','B','Validation, deterministic handling, safe fallback and parser/testing evidence are reported. Historical Plenra name does not imply original-product ownership.');
impl.REPORTED_ARTIFACTS=['app/prompts/intake_budget_increase_prompt.py','app/services/intake_schemas.py','run_intake_to_decision_flow.py','decision_gate_service.py','app/api/intake.py','app/main.py'];
impl.REPORTED_FIELDS=['current_budget','target_budget','ROI','CPC','conversion','trend','portfolio ROI','budget_delta_percent'];
const arch=src('SRC-025','October 2025 AgentKit / Session2Printable architecture','PLENRA_ORIGINAL_PRODUCT_IP','DESIGNED_CONCEPTUAL_NOT_PRODUCTION','Approximately October 28, 2025','C','P0 original-source recovery. Product architecture evidence strengthens association of the named agents/capabilities, but does not establish implementation.');
arch.ARCHITECTURE=['ChatKit','Agent Builder','AgentKit',['Supabase','Stripe','Drive','S3','Make']];arch.HISTORICAL_IMPLEMENTATION_STATUS={AGENT_BUILDER:'PLANNED_PENDING',CHATKIT_UI:'PLANNED_NOT_VERIFIED_IMPLEMENTED',SUPABASE_STRIPE_DRIVE:'NOT_YET_CONFIGURED',MAKE_N8N:'MANUAL_BRIDGE',S3:'NOT_STATED',INITIAL_RECOMMENDATION:'IMPLEMENT_ONLY_1_TO_2_AGENTS'};
arch.FLOWS=['After-Lead Marketing','Emotional Layer','Session2Printable Pipeline'];
src('SRC-026','Plenra - Decision Infrastructure System Documentation','BELANAR_PRECURSOR','DOCUMENTATION_REPORTED_NOT_PRODUCTION_VERIFIED',null,'E','Primarily Belanar precursor; full source extraction remains open.');
src('SRC-027','הסוכן המרכזי 4 לווינים','MIXED_LINEAGE_EVIDENCE_COMPONENT_OWNERSHIP_UNRESOLVED','HISTORICAL_DESIGN_EVIDENCE_STATUS_INCOMPLETE',null,'E','Evidence distinguishes emotional Plenra from broader diagnostic/system architecture. Do not infer agent identities, complete architecture or ownership beyond available evidence.');
src('SRC-028','Plenra Execution Agent','BELANAR_PRECURSOR','EXECUTION_CONTRACTS_REPORTED_IMPLEMENTATION_UNVERIFIED',null,'E','Execution contracts, adapters and fail-closed behavior; primarily Belanar precursor.');
src('SRC-029','Budget Increase Decision Gate POC','BELANAR_PRECURSOR','POC_REPORTED_NOT_PRODUCTION_VERIFIED',null,'E','Intake → validation → decision → action → API/UI/observability. No original source bytes or production outcome established.');
for(const [i,p]of ['docs/plenra_v3/plenra/core/loaders.py','docs/plenra_v3/plenra/config/thresholds.yaml','docs/plenra_v3/plenra/prompts/decision_gate.prompt.txt'].entries()){
 const dest='evidence/local/'+p;fs.mkdirSync(path.dirname(path.join(dir,dest)),{recursive:true});fs.copyFileSync(path.join(root,p),path.join(dir,dest));
 s.SOURCES.push({SOURCE_ID:'SRC-'+String(30+i).padStart(3,'0'),SOURCE_NAME:p,SOURCE_TYPE:'LOCAL_V3_COMPONENT',DATE_OR_PERIOD:null,EVIDENCE_AVAILABLE:{ORIGINAL_LOCAL_PATH:p,BASE_COMMIT:base,PACK_PATH:dest,SHA256:hash(fs.readFileSync(path.join(dir,dest)))},EVIDENCE_LEVEL:'BYTE_PRESERVED_LOCAL_ARTIFACT_NOT_PRODUCTION_VERIFICATION',PRODUCT_STAGE:'LOCAL_ARTIFACT_PRESENT_NOT_PRODUCTION_VERIFIED',OWNERSHIP:'BELANAR_PRECURSOR',COMPONENT_OF:'SRC-023',RECOVERY_STATUS:'LOCAL_COMPONENT_PRESERVED_UPSTREAM_EXTRACTION_INCOMPLETE',SOURCE_PARITY_STATUS:'UNVERIFIED_AGAINST_HISTORICAL_ZIP_AND_ORIGINAL_PRODUCTION_SOURCE',NOTES:'Observed local decision-infrastructure component. Byte preservation does not establish original prompt completeness, historical zip identity or production.'});
}
const ev=(id,section)=>({SOURCE_ID:id,LOCATOR:ep+'#'+section,EVIDENCE_LIMIT:'Attributed user recovery evidence; original historical source not extracted.'});
for(const r of c.CAPABILITIES)r.OWNERSHIP='PLENRA_ORIGINAL_PRODUCT_IP';
const emotional=c.CAPABILITIES.find(r=>r.NAME==='Emotional Layer / Emotional Engine');emotional.SOURCE_EVIDENCE.push(ev('SRC-025','c--october-2025-product-architecture'));emotional.CURRENT_CLASSIFICATION='PLENRA_ORIGINAL_PRODUCT_IP';emotional.CURRENT_INTENT='FUTURE_PRODUCTION_CANDIDATE';
function cap(name,owner,source,stage,notes){c.CAPABILITIES.push({CAPABILITY_ID:'CAP-'+String(c.CAPABILITIES.length+1).padStart(3,'0'),NAME:name,PURPOSE:null,SOURCE_EVIDENCE:[ev(source,source==='SRC-025'?'c--october-2025-product-architecture':source==='SRC-024'?'b--marchapril-2026-implementation':'e--additional-p0-references')],HISTORICAL_STATUS:stage,OWNERSHIP:owner,CURRENT_CLASSIFICATION:owner,CURRENT_INTENT:owner==='PLENRA_ORIGINAL_PRODUCT_IP'?'FUTURE_PRODUCTION_CANDIDATE':'PRESERVE_LINEAGE_NO_BUILD_AUTHORITY',PRODUCTION_EVIDENCE:{STATUS:'NOT_ESTABLISHED'},VALIDATION_REQUIRED:['Recover exact original source and definitions','Verify implementation separately from production and outcomes'],DEPENDENCIES:null,NOTES:notes});}
cap('Session2Printable','PLENRA_ORIGINAL_PRODUCT_IP','SRC-025','DESIGNED_CONCEPTUAL','Named product capability and Session2Printable Pipeline; detailed original definition missing.');
cap('Evaluator','PLENRA_ORIGINAL_PRODUCT_IP','SRC-025','DESIGNED_CONCEPTUAL','Product architecture scope only; no inference about generic evaluators.');
cap('After-Lead Marketing','PLENRA_ORIGINAL_PRODUCT_IP','SRC-025','DESIGNED_CONCEPTUAL','Named historical flow; detailed steps unavailable.');
cap('Budget Increase Decision Gate','BELANAR_PRECURSOR','SRC-029','POC_REPORTED_NOT_PRODUCTION_VERIFIED','Intake → validation → decision → action → API/UI/observability; generalized decision infrastructure.');
cap('Generic execution contracts and adapters','BELANAR_PRECURSOR','SRC-028','CONTRACTS_REPORTED_IMPLEMENTATION_UNVERIFIED','Reported fail-closed execution; no shared runtime inferred.');
cap('Generic Decision Infrastructure','BELANAR_PRECURSOR','SRC-024','IMPLEMENTATION_REPORTED_NOT_PRODUCTION_VERIFIED','Reported decision fields, deterministic validation and safe fallback; not emotional product capability ownership.');
for(const name of ['VP Marketing','VP Content','VP Distribution','Session2Printable','Evaluator']){
 let r=a.AGENTS.find(x=>x.NAME===name);
 if(!r){r={AGENT_ID:'AGT-'+String(a.AGENTS.length+1).padStart(3,'0'),NAME:name,ORIGINAL_PURPOSE:null,SOURCE_EVIDENCE:[],HISTORICAL_STATUS:'DESIGNED_CONCEPTUAL',PRODUCTION_HISTORY:{STATUS:'NOT_PRODUCTION',BASIS:'Explicit user recovery statement; no deployment verified.'},VALIDATION_REQUIRED:['Recover complete original prompt and agent definition','Reconcile legacy GPT inventory','Independent future production validation and authorization required'],POTENTIAL_CONSOLIDATION:null};a.AGENTS.push(r);}
 Object.assign(r,{OWNERSHIP:'PLENRA_ORIGINAL_PRODUCT_IP',CURRENT_CLASSIFICATION:'PLENRA_ORIGINAL_PRODUCT_IP',CURRENT_INTENT:'FUTURE_PRODUCTION_CANDIDATE',DATE_OR_PERIOD:'Approximately October 28, 2025',NOTES:'Association is scoped to the October product architecture. Later same-named infrastructure scaffolds are not proven identical. Designed/conceptual; not production. Candidate is not BUILD_NOW.'});r.SOURCE_EVIDENCE.push(ev('SRC-025','c--october-2025-product-architecture'));
}
l.CAPABILITY_LINEAGE_STATUS='Component-level separation supported by V0.4 attributed evidence; no exhaustive transfer mapping or shared runtime established.';
l.LINEAGE[0].FROM='PLENRA_ORIGINAL';l.LINEAGE[0].TO='GENERALIZATION';
l.LINEAGE[1].FROM='PLENRA_DECISION_INTELLIGENCE';l.LINEAGE[1].TO='PLENRA_DECISION_INFRASTRUCTURE';
l.LINEAGE[2].FROM='PLENRA_DECISION_INFRASTRUCTURE';
l.LINEAGE.splice(1,0,{LINEAGE_ID:'LIN-004',FROM:'GENERALIZATION',TO:'PLENRA_DECISION_INTELLIGENCE',RELATION:'GENERALIZED_DECISION_INTELLIGENCE_EVOLUTION',DATE_OR_PERIOD:null,SOURCE_EVIDENCE:[],PRODUCT_MERGER:false,CAPABILITY_MAPPINGS:[],NOTES:'Conceptual transition, not original-product conversion to Belanar.'});
for(const r of l.LINEAGE){r.SOURCE_EVIDENCE.push(ev('SRC-022','d--lineage-correction'));r.SHARED_RUNTIME_ESTABLISHED=false;}
l.COMPONENT_CLASSIFICATIONS=[{SOURCE_IDS:['SRC-025'],OWNERSHIP:'PLENRA_ORIGINAL_PRODUCT_IP'},{SOURCE_IDS:['SRC-003','SRC-024','SRC-026','SRC-028','SRC-029','SRC-030','SRC-031','SRC-032'],OWNERSHIP:'BELANAR_PRECURSOR'},{SOURCE_IDS:['SRC-023'],OWNERSHIP:'MIXED_TRANSITION_SOURCE'},{SOURCE_IDS:['SRC-027'],OWNERSHIP:'MIXED_LINEAGE_EVIDENCE_COMPONENT_OWNERSHIP_UNRESOLVED'}];
for(const r of gaps.MISSING_SOURCES)if(['MISS-001','MISS-002','MISS-003','MISS-005','MISS-007','MISS-013'].includes(r.MISSING_SOURCE_ID))r.RECOVERY_PRIORITY='P0';
Object.assign(gaps.MISSING_SOURCES.find(r=>r.MISSING_SOURCE_ID==='MISS-002'),{KNOWN_EVIDENCE:'SRC-023 reports a synthetic V3 pack on/around March 27, 2026. Four local components preserved; their equivalence to the historical zip is unverified.',MISSING_EVIDENCE:'Complete Plenra Python v3 source-level extraction, original build conversation and file inventory, component-level ownership reconciliation and provenance.'});
function gap(name,known,missing){gaps.MISSING_SOURCES.push({MISSING_SOURCE_ID:'MISS-'+String(gaps.MISSING_SOURCES.length+1).padStart(3,'0'),SOURCE_NAME:name,WHY_IT_MATTERS:'Summary or synthetic reconstruction does not replace original source evidence.',KNOWN_EVIDENCE:known,MISSING_EVIDENCE:missing,RECOVERY_PRIORITY:'P0',RECOVERY_STATUS:'OPEN'});}
gap('Exact original prompt texts','Intended real prompt contents reported in SRC-023; partial local prompt preserved.','Original prompt bodies and provenance; never reconstruct from summaries.');
gap('Complete original agent definitions','SRC-025 names five product agents/capabilities.','Complete original definitions and configuration; not only names or later scaffolds.');
gap('Original plenra_v3_pack.zip bytes','Historical filename generated/referenced; no matching archive found in repository inventory.','Original archive bytes, archive inventory and provenance. Search does not cover external drives or ChatGPT attachments.');
gap('Source-parity verification','Synthetic reconstruction explicitly distinguished from original production repository.','Independently identified original reference source and component-level byte/content comparison.');
for(const id of ['SRC-024','SRC-025','SRC-026','SRC-027','SRC-028','SRC-029']){const r=s.SOURCES.find(x=>x.SOURCE_ID===id);gap(r.SOURCE_NAME,id+' preserves attributed recovery evidence.','Full original source, context, attachments and source-level extraction. Reported summary does not close this gap.');}
for(const [n,d]of Object.entries({source_register:s,capability_registry:c,agent_registry:a,lineage_registry:l,missing_source_register:gaps}))write(n+'.json',d);
write('README.md',`# Plenra Original Recovery V0.4

PRESERVATION + LINEAGE CORRECTION ONLY. NOT ACTIVE CANON. SOURCE_COMPLETE: false. ACTIVE_CANON: false. No build or production authorization.

Derived from immutable V0.3 commit ${base}. The original product remains distinct from Belanar. Conceptual lineage: PLENRA_ORIGINAL → GENERALIZATION → PLENRA_DECISION_INTELLIGENCE → PLENRA_DECISION_INFRASTRUCTURE → BELANAR. Mosquito remains a Belanar vertical / validation environment, not Belanar Core.

Plenra Python v3 is MIXED_TRANSITION_SOURCE. The reported plenra_v3_pack.zip was a synthetic reconstruction, not verified original production source. Classify components separately. October 2025 AgentKit / Session2Printable product architecture is PLENRA_ORIGINAL_PRODUCT_IP; generalized March/April decision infrastructure is primarily BELANAR_PRECURSOR. No SHARED classification or shared runtime is inferred.

V0.3 evidence snapshots and user_recovery_evidence.md remain byte-preserved in this pack as historical evidence. Their historical wording is not active V0.4 classification. New evidence is attributed in v0_4_recovery_evidence.md. Four local V3 components are preserved (architecture inherited; loader, thresholds and prompt added), without asserting historical archive identity. No original prompt is reconstructed. Unavailable artifact paths and parser/testing evidence remain reported references.

See V0_3_TO_V0_4_DELTA.md and missing_source_register.json. Original purposes and dependencies remain null where unknown. DESIGNED ≠ IMPLEMENTED ≠ PRODUCTION ≠ VERIFIED OUTCOME. FUTURE_PRODUCTION_CANDIDATE ≠ BUILD_NOW. HISTORICAL NAME ≠ CURRENT OWNERSHIP. SYNTHETIC RECONSTRUCTION ≠ ORIGINAL SOURCE. BELANAR_PRECURSOR ≠ PLENRA_ORIGINAL_PRODUCT. LINEAGE RELATIONSHIP ≠ SHARED RUNTIME.

Run node recovery/plenra-original/v0.4/validate_pack.cjs (optionally --staged before commit). The validator verifies all JSON, SHA-256 hashes, retained refs/stash, V0.3 bytes against the locally available remote-preservation commit and additions-only scope. Live remote state is not refreshed under local-only authority. build_pack.cjs refuses to overwrite a finalized manifest.

The manifest hashes every other pack file. Its own SHA-256 is computed externally to avoid circular self-hashing. No application source changes, push, merge or main mutation is authorized.
`);
const inherited=[],changed=[],added=[];
for(const f of walk(dir)){const p=path.relative(dir,f).replaceAll('\\','/');if(fs.existsSync(path.join(old,p))){(fs.readFileSync(f).equals(fs.readFileSync(path.join(old,p)))?inherited:changed).push(p);}else added.push(p);}
for(const n of ['recovery_manifest.json'])if(!changed.includes(n))changed.push(n);
for(const n of ['V0_3_TO_V0_4_DELTA.md'])if(!added.includes(n))added.push(n);
write('V0_3_TO_V0_4_DELTA.md',`# V0.3 → V0.4 delta

V0.4 is still NOT ACTIVE CANON. SOURCE_COMPLETE: false. ACTIVE_CANON: false.

## Evidence and changes
The user-supplied V0.4 statement (SRC-022; v0_4_recovery_evidence.md) supplies approximate March 2026 synthetic-pack evidence, March/April implementation evidence and approximately October 28, 2025 product architecture evidence. No original historical chat or archive was supplied as bytes. Three existing local V3 files were newly copied byte-for-byte; the architecture snapshot was inherited.

- SRC-003 is explicitly BELANAR_PRECURSOR for the local decision-authorization architecture component; it no longer implies classification of the entire V3 source. All 21 inherited source records gain SOURCE_PARITY_STATUS without asserting original-source parity.
- SRC-022–SRC-029 add the attributed statement and seven requested source references. SRC-023 explicitly classifies Plenra Python v3 as MIXED_TRANSITION_SOURCE and its archive as synthetic reconstruction. SRC-030–SRC-032 preserve local loader, thresholds and Decision Gate prompt components as Belanar precursor, with historical-archive parity unresolved.
- CAP-006 gains October evidence and FUTURE_PRODUCTION_CANDIDATE intent. All 22 inherited product capabilities retain their original-product association via explicit OWNERSHIP. CAP-023–CAP-025 add Session2Printable, Evaluator and After-Lead Marketing as product concepts. CAP-026–CAP-028 add Decision Gate, generic execution contracts and generic Decision Infrastructure as BELANAR_PRECURSOR.
- AGT-009, AGT-010 and AGT-012 (VP Marketing, VP Content, VP Distribution) are reclassified in the October product context to PLENRA_ORIGINAL_PRODUCT_IP and FUTURE_PRODUCTION_CANDIDATE. AGT-016 and AGT-017 add Session2Printable and Evaluator. All agents remain historically DESIGNED_CONCEPTUAL / NOT_PRODUCTION. Same-named later scaffolds are not equated with these concepts.
- LIN-001 is narrowed to PLENRA_ORIGINAL → GENERALIZATION; LIN-004 adds GENERALIZATION → PLENRA_DECISION_INTELLIGENCE. LIN-002 and LIN-003 retain infrastructure evolution and renaming with normalized identifiers. This does not say the original product became Belanar, map unsupported capability transfers, establish dual consumers or imply shared runtime.
- Six existing gaps become P0; ten new P0 gaps preserve missing originals. No missing-source record is closed. Unknown exact dates, purposes, definitions, prompt bodies and dependencies remain unknown.

## Unresolved P0 sources
${gaps.MISSING_SOURCES.filter(r=>r.RECOVERY_PRIORITY==='P0').map(r=>'- '+r.MISSING_SOURCE_ID+': '+r.SOURCE_NAME+' — OPEN').join('\n')}

## Immutability and validation scope
V0.3 remains immutable so the prior evidence state and its original classification decisions can be audited. V0.4 applies corrections in a separate directory and local branch. V0.3 files are compared byte-for-byte with ${remoteRef} at ${base}; this is the locally recorded remote-preserved version, not a live remote fetch. Existing refs, stash and checkpoint are retained. Only V0.4 additions are permitted. The validator checks hashes, JSON, classification boundaries, agent status and additions-only Git scope. Attributed evidence is not independent historical verification; semantic review cannot prove completeness of missing sources.

## File accounting
Inherited byte-identical files (${inherited.length}):\n${inherited.sort().map(x=>'- '+x).join('\n')}

Changed counterparts from V0.3 (${changed.length}):\n${changed.sort().map(x=>'- '+x).join('\n')}

New relative paths (${added.length}):\n${added.sort().map(x=>'- '+x).join('\n')}
`);
const files=walk(dir).map(f=>({PATH:path.relative(dir,f).replaceAll('\\','/'),SHA256:hash(fs.readFileSync(f))})).sort((a,b)=>a.PATH.localeCompare(b.PATH));
files.push({PATH:'recovery_manifest.json',SHA256:null,HASH_EXCLUSION_REASON:'Circular self-hash; compute externally and report with commit.'});
write('recovery_manifest.json',{PACK_VERSION:'0.4',CREATED_AT:new Date().toISOString(),CREATION_DATE_BASIS:'Construction clock, not a historical source date',DERIVED_FROM_VERSION:'0.3',BASE_COMMIT:base,RECOVERY_STATUS:'PARTIAL_PRESERVATION_LINEAGE_CORRECTED_ORIGINAL_SOURCES_INCOMPLETE',SOURCE_COMPLETE:false,ACTIVE_CANON:false,FILES:files});
console.log('Created immutable V0.4 pack; validate before commit.');
