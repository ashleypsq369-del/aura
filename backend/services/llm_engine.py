"""
LLM Engine  --  ProjectAura
========================
Routes all chat requests through the self-hosted Aura AI Engine.
Zero subscriptions. Zero external APIs. Fully local.
"""

from __future__ import annotations
from typing import Dict, List, Optional, Any

# Import the self-hosted engine
from services.aura_ai_engine import generate as _aura_generate, engine_status


def generate_response(
    message: str,
    history: List[Dict],
    user_name: Optional[str] = None,
    patient_context: str = "",
    patient_context_dict: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Unified generate function called by conversational_chatbot.py.
    Delegates entirely to the self-hosted Aura AI Engine.

    patient_context       --  plain-text context string (legacy)
    patient_context_dict  --  structured dict (preferred, includes care_setting)
    """
    # Use structured dict if provided; otherwise parse the plain-text string
    if patient_context_dict:
        ctx: Dict[str, Any] = patient_context_dict
    else:
        ctx = {}
        if patient_context:
            for line in patient_context.splitlines():
                lower = line.lower()
                if "pain" in lower and any(c.isdigit() for c in line):
                    import re
                    m = re.search(r"(\d+)", line)
                    if m:
                        ctx["esas_pain"] = int(m.group(1))
                if "anxiety" in lower and any(c.isdigit() for c in line):
                    import re
                    m = re.search(r"(\d+)", line)
                    if m:
                        ctx["esas_anxiety"] = int(m.group(1))
                if "depression" in lower and any(c.isdigit() for c in line):
                    import re
                    m = re.search(r"(\d+)", line)
                    if m:
                        ctx["esas_depression"] = int(m.group(1))
                if "diagnosis:" in lower:
                    ctx["diagnosis"] = line.split(":", 1)[-1].strip()
                if "clinical diagnosis:" in lower:
                    ctx["diagnosis"] = line.split(":", 1)[-1].strip()
                # ── Care setting extraction ─────────────────────────────────
                if "care_setting_key:" in lower:
                    key = line.split(":", 1)[-1].strip()
                    ctx.setdefault("care_setting", {})["key"] = key
                if "care_setting_label:" in lower:
                    label = line.split(":", 1)[-1].strip()
                    ctx.setdefault("care_setting", {})["label"] = label
                if "care_setting_focus:" in lower:
                    focus = line.split(":", 1)[-1].strip()
                    ctx.setdefault("care_setting", {})["focus"] = focus
                if "care_setting_facility:" in lower:
                    facility = line.split(":", 1)[-1].strip()
                    ctx.setdefault("care_setting", {})["facility"] = facility
                if "care_setting_frequency:" in lower:
                    freq = line.split(":", 1)[-1].strip()
                    ctx.setdefault("care_setting", {})["visit_frequency"] = freq

    result = _aura_generate(
        message=message,
        history=history,
        user_name=user_name,
        patient_context=ctx,
    )

    return {
        "message":     result["message"],
        "model_used":  result["model"],
        "tokens_used": None,
        "is_crisis":   result["is_crisis"],
        "confidence":  result["confidence"],
        "intents":     [result["intent"]],
        "sentiment":   result["sentiment"],
        "entities":    result["entities"],
    }


def get_provider_status() -> Dict[str, Any]:
    """Return status expected by /api/conversational-chatbot/status endpoint."""
    s = engine_status()
    return {
        "provider":    s["provider"],
        "model":       s["model"],
        "available":   s["available"],
        "is_free":     s["is_free"],
        "is_local":    s["is_local"],
        "features":    s["features"],
        "setup_instructions": None,
    }


# Re-export the NLP helper so conversational_chatbot.py can use it
from services.aura_ai_engine import (
    classify_intent as _classify,
    extract_entities,
    analyze_sentiment,
    is_crisis,
)

class _NLPShim:
    """Thin shim so the router can call nlp.detect_intents() etc."""
    def detect_intents(self, text: str):
        return [i for i, _ in _classify(text, top_n=5)]
    def extract_entities(self, text: str):
        return extract_entities(text)
    def analyze_sentiment(self, text: str):
        return analyze_sentiment(text)
    def is_crisis(self, text: str):
        return is_crisis(text), (1.0 if is_crisis(text) else 0.0)
    def extract_pain_scale(self, text: str):
        import re
        m = re.search(r'\b(\d{1,2})\s*(?:out of|/)\s*10\b|\bpain\s+(?:is\s+|score\s+)?(\d{1,2})\b',
                      text, re.IGNORECASE)
        if m:
            v = int(m.group(1) or m.group(2))
            return v if 0 <= v <= 10 else None
        return None

nlp = _NLPShim()
