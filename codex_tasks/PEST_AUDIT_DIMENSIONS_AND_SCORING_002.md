TASK\_ID:

ORCH\_TO\_CODEX\_PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002



CODEX TASK NAME:

PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002



ROLE:

You are Codex operating under Plenra Orchestrator constraints.



OBJECTIVE:

Create an internal-only pest-control audit dimensions and scoring package based on the existing validated registry files from:



data/pest\_control/evidence\_batch\_001/



This is a bounded data-structuring and scoring-definition task only.



You must not infer new outcomes.

You must not analyze screenshots.

You must not inspect private WhatsApp images.

You must not generate marketing copy.

You must not create WhatsApp outreach.

You must not create ads.

You must not create automation.

You must not create CRM or funnel assets.

You must not update canon.

You must not create public-facing claims.



CURRENT VERIFIED INPUTS:

The previous task PEST\_CONTROL\_EVIDENCE\_REGISTRY\_BUILD\_001 completed with:



\* evidence\_count: 28

\* outcome\_count: 26

\* opportunity\_count: 2

\* validation\_result: PASS



SOURCE FILES TO READ:



1\. data/pest\_control/evidence\_batch\_001/evidence\_registry.csv

2\. data/pest\_control/evidence\_batch\_001/outcome\_registry.csv

3\. data/pest\_control/evidence\_batch\_001/opportunity\_registry.csv

4\. data/pest\_control/evidence\_batch\_001/README.md

5\. data/pest\_control/evidence\_batch\_001/validation\_report.md



TARGET DIRECTORY:

data/pest\_control/evidence\_batch\_001/scoring/



ALLOWED FILES ONLY:



1\. data/pest\_control/evidence\_batch\_001/scoring/audit\_dimensions\_v1.csv

2\. data/pest\_control/evidence\_batch\_001/scoring/success\_vs\_stuck\_matrix\_v1.csv

3\. data/pest\_control/evidence\_batch\_001/scoring/evidence\_scoring\_guide\_v1.md

4\. data/pest\_control/evidence\_batch\_001/scoring/sample\_scored\_records\_v1.csv

5\. data/pest\_control/evidence\_batch\_001/scoring/validation\_report.md



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

\* no changes to existing registry files from task 001

\* no generated customer-facing material



GLOBAL RULES:



\* All outputs are internal-only candidate artifacts.

\* Do not change evidence\_registry.csv.

\* Do not change outcome\_registry.csv.

\* Do not change opportunity\_registry.csv.

\* Do not count pipeline as outcome.

\* Do not count review\_request\_sent as review\_received.

\* Do not count referral\_shared as converted referral.

\* Do not treat invoice\_or\_receipt\_visible as payment\_received unless payment\_received is explicitly true in the registry.

\* Do not infer new outcomes from notes.

\* Do not create customer-facing copy.

\* Do not create recommendations for customers.

\* Do not create marketing, ads, outreach, funnel or automation assets.

\* Every scoring artifact must preserve privacy and redaction requirements.

\* Any record with private property, access, payment, family, institution or minor context must be marked as strict\_redaction\_required.



PURPOSE OF THIS TASK:

Create internal scoring definitions that allow Plenra to score the next 5 new WhatsApp conversations manually.



This task does not score future conversations.

This task only creates the scoring artifacts and a small sample scoring based on existing records.



REQUIRED FILE 1:

audit\_dimensions\_v1.csv



COLUMNS:

dimension\_id

dimension\_name

definition

success\_signal

stuck\_signal

deferred\_signal

pipeline\_signal

recommended\_manual\_check

privacy\_risk

allowed\_use

blocked\_use



REQUIRED DIMENSIONS:



1\. intent\_clarity

2\. scheduling\_clarity

3\. reschedule\_recovery

4\. household\_safety\_and\_reentry\_coordination

5\. post\_treatment\_expectation\_setting

6\. delayed\_emergence\_and\_delayed\_contact\_explanation

7\. preparation\_instructions

8\. access\_coordination

9\. trust\_backed\_remote\_access\_coordination

10\. proxy\_booking\_coordination

11\. recipient\_buy\_in\_for\_proxy\_booking

12\. repeat\_customer\_reactivation

13\. pre\_move\_timing

14\. scope\_expansion\_detection

15\. private\_plus\_building\_combo\_detection

16\. building\_common\_area\_opportunity

17\. multi\_site\_account\_expansion

18\. family\_network\_pipeline\_detection

19\. building\_committee\_referral\_pipeline

20\. visual\_evidence\_to\_next\_step

21\. operator\_field\_evidence\_and\_remote\_explanation

22\. environmental\_source\_identification

23\. rodent\_uncertainty\_and\_follow\_up\_closure

24\. DIY\_deferral\_detection

25\. capacity\_constraint\_and\_alternative\_scheduling

26\. appointment\_stability\_and\_alternative\_slot\_handling

27\. repeat\_customer\_scope\_repricing

28\. multi\_pest\_scope\_clarification

29\. payment\_reconciliation\_after\_partial\_transfer

