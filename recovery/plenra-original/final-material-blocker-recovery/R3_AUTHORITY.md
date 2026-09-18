# R3 — Recipient delivery and human approval

Status: **PARTIALLY_RESOLVED_MATERIAL_UNKNOWN_REMAINS**

The October original explicitly requires therapist approval before sending a printable to a patient. Later setup text describes automatic delivery to a coach or coachee. It does not explicitly establish a coaching exemption or adapted-follow-up approval rule.

## Original evidence

**E02 — Clinical recipient release**, [October conversation](https://chatgpt.com/c/68e3ae01-bc50-8333-8a73-2a15bd2bd64f), [original preserved text](../deep-source-recovery/PASS2-S06-session-contract-and-guards.txt), live re-inspected.

> שום Printable לא נשלח למטופל אוטומטית ללא “Approve” של המטפל.

Translation: no printable is automatically sent to the patient without the therapist's Approve.

> כל דף נשמר עם חותמת מי אישר ומתי.

Translation: each sheet is saved with a stamp showing who approved it and when.

This is the strongest recovered direct statement of human recipient-release authority. It also proposes therapist editing, approval and deletion control. It does not specify an immutable approval version, invalidation after editing, or an exception for adapted follow-ups.

**E01 — Email delivery opt-in**, same source:

> Opt-in מפורש לשליחת תרגול במייל.

Explicit opt-in for sending practice by email is a distinct condition from therapist content/release approval. The proposed Gmail/Scheduler pipeline does not itself negate the adjacent approval guard.

**E03 — Automatic coaching delivery and return**, [Central Agent 2](https://chatgpt.com/c/690f3792-4b68-832c-b5bd-6ff8f8c874c5), [partial original setup](../deep-source-recovery/PASS2-S08-setup-and-feedback-loop.txt), live re-inspected.

> המערכת שולחת את ה־Printable אוטומטית למאמן, או ישירות למתאמן במייל.

Translation: the system automatically sends the printable to the coach or directly to the coachee by email. Send Back returns the completed file to the coach's Drive or Plenra portal. Subsequent answers can produce an adapted printable; another example proposes a new printable to the coach.

Automatic delivery could occur after an approval gate, or could describe a distinct coaching scope. Neither interpretation is historically established by this text. Sending to a coach is also distinct from release to the recipient.

**E04 — Blueprint production approval**, original Central Agent 2 response, live re-inspected:

> עבור כל Printable Blueprint שהמנוע מחזיר במצב "approved by Central Agent", הפוך אותו ל JSON Template רשמי, חבר לטמפלט Slides הרלוונטי והעבר למודול ההפקה.

Translation: convert each blueprint marked approved by Central Agent into an official JSON template, connect it to Slides and pass it to production. This approves a blueprint for production. It does **not** state therapist approval to release a specific person's printable. No evidence equates these authorities.

## Recovered distinctions

| Authority | What the source supports | What it does not settle |
|---|---|---|
| Central Agent blueprint approval | Template/production handoff | Human recipient release |
| Therapist Approve | Required before patient delivery in October proposal | Coaching exemption; follow-up rules |
| Email opt-in | Consent to email practice | Substitution for therapist approval |
| Per-sheet approver/time stamp | Attribution and timing | Version binding or change invalidation |
| Send Back | Returned recipient content | Approval to release a new adapted tool |

## Remaining unknown — FUTURE_PRODUCT_DECISION_REQUIRED (FD-R3)

Define human release authority per clinical/coaching/Compassion scope, including initial delivery and every adapted follow-up. Specify approval-version binding, reapproval triggers, withdrawal and the relationship between blueprint approval and individual release.

The literal “no printable” guard points toward clinical follow-ups being covered, but the system's historical adaptation/version policy is not separately specified. Do not narrow that guard or invent a coaching exemption.

Stop basis: the highest direct release statement, setup automatic-delivery language and blueprint approval statement were inspected. Additional generalized automatic-production descriptions do not supply the missing authority boundary. The earlier approval/automatic-delivery conflict remains unresolved in scope; no same-scope supersession is asserted.

