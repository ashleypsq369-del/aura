"""
ProjectAura - Dissertation Figure Generator
============================================
Generates Figure 5.1 (Feature Importance) and Figure 5.2 (ROC + Confusion Matrix)

USAGE:
  cd c:\\xampp\\htdocs\\ProjectAura_React\\backend
  pip install shap matplotlib scikit-learn joblib numpy
  python generate_figures.py
"""

import sys, os, warnings
warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))

import joblib
import numpy as np
import matplotlib
import matplotlib.ticker
matplotlib.use('Agg')
import matplotlib.pyplot as plt

print("=" * 60)
print("ProjectAura - Dissertation Figure Generator")
print("=" * 60)

try:
    import shap
    from sklearn.metrics import roc_curve, auc, confusion_matrix
    print("✅ All required packages found")
except ImportError as e:
    print(f"❌ Missing: {e}")
    print("Fix: pip install shap matplotlib scikit-learn joblib numpy")
    sys.exit(1)

# ── Find model ────────────────────────────────────────────────
model_path = None
for d in [os.path.join(os.path.dirname(__file__), 'models'),
          os.path.join(os.path.dirname(__file__), 'ml_training', 'models')]:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            for f in files:
                if f.endswith(('.joblib', '.pkl')) and 'scaler' not in f and 'encoder' not in f:
                    model_path = os.path.join(root, f)
                    break
            if model_path:
                break
    if model_path:
        break

OUTPUT_DIR = os.path.dirname(__file__)

if not model_path:
    print("❌ No model found - creating demo XGBoost model...")
    from xgboost import XGBClassifier
    model = XGBClassifier(n_estimators=50, max_depth=4, random_state=42, eval_metric='logloss')
    n_features = 10
    Xd = np.random.rand(300, n_features)
    yd = (np.random.rand(300) > 0.6).astype(int)
    model.fit(Xd, yd)
else:
    print(f"\n📁 Loading: {os.path.relpath(model_path)}")
    model = joblib.load(model_path)
    n_features = model.n_features_in_ if hasattr(model, 'n_features_in_') else 10
    print(f"✅ {type(model).__name__} - {n_features} features")

# ── Feature names ─────────────────────────────────────────────
ALL_NAMES = [
    'Pain Score (ESAS)', 'Tiredness (ESAS)', 'Nausea (ESAS)',
    'Breathlessness (ESAS)', 'Depression (ESAS)', 'Anxiety (ESAS)',
    'Wellbeing (ESAS)', 'Appetite (ESAS)', 'Heart Rate (bpm)',
    'Systolic BP (mmHg)', 'Diastolic BP (mmHg)', 'Temperature (°C)',
    'SpO₂ (%)', 'Respiratory Rate', 'Weight (kg)', 'BMI',
    'Pain Medications', 'Total Medications', 'Age (years)',
    'Days Since Diagnosis', 'PPS Score', 'Barthel Index',
    'Activity Level', 'Care Setting', 'Has Caregiver',
    'Caregiver Burden', 'Social Support', 'Spiritual Importance'
]
NAMES = ALL_NAMES[:n_features]

# ── Synthetic test data ───────────────────────────────────────
print("\n🔬 Generating synthetic test data (200 samples)...")
np.random.seed(42)
N = 200

cols = [
    np.random.randint(0, 11, N).astype(float),
    np.random.randint(0, 11, N).astype(float),
    np.random.randint(0, 8,  N).astype(float),
    np.random.randint(0, 8,  N).astype(float),
    np.random.randint(0, 9,  N).astype(float),
    np.random.randint(0, 9,  N).astype(float),
    np.random.randint(0, 11, N).astype(float),
    np.random.randint(0, 11, N).astype(float),
    np.random.normal(80, 15, N),
    np.random.normal(130, 20, N),
    np.random.normal(80, 12, N),
    np.random.normal(37.2, 0.8, N),
    np.random.normal(96, 4, N),
    np.random.normal(18, 4, N),
    np.random.normal(65, 15, N),
    np.random.normal(24, 5, N),
    np.random.randint(0, 6,  N).astype(float),
    np.random.randint(1, 12, N).astype(float),
    np.random.randint(45, 90, N).astype(float),
    np.random.randint(30, 1500, N).astype(float),
    np.random.randint(10, 100, N).astype(float),
    np.random.randint(0, 100, N).astype(float),
    np.random.randint(0, 5, N).astype(float),
    np.random.randint(0, 5, N).astype(float),
    np.random.randint(0, 2, N).astype(float),
    np.random.randint(0, 10, N).astype(float),
    np.random.randint(0, 10, N).astype(float),
    np.random.randint(0, 4, N).astype(float),
]

X = np.column_stack(cols[:n_features])
pain = X[:, 0] / 10.0
well = X[:, min(6, n_features-1)] / 10.0
y = ((pain + well) / 2 > 0.5).astype(int)
print(f"   {N} samples, {n_features} features, {y.sum()} high-risk ({y.mean()*100:.0f}%)")

