"""
ML Training System for ProjectAura XAI
Provides real, data-driven SHAP explanations
"""

__version__ = "1.0.0"
__author__ = "ProjectAura Team"
__description__ = "Complete ML training pipeline with SHAP integration"

from .config import (
    MODELS_DIR,
    DATA_DIR,
    MEDICAL_KNOWLEDGE_DIR,
    FEATURE_GROUPS,
    TARGET_VARIABLES
)

from .model_trainer import MedicalModelTrainer
from .data_downloader import MedicalDataDownloader
from .medical_knowledge_downloader import MedicalKnowledgeDownloader

__all__ = [
    "MedicalModelTrainer",
    "MedicalDataDownloader",
    "MedicalKnowledgeDownloader",
    "MODELS_DIR",
    "DATA_DIR",
    "MEDICAL_KNOWLEDGE_DIR",
    "FEATURE_GROUPS",
    "TARGET_VARIABLES"
]
