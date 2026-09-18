"""
Plenra Event Flow: decision, execution, and outcome models with validation
and eligibility for downstream dataset construction.
"""

from .dataset_builder import build_eligibility
from .decision_event import create_decision_event
from .decision_ledger import DecisionLedger
from .execution_event import create_execution_event
from .outcome_event import create_outcome_event
from .types import (
    ConfidenceLevel,
    DecisionEvent,
    DecisionOutput,
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

__all__ = [
    "ConfidenceLevel",
    "DecisionEvent",
    "DecisionLedger",
    "DecisionOutput",
    "EligibilityResult",
    "ExecutionEvent",
    "FailureType",
    "OutcomeEvent",
    "build_eligibility",
    "create_decision_event",
    "create_execution_event",
    "create_outcome_event",
    "is_stale_outcome",
    "validate_chain_completeness",
    "validate_decision_confidence_chain",
    "validate_decision_id_linkage",
    "validate_event_order",
    "validate_no_duplicate_identifiers",
    "validate_outcome_requires_execution",
]
