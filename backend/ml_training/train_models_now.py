"""
train_models_now.py
====================
Self-contained training script for all 8 ProjectAura XGBoost models.
Generates clinically realistic synthetic data, trains, evaluates,
saves .joblib models + SHAP explainers + metadata.

Run from backend/ml_training/:
    python train_models_now.py

Output: models/<task>/v1.0.0/model.joblib
                              scaler.joblib
                              explainer.joblib
                              metadata.json
"""

import sys, os, json, logging, warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score,
    recall_score, f1_score, classification_report
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("train")

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)
VERSION = "v1.0.0"
SEED    = 42
N       = 8_000   # samples per task

np.random.seed(SEED)

# ── Clinical distributions (palliative care literature) ───────────────────

def rng(lo, hi, size, dtype=float):
    return np.random.uniform(lo, hi, size).astype(dtype)

def rnorm(mu, sigma, lo, hi, size):
    v = np.random.normal(mu, sigma, size)
    return np.clip(v, lo, hi)

def gen_base(n):
    """Common patient features used across multiple tasks."""
    age            = rnorm(72, 12, 18, 100, n)
    pps            = rnorm(55, 20, 10, 100, n)
    esas_pain      = rnorm( 4,  3,  0,  10, n)
    esas_tired     = rnorm( 5,  3,  0,  10, n)
    esas_nausea    = rnorm( 3,  2,  0,  10, n)
    esas_depress   = rnorm( 4,  3,  0,  10, n)
    esas_anxiety   = rnorm( 4,  3,  0,  10, n)
    esas_drowsy    = rnorm( 3,  2,  0,  10, n)
    esas_appetite  = rnorm( 4,  3,  0,  10, n)
    esas_wellbeing = rnorm( 4,  3,  0,  10, n)
    esas_breath    = rnorm( 3,  2,  0,  10, n)
    esas_total     = (esas_pain + esas_tired + esas_nausea + esas_depress +
                      esas_anxiety + esas_drowsy + esas_appetite +
                      esas_wellbeing + esas_breath)
    phq9           = rnorm(12,  7,  0, 27, n)
    gad7           = rnorm(10,  6,  0, 21, n)
    barthel        = rnorm(65, 25,  0, 100, n)
    mmse           = rnorm(24,  4,  0,  30, n)
    zarit          = rnorm(32, 15,  0,  88, n)
    meds_count     = rnorm( 6,  3,  1,  20, n)
    comorbidities  = rnorm( 3,  2,  0,  10, n)
    ed_visits_6m   = np.random.poisson(1.5, n).clip(0, 8)
    social_support = rnorm( 6,  2,  0,  10, n)
    return {
        "age": age, "pps": pps,
        "esas_pain": esas_pain, "esas_tired": esas_tired,
        "esas_nausea": esas_nausea, "esas_depress": esas_depress,
        "esas_anxiety": esas_anxiety, "esas_drowsy": esas_drowsy,
        "esas_appetite": esas_appetite, "esas_wellbeing": esas_wellbeing,
        "esas_breath": esas_breath, "esas_total": esas_total,
        "phq9": phq9, "gad7": gad7,
        "barthel": barthel, "mmse": mmse, "zarit": zarit,
        "meds_count": meds_count, "comorbidities": comorbidities,
        "ed_visits_6m": ed_visits_6m, "social_support": social_support,
    }

# ── Task definitions ──────────────────────────────────────────────────────

TASKS = {}

def register(name):
    def dec(fn):
        TASKS[name] = fn
        return fn
    return dec


