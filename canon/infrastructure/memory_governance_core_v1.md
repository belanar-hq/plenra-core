# Memory Governance Core v1

## Overview
Operational memory governance runtime for Plenra, enforcing deterministic, replay-safe, append-only memory management.

## Key Components
- **Memory Registry**: Tracks active, canon, and archive memory with limits and confidence.
- **Event Store**: Append-only event storage with idempotency.
- **Eviction Engine**: Manages active memory caps and TTL.
- **Deduplication**: Prevents canon conflicts.
- **Archive Migration**: Safe demotion with lineage preservation.
- **TTL Runtime**: Evaluates memory expiration.
- **Reference Layer**: Registry-backed resolution.
- **Compaction Engine**: Narrative to structured conversion.
- **Replay Validator**: Ensures event safety.
- **Governance Validator**: Overall system validation.

## Operational Rules
- Strict schema validation for all memory events.
- No free-text as source of truth.
- PII protection mandatory.
- Active memory: max 7 items, 1-turn TTL.
- Canon: persistent unless deprecated.
- Archive: read-only.

## Fail-Closed Behavior
- Blocks unsafe states.
- Holds on missing data.
- Keeps confidence PARTIAL until validated.
- Blocks learning until governance PASS.