30\. invoice\_or\_receipt\_closure

31\. post\_service\_review\_request\_pipeline

32\. referral\_propagation\_detection

33\. outcome\_vs\_pipeline\_separation



REQUIRED FILE 2:

success\_vs\_stuck\_matrix\_v1.csv



COLUMNS:

matrix\_id

diagnostic\_axis

success\_signal

stuck\_signal

deferred\_signal

pipeline\_signal

evidence\_examples

recommended\_manual\_check

outcome\_counting\_rule

allowed\_use

blocked\_use



REQUIRED MATRIX ROWS:



1\. completed\_paid\_service

2\. recovered\_reschedule

3\. building\_expansion

4\. trust\_backed\_access

5\. rodent\_uncertainty\_resolved

6\. delayed\_emergence\_expectation\_gap

7\. proxy\_booking\_success

8\. proxy\_booking\_failure

9\. DIY\_deferral

10\. customer\_cancellation

11\. coordination\_stuck\_risk

12\. pending\_pipeline



EVIDENCE EXAMPLE GUIDANCE:

Use only existing evidence IDs from evidence\_registry.csv.



Suggested mappings:



\* completed\_paid\_service: PEST\_EVIDENCE\_001, PEST\_EVIDENCE\_023, PEST\_EVIDENCE\_028

\* recovered\_reschedule: PEST\_EVIDENCE\_002, PEST\_EVIDENCE\_003, PEST\_EVIDENCE\_007, PEST\_EVIDENCE\_020, PEST\_EVIDENCE\_025

\* building\_expansion: PEST\_EVIDENCE\_008, PEST\_EVIDENCE\_010, PEST\_EVIDENCE\_022, PEST\_EVIDENCE\_024

\* trust\_backed\_access: PEST\_EVIDENCE\_019, PEST\_EVIDENCE\_026

\* rodent\_uncertainty\_resolved: PEST\_EVIDENCE\_004, PEST\_EVIDENCE\_014

\* delayed\_emergence\_expectation\_gap: PEST\_EVIDENCE\_015, PEST\_EVIDENCE\_028

\* proxy\_booking\_success: PEST\_EVIDENCE\_012

\* proxy\_booking\_failure: PEST\_EVIDENCE\_017

\* DIY\_deferral: PEST\_EVIDENCE\_014

\* customer\_cancellation: PEST\_EVIDENCE\_006

\* coordination\_stuck\_risk: PEST\_EVIDENCE\_003

\* pending\_pipeline: PEST\_EVIDENCE\_018, PEST\_EVIDENCE\_022, PEST\_EVIDENCE\_023



REQUIRED FILE 3:

evidence\_scoring\_guide\_v1.md



MUST INCLUDE:



\* Internal-only status

\* Purpose

\* How to use this guide manually

\* Scoring scale

\* Outcome vs pipeline rules

\* Evidence quality rules

\* Privacy and redaction rules

\* How to score the next 5 new WhatsApp conversations

\* What not to do



SCORING SCALE:

Use 0 / 1 / 2 / 3 only.



0 = not present

1 = weak or unclear signal

2 = present but incomplete

3 = strong clear signal



REQUIRED MANUAL SCORING FIELDS FOR NEXT 5 RECORDS:

record\_id

source\_conversation\_id

review\_owner

review\_date

intent\_clarity\_score

scheduling\_clarity\_score

reschedule\_recovery\_score

expectation\_setting\_score

access\_coordination\_score

scope\_expansion\_score

visual\_evidence\_score

payment\_closure\_score

outcome\_vs\_pipeline\_score

evidence\_quality\_score

privacy\_risk\_level

outcome\_class

outcome\_event

stuck\_risk\_signal

pipeline\_detected

recommended\_manual\_next\_action

confidence

notes



OUTCOME CLASS OPTIONS:

hard\_commercial\_outcome

hard\_operational\_outcome

admin\_outcome

trust\_outcome

negative\_deferred\_outcome

stuck\_risk\_signal

pipeline\_opportunity

review\_pipeline

referral\_pipeline

unresolved\_or\_unknown



CONFIDENCE OPTIONS:

low

medium

high\_internal



HIGH CONFIDENCE RULE:

Use high\_internal only when the existing registry explicitly supports service\_completed, payment\_received, or operator-confirmed operational outcome.

Do not use high\_internal for pipeline-only, review-request-only, referral-only, or unresolved cases.



REQUIRED FILE 4:

sample\_scored\_records\_v1.csv



Purpose:

Create sample internal scoring rows for exactly 5 existing evidence records to demonstrate scoring.



Use these exact evidence IDs:



1\. PEST\_EVIDENCE\_004

2\. PEST\_EVIDENCE\_014

3\. PEST\_EVIDENCE\_018

4\. PEST\_EVIDENCE\_022

5\. PEST\_EVIDENCE\_028



COLUMNS:

evidence\_id

classification

intent\_clarity\_score

scheduling\_clarity\_score

reschedule\_recovery\_score

expectation\_setting\_score

access\_coordination\_score

scope\_expansion\_score

visual\_evidence\_score

