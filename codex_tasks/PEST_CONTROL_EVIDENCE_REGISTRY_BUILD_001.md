TASK\_ID:

PEST\_CONTROL\_EVIDENCE\_REGISTRY\_BUILD\_001



ROLE:

You are Codex operating under Plenra Orchestrator constraints.



OBJECTIVE:

Build the internal Evidence Registry package for PEST\_CONTROL\_WHATSAPP\_EVIDENCE\_BATCH\_001.



This is a bounded data-structuring task only.



You must create structured internal files from the manually reviewed seed data below.



You must not infer new outcomes.

You must not analyze screenshots.

You must not inspect private raw WhatsApp images.

You must not generate marketing copy.

You must not create WhatsApp outreach.

You must not create ads.

You must not create automation.

You must not create CRM or funnel assets.

You must not update canon.

You must not create public-facing claims.



TARGET DIRECTORY:

data/pest\_control/evidence\_batch\_001/



ALLOWED FILES ONLY:



1\. data/pest\_control/evidence\_batch\_001/evidence\_registry.csv

2\. data/pest\_control/evidence\_batch\_001/outcome\_registry.csv

3\. data/pest\_control/evidence\_batch\_001/opportunity\_registry.csv

4\. data/pest\_control/evidence\_batch\_001/README.md

5\. data/pest\_control/evidence\_batch\_001/validation\_report.md



FORBIDDEN FILE CHANGES:



\* no source code changes

\* no app changes

\* no UI changes

\* no automation files

\* no CRM files

\* no funnel files

\* no public assets

\* no marketing assets

\* no canon mutation

\* no architecture changes

\* no tests unless already required by local repo conventions and limited to these files

\* no generated customer-facing material



SOURCE OF TRUTH:

Use only the manually reviewed seed data in this instruction.



Do not enrich from external knowledge.

Do not open screenshots.

Do not infer customer identity.

Do not infer payment unless payment\_received is explicitly true in the seed data.

Do not convert pipeline into outcome.

Do not convert review\_request\_sent into review\_received.

Do not convert referral\_shared into converted referral.



GLOBAL RULES:



\* asset\_generation\_allowed must be false for every evidence row.

\* redaction\_required must be true for every evidence row.

\* pipeline must never be counted as outcome.

\* invoice\_or\_receipt\_visible is not equal to payment\_received unless payment\_received is explicitly true.

\* review\_request\_sent is not review\_received.

\* referral\_requested or referral\_shared must not be counted as converted referral unless separately confirmed.

\* additional apartments, buildings, family units, or committee referrals are pipeline until closed, performed and paid.

\* visible screenshot evidence and operator-confirmed outcome must remain separate in notes where relevant.

\* all outputs are internal-only candidate artifacts.

\* if any required record is missing, return HOLD in validation\_report.md.

\* if any forbidden action is required or attempted, stop and return HOLD.



CSV REQUIREMENTS:



\* Use UTF-8.

\* Include headers exactly as specified.

\* Quote values containing commas.

\* For absent optional values, use an empty string.

\* Use true / false for booleans.

\* Do not add columns.



EVIDENCE REGISTRY COLUMNS:

evidence\_id

classification

customer\_type

service\_type

scope

main\_friction

trust\_signal

price\_issue

access\_issue

expectation\_gap

outcome\_type

service\_completed

payment\_received

invoice\_or\_receipt\_visible

pipeline\_detected

negative\_or\_deferred\_reason

pattern\_id

redaction\_required

asset\_generation\_allowed

notes



OUTCOME REGISTRY COLUMNS:

outcome\_id

linked\_evidence\_id

outcome\_type

outcome\_events

service\_completed

payment\_received

invoice\_or\_receipt\_issued

source

confidence

not\_claimed

notes



OPPORTUNITY REGISTRY COLUMNS:

opportunity\_id

linked\_evidence\_id

opportunity\_type

status

events

follow\_up\_required

not\_counted\_as\_outcome

notes



EXPECTED COUNTS:



\* evidence\_registry.csv: exactly 28 evidence rows

\* outcome\_registry.csv: exactly 26 outcome rows

\* opportunity\_registry.csv: exactly 2 opportunity rows



IMPORTANT OUTCOME ID RULE:

Create outcome rows only from the OUTCOME\_SEED\_DATA section below.



The Orchestrator has explicitly assigned PEST\_OUTCOME\_001A for PEST\_EVIDENCE\_001 because the manual seed explicitly states hard\_commercial\_outcome, service\_completed=true, payment\_received=true, and invoice\_or\_receipt\_visible=true.



Do not create outcome rows for PEST\_EVIDENCE\_002 or PEST\_EVIDENCE\_003 because no outcome\_id is provided and they are stuck-risk or recovery signals, not confirmed outcomes.



