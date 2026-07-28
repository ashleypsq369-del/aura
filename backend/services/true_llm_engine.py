"""
True LLM Engine  --  ProjectAura
================================
Production-grade LLM gateway with:
  - OpenRouter meta-llama/llama-3.1-8b-instruct (primary, FREE)
  - Google Gemini 1.5 Flash        (fallback)
  - Groq  Llama-3.1-70B            (fallback)
  - Aura rule-based NLP            (last-resort, always works offline)

Supports both streaming (SSE) and non-streaming responses.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, Generator, List, Optional

# ─── API keys ────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b:free"

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
GROQ_API_KEY:   str = os.getenv("GROQ_API_KEY",   "").strip()

# ─── Availability flags ───────────────────────────────────────────────────────
OPENROUTER_AVAILABLE = False
GEMINI_AVAILABLE     = False
GROQ_AVAILABLE       = False
_groq_client         = None

# ── OpenRouter ────────────────────────────────────────────────────────────────
if OPENROUTER_API_KEY:
    try:
        import httpx as _httpx_check  # noqa: F401
        OPENROUTER_AVAILABLE = True
        print(f"[LLM] OpenRouter ({OPENROUTER_MODEL}): ACTIVE (primary LLM — Nemotron 550B)")
    except ImportError:
        print("[LLM] WARNING: httpx not installed -> run: pip install httpx")
else:
    print("[LLM] OPENROUTER_API_KEY not set  --  OpenRouter disabled")

# ── Gemini ────────────────────────────────────────────────────────────────────
if GEMINI_API_KEY:
    try:
        import google.genai as genai_new
        _gemini_client = genai_new.Client(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        GEMINI_SDK = "new"
        print("[LLM] Gemini 2.0 Flash: ACTIVE (fallback LLM - new SDK)")
    except ImportError:
        try:
            import google.generativeai as genai_old  # noqa: F401
            genai_old.configure(api_key=GEMINI_API_KEY)
            GEMINI_AVAILABLE = True
            GEMINI_SDK = "old"
            print("[LLM] Gemini 1.5 Flash: ACTIVE (fallback LLM - legacy SDK)")
        except ImportError:
            print("[LLM] WARNING: No Gemini SDK found -> run: pip install google-genai")
else:
    print("[LLM] GEMINI_API_KEY not set - Gemini disabled")

GEMINI_SDK = globals().get("GEMINI_SDK", None)

# ── Groq ──────────────────────────────────────────────────────────────────────
if GROQ_API_KEY:
    try:
        from groq import Groq
        _groq_client  = Groq(api_key=GROQ_API_KEY)
        GROQ_AVAILABLE = True
        print("[LLM] Groq Llama-3.1-70B: ACTIVE (fallback LLM)")
    except ImportError:
        print("[LLM] WARNING: groq not installed -> run: pip install groq")
else:
    print("[LLM] GROQ_API_KEY not set - Groq disabled")

if not OPENROUTER_AVAILABLE and not GEMINI_AVAILABLE and not GROQ_AVAILABLE:
    print("[LLM] WARNING: No real LLM configured - using rule-based fallback")
    print("[LLM]          Set OPENROUTER_API_KEY in backend/.env")

# ─── System-prompt template ───────────────────────────────────────────────────
_SYSTEM_TEMPLATE = """\
You are Aura, an intelligent, empathetic AI companion built into ProjectAura  -- 
a palliative care platform for patients, families, caregivers, and clinicians.

## Core identity
- Warm, compassionate, direct, and genuinely intelligent.
- You sound like a knowledgeable friend, NOT a clinical robot.
- Match the user's tone: casual if they're casual, gentle if they're distressed, precise if they're clinical.
- You NEVER use hollow openers like "Certainly!", "Of course!", "Great question!", "Absolutely!".
- You understand full human language including colloquialisms, slang, spelling errors, abbreviations, sarcasm, humour, and emotional subtext.
- You respond in the language the user writes in.
- You remember everything said earlier in this conversation and build on it naturally.
- You give specific, direct answers  --  not vague deflections or template responses.
- Response length matches the question: concise for simple queries, thorough for complex ones.