payment\_closure\_score

outcome\_vs\_pipeline\_score

evidence\_quality\_score

privacy\_risk\_level

outcome\_class

outcome\_event

stuck\_risk\_signal

pipeline\_detected

recommended\_manual\_next\_action

confidence

notes



SCORING GUIDANCE FOR SAMPLE RECORDS:



\* PEST\_EVIDENCE\_004: rodent uncertainty resolved, hard commercial outcome, visual evidence and confirmed capture.

\* PEST\_EVIDENCE\_014: DIY deferral, negative/deferred outcome, not closed, future interest conditional.

\* PEST\_EVIDENCE\_018: primary job is closed and paid, additional family apartments are pipeline only.

\* PEST\_EVIDENCE\_022: apartment job completed and paid, building committee referral is pipeline only.

\* PEST\_EVIDENCE\_028: multi-pest scope clarified, delayed emergence expectation, payment reconciliation completed.



Do not invent information beyond the registry rows.

For unknown dimensions, use 0 or 1 and explain in notes.



REQUIRED FILE 5:

validation\_report.md



MUST INCLUDE:



\# PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002 Validation Report



\## Summary



validation\_result: PASS | HOLD

audit\_dimensions\_count:

matrix\_rows\_count:

sample\_scored\_records\_count:

source\_registry\_checked: true | false



\## Checks



\* source\_registry\_exists: PASS | FAIL

\* source\_registry\_validation\_passed: PASS | FAIL

\* audit\_dimensions\_count\_equals\_33: PASS | FAIL

\* matrix\_rows\_count\_equals\_12: PASS | FAIL

\* sample\_scored\_records\_count\_equals\_5: PASS | FAIL

\* sample\_records\_use\_only\_allowed\_evidence\_ids: PASS | FAIL

\* no\_pipeline\_counted\_as\_outcome: PASS | FAIL

\* no\_review\_request\_counted\_as\_review\_received: PASS | FAIL

\* no\_referral\_counted\_as\_converted\_referral: PASS | FAIL

\* no\_existing\_registry\_files\_modified: PASS | FAIL

\* no\_forbidden\_files\_changed: PASS | FAIL

\* no\_customer\_facing\_copy\_created: PASS | FAIL

\* privacy\_rules\_preserved: PASS | FAIL



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

\* no customer-facing copy



\## Next Allowed Manual Action



Use audit\_dimensions\_v1.csv and success\_vs\_stuck\_matrix\_v1.csv to score the next 5 new WhatsApp conversations manually.



VALIDATION RULES:



1\. audit\_dimensions\_v1.csv must contain exactly 33 rows.

2\. success\_vs\_stuck\_matrix\_v1.csv must contain exactly 12 rows.

3\. sample\_scored\_records\_v1.csv must contain exactly 5 rows.

4\. Sample records must use exactly:



&#x20;  \* PEST\_EVIDENCE\_004

&#x20;  \* PEST\_EVIDENCE\_014

&#x20;  \* PEST\_EVIDENCE\_018

&#x20;  \* PEST\_EVIDENCE\_022

&#x20;  \* PEST\_EVIDENCE\_028

5\. No pipeline item may be counted as outcome.

6\. No review\_request\_sent may be counted as review\_received.

7\. No referral\_shared may be counted as converted referral.

8\. Existing registry files from task 001 must not be modified.

9\. No public-facing copy may be created.

10\. validation\_report.md must return PASS only if all checks pass.



STOP CONDITIONS:

Stop and return HOLD if:



\* source registry files are missing

\* previous validation\_report.md does not show PASS

\* any target count fails

\* any sample evidence ID is missing from evidence\_registry.csv

\* pipeline is counted as outcome

\* any existing registry file is modified

\* any public-facing copy is created

\* any marketing asset is generated

\* any automation or CRM flow is created

\* any canon or architecture change is attempted

\* any file outside the allowed file list is modified



COMPLETION CONDITION:

The task is complete only when:



\* all 5 allowed scoring files exist

\* audit\_dimensions\_count equals 33

\* matrix\_rows\_count equals 12

\* sample\_scored\_records\_count equals 5

\* source registry was checked

\* previous validation passed

\* validation\_report.md returns PASS

\* no forbidden action occurred



FINAL CODEX REPORT SCHEMA:

Return this final report after completing or stopping:



{

"task\_id": "PEST\_AUDIT\_DIMENSIONS\_AND\_SCORING\_002",

"created\_files": \[],

"audit\_dimensions\_count": 0,

"matrix\_rows\_count": 0,

"sample\_scored\_records\_count": 0,

"source\_registry\_checked": false,

"previous\_registry\_validation\_result": "PASS | HOLD | UNKNOWN",

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

"no\_public\_facing\_claims",

"no\_customer\_facing\_copy"

],

"next\_allowed\_manual\_action": "Use audit\_dimensions\_v1.csv and success\_vs\_stuck\_matrix\_v1.csv to score the next 5 new WhatsApp conversations manually."

}



EXPECTED RESULT:

PASS if all scoring files are created correctly and validation passes.



