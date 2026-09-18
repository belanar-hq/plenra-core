# WhatsApp Intake Flow

Operational flow for mosquito lead qualification via WhatsApp after QR scan.

## Flow Overview

1. **Entry** — Customer scans QR, receives initial greeting
2. **Questions** — 5 structured questions with multi-select options
3. **Scoring** — Calculate lead_score from answers
4. **Routing** — Status update based on score
5. **Booking** — HIGH_PRIORITY leads move to paid installation scheduling

## Multi-Select Rule

Customers may select multiple answers where relevant (e.g., multiple bite locations). Send options as numbered list, accept comma-separated numbers (e.g., "1,3").

## Questions & Mapping

| # | Question (Hebrew) | Options | Maps to Field | Accepted Format |
|---|-------------------|---------|---------------|-----------------|
| 1 | איפה זה מורגש? | 1. רגליים<br>2. ידיים<br>3. גב<br>4. צוואר<br>5. כל הגוף | bites_location | 1-5 (multi-select) |
| 2 | מתי זה קורה בעיקר? | 1. בוקר<br>2. צהריים<br>3. ערב<br>4. לילה<br>5. כל היום | mosquito_frequency | 1-5 (single) |
| 3 | כמה זמן זה נמשך? | 1. יום אחד<br>2. כמה ימים<br>3. שבוע<br>4. חודש<br>5. יותר מחודש | mosquito_frequency | 1-5 (single) |
| 4 | כמה אנשים בבית נעקצים? | 1. אני בלבד<br>2. 2-3 אנשים<br>3. 4-5 אנשים<br>4. כל המשפחה | messages_count | 1-4 (single) |
| 5 | יש חצר / גינה / השקיה? | 1. כן, חצר גדולה<br>2. כן, חצר קטנה<br>3. כן, גינה<br>4. כן, השקיה<br>5. לא | has_yard, has_water_source | 1-5 (multi-select) |

## Status Changes

- **Start**: status = NEW
- **After Questions**: status = REVIEW
- **After Scoring**: 
  - lead_score < 61: status = REVIEW (nurture)
  - lead_score ≥ 61: status = HIGH_PRIORITY
- **HIGH_PRIORITY**: next_action = BOOKING_PENDING

## Scoring Trigger

Calculate lead_score after all 5 questions answered. Use scoring logic from lead-scoring.md.

## Booking Trigger

Move to BOOKING_PENDING immediately after HIGH_PRIORITY status set. Send payment prompt.

## Business Rules

- No free-text diagnosis
- No promise to solve problem
- No site inspection language
- Goal: Paid installation scheduling
- Single technician visit only (post-payment trap installation)