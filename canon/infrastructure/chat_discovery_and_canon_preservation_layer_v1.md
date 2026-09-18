# Chat Discovery and Canon Preservation Layer v1

## Overview
Operational artifact discovery and external Canon preservation runtime for Plenra, processing chats to extract, classify, preserve, and schedule operational artifacts.

## Key Components
- **Chat Index Registry**: Stable chat indexing with deterministic IDs.
- **Discovery Scanner**: Detects Plenra signals in chats.
- **Artifact Extraction Engine**: Extracts operational artifacts, ignores noise.
- **Maturity Scoring Engine**: Evaluates artifact completeness for Codex readiness.
- **Canon Preservation Manager**: Preserves artifacts to Canon with hash verification.
- **External Backup Registry**: Tracks preservation completeness.
- **Coverage Audit Engine**: Assesses discovery completeness.
- **Dependency Mapper**: Maps artifact dependencies.
- **Discovery Orchestrator**: End-to-end chat processing cycle.

## Operational Rules
- Extracts infrastructure, schemas, prompts, validation rules, deterministic logic, dependencies, fail-closed rules, replay requirements, orchestration logic, routing logic, execution tasks, Codex tasks, acceptance criteria.
- Ignores casual conversation, emotional content, brainstorming, repetitions.
- Maturity blocks READY_FOR_CODEX without validation requirements or fail-closed logic.
- Preservation uses existing canonWriter and hashManager.
- Coverage HIGH only when all chats scanned, artifacts indexed, P0/P1 preserved, dependencies synchronized.

## Dependencies
- orchestrator_runtime_infrastructure_v1
- memory_governance_core_v1

## Fail-Closed Behavior
- HOLD on missing source_chat_id or incomplete extraction.
- BLOCK on conflicting Canon without lineage.
- PARTIAL coverage on incomplete preservation.
- Blocks dependent systems on missing P0/P1 backups.