"""Patch the broken explain_symptom_focus function in comprehensive_ai.py"""

NEW_FUNC = '''async def explain_symptom_focus(patient, focus_data: dict, db):
    """Explain symptom patterns using actual Symptom model columns."""
    from src.db import Symptom as _Sym
    import numpy as _np

    symptom_type     = focus_data.get('symptom_type', 'pain')
    current_severity = focus_data.get('severity', 0)

    symptom_history = db.query(_Sym).filter(
        _Sym.patient_id == patient.id
    ).order_by(_Sym.recorded_at.desc()).limit(10).all()

    explanation   = f"Analyzing {symptom_type} pattern for {patient.full_name}. "
    risk_level    = "normal"
    recommendations = []
    trend         = "stable"

    col_map = {
        'pain':           lambda s: s.pain_level or 0,
        'nausea':         lambda s: (s.nausea_level or 0) if s.nausea else 0,
        'fatigue':        lambda s: (s.fatigue_level or 0) if s.fatigue else 0,
        'anxiety':        lambda s: (s.anxiety_level or 0) if s.anxiety else 0,
        'breathlessness': lambda s: s.breathlessness or 0,
        'dyspnea':        lambda s: s.breathlessness or 0,
        'depression':     lambda s: s.depression_level or 0,
        'appetite':       lambda s: s.appetite_level or 0,
    }
    get_level = col_map.get(symptom_type, lambda s: s.pain_level or 0)

    if len(symptom_history) > 1:
        recent = [get_level(s) for s in symptom_history[:3]]
        older  = [get_level(s) for s in symptom_history[3:6]] if len(symptom_history) >= 6 else recent
        if recent and older:
            if _np.mean(recent) > _np.mean(older) + 1:
                trend, risk_level = "worsening", "warning"
                explanation += f"{symptom_type.capitalize()} is worsening over time. "
            elif _np.mean(recent) < _np.mean(older) - 1:
                trend = "improving"
                explanation += f"{symptom_type.capitalize()} is improving. "

    if current_severity >= 7:
        risk_level = "critical"
        explanation += f"Current severity ({current_severity}/10) is severe. "
        recommendations.append("Urgent clinical review required")
    elif current_severity >= 5:
        risk_level = "warning"
        explanation += f"Current severity ({current_severity}/10) is moderate. "

    rec_map = {
        'pain':                    ["Consider breakthrough pain medication if score >= 7",
                                    "Review WHO analgesic ladder — step up if needed",
                                    "Non-pharmacological: positioning, heat/cold, relaxation"],
        'nausea':                  ["Administer prescribed antiemetic",
                                    "Small frequent meals, avoid strong odours",
                                    "Check if opioid-induced — consider dose reduction"],
        'breathlessness':          ["Check SpO2 immediately",
                                    "Position patient upright at 30-45 degrees",
                                    "Consider supplemental oxygen if SpO2 < 95%"],
        'dyspnea':                 ["Check SpO2 immediately",
                                    "Position patient upright",
                                    "Consider supplemental oxygen if SpO2 < 95%"],
        'anxiety':                 ["Breathing exercises: 4-7-8 technique",
                                    "Ensure patient feels safe and informed",
                                    "Review anxiolytic prescription with clinician"],
        'fatigue':                 ["Energy conservation and pacing strategies",
                                    "Check haemoglobin — may indicate anaemia",
                                    "Review medications for fatigue side-effects"],
    }
    recommendations.extend(rec_map.get(symptom_type, ["Continue monitoring and document changes"]))
    if current_severity >= 7 and 'Urgent clinical review required' not in recommendations:
        recommendations.insert(0, "Urgent clinical review required")

    return {
        "patient_id":       patient.id,
        "patient_name":     patient.full_name,
        "focus_type":       "symptom",
        "symptom_type":     symptom_type,
        "current_severity": current_severity,
        "trend":            trend,
        "risk_level":       risk_level,
        "explanation":      explanation,
        "history_count":    len(symptom_history),
        "recommendations":  recommendations[:6],
        "confidence":       0.80
    }

'''

with open('routers/comprehensive_ai.py', 'r', encoding='utf-8') as f:
    content = f.read()

func_sig = 'async def explain_symptom_focus(patient: Patient, focus_data: dict, db: Session):'
idx_start = content.find(func_sig)
if idx_start == -1:
    print('ERROR: function not found')
    exit(1)

idx_next = content.find('\nasync def ', idx_start + len(func_sig))
if idx_next == -1:
    print('ERROR: could not find end of function')
    exit(1)

old_func = content[idx_start:idx_next]
new_content = content.replace(old_func, NEW_FUNC, 1)

with open('routers/comprehensive_ai.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Done. Replaced {len(old_func)} chars with {len(NEW_FUNC)} chars.')

# Verify
remaining = [ln for ln in new_content.split('\n') if 'Symptom.symptom_type' in ln or 's.severity' in ln]
if remaining:
    print('WARNING: stale references remain:', remaining)
else:
    print('Clean - no stale Symptom.symptom_type or s.severity references.')
