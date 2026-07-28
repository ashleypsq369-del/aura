"""
ML Model Service  --  loads trained XGBoost models + real SHAP explainers.
Models are trained by ml_training/train_models_now.py.
"""

import logging
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

TASK_NAMES = [
    "vital_risk", "symptom_burden", "functional_decline",
    "cognitive_impairment", "mental_health_risk", "medication_risk",
    "caregiver_burden", "admission_risk",
]

# Human-readable display names for features
FEATURE_DISPLAY = {
    "heart_rate":            "Heart Rate (bpm)",
    "bp_systolic":           "Systolic BP (mmHg)",
    "bp_diastolic":          "Diastolic BP (mmHg)",
    "oxygen_saturation":     "O2 Saturation (%)",
    "temperature":           "Temperature (C)",
    "respiratory_rate":      "Respiratory Rate (/min)",
    "age":                   "Patient Age",
    "pps":                   "Palliative Performance Scale",
    "esas_pain":             "Pain (ESAS)",
    "esas_tired":            "Fatigue (ESAS)",
    "esas_nausea":           "Nausea (ESAS)",
    "esas_depress":          "Depression (ESAS)",
    "esas_anxiety":          "Anxiety (ESAS)",
    "esas_drowsy":           "Drowsiness (ESAS)",
    "esas_appetite":         "Appetite (ESAS)",
    "esas_breath":           "Breathlessness (ESAS)",
    "esas_wellbeing":        "Wellbeing (ESAS)",
    "esas_total":            "Total Symptom Burden (ESAS)",
    "phq9":                  "Depression Score (PHQ-9)",
    "gad7":                  "Anxiety Score (GAD-7)",
    "barthel":               "ADL Independence (Barthel)",
    "mmse":                  "Cognitive Function (MMSE)",
    "zarit":                 "Caregiver Burden (Zarit)",
    "meds_count":            "Medication Count",
    "comorbidities":         "Comorbidity Count",
    "recent_ed_visits":      "Recent ED Visits (6m)",
    "ed_visits_6m":          "Recent ED Visits (6m)",
    "social_support":        "Social Support Score",
    "high_risk_meds":        "High-Risk Medications",
    "drug_interactions":     "Drug Interactions",
    "adherence_score":       "Medication Adherence (MMAS)",
    "recent_delirium":       "Recent Delirium History",
    "cog_affecting_meds":    "Cognitively Impairing Meds",
    "care_hours_per_week":   "Weekly Care Hours",
    "carer_age":             "Caregiver Age",
    "has_respite":           "Respite Care Available",
    "patient_pps":           "Patient PPS (Caregiver view)",
    "patient_esas_total":    "Patient Symptom Burden",
    "recent_hospitalisations": "Recent Hospitalisations",
}


