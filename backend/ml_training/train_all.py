"""
Main Training Script
Orchestrates the entire ML training pipeline:
1. Download medical data
2. Download medical knowledge
3. Train all models
4. Generate SHAP explanations
5. Validate models
"""

import sys
import logging
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from data_downloader import download_all_medical_data
from medical_knowledge_downloader import MedicalKnowledgeDownloader
from model_trainer import train_all_tasks, MedicalModelTrainer
from config import MODELS_DIR, LOGS_DIR

# Setup logging
log_file = LOGS_DIR / f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def main():
    """Main training pipeline"""
    
    logger.info("="*100)
    logger.info("PROJECTAURA ML TRAINING PIPELINE")
    logger.info("="*100)
    logger.info(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Log file: {log_file}")
    
    try:
        # Step 1: Download Medical Data
        logger.info("\n" + "="*100)
        logger.info("STEP 1: DOWNLOADING MEDICAL DATA")
        logger.info("="*100)
        
        datasets = download_all_medical_data()
        logger.info(f"✅ Downloaded {len(datasets)} medical datasets")
        
        # Step 2: Download Medical Knowledge
        logger.info("\n" + "="*100)
        logger.info("STEP 2: DOWNLOADING MEDICAL KNOWLEDGE")
        logger.info("="*100)
        
        knowledge_downloader = MedicalKnowledgeDownloader()
        knowledge = knowledge_downloader.download_all()
        logger.info("✅ Medical knowledge base created")
        
        # Step 3: Train All Models
        logger.info("\n" + "="*100)
        logger.info("STEP 3: TRAINING ML MODELS")
        logger.info("="*100)
        
        results = train_all_tasks(datasets)
        
        # Step 4: Generate Summary Report
        logger.info("\n" + "="*100)
        logger.info("TRAINING COMPLETE - SUMMARY REPORT")
        logger.info("="*100)
        
        successful_tasks = sum(1 for r in results.values() if r["status"] == "success")
        failed_tasks = len(results) - successful_tasks
        
        logger.info(f"\nTotal tasks: {len(results)}")
        logger.info(f"✅ Successful: {successful_tasks}")
        logger.info(f"❌ Failed: {failed_tasks}")
        
        logger.info("\nDetailed Results:")
        for task_name, result in results.items():
            if result["status"] == "success":
                metrics = result["metrics"]
                logger.info(f"\n✅ {task_name.upper()}")
                logger.info(f"   Location: {result['version_dir']}")
                logger.info(f"   Accuracy: {metrics.get('accuracy', 0):.4f}")
                logger.info(f"   Precision: {metrics.get('precision', 0):.4f}")
                logger.info(f"   Recall: {metrics.get('recall', 0):.4f}")
                logger.info(f"   F1-Score: {metrics.get('f1_score', 0):.4f}")
                logger.info(f"   ROC-AUC: {metrics.get('roc_auc', 0):.4f}")
            else:
                logger.info(f"\n❌ {task_name.upper()}")
                logger.info(f"   Error: {result['error']}")
        
        # Step 5: Generate Deployment Instructions
        logger.info("\n" + "="*100)
        logger.info("NEXT STEPS: DEPLOYMENT")
        logger.info("="*100)
        
        logger.info("\n1. Model files are saved in: " + str(MODELS_DIR))
        logger.info("2. To use models in production:")
        logger.info("   - Copy model directories to backend/models/")
        logger.info("   - Update comprehensive_ai.py to load trained models")
        logger.info("   - Replace simulated SHAP with real SHAP values")
        logger.info("\n3. To test a model:")
        logger.info("   python test_model.py --task vital_risk --patient-id 8")
        logger.info("\n4. To retrain a specific task:")
        logger.info("   python retrain_task.py --task symptom_burden")
        
        logger.info(f"\n{'='*100}")
        logger.info(f"Pipeline completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"Full log: {log_file}")
        logger.info(f"{'='*100}")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    results = main()