EVIDENCE\_SEED\_DATA:

\[

{

"evidence\_id": "PEST\_EVIDENCE\_001",

"classification": "COMPLETED\_WHATSAPP\_CONVERSION\_PATH\_PLUS\_POST\_SERVICE\_REFERRAL\_PROPAGATION",

"customer\_type": "customer\_or\_resident\_context",

"service\_type": "pest\_control",

"scope": "apartment\_or\_building\_context",

"main\_friction": "",

"trust\_signal": "satisfaction\_or\_referral\_propagation",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "referral\_shared",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "COMPLETED\_SUCCESS\_PATH",

"notes": "Completed service path with payment/admin/satisfaction/referral propagation. Referral/shared signal is pipeline unless separately converted."

},

{

"evidence\_id": "PEST\_EVIDENCE\_002",

"classification": "RESCHEDULE\_RECOVERY\_PLUS\_BUILDING\_COMMON\_AREA\_UPSELL",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "private\_apartment\_plus\_common\_area\_opportunity",

"main\_friction": "reschedule\_recovery\_and\_household\_constraints",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "stuck\_risk\_or\_recovery\_signal",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "building\_common\_area\_opportunity",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "RESCHEDULE\_RECOVERY\_PATH",

"notes": "Reschedule recovery, household constraints, committee/building flow. Pipeline only."

},

{

"evidence\_id": "PEST\_EVIDENCE\_003",

"classification": "RECURRING\_CUSTOMER\_MULTI\_RESCHEDULE\_BUILDING\_COORDINATION\_FRICTION",

"customer\_type": "recurring\_customer",

"service\_type": "pest\_control",

"scope": "multiple\_apartments\_or\_building\_coordination",

"main\_friction": "multi\_reschedule\_coordination\_friction",

"trust\_signal": "returning\_customer",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "stuck\_risk\_signal",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "MULTI\_RESCHEDULE\_COORDINATION\_FRICTION\_PATTERN\_001",

"notes": "Demand exists but coordination burden creates stuck risk."

},

{

"evidence\_id": "PEST\_EVIDENCE\_004",

"classification": "RODENT\_PHOTO\_TRIAGE\_TO\_PAID\_SERVICE\_WITH\_CONFIRMED\_OUTCOME",

"customer\_type": "residential\_customer",

"service\_type": "rodent\_control",

"scope": "private\_home\_or\_apartment",

"main\_friction": "rodent\_uncertainty",

"trust\_signal": "visual\_evidence\_shared",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "RODENT\_UNCERTAINTY\_TO\_CONFIRMED\_RESOLUTION\_PATTERN\_001",

"notes": "Mouse was caught, confirmed by operator."

},

{

"evidence\_id": "PEST\_EVIDENCE\_005",

"classification": "SCHEDULE\_RESCHEDULE\_TO\_SERVICE\_COMPLETION\_WITH\_INVOICE\_ISSUED",

"customer\_type": "residential\_or\_business\_customer",

"service\_type": "pest\_control",

"scope": "apartment\_or\_site",

"main\_friction": "schedule\_reschedule",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_operational\_outcome",

"service\_completed": true,

"payment\_received": false,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "SERVICE\_COMPLETED\_WITH\_ADMIN\_FLOW",

"notes": "Service completed. Payment received only if separately confirmed."

},

{

"evidence\_id": "PEST\_EVIDENCE\_006",

"classification": "CONFIRMED\_APPOINTMENT\_TO\_CUSTOMER\_CANCELLATION\_WITH\_TRUST\_PRESERVATION",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "appointment\_only",

"main\_friction": "external\_cancellation\_after\_confirmation",

"trust\_signal": "relationship\_preserved",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "negative\_deferred\_outcome",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "customer\_cancelled\_due\_to\_external\_constraint",

"pattern\_id": "EXTERNAL\_CANCELLATION\_TRUST\_PRESERVATION\_PATTERN\_001",

"notes": "Cancellation due to external constraint, not sales failure."

},

{

"evidence\_id": "PEST\_EVIDENCE\_007",

"classification": "TIME\_CHANGE\_RECOVERY\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "apartment\_or\_private\_home",

"main\_friction": "time\_change\_and\_reentry\_constraint",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "HOUSEHOLD\_CONSTRAINT\_TO\_PAID\_SERVICE\_OUTCOME\_PATTERN\_001",

"notes": "Household reentry constraint handled."

},

{

"evidence\_id": "PEST\_EVIDENCE\_008",

"classification": "PRIVATE\_APARTMENT\_PLUS\_BUILDING\_COMMON\_AREA\_COMBO\_JOB\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "private\_apartment\_plus\_building\_common\_area",

"main\_friction": "scope\_expansion",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "PRIVATE\_PLUS\_BUILDING\_COMBO\_OUTCOME\_PATTERN\_001",

"notes": "Combined-scope job."

},

{

"evidence\_id": "PEST\_EVIDENCE\_009",

"classification": "RETURNING\_CUSTOMER\_PRE\_MOVE\_APARTMENT\_TREATMENT\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "pre\_move\_private\_apartment",

"main\_friction": "pre\_move\_timing",

"trust\_signal": "returning\_customer",

"price\_issue": "",

"access\_issue": "access\_resolved",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "REPEAT\_CUSTOMER\_PRE\_MOVE\_OUTCOME\_PATTERN\_001",

"notes": "Pre-move repeat customer."

},

{

"evidence\_id": "PEST\_EVIDENCE\_010",

"classification": "RETURNING\_CUSTOMER\_PRIVATE\_APARTMENT\_PLUS\_BUILDING\_COMMON\_AREA\_COMBO\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "private\_apartment\_plus\_building\_common\_area",

"main\_friction": "scope\_expansion",

"trust\_signal": "returning\_customer",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "PRIVATE\_PLUS\_BUILDING\_COMBO\_OUTCOME\_PATTERN\_001",

"notes": "Repeated private plus building combo evidence."

},

{

"evidence\_id": "PEST\_EVIDENCE\_011",

"classification": "RETURNING\_CUSTOMER\_MULTI\_SITE\_EXPANSION\_TO\_TWO\_COMPLETED\_PAID\_SERVICES",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "institutional\_site\_plus\_private\_home",

"main\_friction": "multi\_site\_expansion",

"trust\_signal": "returning\_customer",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "RETURNING\_CUSTOMER\_MULTI\_SITE\_EXPANSION\_PATTERN\_001",

"notes": "Kindergarten plus private home. Redaction must be strict due to institution/minor context."

},

{

"evidence\_id": "PEST\_EVIDENCE\_012",

"classification": "FAMILY\_PROXY\_REPEAT\_APARTMENT\_BOOKING\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "family\_proxy\_customer",

"service\_type": "pest\_control",

"scope": "family\_member\_apartment",

"main\_friction": "proxy\_booking\_coordination",

"trust\_signal": "family\_proxy\_booking\_confirmed",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "FAMILY\_PROXY\_BOOKING\_OUTCOME\_PATTERN\_001",

"notes": "Proxy booking succeeded."

},

{

"evidence\_id": "PEST\_EVIDENCE\_013",

"classification": "RETURNING\_CUSTOMER\_VISUAL\_PEST\_EVIDENCE\_REINFORCEMENT\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "reinforcement\_or\_follow\_up\_visit",

"main\_friction": "visual\_evidence\_to\_reinforcement",

"trust\_signal": "returning\_customer\_visual\_evidence\_shared",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "VISUAL\_EVIDENCE\_TO\_REINFORCEMENT\_OUTCOME\_PATTERN\_001",

"notes": "Photo evidence led to paid reinforcement."

},

{

"evidence\_id": "PEST\_EVIDENCE\_014",

"classification": "RODENT\_INQUIRY\_PRICE\_QUOTE\_TO\_DIY\_TRAP\_DEFERRAL\_NOT\_CLOSED",

"customer\_type": "residential\_or\_building\_customer",

"service\_type": "rodent\_control",

"scope": "building\_or\_home",

"main\_friction": "diy\_deferral",

"trust\_signal": "",

"price\_issue": "quote\_to\_diy\_traps",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "negative\_deferred\_outcome",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "customer\_chose\_diy\_traps",

"pattern\_id": "DIY\_TRAP\_DEFERRAL\_PATTERN\_001",

"notes": "Deferred, not lost."

},

{

"evidence\_id": "PEST\_EVIDENCE\_015",

"classification": "POST\_TREATMENT\_VISIBLE\_ACTIVITY\_CONFUSION\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "cockroach\_or\_insect\_treatment",

"scope": "apartment\_or\_home",

"main\_friction": "post\_treatment\_visible\_activity\_confusion",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "delayed\_emergence\_and\_delayed\_contact",

"outcome\_type": "hard\_commercial\_outcome\_with\_expectation\_gap",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "HIDDEN\_HARBORAGE\_DELAYED\_CONTACT\_EXPECTATION\_GAP\_PATTERN\_001",

"notes": "Delayed emergence/contact expectation gap. Cockroaches may emerge later from hiding and only then contact treatment."

},

{

"evidence\_id": "PEST\_EVIDENCE\_016",

"classification": "OPERATOR\_FIELD\_EVIDENCE\_STANDING\_WATER\_SOURCE\_IDENTIFIED\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "mosquito\_or\_pest\_control",

"scope": "property\_or\_yard",

"main\_friction": "environmental\_source\_identification",

"trust\_signal": "remote\_explanation\_while\_customer\_absent",

"price\_issue": "",

"access\_issue": "customer\_absent\_remote\_explanation",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "FIELD\_EVIDENCE\_TO\_REMOTE\_TRUST\_PRESERVATION\_PATTERN\_001",

"notes": "Operator captured field evidence while customer absent and informed customer remotely."

},

{

"evidence\_id": "PEST\_EVIDENCE\_017",

"classification": "FAMILY\_PROXY\_ELDERLY\_PARENT\_BOOKING\_TO\_RECIPIENT\_RESISTANCE\_CANCELLATION\_DEFERRED",

"customer\_type": "family\_proxy\_customer",

"service\_type": "pest\_control",

"scope": "elderly\_parent\_apartment",

"main\_friction": "recipient\_resistance",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "negative\_deferred\_outcome",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "recipient\_resistance",

"pattern\_id": "PROXY\_BOOKING\_RECIPIENT\_RESISTANCE\_PATTERN\_001",

"notes": "Proxy wanted service, recipient resisted."

},

{

"evidence\_id": "PEST\_EVIDENCE\_018",

"classification": "RETURNING\_CUSTOMER\_PRIMARY\_APARTMENT\_JOB\_TO\_COMPLETED\_PAID\_SERVICE\_WITH\_ADDITIONAL\_FAMILY\_APARTMENT\_OPPORTUNITIES\_PENDING",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "primary\_apartment\_plus\_pending\_family\_apartments",

"main\_friction": "family\_network\_pipeline",

"trust\_signal": "returning\_customer",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome\_plus\_pipeline",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "additional\_family\_apartments\_pending",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "PRIMARY\_JOB\_TO\_FAMILY\_APARTMENT\_PIPELINE\_PATTERN\_001",

"notes": "Primary job closed. Additional family apartments pending, not outcome."

},

{

"evidence\_id": "PEST\_EVIDENCE\_019",

"classification": "TRUST\_BACKED\_REMOTE\_ACCESS\_COMPLETED\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "remote\_access\_property",

"main\_friction": "remote\_access\_coordination",

"trust\_signal": "trust\_backed\_remote\_access\_granted",

"price\_issue": "",

"access\_issue": "remote\_access\_resolved",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "TRUST\_BACKED\_REMOTE\_ACCESS\_COMPLETED\_SERVICE\_PATTERN\_001",

"notes": "Remote access without customer present is trust signal."

},

{

"evidence\_id": "PEST\_EVIDENCE\_020",

"classification": "URGENT\_REQUEST\_CAPACITY\_CONSTRAINT\_TO\_PRE\_CLEANING\_SCHEDULED\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "apartment\_or\_home",

"main\_friction": "capacity\_constraint\_recovery",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "CAPACITY\_CONSTRAINT\_RECOVERY\_OUTCOME\_PATTERN\_001",

"notes": "No immediate availability but deal recovered."

},

{

"evidence\_id": "PEST\_EVIDENCE\_021",

"classification": "RETURNING\_CUSTOMER\_LARGER\_PROPERTY\_REPRICING\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "larger\_property",

"main\_friction": "scope\_based\_repricing",

"trust\_signal": "returning\_customer",

"price\_issue": "prior\_price\_anchor\_scope\_repricing",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "REPEAT\_CUSTOMER\_SCOPE\_REPRICING\_OUTCOME\_PATTERN\_001",

"notes": "Prior price anchor handled through scope explanation."

},

{

"evidence\_id": "PEST\_EVIDENCE\_022",

"classification": "APARTMENT\_JOB\_WITH\_CAPACITY\_CONSTRAINT\_AND\_BUILDING\_COMMITTEE\_REFERRAL\_OPPORTUNITY\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "apartment\_plus\_pending\_building\_committee\_referral",

"main\_friction": "capacity\_constraint\_and\_building\_committee\_pipeline",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome\_plus\_pipeline",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "building\_committee\_referral\_pending",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "COMPLETED\_APARTMENT\_JOB\_WITH\_BUILDING\_COMMITTEE\_PIPELINE\_PATTERN\_001",

"notes": "Apartment job completed and paid. Building committee referral pending, not outcome."

},

{

"evidence\_id": "PEST\_EVIDENCE\_023",

"classification": "URGENT\_SEASONAL\_HOME\_PEST\_REQUEST\_WITH\_LIFE\_EVENT\_TIMING\_TO\_COMPLETED\_PAID\_SERVICE\_AND\_REVIEW\_REQUEST",

"customer\_type": "returning\_or\_familiar\_customer",

"service\_type": "pest\_control",

"scope": "home\_or\_apartment",

"main\_friction": "urgent\_seasonal\_request\_with\_reschedule",

"trust\_signal": "returning\_or\_familiar\_customer",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome\_plus\_review\_pipeline",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "review\_request\_sent",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "COMPLETED\_PAID\_SERVICE\_TO\_REVIEW\_REQUEST\_PATTERN\_001",

"notes": "Review request sent, review not confirmed."

},

{

"evidence\_id": "PEST\_EVIDENCE\_024",

"classification": "FLEA\_TREATMENT\_PRIVATE\_APARTMENT\_PLUS\_BUILDING\_COMMON\_AREA\_COMBO\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "flea\_treatment",

"scope": "private\_apartment\_plus\_building\_common\_area",

"main\_friction": "scope\_expansion",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "PRIVATE\_PLUS\_BUILDING\_COMBO\_OUTCOME\_PATTERN\_001",

"notes": "Private plus building combo, flea context."

},

{

"evidence\_id": "PEST\_EVIDENCE\_025",

"classification": "APPOINTMENT\_SCHEDULING\_WITH\_ALTERNATIVE\_AVAILABILITY\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "pest\_control",

"scope": "apartment\_or\_home",

"main\_friction": "alternative\_slot\_and\_original\_appointment\_preserved",

"trust\_signal": "",

"price\_issue": "",

"access\_issue": "",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "ALTERNATIVE\_SLOT\_OFFERED\_ORIGINAL\_APPOINTMENT\_PRESERVED\_TO\_PAID\_SERVICE\_PATTERN\_001",

"notes": "Earlier slot offered, original appointment preserved."

},

{

"evidence\_id": "PEST\_EVIDENCE\_026",

"classification": "TRUST\_BACKED\_REMOTE\_ACCESS\_WITH\_VIDEO\_INSTRUCTIONS\_ALARM\_KEY\_RETURN\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "business\_or\_property\_customer",

"service\_type": "pest\_control",

"scope": "remote\_access\_location",

"main\_friction": "remote\_access\_with\_alarm\_key\_return",

"trust\_signal": "trust\_backed\_remote\_access\_granted",

"price\_issue": "",

"access\_issue": "video\_access\_instructions\_access\_code\_key\_alarm",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "TRUST\_BACKED\_REMOTE\_ACCESS\_COMPLETED\_SERVICE\_PATTERN\_001",

"notes": "Very strong trust-backed access evidence. Redact access code, key and alarm details."

},

{

"evidence\_id": "PEST\_EVIDENCE\_027",

"classification": "RETURNING\_CUSTOMER\_SIMPLE\_APPOINTMENT\_CONFIRMATION\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "returning\_customer",

"service\_type": "pest\_control",

"scope": "apartment\_or\_home",

"main\_friction": "simple\_appointment\_confirmation",

"trust\_signal": "returning\_customer",

"price\_issue": "",

"access\_issue": "address\_confirmed",

"expectation\_gap": "",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": false,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "SIMPLE\_RETURNING\_CUSTOMER\_APPOINTMENT\_FLOW\_PATTERN\_001",

"notes": "Clean repeat customer scheduling baseline."

},

{

"evidence\_id": "PEST\_EVIDENCE\_028",

"classification": "MULTI\_PEST\_URGENCY\_WITH\_EXPECTATION\_SETTING\_AND\_PAYMENT\_RECONCILIATION\_TO\_COMPLETED\_PAID\_SERVICE",

"customer\_type": "residential\_customer",

"service\_type": "multi\_pest\_or\_cockroach\_treatment",

"scope": "apartment\_or\_home",

"main\_friction": "multi\_pest\_scope\_and\_payment\_reconciliation",

"trust\_signal": "",

"price\_issue": "partial\_payment\_reconciliation",

"access\_issue": "",

"expectation\_gap": "delayed\_emergence\_explanation",

"outcome\_type": "hard\_commercial\_outcome",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_visible": true,

"pipeline\_detected": "false",

"negative\_or\_deferred\_reason": "",

"pattern\_id": "MULTI\_PEST\_SCOPE\_AND\_PAYMENT\_RECONCILIATION\_PATTERN\_001",

"notes": "Multi-pest scope clarification and partial payment reconciliation."

}

]



