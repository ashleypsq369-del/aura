import os
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['KMP_INIT_AT_FORK'] = 'FALSE'

print("Testing xgboost import...")
try:
    import xgboost
    print("xgboost OK:", xgboost.__version__)
except Exception as e:
    print("xgboost import FAILED:", e)

print("Testing shap import...")
try:
    import shap
    print("shap OK:", shap.__version__)
except Exception as e:
    print("shap import FAILED:", e)

print("Testing joblib load of a model...")
try:
    import joblib
    from pathlib import Path
    model_path = Path("ml_training/models/vital_risk/v1.0.0/model.joblib")
    model = joblib.load(model_path)
    print("Model loaded OK, type:", type(model).__name__)
except Exception as e:
    print("Model load FAILED:", e)

print("ALL DONE")
