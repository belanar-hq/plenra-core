"""In-memory ledger for a single decision / execution / outcome chain."""

from __future__ import annotations

from .types import DecisionEvent, ExecutionEvent, OutcomeEvent


class DecisionLedger:
    """
    Holds at most one decision, one execution, and one outcome, enforcing
    matching ``decision_id`` when recording dependent events.
    """

    __slots__ = ("_decision", "_execution", "_outcome")

    def __init__(self) -> None:
        self._decision: DecisionEvent | None = None
        self._execution: ExecutionEvent | None = None
        self._outcome: OutcomeEvent | None = None

    @property
    def decision_event(self) -> DecisionEvent | None:
        return self._decision

    @property
    def execution_event(self) -> ExecutionEvent | None:
        return self._execution

    @property
    def outcome_event(self) -> OutcomeEvent | None:
        return self._outcome

    def record_decision(self, event: DecisionEvent) -> None:
        """Store the decision; raises if a decision is already set."""
        if not isinstance(event, DecisionEvent):
            raise ValueError(f"event must be DecisionEvent, got {type(event).__name__}.")
        if self._decision is not None:
            raise ValueError("Decision already recorded.")
        self._decision = event

    def record_execution(self, event: ExecutionEvent) -> None:
        """Store execution after a decision; ``decision_id`` must match."""
        if not isinstance(event, ExecutionEvent):
            raise ValueError(f"event must be ExecutionEvent, got {type(event).__name__}.")
        if self._decision is None:
            raise ValueError("Cannot record execution before a decision.")
        if event.decision_id != self._decision.decision_id:
            raise ValueError("execution.decision_id does not match ledger decision_id.")
        if self._execution is not None:
            raise ValueError("Execution already recorded.")
        self._execution = event

    def record_outcome(self, event: OutcomeEvent) -> None:
        """Store outcome after execution; ``decision_id`` must match."""
        if not isinstance(event, OutcomeEvent):
            raise ValueError(f"event must be OutcomeEvent, got {type(event).__name__}.")
        if self._decision is None:
            raise ValueError("Cannot record outcome before a decision.")
        if self._execution is None:
            raise ValueError("Cannot record outcome before execution.")
        if event.decision_id != self._decision.decision_id:
            raise ValueError("outcome.decision_id does not match ledger decision_id.")
        if self._outcome is not None:
            raise ValueError("Outcome already recorded.")
        self._outcome = event

    def is_chain_complete(self) -> bool:
        """True when decision, execution, and outcome are all present."""
        return (
            self._decision is not None
            and self._execution is not None
            and self._outcome is not None
        )
