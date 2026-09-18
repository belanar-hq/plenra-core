
import yaml
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

def load_thresholds():
    with open(BASE / "config" / "thresholds.yaml") as f:
        return yaml.safe_load(f)

def load_prompt(name: str):
    with open(BASE / "prompts" / f"{name}.prompt.txt") as f:
        return f.read()
