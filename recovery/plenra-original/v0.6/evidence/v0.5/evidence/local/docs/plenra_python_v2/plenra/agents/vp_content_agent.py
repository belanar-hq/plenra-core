from __future__ import annotations

from plenra.core.base_agent import AgentResult, BaseAgent


class VPContentAgent(BaseAgent):
    agent_name = "vp_content_agent"
    prompt_key = "vp_content_agent"
    mission = "Generate emotionally aligned and operationally useful content."

    def run(self, context: dict) -> AgentResult:
        return AgentResult(
            agent_name=self.agent_name,
            status="ok",
            summary="Content scaffold executed.",
            payload={
                "mission": self.mission,
                "prompt": self.get_prompt(),
                "received_keys": sorted(context.keys()),
            },
        )