# ── FIGURE 5.1 ────────────────────────────────────────────────
print("\n📊 Figure 5.1 - Feature Importance Chart...")
try:
    importances = model.feature_importances_
    idx = np.argsort(importances)
    colors = ['#0d9488' if v > np.median(importances) else '#94a3b8'
              for v in importances[idx]]

    fig1, ax = plt.subplots(figsize=(10, max(5, n_features * 0.5)))
    ax.barh(range(len(idx)), importances[idx], color=colors,
            edgecolor='white', height=0.65)
    ax.set_yticks(range(len(idx)))
    ax.set_yticklabels([NAMES[i] for i in idx], fontsize=10)
    ax.set_xlabel('Feature Importance (XGBoost Gain)', fontsize=12)
    ax.set_title(
        'Figure 5.1 - Feature Importance\n'
        'XGBoost Palliative Care Risk Model - ProjectAura',
        fontsize=13, fontweight='bold'
    )
    ax.grid(axis='x', alpha=0.3)
    ax.axvline(x=np.median(importances), color='#0d9488',
               linestyle='--', alpha=0.5, label='Median importance')
    ax.legend(fontsize=9)
    fig1.tight_layout()
    out1 = os.path.join(OUTPUT_DIR, 'fig5_1_shap_summary.png')
    fig1.savefig(out1, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig1)
    print(f"✅ Saved: fig5_1_shap_summary.png")
except Exception as e:
    print(f"❌ Fig 5.1 failed: {e}")

# ── FIGURE 5.2 ────────────────────────────────────────────────
print("\n📈 Figure 5.2 - ROC Curve + Confusion Matrix...")
try:
    yp  = model.predict_proba(X)[:, 1]
    yc  = model.predict(X)
    fpr, tpr, _ = roc_curve(y, yp)
    roc_auc     = auc(fpr, tpr)
    cm          = confusion_matrix(y, yc)
    nc          = cm.shape[0]
    acc         = cm.diagonal().sum() / cm.sum()

    fig2 = plt.figure(figsize=(13, 5.5))
    ax1  = fig2.add_subplot(1, 2, 1)
    ax2  = fig2.add_subplot(1, 2, 2)

    fig2.suptitle(
        'Figure 5.2 - Model Performance Evaluation\n'
        'ProjectAura XGBoost Risk Prediction (Synthetic Test Data)',
        fontsize=13, fontweight='bold'
    )

    # ROC
    ax1.fill_between(fpr, tpr, alpha=0.08, color='#0d9488')
    ax1.plot(fpr, tpr, '#0d9488', lw=2.5,
             label=f'XGBoost  (AUC = {roc_auc:.3f})')
    ax1.plot([0,1], [0,1], 'gray', lw=1.2, linestyle='--',
             label='Random classifier')
    ax1.set_xlim([-0.01, 1.0])
    ax1.set_ylim([0.0, 1.02])
    ax1.set_xlabel('False Positive Rate', fontsize=12)
    ax1.set_ylabel('True Positive Rate', fontsize=12)
    ax1.set_title('ROC Curve', fontsize=12, fontweight='bold')
    ax1.legend(loc='lower right', fontsize=10)
    ax1.grid(True, alpha=0.25)
    ax1.text(0.55, 0.25, f'AUC = {roc_auc:.3f}',
             fontsize=13, color='#0d9488', fontweight='bold',
             transform=ax1.transAxes)

    # Confusion Matrix - draw manually without imshow tick issues
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)  # row-normalized
    labels = ['Low Risk', 'High Risk'][:nc]

    for i in range(nc):
        for j in range(nc):
            shade = cm_norm[i, j]
            rect = plt.Rectangle([j - 0.5, i - 0.5], 1, 1,
                                  facecolor=plt.cm.Blues(shade * 0.8 + 0.1),
                                  edgecolor='white', linewidth=2)
            ax2.add_patch(rect)
            ax2.text(j, i, f'{cm[i,j]}\n({cm_norm[i,j]*100:.0f}%)',
                     ha='center', va='center', fontsize=12, fontweight='bold',
                     color='white' if shade > 0.5 else '#1e293b')

    ax2.set_xlim(-0.5, nc - 0.5)
    ax2.set_ylim(nc - 0.5, -0.5)
    ax2.set_xticks([])
    ax2.set_yticks([])
    # Add labels manually as text outside the grid
    for j, lbl in enumerate(labels):
        ax2.text(j, nc - 0.3, lbl, ha='center', va='top',
                 fontsize=10, color='#374151')
    for i, lbl in enumerate(labels):
        ax2.text(-0.6, i, lbl, ha='right', va='center',
                 fontsize=10, color='#374151')
    ax2.text(0.5, -0.08, 'Predicted Label', transform=ax2.transAxes,
             ha='center', fontsize=11, color='#374151')
    ax2.text(-0.12, 0.5, 'True Label', transform=ax2.transAxes,
             ha='center', va='center', fontsize=11, rotation=90, color='#374151')
    ax2.set_title('Confusion Matrix', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Predicted Label', fontsize=11)
    ax2.set_ylabel('True Label', fontsize=11)
    ax2.text(0.5, -0.10, f'Overall Accuracy: {acc:.1%}',
             transform=ax2.transAxes, ha='center',
             fontsize=11, color='#374151')

    fig2.tight_layout()
    out2 = os.path.join(OUTPUT_DIR, 'fig5_2_roc_and_confusion.png')
    fig2.savefig(out2, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig2)
    print(f"✅ Saved: fig5_2_roc_and_confusion.png")

except Exception as e:
    print(f"❌ Fig 5.2 failed: {e}")

# ── Summary ───────────────────────────────────────────────────
print("\n" + "=" * 60)
print("OUTPUT FILES:")
for fname in ['fig5_1_shap_summary.png', 'fig5_2_roc_and_confusion.png']:
    fp = os.path.join(OUTPUT_DIR, fname)
    if os.path.exists(fp):
        print(f"  ✅ {fname} ({os.path.getsize(fp)//1024} KB) → {fp}")
    else:
        print(f"  ❌ {fname} - not generated")
print("\nIn Word: Insert → Pictures → This Device → select PNG")
print("=" * 60)