OUTCOME\_SEED\_DATA:

\[

{

"outcome\_id": "PEST\_OUTCOME\_001A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_001",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "service\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary",

"confidence": "high\_internal",

"not\_claimed": "referral\_shared\_not\_counted\_as\_converted\_referral",

"notes": "Completed service path with payment/admin/satisfaction/referral propagation."

},

{

"outcome\_id": "PEST\_OUTCOME\_004A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_004",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "rodent\_captured,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Mouse was caught, confirmed by operator."

},

{

"outcome\_id": "PEST\_OUTCOME\_005A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_005",

"outcome\_type": "hard\_operational\_outcome",

"outcome\_events": "service\_completed,invoice\_issued,payment\_requested",

"service\_completed": true,

"payment\_received": false,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary",

"confidence": "medium\_internal",

"not\_claimed": "payment\_received\_not\_claimed",

"notes": "Service completed. Payment received only if separately confirmed."

},

{

"outcome\_id": "PEST\_OUTCOME\_006A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_006",

"outcome\_type": "negative\_deferred\_outcome",

"outcome\_events": "appointment\_confirmed,customer\_cancelled\_after\_confirmation,relationship\_preserved",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary",

"confidence": "medium\_internal",

"not\_claimed": "not\_sales\_failure",

"notes": "Cancellation due to external constraint, not sales failure."

},

{

"outcome\_id": "PEST\_OUTCOME\_007A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_007",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "appointment\_closed,service\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Household reentry constraint handled."

},

{

"outcome\_id": "PEST\_OUTCOME\_008A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_008",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "private\_apartment\_service\_completed,building\_common\_area\_service\_completed,combined\_scope\_job\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Combined-scope job."

},

{

"outcome\_id": "PEST\_OUTCOME\_009A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_009",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "repeat\_customer\_reactivated,preparation\_instructions\_given,access\_resolved,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Pre-move repeat customer."

},

{

"outcome\_id": "PEST\_OUTCOME\_010A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_010",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "repeat\_customer\_reactivated,private\_apartment\_service\_completed,building\_common\_area\_service\_completed,combined\_scope\_job\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Repeated private plus building combo evidence."

},

{

"outcome\_id": "PEST\_OUTCOME\_011A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_011",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "repeat\_customer\_reactivated,institutional\_site\_service\_completed,private\_home\_service\_completed,multi\_site\_expansion\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "institution\_name\_and\_minor\_context\_must\_be\_redacted",

"notes": "Kindergarten plus private home. Strict redaction required."

},

{

"outcome\_id": "PEST\_OUTCOME\_012A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_012",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "family\_proxy\_booking\_confirmed,appointment\_scheduled,preparation\_instructions\_given,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "family\_relation\_identifiers\_must\_be\_redacted",

"notes": "Proxy booking succeeded."

},

{

"outcome\_id": "PEST\_OUTCOME\_013A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_013",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "visual\_pest\_evidence\_received,reinforcement\_visit\_scheduled,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "private\_visuals\_not\_allowed\_for\_public\_use",

"notes": "Photo evidence led to paid reinforcement."

},

{

"outcome\_id": "PEST\_OUTCOME\_014A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_014",

"outcome\_type": "negative\_deferred\_outcome",

"outcome\_events": "customer\_chose\_diy\_traps,job\_not\_closed,conditional\_future\_interest",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary",

"confidence": "medium\_internal",

"not\_claimed": "not\_revenue\_not\_closed",

"notes": "Deferred, not lost."

},

{

"outcome\_id": "PEST\_OUTCOME\_015A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_015",

"outcome\_type": "hard\_commercial\_outcome\_with\_expectation\_gap",

"outcome\_events": "service\_completed,payment\_received,post\_treatment\_customer\_concern\_detected,delayed\_kill\_expectation\_gap\_detected",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "expectation\_gap\_not\_treatment\_failure\_claim",

"notes": "Delayed emergence/contact expectation gap."

},

{

"outcome\_id": "PEST\_OUTCOME\_016A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_016",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "operator\_field\_evidence\_captured,environmental\_source\_identified,customer\_informed\_remotely,service\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "private\_property\_visuals\_not\_allowed\_for\_public\_use",

"notes": "Operator captured field evidence while customer absent and informed customer remotely."

},

{

"outcome\_id": "PEST\_OUTCOME\_017A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_017",

"outcome\_type": "negative\_deferred\_outcome",

"outcome\_events": "family\_proxy\_booking\_attempted,appointment\_confirmed,recipient\_resistance\_detected,customer\_cancelled\_before\_service,reschedule\_possible",

"service\_completed": false,

"payment\_received": false,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary",

"confidence": "medium\_internal",

"not\_claimed": "not\_revenue\_not\_closed",

"notes": "Proxy wanted service, recipient resisted."

},

{

"outcome\_id": "PEST\_OUTCOME\_018A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_018",

"outcome\_type": "hard\_commercial\_outcome\_plus\_pipeline",

"outcome\_events": "primary\_apartment\_service\_closed,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "additional\_family\_apartments\_not\_counted\_as\_outcome",

"notes": "Primary job closed. Additional family apartments pending, not outcome."

},

{

"outcome\_id": "PEST\_OUTCOME\_019A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_019",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "remote\_access\_resolved,trust\_backed\_remote\_access\_granted,service\_completed,payment\_received,post\_treatment\_instructions\_given",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "access\_details\_must\_be\_redacted",

"notes": "Remote access without customer present is trust signal."

},

{

"outcome\_id": "PEST\_OUTCOME\_020A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_020",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "urgent\_request\_received,capacity\_constraint\_disclosed,appointment\_scheduled,appointment\_reconfirmed,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "No immediate availability but deal recovered."

},

{

"outcome\_id": "PEST\_OUTCOME\_021A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_021",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "repeat\_customer\_reactivated,larger\_property\_scope\_detected,scope\_based\_repricing\_explained,service\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "pricing\_automation\_not\_allowed",

"notes": "Prior price anchor handled through scope explanation."

},

{

"outcome\_id": "PEST\_OUTCOME\_022A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_022",

"outcome\_type": "hard\_commercial\_outcome\_plus\_pipeline",

"outcome\_events": "apartment\_service\_scheduled,capacity\_constraint\_handled,service\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "building\_committee\_referral\_not\_counted\_as\_outcome",

"notes": "Apartment job completed and paid. Building committee referral pending, not outcome."

},

{

"outcome\_id": "PEST\_OUTCOME\_023A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_023",

"outcome\_type": "hard\_commercial\_outcome\_plus\_review\_pipeline",

"outcome\_events": "seasonal\_pest\_request\_received,appointment\_scheduled,reschedule\_handled,service\_completed,payment\_received,review\_request\_sent",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "review\_request\_sent\_not\_review\_received",

"notes": "Review request sent, review not confirmed."

},

{

"outcome\_id": "PEST\_OUTCOME\_024A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_024",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "flea\_treatment\_requested,private\_apartment\_service\_completed,building\_common\_area\_service\_completed,combined\_scope\_job\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Private plus building combo, flea context."

},

{

"outcome\_id": "PEST\_OUTCOME\_025A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_025",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "appointment\_scheduled,capacity\_constraint\_handled,alternative\_appointment\_offered,original\_appointment\_preserved,service\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "none",

"notes": "Earlier slot offered, original appointment preserved."

},

{

"outcome\_id": "PEST\_OUTCOME\_026A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_026",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "trust\_backed\_remote\_access\_granted,video\_access\_instructions\_received,access\_code\_received,service\_completed,key\_returned,alarm\_reactivated,invoice\_or\_receipt\_issued,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "access\_code\_key\_alarm\_details\_must\_be\_redacted",

"notes": "Very strong trust-backed access evidence."

},

{

"outcome\_id": "PEST\_OUTCOME\_027A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_027",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "repeat\_customer\_reactivated,appointment\_requested,appointment\_scheduled,address\_confirmed,service\_completed,payment\_received",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": false,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "address\_must\_be\_redacted",

"notes": "Clean repeat customer scheduling baseline."

},

{

"outcome\_id": "PEST\_OUTCOME\_028A",

"linked\_evidence\_id": "PEST\_EVIDENCE\_028",

"outcome\_type": "hard\_commercial\_outcome",

"outcome\_events": "urgent\_multi\_pest\_request\_received,scope\_clarification\_completed,delayed\_emergence\_explanation\_given,service\_completed,partial\_payment\_received,payment\_reconciliation\_completed,payment\_received,invoice\_or\_receipt\_issued",

"service\_completed": true,

"payment\_received": true,

"invoice\_or\_receipt\_issued": true,

"source": "manual\_reviewed\_seed\_summary\_operator\_confirmed",

"confidence": "high\_internal",

"not\_claimed": "do\_not\_generalize\_pricing\_or\_treatment\_recommendations",

"notes": "Multi-pest scope clarification and partial payment reconciliation."

}

]



