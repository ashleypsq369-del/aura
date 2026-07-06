"""
ML Model Trainer with SHAP Integration
Trains XGBoost/LightGBM models for medical prediction tasks
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from typing import Dict, Tuple, List, Any
from datetime import datetime
import logging

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    precision_recall_curve, auc
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import lightgbm as lgb
try:
    import shap
    SHAP_AVAILABLE = True
except (ImportError, OSError, Exception):
    shap = None
    SHAP_AVAILABLE = False
    print("[WARNING] SHAP not available in model_trainer")

from config import (
    MODELS_DIR, LOGS_DIR, SELECTED_MODEL,
    XGBOOST_CONFIG, LIGHTGBM_CONFIG,
    FEATURE_GROUPS, TARGET_VARIABLES,
    TRAINING_CONFIG, EVALUATION_METRICS,
    CLINICAL_VALIDATION_CONFIG, SHAP_CONFIG
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MedicalModelTrainer:
    """Trains ML models for medical predictions with SHAP explainability"""
    
    def __init__(self, task_name: str):
        """
        Initialize trainer for a specific prediction task
        
        Args:
            task_name: One of FEATURE_GROUPS keys (e.g., "vital_risk", "symptom_burden")
        """
        self.task_name = task_name
        self.feature_names = FEATURE_GROUPS.get(task_name, [])
        self.target_name = TARGET_VARIABLES.get(task_name, "outcome")
        
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.shap_explainer = None
        self.feature_importance = None
        
        # Create task-specific directory
        self.task_dir = MODELS_DIR / task_name
        self.task_dir.mkdir(exist_ok=True, parents=True)
        
        logger.info(f"Initialized trainer for task: {task_name}")
        logger.info(f"Features: {len(self.feature_names)}")
        logger.info(f"Target: {self.target_name}")
    
    def prepare_data(
        self,
        df: pd.DataFrame,
        test_size: float = 0.2,
        validation_size: float = 0.2
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Prepare data for training
        
        Returns:
            train_df, val_df, test_df
        """
        logger.info("Preparing data...")
        
        # Remove missing values
        df = df.dropna(subset=self.feature_names + [self.target_name])
        
        # Encode categorical features
        categorical_cols = df[self.feature_names].select_dtypes(include=['object']).columns
        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le
        
        # Split data
        train_val_df, test_df = train_test_split(
            df,
            test_size=test_size,
            random_state=TRAINING_CONFIG.get("random_seed", 42),
            stratify=df[self.target_name] if df[self.target_name].nunique() == 2 else None
        )
        
        train_df, val_df = train_test_split(
            train_val_df,
            test_size=validation_size / (1 - test_size),
            random_state=TRAINING_CONFIG.get("random_seed", 42),
            stratify=train_val_df[self.target_name] if train_val_df[self.target_name].nunique() == 2 else None
        )
        
        logger.info(f"Training samples: {len(train_df)}")
        logger.info(f"Validation samples: {len(val_df)}")
        logger.info(f"Test samples: {len(test_df)}")
        
        # Check class balance
        if df[self.target_name].nunique() == 2:
            class_dist = train_df[self.target_name].value_counts()
            logger.info(f"Class distribution: {dict(class_dist)}")
            imbalance_ratio = class_dist.max() / class_dist.min()
            if imbalance_ratio > 3:
                logger.warning(f"Class imbalance detected (ratio: {imbalance_ratio:.1f})")
        
        return train_df, val_df, test_df
    
    def handle_class_imbalance(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Handle class imbalance using SMOTE"""
        
        if not TRAINING_CONFIG["class_balancing"]["enabled"]:
            return X_train, y_train
        
        method = TRAINING_CONFIG["class_balancing"]["method"]
        
        if method == "smote":
            logger.info("Applying SMOTE for class balancing...")
            smote = SMOTE(random_state=42)
            X_train, y_train = smote.fit_resample(X_train, y_train)
            logger.info(f"After SMOTE: {len(X_train)} samples")
        
        return X_train, y_train
    
    def train(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Train the model
        
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training {SELECTED_MODEL} model...")
        
        # Prepare features and target
        X_train = train_df[self.feature_names].values
        y_train = train_df[self.target_name].values
        X_val = val_df[self.feature_names].values
        y_val = val_df[self.target_name].values
        
        # Scale features
        X_train = self.scaler.fit_transform(X_train)
        X_val = self.scaler.transform(X_val)
        
        # Handle class imbalance
        X_train, y_train = self.handle_class_imbalance(X_train, y_train)
        
        # Train model
        if SELECTED_MODEL == "xgboost":
            self.model = self._train_xgboost(X_train, y_train, X_val, y_val)
        elif SELECTED_MODEL == "lightgbm":
            self.model = self._train_lightgbm(X_train, y_train, X_val, y_val)
        else:
            raise ValueError(f"Unknown model type: {SELECTED_MODEL}")
        
        # Evaluate on validation set
        y_val_pred = self.model.predict(X_val)
        if hasattr(self.model, "predict_proba"):
            y_val_pred_proba = self.model.predict_proba(X_val)[:, 1]
        else:
            y_val_pred_proba = y_val_pred
        
        metrics = self._calculate_metrics(y_val, y_val_pred, y_val_pred_proba)
        
        logger.info("Validation Metrics:")
        for metric, value in metrics.items():
            if isinstance(value, float):
                logger.info(f"  {metric}: {value:.4f}")
        
        return metrics
    
    def _train_xgboost(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> xgb.XGBClassifier:
        """Train XGBoost model"""
        
        model = xgb.XGBClassifier(**XGBOOST_CONFIG)
        
        # Training with early stopping
        eval_set = [(X_train, y_train), (X_val, y_val)]
        
        model.fit(
            X_train, y_train,
            eval_set=eval_set,
            verbose=False
        )
        
        # Log training results (best_iteration only available if early stopping was used)
        if hasattr(model, 'best_iteration') and model.best_iteration is not None:
            logger.info(f"Best iteration: {model.best_iteration}")
        if hasattr(model, 'best_score') and model.best_score:
            logger.info(f"Best score: {model.best_score:.4f}")
        
        return model
    
    def _train_lightgbm(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> lgb.LGBMClassifier:
        """Train LightGBM model"""
        
        model = lgb.LGBMClassifier(**LIGHTGBM_CONFIG)
        
        # Training with early stopping
        eval_set = [(X_val, y_val)]
        
        model.fit(
            X_train, y_train,
            eval_set=eval_set,
            callbacks=[lgb.early_stopping(stopping_rounds=50)]
        )
        
        return model
    
    def calculate_shap_values(
        self,
        X_sample: np.ndarray,
        background_samples: int = 100
    ):
        """
        Calculate SHAP values for model explanations

        Returns:
            (shap_values, explainer) tuple, or (None, None) if SHAP unavailable
        """
        if not SHAP_AVAILABLE or shap is None:
            logger.warning("SHAP not available  --  skipping SHAP calculation")
            self.shap_explainer = None
            return None, None

        logger.info("Calculating SHAP values...")

        # Create SHAP explainer
        if SHAP_CONFIG["explainer_type"] == "tree":
            self.shap_explainer = shap.TreeExplainer(self.model)
        else:
            background = shap.sample(X_sample, background_samples)
            self.shap_explainer = shap.KernelExplainer(
                self.model.predict_proba,
                background
            )

        # Calculate SHAP values
        shap_values = self.shap_explainer.shap_values(X_sample)

        # For binary classification, take class 1 SHAP values
        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        logger.info(f"SHAP values calculated for {len(X_sample)} samples")
        return shap_values, self.shap_explainer
    
    def get_feature_importance(
        self,
        shap_values: np.ndarray
    ) -> pd.DataFrame:
        """
        Get feature importance from SHAP values
        
        Args:
            shap_values: SHAP values from calculate_shap_values
        
        Returns:
            DataFrame with feature importance
        """
        # Calculate mean absolute SHAP value for each feature
        importance = np.abs(shap_values).mean(axis=0)
        
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance,
            'display_name': [
                SHAP_CONFIG["feature_display_names"].get(f, f)
                for f in self.feature_names
            ]
        })
        
        importance_df = importance_df.sort_values('importance', ascending=False)
        self.feature_importance = importance_df
        
        return importance_df
    
    def explain_prediction(
        self,
        patient_data: Dict[str, Any],
        top_k: int = 10
    ) -> Dict[str, Any]:
        """
        Generate SHAP explanation for a single patient
        
        Args:
            patient_data: Dictionary with patient features
            top_k: Number of top features to return
        
        Returns:
            Dictionary with explanation
        """
        # Prepare input
        X = np.array([[patient_data.get(f, 0) for f in self.feature_names]])
        X_scaled = self.scaler.transform(X)
        
        # Get prediction
        prediction = self.model.predict(X_scaled)[0]
        if hasattr(self.model, "predict_proba"):
            prediction_proba = self.model.predict_proba(X_scaled)[0][1]
        else:
            prediction_proba = prediction
        
        # Calculate SHAP values
        shap_values = self.shap_explainer.shap_values(X_scaled)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        # Get top features
        feature_shap = list(zip(self.feature_names, shap_values[0]))
        feature_shap.sort(key=lambda x: abs(x[1]), reverse=True)
        top_features = feature_shap[:top_k]
        
        # Format explanation
        explanation = {
            "prediction": int(prediction),
            "probability": float(prediction_proba),
            "risk_level": self._classify_risk(prediction_proba),
            "top_features": [
                {
                    "feature": feat,
                    "display_name": SHAP_CONFIG["feature_display_names"].get(feat, feat),
                    "value": float(patient_data.get(feat, 0)),
                    "shap_value": float(shap_val),
                    "impact": "increases_risk" if shap_val > 0 else "decreases_risk",
                    "importance": float(abs(shap_val))
                }
                for feat, shap_val in top_features
            ],
            "base_value": float(self.shap_explainer.expected_value if hasattr(self.shap_explainer, 'expected_value') else 0),
            "model_type": SELECTED_MODEL,
            "task": self.task_name
        }
        
        return explanation
    
    def _classify_risk(self, probability: float) -> str:
        """Classify risk level based on probability"""
        if probability >= 0.7:
            return "critical"
        elif probability >= 0.4:
            return "warning"
        else:
            return "normal"
    
    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray
    ) -> Dict[str, float]:
        """Calculate evaluation metrics"""
        
        metrics = {}
        
        if "accuracy" in EVALUATION_METRICS:
            metrics["accuracy"] = accuracy_score(y_true, y_pred)
        
        if "precision" in EVALUATION_METRICS:
            metrics["precision"] = precision_score(y_true, y_pred, zero_division=0)
        
        if "recall" in EVALUATION_METRICS:
            metrics["recall"] = recall_score(y_true, y_pred, zero_division=0)
        
        if "f1_score" in EVALUATION_METRICS:
            metrics["f1_score"] = f1_score(y_true, y_pred, zero_division=0)
        
        if "roc_auc" in EVALUATION_METRICS:
            try:
                metrics["roc_auc"] = roc_auc_score(y_true, y_pred_proba)
            except:
                metrics["roc_auc"] = 0.0
        
        if "specificity" in EVALUATION_METRICS:
            tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
            metrics["specificity"] = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        if "npv" in EVALUATION_METRICS:
            tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
            metrics["npv"] = tn / (tn + fn) if (tn + fn) > 0 else 0
        
        return metrics
    
    def save_model(self, version: str = None):
        """Save trained model and artifacts"""
        
        if version is None:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        version_dir = self.task_dir / version
        version_dir.mkdir(exist_ok=True)
        
        # Save model
        model_path = version_dir / "model.joblib"
        joblib.dump(self.model, model_path)
        logger.info(f"Model saved to {model_path}")
        
        # Save scaler
        scaler_path = version_dir / "scaler.joblib"
        joblib.dump(self.scaler, scaler_path)
        
        # Save label encoders
        if self.label_encoders:
            encoders_path = version_dir / "label_encoders.joblib"
            joblib.dump(self.label_encoders, encoders_path)
        
        # Save SHAP explainer
        if self.shap_explainer:
            explainer_path = version_dir / "shap_explainer.joblib"
            joblib.dump(self.shap_explainer, explainer_path)
        
        # Save feature importance
        if self.feature_importance is not None:
            importance_path = version_dir / "feature_importance.csv"
            self.feature_importance.to_csv(importance_path, index=False)
        
        # Save metadata
        metadata = {
            "task_name": self.task_name,
            "model_type": SELECTED_MODEL,
            "features": self.feature_names,
            "target": self.target_name,
            "version": version,
            "trained_at": datetime.now().isoformat()
        }
        
        metadata_path = version_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"All artifacts saved to {version_dir}")
        
        return version_dir
    
    def load_model(self, version: str):
        """Load trained model and artifacts"""
        
        version_dir = self.task_dir / version
        
        if not version_dir.exists():
            raise FileNotFoundError(f"Model version not found: {version_dir}")
        
        # Load model
        model_path = version_dir / "model.joblib"
        self.model = joblib.load(model_path)
        
        # Load scaler
        scaler_path = version_dir / "scaler.joblib"
        self.scaler = joblib.load(scaler_path)
        
        # Load label encoders
        encoders_path = version_dir / "label_encoders.joblib"
        if encoders_path.exists():
            self.label_encoders = joblib.load(encoders_path)
        
        # Load SHAP explainer
        explainer_path = version_dir / "shap_explainer.joblib"
        if explainer_path.exists():
            self.shap_explainer = joblib.load(explainer_path)
        
        # Load feature importance
        importance_path = version_dir / "feature_importance.csv"
        if importance_path.exists():
            self.feature_importance = pd.read_csv(importance_path)
        
        logger.info(f"Model loaded from {version_dir}")


def train_all_tasks(datasets: Dict[str, pd.DataFrame]):
    """Train models for all prediction tasks"""
    
    logger.info("="*80)
    logger.info("TRAINING ALL PREDICTION TASKS")
    logger.info("="*80)
    
    results = {}
    
    for task_name in FEATURE_GROUPS.keys():
        logger.info(f"\n{'='*80}")
        logger.info(f"Training task: {task_name}")
        logger.info(f"{'='*80}")
        
        try:
            # Initialize trainer
            trainer = MedicalModelTrainer(task_name)
            
            # Get relevant dataset
            dataset_name = _get_dataset_for_task(task_name)
            if dataset_name not in datasets:
                logger.warning(f"Dataset {dataset_name} not found for task {task_name}")
                continue
            
            df = datasets[dataset_name]
            
            # Prepare data
            train_df, val_df, test_df = trainer.prepare_data(df)
            
            # Train model
            metrics = trainer.train(train_df, val_df)
            
            # Calculate SHAP values
            X_test = test_df[trainer.feature_names].values
            X_test_scaled = trainer.scaler.transform(X_test)
            shap_values, explainer = trainer.calculate_shap_values(X_test_scaled[:100])
            
            # Get feature importance
            importance_df = trainer.get_feature_importance(shap_values)
            logger.info("\nTop 10 Most Important Features:")
            for idx, row in importance_df.head(10).iterrows():
                logger.info(f"  {row['display_name']}: {row['importance']:.4f}")
            
            # Save model
            version_dir = trainer.save_model()
            
            results[task_name] = {
                "status": "success",
                "metrics": metrics,
                "version_dir": str(version_dir)
            }
            
        except Exception as e:
            logger.error(f"Failed to train {task_name}: {e}")
            results[task_name] = {
                "status": "failed",
                "error": str(e)
            }
    
    logger.info("\n" + "="*80)
    logger.info("TRAINING SUMMARY")
    logger.info("="*80)
    
    for task_name, result in results.items():
        status = result["status"]
        if status == "success":
            logger.info(f"✅ {task_name}: SUCCESS")
            metrics = result["metrics"]
            logger.info(f"   AUC: {metrics.get('roc_auc', 0):.4f}, F1: {metrics.get('f1_score', 0):.4f}")
        else:
            logger.info(f"❌ {task_name}: FAILED - {result['error']}")
    
    return results


def _get_dataset_for_task(task_name: str) -> str:
    """Map task name to dataset name"""
    mapping = {
        "vital_risk": "vital_signs",
        "symptom_burden": "symptom_assessment",
        "functional_decline": "palliative_performance_scale",
        "cognitive_impairment": "cognitive_assessment",
        "mental_health_risk": "mental_health",
        "medication_risk": "medication_adherence",
        "caregiver_burden": "caregiver_burden",
        "admission_risk": "admission_risk"  # Uses dedicated admission_risk dataset
    }
    return mapping.get(task_name, "vital_signs")


if __name__ == "__main__":
    # Load datasets
    from data_downloader import download_all_medical_data
    
    datasets = download_all_medical_data()
    
    # Train all models
    results = train_all_tasks(datasets)
