"""Core enums and dataclasses for the Plenra Event Flow module."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class DecisionOutput(str, Enum):
    """Canonical decision outputs from the decision engine."""

    PASS = "PASS"
    HOLD = "HOLD"
    REDUCE = "REDUCE"
    STOP = "STOP"
    COOLDOWN = "COOLDOWN"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class ConfidenceLevel(str, Enum):
    """Confidence attached to a decision or derived eligibility."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INVALID = "INVALID"


class FailureType(str, Enum):
    """Why a chain is ineligible or invalid."""

    NONE = "NONE"
    MISSING_EXECUTION = "MISSING_EXECUTION"
    MISSING_OUTCOME = "MISSING_OUTCOME"
    STALE_OUTCOME = "STALE_OUTCOME"
    DUPLICATE_EVENT = "DUPLICATE_EVENT"
    BROKEN_LINKAGE = "BROKEN_LINKAGE"
    INVALID_ORDER = "INVALID_ORDER"
    LOW_CONFIDENCE_CHAIN = "LOW_CONFIDENCE_CHAIN"


@dataclass(frozen=True, slots=True)
class DecisionEvent:
    """A single decision record in the event flow."""

    decision_id: str
    output: DecisionOutput
    confidence: ConfidenceLevel
    occurred_at: datetime


@dataclass(frozen=True, slots=True)
class ExecutionEvent:
    """Execution of a decision (linked by decision_id)."""

    decision_id: str
    execution_id: str
    occurred_at: datetime


@dataclass(frozen=True, slots=True)
class OutcomeEvent:
    """Observed outcome for a decision (linked by decision_id)."""

    decision_id: str
    outcome_id: str
    occurred_at: datetime


@dataclass(frozen=True, slots=True)
class EligibilityResult:
    """Result of evaluating a decision / execution / outcome chain."""

    eligible: bool
    confidence: ConfidenceLevel
    failure_type: FailureType
