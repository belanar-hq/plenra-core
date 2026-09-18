"""Factory for validated DecisionEvent instances."""

from __future__ import annotations

from datetime import datetime

from .types import ConfidenceLevel, DecisionEvent, DecisionOutput


def _require_nonempty_id(name: str, value: object) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be str, got {type(value).__name__}.")
    if not value or value.isspace():
        raise ValueError(f"{name} must be non-empty.")
    return value


def _require_aware_dt(name: str, value: object) -> datetime:
    if not isinstance(value, datetime):
        raise ValueError(f"{name} must be datetime, got {type(value).__name__}.")
    if value.tzinfo is None:
        raise ValueError(f"{name} must be timezone-aware.")
    return value


def create_decision_event(
    decision_id: str,
    output: DecisionOutput,
    confidence: ConfidenceLevel,
    occurred_at: datetime,
) -> DecisionEvent:
    """
    Construct a DecisionEvent with validated fields.

    Raises ValueError if any field is missing, empty, or invalid.
    """
    did = _require_nonempty_id("decision_id", decision_id)
    if not isinstance(output, DecisionOutput):
        raise ValueError(f"output must be DecisionOutput, got {type(output).__name__}.")
    if not isinstance(confidence, ConfidenceLevel):
        raise ValueError(f"confidence must be ConfidenceLevel, got {type(confidence).__name__}.")
    ts = _require_aware_dt("occurred_at", occurred_at)
    return DecisionEvent(
        decision_id=did,
        output=output,
        confidence=confidence,
        occurred_at=ts,
    )
