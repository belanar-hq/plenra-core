"""Deterministic validation for event-flow chains."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .types import (
    ConfidenceLevel,
    DecisionEvent,
    ExecutionEvent,
    FailureType,
    OutcomeEvent,
)


def _ensure_utc(dt: datetime) -> datetime:
    """Normalize datetimes to UTC for ordering and age checks."""
    if dt.tzinfo is None:
        raise ValueError("occurred_at must be timezone-aware (use datetime.timezone.utc).")
    return dt.astimezone(timezone.utc)


def validate_decision_id_linkage(
    decision: DecisionEvent,
    execution: ExecutionEvent | None,
    outcome: OutcomeEvent | None,
) -> FailureType:
    """
    Return BROKEN_LINKAGE if any present event's decision_id does not match
    the decision's decision_id; otherwise NONE.
    """
    base = decision.decision_id
    if execution is not None and execution.decision_id != base:
        return FailureType.BROKEN_LINKAGE
    if outcome is not None and outcome.decision_id != base:
        return FailureType.BROKEN_LINKAGE
    return FailureType.NONE


def validate_event_order(
    decision: DecisionEvent,
    execution: ExecutionEvent | None,
    outcome: OutcomeEvent | None,
) -> FailureType:
    """
    Require decision <= execution <= outcome by occurred_at (inclusive).
    Missing execution/outcome is handled elsewhere; if any pair is present, order must hold.
    """
    d = _ensure_utc(decision.occurred_at)
    if execution is not None:
        e = _ensure_utc(execution.occurred_at)
        if e < d:
            return FailureType.INVALID_ORDER
    if outcome is not None:
        o = _ensure_utc(outcome.occurred_at)
        if execution is not None:
            e = _ensure_utc(execution.occurred_at)
            if o < e:
                return FailureType.INVALID_ORDER
        else:
            if o < d:
                return FailureType.INVALID_ORDER
    return FailureType.NONE


def validate_outcome_requires_execution(
    execution: ExecutionEvent | None,
    outcome: OutcomeEvent | None,
) -> FailureType:
    """Outcome must not exist without a matching execution record."""
    if outcome is not None and execution is None:
        return FailureType.MISSING_EXECUTION
    return FailureType.NONE


def validate_chain_completeness(
    execution: ExecutionEvent | None,
    outcome: OutcomeEvent | None,
) -> FailureType:
    """
    For eligibility, the chain must include execution and outcome when evaluating
    a full triple; missing either fails closed.
    """
    if execution is None:
        return FailureType.MISSING_EXECUTION
    if outcome is None:
        return FailureType.MISSING_OUTCOME
    return FailureType.NONE


def validate_no_duplicate_identifiers(
    execution: ExecutionEvent | None,
    outcome: OutcomeEvent | None,
) -> FailureType:
    """Same identifier must not be reused across execution and outcome."""
    if execution is not None and outcome is not None:
        if execution.execution_id == outcome.outcome_id:
            return FailureType.DUPLICATE_EVENT
    return FailureType.NONE


def is_stale_outcome(
    outcome: OutcomeEvent,
    *,
    reference_time: datetime,
    max_age_hours: float,
) -> bool:
    """
    True if outcome is older than max_age_hours relative to reference_time.
    Both datetimes must be timezone-aware.
    """
    if max_age_hours < 0:
        raise ValueError("max_age_hours must be non-negative.")
    o = _ensure_utc(outcome.occurred_at)
    ref = _ensure_utc(reference_time)
    return o < ref - timedelta(hours=max_age_hours)


def validate_decision_confidence_chain(confidence: ConfidenceLevel) -> FailureType:
    """LOW or INVALID confidence fails eligibility for the chain."""
    if confidence is ConfidenceLevel.INVALID:
        return FailureType.LOW_CONFIDENCE_CHAIN
    if confidence is ConfidenceLevel.LOW:
        return FailureType.LOW_CONFIDENCE_CHAIN
    return FailureType.NONE
