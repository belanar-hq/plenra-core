# R1 — Personalization, inference, adaptation

Status: **PARTIALLY_RESOLVED_MATERIAL_UNKNOWN_REMAINS**

The original sources describe a transformation-only clinical flow and separate inference/adaptation proposals. They do not establish one governing permission boundary across those scopes. No complete Emotional Map, Mechanism Map, CBT/ACT selection contract, or feedback-to-next-action policy was recovered.

## Original evidence

**E01 — October Session2Printable contract.** Original conversation excerpt, assistant-proposed schema, [source](https://chatgpt.com/c/68e3ae01-bc50-8333-8a73-2a15bd2bd64f), message `33418511-13d1-4b8e-a0eb-4052aaf0894a`. Previously preserved in [PASS2-S06](../deep-source-recovery/PASS2-S06-session-contract-and-guards.txt); re-inspected live in this pass.

Input fields include `therapy_type: CBT`, `goals`, `summary_free_text`, `homework_prev_status`, and `constraints`. Parser normalizes raw text to JSON; the pipeline routes by `therapy_type`. Example output includes insights, practice tasks, and anxiety 0–10 before/after plus completion checkboxes. These are example inputs/outputs, not evidence that the model may autonomously select CBT over ACT.

**E02 — Adjacent October guardrails.** Same original conversation and preserved file; re-inspected live.

> AI לא מפרש, רק ממיר:

> המודל לא קובע אבחנה או המלצה טיפולית, אלא מתמצת תכנים קיימים לדף תרגול.

Translation: AI does not interpret, only converts; it does not determine a diagnosis or therapeutic recommendation, but summarizes existing content into a practice sheet. The response also proposes filtering medical recommendations and risky behaviors, including strong exposure or stopping medication.

**E03 — Setup and feedback loop.** User-pasted setup text in [Central Agent 2](https://chatgpt.com/c/690f3792-4b68-832c-b5bd-6ff8f8c874c5), inspected near message `356d85be-611d-4797-a8af-6901b5a3b433`; [preserved excerpt](../deep-source-recovery/PASS2-S08-setup-and-feedback-loop.txt). PARTIAL_ORIGINAL_CONVERSATION, not recovered DOCX bytes.

> המערכת מבינה את הדפוס שמסתתר מאחורי המילים

Translation: the system understands the pattern behind the words. The example maps a coach's account of overload and lack of accomplishment to a “Moments of Clarity” printable.

> Plenra קוראת את התשובות ומזהה שינוי: אם למשל דנה כתבה “הצלחתי סוף סוף להרגיע את עצמי בלילה” – המערכת מזהה התקדמות, ומתאימה לה Printable חדש להמשך הדרך, כמו “Keep Your Calm Routine”.

Translation: the system reads returned answers, detects progress from a report of calming oneself at night, and adapts the next printable. Another example says it proposes “Week of Calm Progress” to the coach. These are qualitative illustrations, not thresholds or an exhaustive selection policy.

**E05 — Compassion module core prompt.** [Central Agent 3](https://chatgpt.com/c/692ca2ec-9510-832b-a3f5-429a3e75d9aa), selected original conversation inspected live; [previous prompt capture](../deep-source-recovery/PASS2-S10-quality-and-compassion-prompt.txt).

> Transform any description of someone's distress into:

The prompt lists a personalized therapeutic printable, a POD gift concept, sender/recipient messages, and distribution strategy. Its rules include:

> Never use diagnosing language.

> Use Plenra Emotional Map + Mechanism Map.

> Always include a micro-action plan.

Its schema proposes emotion category, secondary emotion, urgent need, regulation style, and risk level. It references maps but does not supply their definitions or selection rules.

**E06 — Adjacent Compassion proposal, newly inspected.** Same Central Agent 3 conversation. The assistant proposes seven signals for a Predictive Support Engine: relationship, age, emotional state, intensity, response pattern, crisis frequency, and needed support. Age-based gift examples concern POD selection; they are not CBT/ACT intervention rules. See R2 for sender-supplied recipient profiling and R4 for the proposed timed upsell.

## Recovered chain and limits

| Stage | Evidence recovered | Missing governing rule |
|---|---|---|
| Input | Therapist summary, goals, stated therapy type, previous homework, constraints; coach summary; sender distress description | Permitted input/inference boundaries by scope |
| Interpretation | E02 conversion-only; E03 hidden-pattern inference; E05 emotion-analysis schema | Which scope may infer what; relation to clinical restriction |
| Selection | Route by supplied therapy type; named illustrative printables; referenced maps | Map contents, CBT/ACT decision criteria, exclusion rules |
| Output | Practice sheet, micro-actions, tracking; Compassion gift/message proposals | Scope-specific allowable intervention |
| Feedback | Returned worksheet, completion and anxiety scales, qualitative self-report | Validated progress indicators and sufficient evidence |
| Next action | Example adapted printable or suggestion to coach | Deterministic adaptation rules and release/reapproval authority |

D01's Therapeutic Logic Engine synopsis claims protocol identification and future next-printable continuity. It is DERIVED_SUMMARY, not an executable or adopted selection contract. REF01's Emotion Response Mechanism inventory describes a partial concept requiring a formal specification; the underlying original was not recovered.

## Remaining unknown — FUTURE_PRODUCT_DECISION_REQUIRED (FD-R1)

Define allowed inference versus restatement per clinical, coaching, and Compassion scope; establish map and CBT/ACT selection rules; specify progress signals, adaptation limits, and next-action authority. The apparent transformation/inference tension remains unresolved. Different scopes could explain it, but no historical scope or supersession decision was found.

Stop basis: original October guards, setup loop and Compassion prompt inspected; targeted map/loop searches and the named bridge reference produced no additional governing contract. This is bounded absence, not proof that no decision ever existed.

