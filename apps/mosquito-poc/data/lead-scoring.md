# Lead Scoring Logic

Scoring system to prioritize high-intent mosquito treatment leads.

## Score Factors

| Factor | Signal | Points | Notes |
|--------|--------|--------|-------|
| **Mosquito Frequency** | Daily incidents | +30 | Highest intent signal |
| | Multiple per week | +20 | |
| | Weekly | +10 | |
| | Occasional | +5 | |
| **Has Yard** | Yes | +25 | Infrastructure for infestation |
| | No | 0 | Apartment/urban dweller |
| **Water Source** | Standing water detected | +20 | Breeding ground presence |
| | No standing water | 0 | |
| **Bites Location** | Multiple areas / whole body | +15 | Severity indicator |
| | Localized | +10 | |
| **Household Complaints** | Multiple family members reporting | +15 | Urgency multiplier |
| | Single reporter | +5 | |
| **Activity Pattern** | Evening activity mentioned | +10 | Typical mosquito behavior |
| | Other times | +5 | |
| **Messages Count** | 5+ messages in campaign | +10 | Engagement bonus |
| | 3-4 messages | +5 | |
| | 1-2 messages | 0 | |

## Score Bands

| Range | Status | Action |
|-------|--------|--------|
| **0-30** | LOW | Archive or nurture |
| **31-60** | MEDIUM | Monitor, nurture sequence |
| **61-100** | HIGH | Immediate outreach |
| **100+** | CRITICAL | Priority booking |

## Calculation

```
total_score = sum(all factor points)
lead_score = min(total_score, 120)  // cap at 120
status = HIGH_PRIORITY if lead_score >= 61 else REVIEW
```

## Example Scores

- **Daily bites, yard, standing water, multiple complaints** = 30+25+20+15 = 90 → HIGH_PRIORITY
- **Weekly bites, yard, no water** = 10+25+0 = 35 → MEDIUM (nurture)
- **Occasional, apartment, engaged** = 5+0+10 = 15 → LOW
