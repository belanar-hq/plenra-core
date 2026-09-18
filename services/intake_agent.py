from services.decision_gate import evaluate_decision


def run_intake(input_text: str):
    parsed = {
        "parsed_intent": "budget_increase",
        "data": {
            "current_budget": 1000,
            "target_budget": 1500,
            "roi": 1.4,
            "cpc": 2.1
        }
    }

    decision = evaluate_decision(parsed["data"])

    return {
        "intake": parsed,
        "decision": decision
    }


if __name__ == "__main__":
    result = run_intake("I want to scale my budget")
    print(result)
    