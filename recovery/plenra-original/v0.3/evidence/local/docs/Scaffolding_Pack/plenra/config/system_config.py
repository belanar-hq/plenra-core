from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class RuntimeConfig:
    system_name: str = "Plenra"
    mode: str = "deterministic_fail_closed"
    environment: str = "production_ready_scaffold"
    timezone: str = "Asia/Jerusalem"
    max_override_rate: float = 0.05
    default_chat_history_limit: int = 10
    max_agent_iterations: int = 5
    cache_ttl_seconds: int = 3600
    ops_logger_schema_version: str = "OPS-01 v1.1.2"
    explainability_required: bool = True
    full_automation_only: bool = True


@dataclass(slots=True)
class GrowthConfig:
    use_bottom_up_demand: bool = True
    use_micro_cta: bool = True
    use_gamified_series: bool = True
    use_follow_up_email_for_coachees: bool = True
    target_k_factor_low: float = 1.5
    target_k_factor_high: float = 1.8


@dataclass(slots=True)
class SafetyConfig:
    fail_closed_on_uncertainty: bool = True
    allow_external_execution_tools_decision_authority: bool = False
    require_gap_attack_question: bool = True
    require_loophole_scan: bool = True
    require_validation_gate: bool = True
    require_copy_source_of_truth: bool = True


@dataclass(slots=True)
class DesignConfig:
    font_family: str = "Montserrat"
    palette_lock: tuple[str, ...] = ("#FAF9F6", "#F3EBDD", "#1D4E89", "#56CFE1", "#6C757D")
    fixed_margin_inches: float = 0.5
    safe_zone_required: bool = True
    whitespace_priority: str = "high"


@dataclass(slots=True)
class SystemConfig:
    runtime: RuntimeConfig = field(default_factory=RuntimeConfig)
    growth: GrowthConfig = field(default_factory=GrowthConfig)
    safety: SafetyConfig = field(default_factory=SafetyConfig)
    design: DesignConfig = field(default_factory=DesignConfig)


SYSTEM_CONFIG = SystemConfig()
