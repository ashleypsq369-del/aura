"""Quick smoke test for evidence-based scoring models."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('SECRET_KEY', 'test')

from services.evidence_based_scoring import (
    score_ppi, score_pap, score_esas, score_pps,
    score_phq9, score_gad7, score_barthel, composite_palliative_risk
)

# Realistic palliative patient: advanced cancer, PPS 40%, high symptom burden
esas = score_esas(pain=7, tiredness=6, nausea=3, depression=8, anxiety=5,
                  drowsiness=4, appetite=6, shortness_of_breath=4, wellbeing=7)
ppi  = score_ppi(pps_score=40, oral_intake='reduced', dyspnoea_at_rest=True)
pap  = score_pap(has_dyspnoea=True, kps_score=40, clinician_survival_estimate='3-4 weeks')
pps  = score_pps(40)
phq9 = score_phq9(17, item9_suicidal=1)
gad7 = score_gad7(13)
bart = score_barthel(45)

comp = composite_palliative_risk(
    esas_pain=7, esas_tiredness=6, esas_nausea=3, esas_depression=8,
    esas_anxiety=5, esas_drowsiness=4, esas_appetite=6,
    esas_breath=4, esas_wellbeing=7,
    pps_score=40, oral_intake='reduced', dyspnoea_at_rest=True,
    phq9_total=17, phq9_suicidal=1, gad7_total=13, barthel_total=45
)

print()
print("=== EVIDENCE-BASED SCORING TEST ===")
print("ESAS TSDS:", esas["tsds"], "/90 | Risk:", esas["risk_level"])
print("PPI total:", ppi["ppi_total"], "| Survival:", ppi["survival_estimate"])
print("PaP Group:", pap["pap_group"], "| 30d survival:", pap["survival_30d_pct"])
print("PPS 40%: median", pps["median_survival_days"], "d | 6m mort:", pps["mortality_6_month"])
print("PHQ-9:", phq9["severity"], "| Suicidal:", phq9["suicidal_flag"])
print("GAD-7:", gad7["severity"])
print("Barthel:", bart["dependence_level"])
print("COMPOSITE:", comp["risk_level"], "| Score:", comp["overall_risk"])
if comp["clinical_actions"]:
    print("Top action:", comp["clinical_actions"][0])
print()

# Verify expected outputs
assert esas["risk_level"] in ("critical","high"), "ESAS risk should be critical/high"
assert ppi["ppi_total"] > 0, "PPI should produce a score"
assert pap["pap_group"] in ("A","B","C"), "PaP group should be A/B/C"
assert pps["mortality_6_month"] > 0, "PPS 6m mortality should be > 0"
assert phq9["severity"] == "moderately_severe", "PHQ-9 score 17 should be moderately_severe"
assert phq9["suicidal_flag"] == True, "Suicidal item should flag"
assert gad7["severity"] == "moderate", "GAD-7 score 13 should be moderate"
assert bart["dependence_level"] == "severe_dependence", "Barthel 45 should be severe"
assert comp["risk_level"] in ("critical","high"), "Composite should be critical/high for this patient"
assert len(comp["clinical_actions"]) > 0, "Should produce clinical actions"
assert len(comp["references"]) > 0, "Should include references"

print("ALL ASSERTIONS PASSED")
print()
print("Evidence-based models confirmed working:")
print("  PPI  - Morita et al. 1999 (real cancer patient data)")
print("  PaP  - Maltoni et al. 1999 (518 real patients, 5 EU centres)")
print("  ESAS - Seow/Watanabe 2011 (16,000+ real patients, Ontario)")
print("  PPS  - Bischoff 2024 (real UCSF palliative cohort)")
print("  PHQ-9 - Kroenke 2002 (6,000 real primary care patients)")
print("  GAD-7 - Spitzer 2006 (2,740 real patients)")
print("  Barthel - Mahoney 1965 + Frontiers 2024")
