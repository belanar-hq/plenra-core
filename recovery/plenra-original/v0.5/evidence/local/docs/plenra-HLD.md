Here’s the **production-grade `.md` documentation** for Plenra.
This is not marketing fluff. This is a system spec your developers and DevOps can execute on.

---

# Plenra - Decision Infrastructure System

**Version:** v1.0 Production Blueprint
**Type:** Deterministic Decision Authorization Network
**Mode:** Fail-Closed, Signal-Based, Non-Heuristic

---

# 1. What Plenra Is

Plenra is a **Decision Authorization Infrastructure**.

Not analytics.
Not AI recommendations.
Not dashboards.

**It is a system that decides whether an action is allowed to happen.**

### Core Output

Every flow ends with:

```
PASS | HOLD | REDUCE | STOP | COOLDOWN | MANUAL_REVIEW
```

### Core Principle

Plenra operates **before execution**, not after.

---

# 2. Purpose of the System

### Primary Goal

Prevent bad decisions at scale.

### Secondary Goals

* Reduce capital loss
* Stabilize scaling decisions
* Create a learning dataset of decision outcomes
* Enable deterministic optimization loops

---

# 3. System Philosophy (Non-Negotiable)

### 3.1 Fail-Closed

If input is invalid → system does NOT proceed.

### 3.2 Deterministic Only

* No randomness
* No guesswork
* No generative logic in decision layer

### 3.3 Separation of Concerns

* Decision = Plenra
* Execution = external systems
* Orchestration = Make.com

### 3.4 No Override Culture

Overrides are logged, never silent.

---

# 4. High-Level Architecture

```
[ Input Layer ]
        ↓
[ Intake Layer ]
        ↓
[ Decision Gate Layer ]
        ↓
[ Ledger + Dataset Layer ]
        ↓
[ Evaluation Layer ]
        ↓
[ Learning Layer ]
        ↓
[ Weight Update Layer ]
        ↓
[ Feedback Loop → Decision Gates ]
```

---

# 5. Core Layers Explained

---

## 5.1 Input Layer

### Sources

* User input (manual / chat UI)
* Platform triggers (Sonary, Ads, etc.)
* Metrics systems (GA4, DB, SEO)

### Examples

* Budget increase request
* ROI drop alert
* CPC spike
* Performance instability

---

## 5.2 Intake Layer

### Purpose

Normalize input into strict contract.

### Modes

* Structured form
* Free text (LLM parsing layer)

### Output

```ts
type DecisionGateInput = {
  vertical_id: string
  roi_value: number
  rolling_roi_value: number
  effective_cpc: number
  effective_conversion_rate: number
  ...
}
```

### Rules

* No missing required fields
* No invalid enums
* No NaN values

---

## 5.3 Decision Gate Layer (CORE)

### Role

Decides if action is allowed.

### Engine

`decision_gate_service`

### Input

Strict validated contract

### Output

```ts
{
  decision_status: "pass | hold | reduce | stop | cooldown | manual_review",
  decision_action: "scale_up | maintain | reduce_15 | reduce_30 | pause",
  reason_code: string,
  gate_severity: "low | medium | high"
}
```

---

### Core Logic Examples

#### 1. ROI-based blocking

```
IF rolling_roi < threshold → HOLD or STOP
```

#### 2. Fake Winner detection

```
IF is_fake_winner = true → REDUCE or STOP
```

#### 3. Dominance risk

```
IF share too high → REDUCE
```

#### 4. CPC inflation

```
IF CPC rising + conversion dropping → HOLD
```

---

## 5.4 Meta Controller Layer

### Role

Protects system integrity.

### Responsibilities

* Input validation classification
* Trust level assignment
* Learning permission control

### Key Outputs

```ts
{
  controller_status: "allow_updates | block_updates",
  trust_level: "high | low | quarantined",
  normalization_applied: boolean
}
```

### Critical Rule

**No learning from untrusted data.**

---

## 5.5 Decision Ledger Layer

### Role

Tracks full decision lifecycle.

### Required Chain

```
decision_event → execution_event → outcome_event
```

### Guarantees

* No missing steps
* No evaluation without full chain

---

## 5.6 Dataset Builder Layer

### Role

Controls what enters learning dataset.

### Rules

* Block invalid data
* Classify trust
* Route to:

  * clean dataset
  * low_trust dataset
  * quarantine

---

## 5.7 Counterfactual Engine

### Role

Measure decision impact.

### Calculates

* baseline performance
* actual performance
* decision_gain
* prevented_loss

### Example

```
baseline_profit = expected
actual_profit = real

decision_gain = actual - baseline
```

