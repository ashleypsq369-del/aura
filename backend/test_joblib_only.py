import os
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

print("1. testing joblib model load only (no shap, no xgb import)...")
import joblib
from pathlib import Path

model = joblib.load(Path("ml_training/models/vital_risk/v1.0.0/model.joblib"))
print("model type:", type(model).__name__)

import numpy as np
n_features = 39
X = np.zeros((1, n_features))
X[0, :] = [72, 50, 7, 8, 4, 5, 6, 3, 5, 4, 6, 48, 95, 145, 90, 91, 37.8, 20, 12, 10, 55, 22, 38, 7, 2, 1, 5.5, 4, 2, 2, 4, 1.0, 45, 62, 0, 50, 48, 2, 0]

try:
    prob = model.predict_proba(X)[0][1]
    print(f"prediction: {prob:.4f}")
    print("MODEL WORKS")
except Exception as e:
    print(f"predict failed: {e}")

print("DONE")
