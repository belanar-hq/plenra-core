from __future__ import annotations

from plenra.core.base_agent import AgentResult, BaseAgent


class CentralAgent(BaseAgent):
    agent_name = "central_agent"
    prompt_key = "central_agent"
    mission = "Coordinate architecture, guardrails, and execution."

    def run(self, context: dict) -> AgentResult:
        return AgentResult(
            agent_name=self.agent_name,
            status="ok",
            summary="Central agent scaffold executed.",
            payload={
                "mission": self.mission,
                "prompt": self.get_prompt(),
                "received_keys": sorted(context.keys()),
            },
        )