OPPORTUNITY\_SEED\_DATA:

\[

{

"opportunity\_id": "PEST\_OPPORTUNITY\_018B",

"linked\_evidence\_id": "PEST\_EVIDENCE\_018",

"opportunity\_type": "additional\_family\_apartments",

"status": "pending\_not\_closed",

"events": "additional\_units\_mentioned,family\_network\_expansion\_possible,follow\_up\_required",

"follow\_up\_required": true,

"not\_counted\_as\_outcome": true,

"notes": "Additional apartments are not outcome until closed, performed and paid."

},

{

"opportunity\_id": "PEST\_OPPORTUNITY\_022B",

"linked\_evidence\_id": "PEST\_EVIDENCE\_022",

"opportunity\_type": "building\_committee\_referral",

"status": "pending\_not\_closed",

"events": "building\_committee\_referral\_requested,seasonal\_building\_timing\_detected,follow\_up\_required",

"follow\_up\_required": true,

"not\_counted\_as\_outcome": true,

"notes": "Building committee referral is pipeline, not revenue."

}

]



README.md MUST INCLUDE:



\* batch name: PEST\_CONTROL\_WHATSAPP\_EVIDENCE\_BATCH\_001

\* internal-only status

\* evidence count

\* outcome count

\* opportunity count

\* blocked uses

