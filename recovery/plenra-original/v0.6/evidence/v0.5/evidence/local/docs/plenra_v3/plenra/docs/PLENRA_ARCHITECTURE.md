
# Plenra – System Architecture (v3)

## Core Definition
Plenra is a **Decision Authorization Infrastructure**.
It does NOT generate suggestions.
It **approves / blocks / modifies actions before execution**.

Core output:
PASS / HOLD / REDUCE / STOP / COOLDOWN

---

## 1. System Layers

### 1. Intake Layer
Input sources:
- API (FastAPI)
- Chat interface
- Automation triggers (Make / Webhooks)

Responsibility:
- normalize input
- validate schema
- route to correct surface

---

### 2. Decision Layer (Core)
Includes:
- Decision Gate
- Meta Controller
- Threshold Engine

Logic:
- deterministic
- fail-closed
- no assumptions

Key rule:
If uncertainty → HOLD

---

### 3. Control Layer
Agents:
- Central Agent
- Sentinel Agent
- Decision Forecast Agent

Responsibilities:
- detect risk
- prevent silent failure
- enforce system rules

---

### 4. Execution Layer
Tools:
- decision_gate_tool
- dataset_builder_tool
- counterfactual_tool
- agent_runner_tool

Rule:
Tools have ZERO decision authority

---

### 5. Learning Layer
Pipeline:
decision_event → execution_event → outcome_event

Then:
- dataset_builder
- pattern detection
- weight update

Guardrails:
- no learning from low trust
- no corrupted data

---

## 2. Core Engines

### Decision Gate
- ROI driven
- CPC stability
- fake winner detection
- cooldown logic

### Meta Controller
- protects system from bad data
- controls learning eligibility

### Counterfactual Engine
- compares actual vs baseline
- calculates:
  - decision_gain
  - prevented_loss

---

## 3. Agent System

Agents are:
- orchestration units
- not decision makers (except central logic)

Main agents:
- Central Agent
- VP Marketing
- VP Conversion
- VP Content
- VP Distribution
- VP Analytics
- VP Tech
- Sentinel
- Solo Revenue
- Silent Growth

---

## 4. Tool System

Tools are:
- execution primitives

Examples:
- run decision
- log audit
- simulate scenario
- move state

Rule:
Agents → Tools → Logic

Never:
Tool → Decision override

---

## 5. Data Flow

Input →
Decision Gate →
Meta Controller →
Execution →
Outcome →
Dataset →
Learning

---

## 6. Safety & Guardrails

Mandatory:
- fail closed
- no override without audit
- no execution without validation
- no learning from low trust

---

## 7. Expansion Model

Vertical-by-vertical only.

Each vertical:
- own thresholds
- own signals
- own dataset

---

## 8. System Philosophy

Plenra is:
- a refusal engine
- a risk prevention system
- a decision insurance layer

NOT:
- chatbot
- recommender
- assistant

---

## 9. KPI System

Core metrics:
- prevented_loss
- decision_accuracy
- hold_rate
- false_hold_rate
- ROI_delta

---

## 10. Final Constraint

System must always:
- protect capital
- reduce uncertainty
- block bad decisions

If conflict exists:
→ system blocks