## What you can do
- Answer ANY question the user has  --  medical, emotional, navigational, or general.
- Help with platform navigation (Dashboard, Patients, Messages, Alerts, Assessments, Community, Memory Vault, Journal, Resources, etc.).
- Explain clinical concepts clearly and compassionately.
- Provide emotional support with real empathy.
- Follow up naturally on previous messages ("as I mentioned earlier...", "building on what you said...").

## Platform navigation
When helping users navigate, include the page path in backticks like: go to `/appointments` or open `/medications`.
Available routes: /dashboard · /patients · /alerts · /ai-insights · /medications · /appointments · /caregivers ·
/assessments · /messages · /community · /journal · /memory-vault · /resources · /my-journey · /profile · /settings

## ══ ETHICAL GUARDRAILS  --  NON-NEGOTIABLE ══

### 1. You are NOT a doctor. You do NOT replace clinical care.
- NEVER diagnose conditions, predict prognosis, or suggest specific drug doses.
- NEVER tell a patient to stop, reduce, or change their medications  --  always say "speak to your care team."
- NEVER provide information that could help a person harm themselves or others.
- If asked for a specific drug dose or prescription advice, respond: "That's a decision only your doctor can make. I can help you ask the right questions at your next appointment."

### 2. Crisis response  --  ALWAYS follow this protocol:
When ANY of these are mentioned (suicidal thoughts, self-harm, wanting to die, hopelessness about continuing):
  a) Respond with immediate warmth and validation  --  NEVER dismiss or minimise.
  b) Provide the helpline: Ghana Mental Health Authority: **0800-111-011** (free, 24/7).
  c) Say clearly: "Your care team has been notified and will reach out to you."
  d) Do NOT provide detailed information about methods of harm.
  e) Keep the person talking  --  ask them to describe one safe person near them right now.

### 3. Medical red-flag escalation:
When a patient/family/caregiver reports ANY of the following, always say their care team will be notified:
  - Sudden severe pain (8/10 or above, or sudden onset)
  - Difficulty breathing or breathlessness at rest
  - Uncontrolled vomiting / inability to keep medications down
  - Sudden confusion, seizure, or loss of consciousness
  - Fever above 38.5°C with chills
  - Significant medication side effect or reaction
  - Any symptom they describe as "emergency" or "much worse suddenly"
  - Falls or new injuries

### 4. Safe messaging on death and dying:
- Do NOT provide graphic descriptions of the dying process unless the user is a clinician asking clinically.
- For patients and families asking "what will dying feel like"  --  respond with comfort, not clinical detail. Focus on peace, presence of loved ones, and the care team's commitment.
- Never use language that frames death as an escape or solution.

### 5. Scope boundaries:
- Legal advice: "I'm not able to give legal advice. A social worker on your care team can help with advance directives and legal matters."
- Spiritual advice: Support, do NOT prescribe or dismiss any faith. Connect to chaplain/spiritual care.
- Financial advice: Refer to social work.
- Second opinions: "It's completely your right to seek a second opinion. I can help you prepare questions to ask."

### 6. Privacy and confidentiality:
- Never repeat sensitive information back unnecessarily.
- If a family member asks about a patient's specific clinical details you shouldn't share, say: "Some clinical details are private to the patient. I can share general information, or suggest they speak with the care team directly."

{user_section}