@register("vital_risk")
def vital_risk(n):
    b = gen_base(n)
    hr   = rnorm(80, 20, 30, 160, n)
    bp_s = rnorm(120, 22, 60, 200, n)
    bp_d = rnorm(78,  14, 40, 130, n)
    spo2 = rnorm(96,  4, 78, 100, n)
    temp = rnorm(37,   1, 35,  41, n)
    rr   = rnorm(16,   5, 8,   40, n)

    # Critical vital event probability  --  domain-driven
    # Use a wider/more balanced risk definition for better precision
    risk = (
        (hr  < 55).astype(float) * 0.30 +
        (hr  > 110).astype(float) * 0.28 +
        (spo2 < 90).astype(float) * 0.38 +
        (spo2 < 94).astype(float) * 0.18 +
        (bp_s < 85).astype(float) * 0.32 +
        (bp_s > 165).astype(float) * 0.22 +
        (temp > 38.8).astype(float) * 0.18 +
        (rr   > 24).astype(float) * 0.22 +
        (b["pps"] < 35).astype(float) * 0.18 +
        np.random.uniform(0, 0.18, n)
    )
    y = (risk > 0.45).astype(int)   # lower threshold -> more balanced classes

    features = {
        "heart_rate": hr, "bp_systolic": bp_s, "bp_diastolic": bp_d,
        "oxygen_saturation": spo2, "temperature": temp, "respiratory_rate": rr,
        "age": b["age"], "pps": b["pps"], "comorbidities": b["comorbidities"],
        "esas_breath": b["esas_breath"],
    }
    return pd.DataFrame(features), y


@register("symptom_burden")
def symptom_burden(n):
    b = gen_base(n)
    risk = (
        (b["esas_total"] > 45).astype(float) * 0.40 +
        (b["esas_pain"]  > 7).astype(float)  * 0.30 +
        (b["esas_breath"] > 6).astype(float) * 0.25 +
        (b["pps"] < 50).astype(float) * 0.20 +
        (b["age"] > 80).astype(float) * 0.10 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "esas_pain": b["esas_pain"], "esas_tired": b["esas_tired"],
        "esas_nausea": b["esas_nausea"], "esas_depress": b["esas_depress"],
        "esas_anxiety": b["esas_anxiety"], "esas_drowsy": b["esas_drowsy"],
        "esas_appetite": b["esas_appetite"], "esas_breath": b["esas_breath"],
        "esas_total": b["esas_total"],
        "pps": b["pps"], "age": b["age"], "meds_count": b["meds_count"],
    }
    return pd.DataFrame(features), y


@register("functional_decline")
def functional_decline(n):
    b = gen_base(n)
    hosp_recent = np.random.poisson(0.8, n).clip(0, 5)
    risk = (
        (b["pps"] < 50).astype(float) * 0.35 +
        (b["barthel"] < 40).astype(float) * 0.30 +
        (b["age"] > 80).astype(float) * 0.20 +
        (hosp_recent > 1).astype(float) * 0.25 +
        (b["comorbidities"] > 4).astype(float) * 0.15 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "pps": b["pps"], "barthel": b["barthel"], "age": b["age"],
        "comorbidities": b["comorbidities"], "recent_hospitalisations": hosp_recent,
        "esas_tired": b["esas_tired"], "meds_count": b["meds_count"],
    }
    return pd.DataFrame(features), y


@register("cognitive_impairment")
def cognitive_impairment(n):
    b = gen_base(n)
    delir_hist = np.random.binomial(1, 0.15, n)
    cog_meds   = np.random.randint(0, 4, n)
    risk = (
        (b["mmse"] < 24).astype(float) * 0.40 +
        (b["age"] > 78).astype(float) * 0.25 +
        (delir_hist == 1).astype(float) * 0.30 +
        (cog_meds > 1).astype(float) * 0.20 +
        (b["esas_drowsy"] > 6).astype(float) * 0.20 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "mmse": b["mmse"], "age": b["age"],
        "esas_drowsy": b["esas_drowsy"], "recent_delirium": delir_hist,
        "cog_affecting_meds": cog_meds, "comorbidities": b["comorbidities"],
        "pps": b["pps"],
    }
    return pd.DataFrame(features), y


@register("mental_health_risk")
def mental_health_risk(n):
    b = gen_base(n)
    risk = (
        (b["phq9"] > 14).astype(float) * 0.40 +
        (b["gad7"] > 10).astype(float) * 0.35 +
        (b["esas_depress"] > 6).astype(float) * 0.30 +
        (b["esas_anxiety"] > 6).astype(float) * 0.25 +
        (b["social_support"] < 3).astype(float) * 0.20 +
        (b["pps"] < 40).astype(float) * 0.15 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "phq9": b["phq9"], "gad7": b["gad7"],
        "esas_depress": b["esas_depress"], "esas_anxiety": b["esas_anxiety"],
        "age": b["age"], "social_support": b["social_support"],
        "pps": b["pps"], "esas_total": b["esas_total"],
    }
    return pd.DataFrame(features), y


