# 🧠 THE CORRECT ARCHITECTURE (NON-NEGOTIABLE)

## Core principle

**Plenra = Deterministic Decision System**
NOT an LLM system.

### Separation (this is critical)

- **Decision Layer → deterministic (Python only)**
- **Execution Layer → queues / workers**
- **AI Layer → optional, controlled, non-authoritative**

If LangChain touches your decision logic → you broke the system.

---

# 🏗️ SYSTEM ARCHITECTURE (PRODUCTION-READY)

## 1. Core Layers

### 1. Intake Layer (optional AI)

- Free text → structured JSON
- LangChain lives ONLY here

### 2. Decision Layer (your core IP)

Pure Python services:

- Decision Gate
- Meta Controller
- Dataset Builder
- Decision Intelligence Engine
- Counterfactual Engine
- Weight Update Engine

👉 No AI here. Ever.

---

### 3. Orchestration Layer

- FastAPI (entry)
- Queue system (Celery / Redis / Kafka)
- Idempotency enforcement

---

### 4. Storage Layer

- PostgreSQL → canonical data
- Redis → queues + cache
- Object storage → logs / snapshots

---

### 5. Learning Layer (controlled)

- Only uses **approved data**
- Fully gated by Meta Controller

---

### 6. Observability Layer

- decision_trace
- audit logs
- replay capability

---

# ⚙️ TECHNOLOGY STACK (WHAT YOU SHOULD ACTUALLY USE)

## Backend

- Python 3.11+
- FastAPI
- Pydantic (strict schemas)

## Async / Workers

- Celery + Redis (simple)
OR
- Kafka + consumers (scale)

## Database

- PostgreSQL
- SQLAlchemy / Prisma alternative

## AI Layer

- LangChain ONLY for:
  - intake parsing
  - explanation generation

NOT:

- decision making
- scoring
- rule evaluation

---

# 📁 PROJECT STRUCTURE

```
plenra/
├── app/
│   ├── api/
│   │   └── main.py
│   ├── services/
│   │   ├── decision_gate.py
│   │   ├── meta_controller.py
│   │   ├── dataset_builder.py
│   │   ├── decision_intelligence.py
│   │   ├── counterfactual.py
│   │   └── weight_update.py
│   ├── models/
│   │   └── schemas.py
│   ├── workers/
│   │   └── queue_workers.py
│   ├── infra/
│   │   ├── db.py
│   │   ├── redis.py
│   │   └── logging.py
│   └── guards/
│       └── validation.py
├── prompts/
│   └── intake_prompt.txt
├── tests/
├── docker/
└── pyproject.toml
```

---

# 🔥 IMPLEMENTATION PLAN (REALISTIC)

## Phase 1 – Core (MANDATORY)

- Decision Gate
- Meta Controller
- Dataset Builder

👉 If this is not perfect → stop everything

---

## Phase 2 – Intelligence

- Decision Intelligence Engine
- Counterfactual Engine

---

## Phase 3 – Learning

- Weight Update Engine
- Pattern system

---

## Phase 4 – AI Layer

- LangChain intake
- Explanation generation

---

## Phase 5 – Production

- Queues
- Idempotency
- Observability
- Replay

---

# 🧩 CORE SERVICE EXAMPLE (REAL CODE)

## Decision Intelligence Engine (Python)

