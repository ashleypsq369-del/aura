import os
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

print("1. testing joblib...")
import joblib
print("joblib OK")

print("2. testing shap (without xgboost pre-import)...")
# shap may try to import xgboost  --  check
import shap
print("shap OK:", shap.__version__)

print("3. loading model with joblib...")
from pathlib import Path
model = joblib.load(Path("ml_training/models/vital_risk/v1.0.0/model.joblib"))
print("model type:", type(model).__name__)

print("4. making prediction...")
import numpy as np
X = np.array([[72, 50, 7, 8, 4, 5, 6, 3, 5, 4, 6, 48, 95, 145, 90, 91, 37.8, 20, 12, 10, 55, 22, 38, 7, 2, 1, 5.5, 4, 2, 2, 4, 1.0, 45, 62, 0, 50, 48, 2, 0, 1]])
# Pad/trim to correct feature count
n_features = len(model.feature_names_in_) if hasattr(model, 'feature_names_in_') else 39
X_padded = np.zeros((1, n_features))
X_padded[0, :min(X.shape[1], n_features)] = X[0, :min(X.shape[1], n_features)]
prob = model.predict_proba(X_padded)[0][1]
print(f"prediction prob: {prob:.4f}")

print("ALL DONE - models work!")
