# R2 — Data, privacy, continuity

Status: **PARTIALLY_RESOLVED_MATERIAL_UNKNOWN_REMAINS**

An original clinical proposal permits free-text input and specifies parser-stage masking. A later derived summary says anonymous data only and no free text. The sources do not establish their respective boundaries or a supersession decision.

## Original evidence and source-specific rules

**E01 — October contract**, [original conversation](https://chatgpt.com/c/68e3ae01-bc50-8333-8a73-2a15bd2bd64f), [preserved original excerpt](../deep-source-recovery/PASS2-S06-session-contract-and-guards.txt), live re-inspected. The input schema contains `summary_free_text`, `therapist_id`, `patient_id`, `session_date`, goals, homework status and constraints. Raw text is normalized by Parser.

> PII Masking כבר בשלבי Parser.

This places masking in the parser stages. It does not establish a verified implementation or precisely locate every external-provider boundary.

**E02 — Adjacent confidentiality proposal**, same source, live re-inspected.

> בשלב ה־Parser של Planera – להסיר שמות, כתובות, תאריכים מזהים. לשמור רק מזהים אנונימיים (SessionID).

Translation: remove names, addresses and identifying dates at Parser; retain only anonymous identifiers (SessionID). “Anonymous” is the source's description; persistent linkability and reidentification properties are not demonstrated.

> שמירה מוגבלת (למשל 90 יום), אלא אם המטפל מבקש אחסון ממושך.

Translation: limited retention, for example 90 days, unless the therapist requests longer storage. **Ninety days is an example, not a fixed adopted retention period.**

The proposal also limits therapist access to their own information, proposes access auditing and therapist editing/deletion control, and uses session summaries rather than access to the medical file. These are historical design claims, not current compliance findings.

**E03 — Setup return loop**, [Central Agent 2](https://chatgpt.com/c/690f3792-4b68-832c-b5bd-6ff8f8c874c5), [preserved partial original](../deep-source-recovery/PASS2-S08-setup-and-feedback-loop.txt), live re-inspected.

> ולוחץ על כפתור “Send Back” שמחזיר את הקובץ למערכת (ל־Drive של המאמן או לפורטל המאמן בפלנרה).

Translation: Send Back returns the file to the system, coach's Drive or Plenra coach portal. The following text proposes reading the answers and adapting the next printable. This establishes a proposed continuity flow, not permissible retained fields, retention time, or masking of returned content.

**E06 — Sender-supplied recipient profile**, [Central Agent 3](https://chatgpt.com/c/692ca2ec-9510-832b-a3f5-429a3e75d9aa), newly inspected selected original conversation.

User's relevant question:

> כאשר השולח מכניס נתונים אנחנו מקבלים דאטה על המקבל ונוכל להשתמש בה בהמשך הדרך, יש לנו כמה צעדים קדימה.

Translation: when the sender enters data, we receive data about the recipient that could be used later.

Assistant proposal:

> בניית emotional profile של המקבל

> בלי שהמקבל הזין כלום.

> יצירת "Recipient Shadow Persona"

Translation: build an emotional profile of the recipient without the recipient entering anything; create a recipient shadow persona. A subsequent user request to build A+B+C is visible in the surrounding exchange. It does not supply consent, retention, identity linkage, access or deletion rules. Do not treat the proposal as permission to implement profiling.

## Lower-parity continuity and privacy material

- **D01 — Product synopsis:** personal session-bound QR token, progression to the next printable and anonymous metrics. DERIVED_SUMMARY, even though present in the original chat. It does not define token lifetime, linkage ownership, stored payload or revocation.
- **D02 — Recovery Master conversation summary:** “Privacy by Design: דאטה אנונימי בלבד, בלי טקסט חופשי, בלי אודיו, בלי וידאו, בלי ביומטרי.” This says anonymous data only, no free text/audio/video/biometrics. Its instruction parity remains DERIVED_SUMMARY. An assertion that it replaces previous versions is not independently recovered original supersession evidence.
- **D03/D04 — Recovery Master files:** prior ORIGINAL_FILE retrieval, but contents are DERIVED_SUMMARY. They describe Zero PII, aggregated/anonymized logs and governance; they do not settle field-level continuity permissions. Read from prior preserved text, not freshly downloaded.

## Remaining unknown — FUTURE_PRODUCT_DECISION_REQUIRED (FD-R2)

Determine whether no-free-text applies to collection, external processing, storage, logs, or only specific scopes. Specify normalization/masking order and failure behavior; reconcile initial IDs/dates with SessionID-only retention; define persistent linkage and QR lifetime; define storage/deletion of returned worksheets, normalized summaries, emotional profiles and adaptation history; determine recipient consent and access boundaries for sender-supplied data.

The prior free-text/no-free-text conflict remains open with its mixed parity explicitly preserved. The profile proposal adds a concrete uncovered data category; it does not resolve that conflict.

Stop basis: original clinical and setup boundaries plus recipient-profile proposal inspected; relevant Recovery Master summaries checked without upgrading their authority. No governing field-level policy or original supersession decision recovered.

