"""
retrain_targeted.py
====================
Retrains only the models that had precision/recall warnings:
  - vital_risk        (precision 0.61, gap 0.254)
  - symptom_burden    (precision 0.77)
  - admission_risk    (precision 0.88 -- already ok but benefits from tuning)

Run from backend/ml_training/:
    python retrain_targeted.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import everything from train_models_now
from train_models_now import train_task, TASKS

RETRAIN_TASKS = ["vital_risk", "symptom_burden", "admission_risk"]

if __name__ == "__main__":
    import json
    from pathlib import Path as P

    results = {}
    for task in RETRAIN_TASKS:
        if task not in TASKS:
            print(f"Task {task} not found")
            continue
        print(f"\nRetraining: {task}")
        try:
            meta = train_task(task, TASKS[task])
            results[task] = {"status": "success", **meta["metrics"]}
            print(f"  AUC={meta['metrics']['auc']:.4f}  "
                  f"Prec={meta['metrics']['precision']:.4f}  "
                  f"Rec={meta['metrics']['recall']:.4f}  "
                  f"F1={meta['metrics']['f1']:.4f}")
        except Exception as e:
            print(f"  FAILED: {e}")
            results[task] = {"status": "failed", "error": str(e)}

    # Update training_summary.json
    summary_path = P(__file__).parent / "models" / "training_summary.json"
    if summary_path.exists():
        existing = json.loads(summary_path.read_text())
        existing.update(results)
        summary_path.write_text(json.dumps(existing, indent=2))
        print(f"\nUpdated summary: {summary_path}")

    print("\nDone.")
