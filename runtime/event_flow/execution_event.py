"""Factory for validated ExecutionEvent instances."""

from __future__ import annotations

from datetime import datetime

from .types import ExecutionEvent


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


def create_execution_event(
    decision_id: str,
    execution_id: str,
    occurred_at: datetime,
) -> ExecutionEvent:
    """
    Construct an ExecutionEvent with validated fields.

    Raises ValueError if any field is missing, empty, or invalid.
    """
    did = _require_nonempty_id("decision_id", decision_id)
    eid = _require_nonempty_id("execution_id", execution_id)
    ts = _require_aware_dt("occurred_at", occurred_at)
    return ExecutionEvent(decision_id=did, execution_id=eid, occurred_at=ts)