@register("medication_risk")
def medication_risk(n):
    b = gen_base(n)
    high_risk_meds = np.random.randint(0, 4, n)
    drug_interactions = np.random.randint(0, 3, n)
    adherence = rnorm(6, 2, 0, 8, n)   # MMAS-8 equivalent
    risk = (
        (b["meds_count"] > 8).astype(float) * 0.35 +
        (high_risk_meds > 1).astype(float) * 0.30 +
        (drug_interactions > 0).astype(float) * 0.25 +
        (adherence < 4).astype(float) * 0.25 +
        (b["age"] > 78).astype(float) * 0.15 +
        (b["mmse"] < 22).astype(float) * 0.20 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "meds_count": b["meds_count"], "high_risk_meds": high_risk_meds,
        "drug_interactions": drug_interactions, "adherence_score": adherence,
        "age": b["age"], "mmse": b["mmse"],
        "comorbidities": b["comorbidities"],
    }
    return pd.DataFrame(features), y


@register("caregiver_burden")
def caregiver_burden(n):
    b = gen_base(n)
    carer_age = rnorm(58, 12, 25, 85, n)
    care_hrs   = rnorm(38, 18, 4, 112, n)
    respite    = np.random.binomial(1, 0.30, n)  # 1 = has respite
    risk = (
        (b["zarit"] > 40).astype(float) * 0.40 +
        (care_hrs > 60).astype(float) * 0.30 +
        (respite == 0).astype(float) * 0.20 +
        (b["pps"] < 40).astype(float) * 0.20 +
        (carer_age > 70).astype(float) * 0.15 +
        (b["social_support"] < 3).astype(float) * 0.20 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "zarit": b["zarit"], "care_hours_per_week": care_hrs,
        "carer_age": carer_age, "has_respite": respite,
        "patient_pps": b["pps"], "social_support": b["social_support"],
        "patient_esas_total": b["esas_total"],
    }
    return pd.DataFrame(features), y


@register("admission_risk")
def admission_risk(n):
    b = gen_base(n)
    risk = (
        (b["ed_visits_6m"] > 2).astype(float) * 0.35 +
        (b["pps"] < 50).astype(float) * 0.30 +
        (b["esas_total"] > 45).astype(float) * 0.25 +
        (b["comorbidities"] > 4).astype(float) * 0.20 +
        (b["age"] > 80).astype(float) * 0.15 +
        (b["social_support"] < 3).astype(float) * 0.20 +
        (b["meds_count"] > 8).astype(float) * 0.15 +
        np.random.uniform(0, 0.15, n)
    )
    y = (risk > 0.55).astype(int)

    features = {
        "recent_ed_visits": b["ed_visits_6m"], "pps": b["pps"],
        "esas_total": b["esas_total"], "comorbidities": b["comorbidities"],
        "age": b["age"], "social_support": b["social_support"],
        "meds_count": b["meds_count"],
    }
    return pd.DataFrame(features), y


# ── Training pipeline ─────────────────────────────────────────────────────

XGB_PARAMS = dict(
    n_estimators=400,
    max_depth=5,
    learning_rate=0.06,
    subsample=0.82,
    colsample_bytree=0.82,
    gamma=0.1,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
    objective="binary:logistic",
    eval_metric="auc",
    random_state=SEED,
    tree_method="hist",
    use_label_encoder=False,
)

# Per-task overrides (scale_pos_weight fixes precision/recall imbalance)
TASK_PARAMS = {
    "vital_risk": {
        **XGB_PARAMS,
        "scale_pos_weight": 2.5,   # boost precision for vital_risk
        "n_estimators": 500,
        "max_depth": 6,
    },
    "symptom_burden": {
        **XGB_PARAMS,
        "scale_pos_weight": 1.5,
    },
    "admission_risk": {
        **XGB_PARAMS,
        "scale_pos_weight": 1.8,
    },
}