class MLModelService:
    def __init__(self):
        self.models:    Dict[str, Any] = {}
        self.scalers:   Dict[str, Any] = {}
        self.explainers: Dict[str, Any] = {}
        self.features:  Dict[str, List[str]] = {}
        self.metadata:  Dict[str, Dict] = {}
        self.available  = False
        self._load_all()

    def _models_dir(self) -> Path:
        return Path(__file__).parent.parent / "ml_training" / "models"

    def _get_latest_version(self, task_dir: Path) -> Optional[str]:
        if not task_dir.exists():
            return None
        versions = sorted(
            [d.name for d in task_dir.iterdir() if d.is_dir()],
            reverse=True
        )
        return versions[0] if versions else None

    def _load_all(self):
        try:
            import joblib
        except ImportError:
            logger.warning("joblib not installed")
            return

        models_dir = self._models_dir()
        if not models_dir.exists():
            logger.warning(f"Models dir not found: {models_dir}")
            return

        loaded = 0
        for task in TASK_NAMES:
            task_dir = models_dir / task
            version  = self._get_latest_version(task_dir)
            if not version:
                logger.debug(f"No trained model for {task} yet")
                continue

            vdir = task_dir / version

            try:
                # ── Model (required) — load directly, no thread ────────────
                model_path = vdir / "model.joblib"
                if not model_path.exists():
                    logger.warning(f"model.joblib missing for {task}")
                    continue

                self.models[task] = joblib.load(model_path)

                # ── Scaler (optional) ──────────────────────────────────────
                scaler_path = vdir / "scaler.joblib"
                if scaler_path.exists():
                    self.scalers[task] = joblib.load(scaler_path)

                # ── SHAP explainer — rebuild inline from model (faster than
                #    loading the large .joblib explainer files) ─────────────
                self._try_rebuild_explainer(task)
                if task not in self.explainers:
                    # Fallback: try loading the saved explainer
                    explainer_path = vdir / "explainer.joblib"
                    if explainer_path.exists():
                        try:
                            self.explainers[task] = joblib.load(explainer_path)
                        except Exception as e:
                            logger.warning(f"SHAP explainer load failed for {task}: {e}")

                # ── Metadata ───────────────────────────────────────────────
                meta_path = vdir / "metadata.json"
                if meta_path.exists():
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                    self.features[task] = meta.get("feature_names", [])
                    self.metadata[task] = meta

                logger.info(f"Loaded {task} v{version}  |  "
                            f"SHAP: {'yes' if task in self.explainers else 'no'}")
                loaded += 1

            except Exception as e:
                logger.error(f"Failed to load {task}: {e}")

        if loaded > 0:
            self.available = True
            logger.info(f"ML Service: {loaded}/{len(TASK_NAMES)} models loaded")
        else:
            logger.warning("ML Service: no models loaded  --  run train_models_now.py first")

    def _try_rebuild_explainer(self, task: str):
        """Try to build a TreeExplainer from an already-loaded model."""
        if task not in self.models:
            return
        try:
            import shap
            self.explainers[task] = shap.TreeExplainer(self.models[task])
            logger.info(f"Rebuilt SHAP TreeExplainer inline for {task}")
        except Exception as e:
            logger.debug(f"Could not build explainer for {task}: {e}")

    def is_available(self) -> bool:
        return self.available

    def get_available_tasks(self) -> List[str]:
        return list(self.models.keys())

    def predict_with_shap(
        self,
        task: str,
        patient_data: Dict[str, Any],
        top_k: int = 10,
    ) -> Optional[Dict[str, Any]]:
        """
        Run prediction + real SHAP values for a single patient.

        Returns dict with:
          prediction, probability, risk_level,
          top_features (list of dicts with real SHAP values),
          model_type, shap_available
        """
        if task not in self.models:
            return None

        try:
            feature_names = self.features.get(task) or list(patient_data.keys())
            X = np.array(
                [[float(patient_data.get(f, 0)) for f in feature_names]],
                dtype=np.float64
            )

            # Scale
            if task in self.scalers:
                X_s = self.scalers[task].transform(X)
            else:
                X_s = X

            model = self.models[task]
            proba = float(model.predict_proba(X_s)[0][1])
            pred  = int(model.predict(X_s)[0])

            risk_level = (
                "critical" if proba >= 0.75 else
                "warning"  if proba >= 0.45 else
                "normal"
            )

            # ── Real SHAP values ─────────────────────────────────────────
            top_features = []
            shap_available = False

            explainer = self.explainers.get(task)
            if explainer is not None:
                try:
                    raw = explainer.shap_values(X_s)
                    # XGBoost TreeExplainer may return list (one per class) or 2-D array
                    if isinstance(raw, list):
                        shap_vals = raw[1][0] if len(raw) > 1 else raw[0][0]
                    else:
                        shap_vals = raw[0]

                    # Sort by absolute value
                    pairs = sorted(
                        zip(feature_names, [float(patient_data.get(f, 0)) for f in feature_names], shap_vals),
                        key=lambda x: abs(x[2]),
                        reverse=True
                    )
                    for fname, fval, sval in pairs[:top_k]:
                        top_features.append({
                            "feature":      fname,
                            "display_name": FEATURE_DISPLAY.get(fname, fname.replace("_", " ").title()),
                            "value":        round(float(fval), 3),
                            "shap_value":   round(float(sval), 4),
                            "impact":       "increases_risk" if sval > 0 else "decreases_risk",
                            "importance":   round(abs(float(sval)), 4),
                            "pct":          0.0,  # filled below
                        })
                    # Normalise to percentage
                    total_imp = sum(f["importance"] for f in top_features) or 1
                    for f in top_features:
                        f["pct"] = round(f["importance"] / total_imp * 100, 1)

                    shap_available = True

                except Exception as e:
                    logger.warning(f"SHAP computation failed for {task}: {e}")

            # Fallback to XGBoost feature importance (not SHAP but still useful)
            if not top_features:
                fi = getattr(model, "feature_importances_", None)
                if fi is not None:
                    pairs = sorted(
                        zip(feature_names, fi),
                        key=lambda x: x[1], reverse=True
                    )
                    total = sum(v for _, v in pairs[:top_k]) or 1
                    for fname, imp in pairs[:top_k]:
                        fval = float(patient_data.get(fname, 0))
                        top_features.append({
                            "feature":      fname,
                            "display_name": FEATURE_DISPLAY.get(fname, fname.replace("_", " ").title()),
                            "value":        round(fval, 3),
                            "shap_value":   0.0,
                            "impact":       "neutral",
                            "importance":   round(float(imp), 4),
                            "pct":          round(float(imp) / total * 100, 1),
                        })

            # SHAP base value (expected prediction)
            base_val = 0.0
            if explainer is not None and hasattr(explainer, "expected_value"):
                ev = explainer.expected_value
                if isinstance(ev, (list, np.ndarray)):
                    base_val = float(ev[1]) if len(ev) > 1 else float(ev[0])
                else:
                    base_val = float(ev)

            return {
                "prediction":     pred,
                "probability":    round(proba, 4),
                "risk_level":     risk_level,
                "model_type":     "xgboost",
                "shap_available": shap_available,
                "top_features":   top_features,
                "base_value":     round(base_val, 4),
                "task":           task,
                "metrics":        self.metadata.get(task, {}).get("metrics", {}),
            }

        except Exception as e:
            logger.error(f"predict_with_shap failed for {task}: {e}", exc_info=True)
            return None

    def predict_all_tasks(
        self,
        patient_data: Dict[str, Any],
        tasks: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Run all available tasks for a patient and return combined risk profile."""
        tasks = tasks or list(self.models.keys())
        results = {}
        for task in tasks:
            if task in self.models:
                r = self.predict_with_shap(task, patient_data, top_k=8)
                if r:
                    results[task] = r
        return results

    def get_overall_risk(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute a single overall risk score from all tasks.
        Returns: overall_risk (0-1), risk_level, contributing_tasks.
        """
        task_results = self.predict_all_tasks(patient_data)
        if not task_results:
            return {"overall_risk": 0.0, "risk_level": "unknown", "tasks": {}}

        # Weight tasks by clinical importance
        WEIGHTS = {
            "vital_risk":          1.5,
            "admission_risk":      1.3,
            "symptom_burden":      1.2,
            "functional_decline":  1.1,
            "mental_health_risk":  1.0,
            "cognitive_impairment":1.0,
            "medication_risk":     0.9,
            "caregiver_burden":    0.8,
        }
        weighted_sum, weight_total = 0.0, 0.0
        for task, r in task_results.items():
            w = WEIGHTS.get(task, 1.0)
            weighted_sum  += r["probability"] * w
            weight_total  += w

        overall = weighted_sum / weight_total if weight_total > 0 else 0.0
        risk_level = (
            "critical"     if overall >= 0.70 else
            "high"         if overall >= 0.50 else
            "moderate"     if overall >= 0.30 else
            "low"
        )

        return {
            "overall_risk":  round(overall, 4),
            "risk_level":    risk_level,
            "tasks":         {t: {"probability": r["probability"], "risk_level": r["risk_level"]}
                              for t, r in task_results.items()},
            "highest_risk_task": max(task_results, key=lambda t: task_results[t]["probability"]),
        }

    def get_model_info(self) -> Dict[str, Any]:
        info = {}
        for task in TASK_NAMES:
            meta = self.metadata.get(task, {})
            info[task] = {
                "loaded":         task in self.models,
                "shap_available": task in self.explainers,
                "version":        meta.get("version", "not trained"),
                "metrics":        meta.get("metrics", {}),
                "n_features":     meta.get("n_features", 0),
                "trained_at":     meta.get("trained_at", None),
            }
        return info


# ── Singleton — lazy-loaded on first use ──────────────────────────────────
_service: Optional[MLModelService] = None

def get_ml_service() -> MLModelService:
    global _service
    if _service is None:
        _service = MLModelService()
    return _service

# Lazy: don't eager-load at import time to avoid blocking server startup.
# First request to /api/ml/* will trigger loading.
ml_service = get_ml_service()