\* privacy/redaction rules

\* next allowed task after PASS



MANDATORY REDACTION RULES TO INCLUDE IN README.md:

Redact names, phone numbers, addresses, apartment numbers, building identifiers, committee contacts, family relationships when identifying, children/minor context, kindergarten/institution names, access codes, key locations, alarm details, bank details, payment screenshots, Bit/PayBox details, invoice/receipt links, invoice/receipt numbers, photos/videos revealing property, and voice notes unless transcribed and redacted.



VALIDATION RULES:



1\. evidence\_registry.csv must contain exactly 28 evidence rows.

2\. outcome\_registry.csv must contain exactly 26 outcome rows.

3\. opportunity\_registry.csv must contain exactly 2 opportunity rows.

4\. opportunity\_registry.csv must contain pipeline opportunities separately from outcomes.

5\. No pipeline item may be counted as payment\_received.

6\. asset\_generation\_allowed must be false for every evidence row.

7\. redaction\_required must be true for every evidence row.

8\. Every outcome\_id must have linked\_evidence\_id.

9\. Every payment\_received=true outcome must have source.

10\. review\_request\_sent must not be counted as review\_received.

11\. referral\_shared must not be counted as converted referral.

12\. invoice\_or\_receipt\_visible must not be used as payment\_received unless payment\_received is explicitly true.