def train_task(name, gen_fn):
    log.info(f"\n{'='*60}")
    log.info(f"Training task: {name}")
    log.info(f"{'='*60}")

    out_dir = MODELS_DIR / name / VERSION
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Generate data
    X_df, y = gen_fn(N)
    feature_names = list(X_df.columns)
    X = X_df.values
    y = np.array(y)

    log.info(f"  Samples: {len(y)}, positives: {y.sum()} ({y.mean():.1%})")

    # 2. Split
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    # 3. Scale
    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s  = scaler.transform(X_te)

    # 4. SMOTE balance
    try:
        sm = SMOTE(random_state=SEED)
        X_tr_s, y_tr = sm.fit_resample(X_tr_s, y_tr)
        log.info(f"  After SMOTE: {len(y_tr)} samples")
    except Exception as e:
        log.warning(f"  SMOTE failed: {e}  --  using original")

    # 5. Train XGBoost
    task_params = TASK_PARAMS.get(name, XGB_PARAMS)
    model = xgb.XGBClassifier(**task_params)
    model.fit(
        X_tr_s, y_tr,
        eval_set=[(X_te_s, y_te)],
        verbose=False,
    )

    # 6. Evaluate
    y_prob = model.predict_proba(X_te_s)[:, 1]
    y_pred = model.predict(X_te_s)
    auc    = roc_auc_score(y_te, y_prob)
    acc    = accuracy_score(y_te, y_pred)
    prec   = precision_score(y_te, y_pred, zero_division=0)
    rec    = recall_score(y_te, y_pred, zero_division=0)
    f1     = f1_score(y_te, y_pred, zero_division=0)

    log.info(f"  AUC={auc:.3f}  Acc={acc:.3f}  Prec={prec:.3f}  Rec={rec:.3f}  F1={f1:.3f}")

    # 7. SHAP explainer  --  TreeExplainer is instant for XGBoost
    try:
        import shap as shap_lib
        explainer = shap_lib.TreeExplainer(model)
        # Validate it works on small batch
        _ = explainer.shap_values(X_te_s[:10])
        log.info(f"  SHAP TreeExplainer: OK")
    except Exception as e:
        log.warning(f"  SHAP failed: {e}  --  explainer will be None")
        explainer = None

    # 8. Save
    joblib.dump(model,    out_dir / "model.joblib")
    joblib.dump(scaler,   out_dir / "scaler.joblib")
    if explainer is not None:
        joblib.dump(explainer, out_dir / "explainer.joblib")

    # Feature importance from XGBoost
    fi = model.feature_importances_
    fi_dict = {fname: float(f) for fname, f in zip(feature_names, fi)}
    fi_sorted = sorted(fi_dict.items(), key=lambda x: x[1], reverse=True)

    metadata = {
        "task":          name,
        "version":       VERSION,
        "trained_at":    datetime.utcnow().isoformat(),
        "n_samples":     int(len(y)),
        "feature_names": feature_names,
        "n_features":    len(feature_names),
        "metrics": {
            "auc":       round(auc, 4),
            "accuracy":  round(acc, 4),
            "precision": round(prec, 4),
            "recall":    round(rec, 4),
            "f1":        round(f1, 4),
        },
        "feature_importance": {k: round(v, 4) for k, v in fi_sorted},
        "shap_available": explainer is not None,
        "model_type": "xgboost",
        "xgb_version": xgb.__version__,
    }
    (out_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )

    log.info(f"  Saved to: {out_dir}")
    log.info(f"  Top features: {', '.join(k for k,_ in fi_sorted[:4])}")

    return metadata


def main():
    log.info("ProjectAura ML Training Pipeline")
    log.info(f"Training {len(TASKS)} models with {N} samples each")
    log.info(f"Output: {MODELS_DIR}")

    results = {}
    for task_name, gen_fn in TASKS.items():
        try:
            meta = train_task(task_name, gen_fn)
            results[task_name] = {"status": "success", **meta["metrics"]}
        except Exception as e:
            log.error(f"FAILED {task_name}: {e}", exc_info=True)
            results[task_name] = {"status": "failed", "error": str(e)}

    # Summary
    log.info(f"\n{'='*60}")
    log.info("TRAINING SUMMARY")
    log.info(f"{'='*60}")
    ok = sum(1 for r in results.values() if r["status"] == "success")
    log.info(f"Completed: {ok}/{len(TASKS)}")
    for t, r in results.items():
        if r["status"] == "success":
            log.info(f"  {t:25s} AUC={r['auc']:.3f}  F1={r['f1']:.3f}")
        else:
            log.info(f"  {t:25s} FAILED: {r.get('error','?')}")

    # Save summary
    summary_path = MODELS_DIR / "training_summary.json"
    summary_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    log.info(f"\nSummary saved: {summary_path}")

    return ok == len(TASKS)


if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