```python
from typing import List, Dict, Any
from collections import defaultdict
import math


CONFIDENCE_WEIGHTS = {
    "high": 1.0,
    "medium": 0.6,
    "low": 0.3,
}


def classify_roi(value: float) -> str:
    if value < 0:
        return "negative"
    elif value < 0.5:
        return "low"
    elif value < 1.5:
        return "mid"
    return "high"


def classify_share(value: float) -> str:
    if value < 0.05:
        return "small"
    elif value < 0.12:
        return "medium"
    return "large"


def classify_cpc(value: float) -> str:
    if value < 2:
        return "stable"
    elif value < 4:
        return "rising"
    return "spiking"


def compute_decision_intelligence(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(records, list):
        return {
            "status": "invalid_input",
            "reason_code": "invalid_input_envelope",
        }

    valid_records = []
    invalid_count = 0
    blocked_count = 0

    for r in records:
        try:
            if r["learning_eligibility"] != "eligible":
                blocked_count += 1
                continue

            if not math.isfinite(r["rolling_roi_value"]):
                raise ValueError

            valid_records.append(r)

        except Exception:
            invalid_count += 1

    scores = []
    patterns = defaultdict(list)

    for r in valid_records:
        weight = CONFIDENCE_WEIGHTS[r["evaluation"]["confidence"]]
        result = r["evaluation"]["result"]

        base = 1 if result == "correct" else -1 if result == "incorrect" else 0
        score = base * weight

        scores.append({
            "decision_id": r["decision_id"],
            "decision_score": score,
        })

        pattern_id = "_".join([
            r["performance_status"],
            classify_roi(r["rolling_roi_value"]),
            classify_share(r["share"]),
            classify_cpc(r["effective_cpc"]),
        ])

        patterns[pattern_id].append(r)

    pattern_outputs = []
    adjustments = []

    for pid, group in patterns.items():
        size = len(group)

        correct = sum(1 for x in group if x["evaluation"]["result"] == "correct")
        total = len(group)

        success_rate = correct / total if total else 0

        avg_roi = sum(x["evaluation"]["delta_roi"] for x in group) / size
        avg_profit = sum(x["evaluation"]["delta_profit"] for x in group) / size

        actions = [x["decision_action"] for x in group]
        dominant = sorted(actions)[0]

        status = "usable" if size >= 2 else "insufficient_data"

        if status == "insufficient_data":
            bias = "hold"
        elif success_rate >= 0.7:
            bias = "increase_weight"
        elif success_rate <= 0.4:
            bias = "decrease_weight"
        else:
            bias = "hold"

        pattern_outputs.append({
            "pattern_id": pid,
            "sample_size": size,
            "success_rate": success_rate,
            "avg_delta_roi": avg_roi,
            "avg_delta_profit": avg_profit,
            "dominant_action": dominant,
            "pattern_status": status,
        })

        adjustments.append({
            "pattern_id": pid,
            "action_bias": bias,
        })

    return {
        "status": "computed",
        "decision_scores": scores,
        "patterns": pattern_outputs,
        "recommended_adjustments": adjustments,
        "debug_trace": {
            "total_records_received": len(records),
            "eligible_records_used": len(valid_records),
            "blocked_records_excluded": blocked_count,
            "invalid_records_excluded": invalid_count,
        },
    }
```

---

# 🧠 LANGCHAIN PROMPT (INTAKE ONLY)

## DO NOT let it decide

```text
You are an intake parser.

Your job:
Convert free-text marketing input into structured JSON.

You must:
- extract numeric values
- normalize fields
- never invent missing data
- return only JSON

Example input:
"I spend 1000, ROI is 1.4, CPC 2.1"

Output:
{
  "budget": 1000,
  "roi": 1.4,
  "cpc": 2.1
}
```

---

# ⚠️ CRITICAL WARNINGS (READ THIS TWICE)

## 1. If you let AI influence decisions → system dies

No explainability
No trust
No reproducibility

---

## 2. If you don’t implement idempotency → data corruption

You MUST enforce:

```
decision_id + stage
```

---

## 3. If you mix learning + execution → system drifts

Learning must be:

- delayed
- validated
- controlled

---

## 4. If you don’t build replay → you can’t debug reality

You NEED:

- decision replay
- outcome comparison

---

# 🔥 WHAT YOU SHOULD DO NEXT (NO OPTIONS)

1. Lock DB schema
2. Build Decision Gate (perfectly)
3. Add Meta Controller
4. Add Dataset Builder
5. Only then move forward

---

If you want, I’ll take you to the next level:

👉 Full production backend:

- Postgres schema + Alembic
- Celery workers
- event pipeline
- idempotency system
- audit logging
- replay engine

Just say:
**“build production backend v1”**