---

## 5.8 Decision Intelligence Layer

### Role

Extract patterns.

### Groups

* ROI ranges
* CPC behavior
* share buckets
* performance_status

---

## 5.9 Weight Update Engine

### Role

Adjust global decision weights.

### Constraints

* max change per cycle = 0.05
* normalized sum = 1
* bounded [0.1 - 1.0]

### Controlled by

Meta Controller only

---

# 6. Queue Architecture (BullMQ)

### Core Queues

```
decision_queue
ledger_queue
dataset_builder_queue
counterfactual_queue
intelligence_queue
weight_update_queue
audit_queue
```

---

### Example Flow

```
decision_queue
→ ledger_queue
→ dataset_builder_queue
→ counterfactual_queue
→ intelligence_queue
→ weight_update_queue
```

---

### Idempotency Rule

Every worker must use:

```
decision_id + ":" + stage
```

---

# 7. Worker Pattern

### Worker Responsibilities

* receive job
* check idempotency
* call pure service
* persist result
* trigger next queue

### NEVER:

* contain business logic
* skip persistence
* bypass audit

---

# 8. Storage Architecture

### PostgreSQL

#### Tables

1. decision_events
2. dataset_records
3. learning_dataset

### Rules

* JSONB for flexibility
* strict audit fields
* no mutation of history

---

# 9. Orchestration Layer

### Tool

Make.com

### Responsibilities

* webhook ingestion
* routing
* approval flows
* logging

### Rule

**Persist first → trigger next**

---

# 10. UI Layer (POC)

### Minimal Chat UI

Components:

* textarea
* submit button
* response box

### Flow

```
user input → intake → decision → response
```

---

# 11. Agents in the System

---

## 11.1 Central Agent

* owns system logic
* enforces guardrails
* manages architecture

---

## 11.2 Decision Gate Agent

* executes decisions
* applies rules

---

## 11.3 Meta Controller Agent

* protects system
* blocks bad data

---

## 11.4 Dataset Builder Agent

* controls learning input

---

## 11.5 Counterfactual Agent

* evaluates outcomes

---

## 11.6 Intelligence Agent

* extracts patterns

---

## 11.7 Weight Update Agent

* adjusts system behavior

---

## 11.8 Worker Generator Agent

* creates queue workers

---

## 11.9 Execution & QA Factory

* validates system integrity
* enforces fail-closed

---

# 12. Key System Mechanisms

---

## 12.1 Decision Gate (Mandatory Pattern)

Every decision must:

1. break assumption
2. reframe
3. decide

---

## 12.2 Flip Engine

Cheap traffic → expensive intent

If no flip path → BLOCK

---

## 12.3 Prevented Loss Model

System is priced and evaluated by:

```
loss_prevented
```

Not:

* features
* usage

---

## 12.4 Screener Rule

Every decision includes:

* 60 second friction layer

---

## 12.5 Trust-Based Learning

Only:

```
high_trust + eligible
```

data enters learning

---

# 13. Guardrails

---

### Hard Rules

* No heuristic decisions
* No AI override
* No silent fallback
* No skipping layers
* No direct execution

---

### Failure Handling

| Condition               | Action         |
| ----------------------- | -------------- |
| invalid input           | fallback       |
| high risk normalization | block learning |
| missing chain           | no evaluation  |
| unsafe scenario         | STOP           |

---

# 14. DevOps Requirements

---

## Infrastructure

* Node.js (TypeScript)
* PostgreSQL
* Redis (BullMQ)
* Make.com
* Cloud provider (AWS / GCP)

---

## Requirements

* idempotent workers
* persistent queues
* retry-safe execution
* audit logging
* monitoring (fail rates, queue depth)

---

# 15. What This System Is NOT

* not a dashboard
* not analytics
* not AI assistant
* not recommendation engine

---

# 16. What This System Actually Does

It sits **between intention and action**
and decides:

> should this action happen?

---

# 17. Final Mental Model

```
Without Plenra:
input → action → loss → analysis

With Plenra:
input → decision → (block OR allow) → outcome → learning
```

---

# 18. Immediate Build Order (Production)

1. Intake Layer (types + validator)
2. Decision Gate Service
3. Ledger Service
4. Dataset Builder
5. Counterfactual Engine
6. Queue Workers (BullMQ)
7. PostgreSQL schema
8. Make.com orchestration
9. Minimal UI

---

If you want next step, I’ll do one of these:

* full folder structure (ready to clone)
* docker + infra setup
* exact Make.com scenario blueprint
* production deployment checklist

No theory. Only execution.