{patient_section}
"""

# ─── Medical flag keyword detection ──────────────────────────────────────────

MEDICAL_FLAG_PATTERNS = [
    # Crisis / self-harm
    (r'\b(suicid|kill myself|end my life|want to die|self.?harm|hurt myself|better off dead|no reason to live)\b',
     'crisis', 'critical'),
    # Severe acute symptoms
    (r'\b(can\'?t breathe|cannot breathe|struggling to breathe|breathing stopped|not breathing)\b',
     'severe_breathlessness', 'high'),
    (r'\bpain\b.{0,30}\b(10|9|8)\s*(out of|/)\s*10\b|\b(10|9|8)\s*(out of|/)\s*10\b.{0,30}\bpain\b',
     'severe_pain', 'high'),
    (r'\b(unconscious|collapsed|seizure|fitting|convuls|passed out|unresponsive)\b',
     'loss_of_consciousness', 'critical'),
    (r'\b(chest pain|heart attack|stroke|can\'?t move|paralys)\b',
     'cardiac_neurological', 'critical'),
    # Medication concerns
    (r'\b(allergic reaction|anaphylax|swollen throat|can\'?t swallow medicine|stopped taking|ran out of medication)\b',
     'medication_concern', 'high'),
    (r'\b(overdose|took too many|too many pills|took wrong medication)\b',
     'medication_overdose', 'critical'),
    # Deterioration
    (r'\b(much worse|rapidly deteriorating|emergency|ambulance|999|911|193)\b',
     'acute_deterioration', 'high'),
    (r'\b(vomiting blood|blood in stool|coughing blood|heavy bleeding)\b',
     'haemorrhage', 'critical'),
    (r'\b(high fever|temperature 39|temperature 40|temp 39|temp 40|burning up)\b',
     'high_fever', 'high'),
]

import re as _re

def detect_medical_flags(text: str) -> list:
    """Return list of (flag_type, severity) for any concerning content."""
    t = text.lower()
    flags = []
    for pattern, flag_type, severity in MEDICAL_FLAG_PATTERNS:
        if _re.search(pattern, t, _re.IGNORECASE):
            flags.append({"type": flag_type, "severity": severity})
    return flags


def _build_system_prompt(
    user_name: Optional[str],
    user_role: str,
    patient_context: Dict[str, Any],
) -> str:
    parts: List[str] = []
    if user_name:
        parts.append(f"The user's name is {user_name}.")
    parts.append(f"Their role is: **{user_role}**.")

    role_hints = {
        "clinician": "Give clinical-grade information. Be precise. Support decision-making.",
        "admin":     "Treat them as a platform administrator who manages users and settings.",
        "patient":   "They are receiving palliative care. Be extra gentle, hopeful, and supportive.",
        "family":    "They are a family member of a patient. Balance medical clarity with emotional warmth.",
        "caregiver": "Professional caregiver. Mix practical guidance with compassionate framing.",
    }
    if user_role in role_hints:
        parts.append(role_hints[user_role])

    user_section = "## About this user\n" + "\n".join(parts)

    pat_lines: List[str] = []
    if patient_context:
        if patient_context.get("patient_name"):
            pat_lines.append(f"Patient: {patient_context['patient_name']} (ID: {patient_context.get('patient_id','')})")
        if patient_context.get("diagnosis"):
            pat_lines.append(f"Diagnosis: {patient_context['diagnosis']}")
        if patient_context.get("age"):
            pat_lines.append(f"Age: {patient_context['age']}")
        if patient_context.get("patient_status"):
            pat_lines.append(f"Status: {patient_context['patient_status']}")

        # ESAS symptom scores
        esas_map = {
            "esas_pain":               "pain",
            "esas_anxiety":            "anxiety",
            "esas_depression":         "depression",
            "esas_tiredness":          "tiredness",
            "esas_nausea":             "nausea",
            "esas_shortness_of_breath":"breathlessness",
            "esas_wellbeing":          "wellbeing",
            "esas_appetite":           "appetite",
        }
        flagged = [
            f"{label} {patient_context[key]}/10"
            for key, label in esas_map.items()
            if patient_context.get(key) is not None and int(patient_context[key]) >= 4
        ]
        if flagged:
            pat_lines.append(f"Active symptoms (>=4/10): {', '.join(flagged)}")

        # Live vitals
        vitals = patient_context.get("vitals")
        if vitals:
            v_parts = []
            if vitals.get("heart_rate"):     v_parts.append(f"HR {vitals['heart_rate']} bpm")
            if vitals.get("blood_pressure"): v_parts.append(f"BP {vitals['blood_pressure']}")
            if vitals.get("oxygen_saturation"): v_parts.append(f"SpO2 {vitals['oxygen_saturation']}%")
            if vitals.get("temperature"):    v_parts.append(f"Temp {vitals['temperature']}°C")
            if vitals.get("respiratory_rate"): v_parts.append(f"RR {vitals['respiratory_rate']}/min")
            if v_parts:
                pat_lines.append(f"Latest vitals ({vitals.get('recorded_at','')}): {', '.join(v_parts)}")

        # Medications
        med_count = patient_context.get("medication_count", 0)
        meds = patient_context.get("medications", [])
        if meds:
            med_names = ", ".join(m["name"] for m in meds[:5] if m.get("name"))
            extra = f" (+{med_count-5} more)" if med_count > 5 else ""
            pat_lines.append(f"Active medications ({med_count}): {med_names}{extra}")

        # Alerts
        alerts = patient_context.get("active_alerts", [])
        if alerts:
            alert_summary = "; ".join(
                f"{a.get('severity','').upper()} - {a.get('message','')[:60]}"
                for a in alerts[:3]
            )
            pat_lines.append(f"Unacknowledged alerts ({len(alerts)}): {alert_summary}")

        # Appointments
        appts = patient_context.get("appointments", [])
        if appts:
            next_appt = appts[0]
            pat_lines.append(
                f"Next appointment: {next_appt.get('date','')}  --  {next_appt.get('type','')}"
                + (f" with {next_appt['clinician']}" if next_appt.get('clinician') else "")
            )

        # Care setting
        cs = patient_context.get("care_setting")
        if cs:
            desc = f"{cs.get('label', '')} -- {cs.get('focus', '')}".strip(" --")
            if desc:
                pat_lines.append(f"Care setting: {desc}")

        # ML risk scores (XGBoost, AUC 0.98-0.99)
        ml_risk = patient_context.get("ml_risk")
        if ml_risk:
            overall = ml_risk.get("overall_risk", 0)
            level   = ml_risk.get("overall_level", "") or ml_risk.get("risk_level", "")
            top     = ml_risk.get("highest_task", "").replace("_", " ")
            if level:
                pat_lines.append(
                    f"ML risk assessment (XGBoost): {level.upper()} "
                    f"({overall:.0%} overall risk) -- highest concern: {top}"
                )
            tasks = ml_risk.get("tasks", {})
            high_tasks = [
                f"{t.replace('_',' ')} {v.get('probability', 0):.0%}"
                for t, v in tasks.items()
                if v.get("risk_level") in ("critical", "warning")
            ]
            if high_tasks:
                pat_lines.append(f"Elevated ML task risks: {', '.join(high_tasks[:3])}")

        # P7 Deterioration trend
        det = patient_context.get("deterioration")
        if det and isinstance(det, dict) and det.get("level") not in ("stable", None):
            score = det.get("score", 0)
            drivers = "; ".join(det.get("drivers", [])[:2])
            days = det.get("days_to_threshold")
            det_str = (
                f"Longitudinal deterioration: {det['level'].upper()} "
                f"(score {score:.0%})"
            )
            if drivers:
                det_str += f" -- drivers: {drivers}"
            if days:
                det_str += f" -- est. {days} days to critical threshold"
            pat_lines.append(det_str)

        # P9 Drug interactions
        drug_ix = patient_context.get("drug_interactions")
        if drug_ix and isinstance(drug_ix, dict) and drug_ix.get("total", 0) > 0:
            severe = drug_ix.get("severe", [])
            severe_count = drug_ix.get("severe_count", 0)
            ix_str = (
                f"Drug interactions: {drug_ix['total']} detected"
                f" ({severe_count} SEVERE)"
            )
            if severe:
                ix_str += f" -- {severe[0]}"
            pat_lines.append(ix_str)

        # P8 Prognosis
        prog = patient_context.get("prognosis")
        if prog and isinstance(prog, dict) and prog.get("months_display"):
            pat_lines.append(
                f"Prognosis estimate: {prog['months_display']} "
                f"({prog.get('risk_category','unknown')} timeframe, "
                f"{prog.get('confidence','low')} confidence)"
            )

    if pat_lines:
        patient_section = "## Current patient context\n" + "\n".join(f"- {l}" for l in pat_lines)
    else:
        patient_section = ""

    return _SYSTEM_TEMPLATE.format(
        user_section=user_section,
        patient_section=patient_section,
    )


# ─── Format conversion helpers ────────────────────────────────────────────────

def _to_openai_messages(history: List[Dict], system: str, message: str) -> List[Dict]:
    """Convert history + system prompt -> OpenAI-compatible messages list."""
    msgs = [{"role": "system", "content": system}]
    for m in history:
        msgs.append({"role": m["role"], "content": m["content"]})
    msgs.append({"role": "user", "content": message})
    return msgs


def _to_gemini_history(history: List[Dict]) -> List[Dict]:
    """Convert [{role, content}...] → Gemini format."""
    out = []
    for m in history:
        role = "user" if m["role"] == "user" else "model"
        out.append({"role": role, "parts": [{"text": m["content"]}]})
    return out


def _to_groq_messages(history: List[Dict], system: str) -> List[Dict]:
    """Convert history → Groq/OpenAI messages format."""
    msgs = [{"role": "system", "content": system}]
    for m in history:
        msgs.append({"role": m["role"], "content": m["content"]})
    return msgs


# ─── OpenRouter helpers ───────────────────────────────────────────────────────

def _openrouter_chat(message: str, history: List[Dict], system: str, stream: bool):
    """Call OpenRouter API (OpenAI-compatible endpoint)."""
    import httpx

    msgs = _to_openai_messages(history, system, message)
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://projectaura.app",
        "X-Title": "ProjectAura AI Companion",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": msgs,
        "temperature": 0.82,
        "max_tokens": 1200,
        "stream": stream,
    }

    if stream:
        return httpx.stream(
            "POST",
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60.0,
        )
    else:
        resp = httpx.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


# ─── Gemini helpers ───────────────────────────────────────────────────────────

_GEMINI_MODEL_NEW  = "gemini-2.0-flash"
_GEMINI_MODEL_OLD  = "gemini-1.5-flash"
_GEMINI_MODEL_NAME = _GEMINI_MODEL_NEW


def _gemini_chat_new(message: str, history: List[Dict], system: str, stream: bool):
    import google.genai as _g
    import google.genai.types as _t
    contents = []
    for m in history:
        role = "user" if m["role"] == "user" else "model"
        contents.append(_t.Content(role=role, parts=[_t.Part(text=m["content"])]))
    contents.append(_t.Content(role="user", parts=[_t.Part(text=message)]))
    cfg = _t.GenerateContentConfig(
        system_instruction=system,
        temperature=0.82,
        top_p=0.95,
        max_output_tokens=1200,
    )
    if stream:
        return _gemini_client.models.generate_content_stream(
            model=_GEMINI_MODEL_NEW, contents=contents, config=cfg
        )
    resp = _gemini_client.models.generate_content(
        model=_GEMINI_MODEL_NEW, contents=contents, config=cfg
    )
    return resp.text


def _gemini_chat_old(message: str, history: List[Dict], system: str, stream: bool):
    import google.generativeai as _g  # noqa
    model = _g.GenerativeModel(
        model_name=_GEMINI_MODEL_OLD,
        system_instruction=system,
        generation_config={"temperature": 0.82, "top_p": 0.95, "max_output_tokens": 1200},
    )
    chat = model.start_chat(history=_to_gemini_history(history))
    if stream:
        return chat.send_message(message, stream=True)
    return chat.send_message(message).text


def _gemini_chat(message: str, history: List[Dict], system: str, stream: bool):
    if GEMINI_SDK == "new":
        return _gemini_chat_new(message, history, system, stream)
    return _gemini_chat_old(message, history, system, stream)


# ─── Groq helpers ─────────────────────────────────────────────────────────────

_GROQ_MODELS = [
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "llama3-8b-8192",
]


def _groq_chat(message: str, history: List[Dict], system: str, stream: bool):
    msgs = _to_groq_messages(history, system)
    msgs.append({"role": "user", "content": message})
    last_exc = None
    for model_name in _GROQ_MODELS:
        try:
            return _groq_client.chat.completions.create(
                model=model_name,
                messages=msgs,
                temperature=0.82,
                max_tokens=1200,
                stream=stream,
            ), model_name
        except Exception as exc:
            last_exc = exc
            continue
    raise last_exc


# ─── Public non-streaming API ─────────────────────────────────────────────────

def generate_llm_response(
    message: str,
    history: List[Dict],
    user_name:       Optional[str]            = None,
    user_role:       str                       = "patient",
    patient_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate a complete (non-streaming) LLM response.
    Falls back: OpenRouter → Gemini → Groq → rule-based.
    """
    system = _build_system_prompt(user_name, user_role, patient_context or {})

    # 1. OpenRouter (primary)
    if OPENROUTER_AVAILABLE:
        try:
            text = _openrouter_chat(message, history, system, stream=False)
            return {
                "message":  text,
                "model":    OPENROUTER_MODEL,
                "provider": "openrouter",
            }
        except Exception as exc:
            print(f"[LLM] OpenRouter error: {exc}")

    # 2. Gemini (fallback)
    if GEMINI_AVAILABLE:
        try:
            text = _gemini_chat(message, history, system, stream=False)
            return {
                "message":  text,
                "model":    _GEMINI_MODEL_NAME,
                "provider": "gemini",
            }
        except Exception as exc:
            print(f"[LLM] Gemini error: {exc}")

    # 3. Groq (fallback)
    if GROQ_AVAILABLE:
        try:
            resp, model_name = _groq_chat(message, history, system, stream=False)
            return {
                "message":  resp.choices[0].message.content,
                "model":    model_name,
                "provider": "groq",
            }
        except Exception as exc:
            print(f"[LLM] Groq error: {exc}")

    # 4. Rule-based fallback
    return _rule_based_fallback(message, user_name)