13\. validation\_report.md must return PASS only if all checks pass.



VALIDATION\_REPORT.md FORMAT:



\# PEST\_CONTROL\_EVIDENCE\_REGISTRY\_BUILD\_001 Validation Report



\## Summary



validation\_result: PASS | HOLD

evidence\_count:

outcome\_count:

opportunity\_count:



\## Checks



\* evidence\_count\_equals\_28: PASS | FAIL

\* outcome\_count\_equals\_26: PASS | FAIL

\* opportunity\_count\_equals\_2: PASS | FAIL

\* opportunities\_separated\_from\_outcomes: PASS | FAIL

\* no\_pipeline\_counted\_as\_payment: PASS | FAIL

\* all\_evidence\_rows\_redaction\_required\_true: PASS | FAIL

\* all\_evidence\_rows\_asset\_generation\_allowed\_false: PASS | FAIL

\* all\_outcomes\_have\_linked\_evidence\_id: PASS | FAIL

\* all\_payment\_received\_true\_outcomes\_have\_source: PASS | FAIL

\* review\_request\_not\_counted\_as\_review\_received: PASS | FAIL

\* referral\_not\_counted\_as\_converted\_referral: PASS | FAIL

\* no\_forbidden\_files\_changed: PASS | FAIL



\## Validation Errors



