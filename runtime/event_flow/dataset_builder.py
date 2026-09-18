"""Build EligibilityResult from decision, execution, and outcome events."""

from __future__ import annotations

from datetime import datetime

from .types import (
    ConfidenceLevel,
    DecisionEvent,
    EligibilityResult,
    ExecutionEvent,
    FailureType,
    OutcomeEvent,
)
from .validator import (
    is_stale_outcome,
    validate_chain_completeness,
    validate_decision_confidence_chain,
    validate_decision_id_linkage,
    validate_event_order,
    validate_no_duplicate_identifiers,
    validate_outcome_requires_execution,
)


def _ineligible(
    failure: FailureType,
    decision_confidence: ConfidenceLevel,
) -> EligibilityResult:
    if failure is FailureType.LOW_CONFIDENCE_CHAIN:
        return EligibilityResult(
            eligible=False,
            confidence=decision_confidence,
            failure_type=failure,
        )
    return EligibilityResult(
        eligible=False,
        confidence=ConfidenceLevel.INVALID,
        failure_type=failure,
    )


def build_eligibility(
    decision_event: DecisionEvent,
    execution_event: ExecutionEvent | None,
    outcome_event: OutcomeEvent | None,
    *,
    reference_time: datetime,
    max_outcome_age_hours: float,
) -> EligibilityResult:
    """
    Evaluate a three-stage chain for eligibility.

    ``reference_time`` is typically "now" in UTC; it is used with
    ``max_outcome_age_hours`` to detect stale outcomes.

    Raises ValueError if ``decision_event`` is not a DecisionEvent or if optional
    events are present but of the wrong type.
    """
    if not isinstance(decision_event, DecisionEvent):
        raise ValueError(
            f"decision_event must be DecisionEvent, got {type(decision_event).__name__}."
        )
    if execution_event is not None and not isinstance(execution_event, ExecutionEvent):
        raise ValueError(
            "execution_event must be ExecutionEvent or None, "
            f"got {type(execution_event).__name__}."
        )
    if outcome_event is not None and not isinstance(outcome_event, OutcomeEvent):
        raise ValueError(
            f"outcome_event must be OutcomeEvent or None, got {type(outcome_event).__name__}."
        )
    if not isinstance(reference_time, datetime):
        raise ValueError(
            f"reference_time must be datetime, got {type(reference_time).__name__}."
        )
    if reference_time.tzinfo is None:
        raise ValueError("reference_time must be timezone-aware.")
    if not isinstance(max_outcome_age_hours, (int, float)):
        raise ValueError("max_outcome_age_hours must be a number.")
    if max_outcome_age_hours < 0:
        raise ValueError("max_outcome_age_hours must be non-negative.")

    ft = validate_outcome_requires_execution(execution_event, outcome_event)
    if ft is not FailureType.NONE:
        return _ineligible(ft, decision_event.confidence)

    ft = validate_chain_completeness(execution_event, outcome_event)
    if ft is not FailureType.NONE:
        return _ineligible(ft, decision_event.confidence)

    assert execution_event is not None and outcome_event is not None

    ft = validate_decision_id_linkage(decision_event, execution_event, outcome_event)
    if ft is not FailureType.NONE:
        return _ineligible(ft, decision_event.confidence)

    ft = validate_no_duplicate_identifiers(execution_event, outcome_event)
    if ft is not FailureType.NONE:
        return _ineligible(ft, decision_event.confidence)

    ft = validate_event_order(decision_event, execution_event, outcome_event)
    if ft is not FailureType.NONE:
        return _ineligible(ft, decision_event.confidence)

    ft = validate_decision_confidence_chain(decision_event.confidence)
    if ft is not FailureType.NONE:
        return _ineligible(ft, decision_event.confidence)

    if is_stale_outcome(
        outcome_event,
        reference_time=reference_time,
        max_age_hours=max_outcome_age_hours,
    ):
        return _ineligible(FailureType.STALE_OUTCOME, decision_event.confidence)

    return EligibilityResult(
        eligible=True,
        confidence=decision_event.confidence,
        failure_type=FailureType.NONE,
    )