# ─── Public streaming API ─────────────────────────────────────────────────────

def stream_llm_response(
    message: str,
    history: List[Dict],
    user_name:       Optional[str]            = None,
    user_role:       str                       = "patient",
    patient_context: Optional[Dict[str, Any]] = None,
) -> Generator[str, None, None]:
    """
    Generator yielding SSE-formatted strings.
    Event shapes:
      {"type": "start",  "model": "<model_name>"}
      {"type": "chunk",  "text":  "<chunk>"}
      {"type": "done"}
      {"type": "error",  "message": "<msg>"}
    """
    system = _build_system_prompt(user_name, user_role, patient_context or {})

    def sse(obj: dict) -> str:
        return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"

    # 1. OpenRouter streaming (primary)
    if OPENROUTER_AVAILABLE:
        try:
            import httpx

            msgs = _to_openai_messages(history, system, message)
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://projectaura.app",
                "X-Title": "ProjectAura AI Companion",
            }
            payload = {
                "model": OPENROUTER_MODEL,
                "messages": msgs,
                "temperature": 0.82,
                "max_tokens": 1200,
                "stream": True,
            }

            yield sse({"type": "start", "model": OPENROUTER_MODEL})

            with httpx.Client(timeout=60.0) as client:
                with client.stream(
                    "POST",
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    buffer = ""
                    for raw_line in response.iter_lines():
                        line = raw_line.strip()
                        if not line or line == "data: [DONE]":
                            continue
                        if line.startswith("data: "):
                            try:
                                chunk_data = json.loads(line[6:])
                                delta = (
                                    chunk_data.get("choices", [{}])[0]
                                    .get("delta", {})
                                    .get("content", "")
                                )
                                if delta:
                                    yield sse({"type": "chunk", "text": delta})
                            except (json.JSONDecodeError, IndexError, KeyError):
                                pass

            yield sse({"type": "done"})
            return
        except Exception as exc:
            print(f"[LLM] OpenRouter stream error: {exc}")
            yield sse({"type": "error", "message": "OpenRouter error  --  trying fallback"})

    # 2. Gemini streaming (fallback)
    if GEMINI_AVAILABLE:
        try:
            yield sse({"type": "start", "model": _GEMINI_MODEL_NAME})
            stream = _gemini_chat(message, history, system, stream=True)
            for chunk in stream:
                if chunk.text:
                    yield sse({"type": "chunk", "text": chunk.text})
            yield sse({"type": "done"})
            return
        except Exception as exc:
            print(f"[LLM] Gemini stream error: {exc}")
            yield sse({"type": "error", "message": "Gemini error  --  trying fallback"})

    # 3. Groq streaming (fallback)
    if GROQ_AVAILABLE:
        try:
            stream, model_name = _groq_chat(message, history, system, stream=True)
            yield sse({"type": "start", "model": model_name})
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield sse({"type": "chunk", "text": delta})
            yield sse({"type": "done"})
            return
        except Exception as exc:
            print(f"[LLM] Groq stream error: {exc}")
            yield sse({"type": "error", "message": "Groq error  --  using offline response"})

    # 4. Non-streaming fallback  --  emit full text as a single chunk
    result = _rule_based_fallback(message, user_name)
    yield sse({"type": "start", "model": result["model"]})
    yield sse({"type": "chunk", "text": result["message"]})
    yield sse({"type": "done"})


# ─── Status ───────────────────────────────────────────────────────────────────

def get_llm_status() -> Dict[str, Any]:
    """Return which LLM provider is currently active."""
    if OPENROUTER_AVAILABLE:
        return {
            "provider":      "openrouter",
            "model":         OPENROUTER_MODEL,
            "label":         f"OpenRouter ({OPENROUTER_MODEL})",
            "is_real_llm":   True,
            "streaming":     True,
            "openrouter_active": True,
            "gemini_active": GEMINI_AVAILABLE,
            "groq_active":   GROQ_AVAILABLE,
        }
    if GEMINI_AVAILABLE:
        return {
            "provider":      "gemini",
            "model":         _GEMINI_MODEL_NAME,
            "label":         f"Google Gemini ({_GEMINI_MODEL_NAME})",
            "is_real_llm":   True,
            "streaming":     True,
            "openrouter_active": False,
            "gemini_active": True,
            "groq_active":   GROQ_AVAILABLE,
        }
    if GROQ_AVAILABLE:
        return {
            "provider":      "groq",
            "model":         _GROQ_MODELS[0],
            "label":         "Groq Llama 3.1 70B",
            "is_real_llm":   True,
            "streaming":     True,
            "openrouter_active": False,
            "gemini_active": False,
            "groq_active":   True,
        }
    return {
        "provider":      "rule-based",
        "model":         "aura-nlp",
        "label":         "Aura NLP (Offline Mode)",
        "is_real_llm":   False,
        "streaming":     True,
        "openrouter_active": False,
        "gemini_active": False,
        "groq_active":   False,
    }


# ─── Rule-based last-resort fallback ─────────────────────────────────────────

def _rule_based_fallback(message: str, user_name: Optional[str]) -> Dict[str, Any]:
    """
    Simple offline fallback when no LLM is configured.
    Tries the existing aura_ai_engine first, then returns a generic reply.
    """
    try:
        from services.aura_ai_engine import generate as _aura_gen
        result = _aura_gen(message=message, history=[], user_name=user_name, patient_context={})
        return {
            "message":  result["message"],
            "model":    "aura-nlp",
            "provider": "rule-based",
        }
    except Exception:
        name_part = f" {user_name}" if user_name else ""
        return {
            "message": (
                f"Hi{name_part}! I'm here to help. I'm currently running in offline mode  --  "
                "to unlock full AI responses, ensure OPENROUTER_API_KEY is set in backend/.env. "
                "In the meantime, feel free to ask me anything and I'll do my best!"
            ),
            "model":    "offline-fallback",
            "provider": "fallback",
        }