List errors. If none, write: none.



\## Blocked Items Confirmed



Confirm:



\* no source code changes

\* no app changes

\* no UI changes

\* no automation files

\* no CRM files

\* no funnel files

\* no public assets

\* no marketing assets

\* no canon mutation

\* no architecture changes

\* no public-facing claims



\## Next Allowed Task



ORCH\_TO\_CODEX\_PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002



COMPLETION CONDITION:

The task is complete only when:



\* all 5 allowed files exist

\* evidence count equals 28

\* outcome count equals 26

\* opportunity count equals 2

\* opportunities are separated from outcomes

\* validation\_report.md returns PASS

\* no forbidden action occurred



STOP CONDITIONS:

Stop and return HOLD if:



\* any evidence\_id is missing

\* any outcome lacks linked\_evidence\_id

\* pipeline is counted as outcome

\* review\_request\_sent is counted as review\_received

\* referral\_shared is counted as converted referral

\* any public-facing copy is created

\* any marketing asset is generated

\* any automation or CRM flow is created

\* any canon or architecture change is attempted

\* any file outside the allowed file list is modified



FINAL CODEX REPORT SCHEMA:

Return this final report after completing or stopping:



{

"task\_id": "PEST\_CONTROL\_EVIDENCE\_REGISTRY\_BUILD\_001",

"created\_files": \[],

"evidence\_count": 0,

"outcome\_count": 0,

"opportunity\_count": 0,

"validation\_result": "PASS | HOLD",

"validation\_errors": \[],

"blocked\_items\_confirmed": \[

"no\_source\_code\_changes",

"no\_app\_changes",

"no\_ui\_changes",

"no\_automation\_files",

"no\_crm\_files",

"no\_funnel\_files",

"no\_public\_assets",

"no\_marketing\_assets",

"no\_canon\_mutation",

"no\_architecture\_changes",

"no\_public\_facing\_claims"

],

"next\_allowed\_task": "ORCH\_TO\_CODEX\_PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002"

}



EXPECTED RESULT:

PASS if registry files are created correctly and validation passes.



NEXT\_ALLOWED\_TASK\_AFTER\_PASS:

ORCH\_TO\_CODEX\_PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002



