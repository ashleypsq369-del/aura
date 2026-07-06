"""
Medical Data Downloader
Downloads and prepares medical datasets for ML training
"""

import os
import requests
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
from tqdm import tqdm
import logging
from datetime import datetime

from config import (
    DATA_DIR, MEDICAL_DATA_SOURCES, SYNTHETIC_DATA_CONFIG,
    CLINICAL_THRESHOLDS, DISEASE_RISK_FACTORS
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MedicalDataDownloader:
    """Downloads and prepares medical datasets"""
    
    def __init__(self):
        self.data_dir = DATA_DIR
        self.data_dir.mkdir(exist_ok=True)
        
    def download_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """Download all configured medical datasets"""
        datasets = {}
        
        logger.info("Starting medical data download...")
        
        for name, config in MEDICAL_DATA_SOURCES.items():
            logger.info(f"Downloading {name}...")
            try:
                df = self.download_dataset(name, config)
                datasets[name] = df
                logger.info(f"✅ {name}: {len(df)} samples downloaded")
            except Exception as e:
                logger.error(f"❌ Failed to download {name}: {e}")
                logger.info(f"Generating synthetic data for {name}")
                datasets[name] = self.generate_synthetic_data(name, config)
        
        return datasets
    
    def download_dataset(self, name: str, config: Dict) -> pd.DataFrame:
        """
        Download a single dataset
        
        NOTE: Most medical datasets require authentication/approval.
        This method provides the framework - you'll need to:
        1. Request access from the data provider
        2. Download manually and place in data/ folder
        3. Or use the synthetic data generator
        """
        cache_file = self.data_dir / f"{name}.csv"
        
        # Check if already downloaded
        if cache_file.exists():
            logger.info(f"Loading cached data from {cache_file}")
            return pd.read_csv(cache_file)
        
        # For demonstration, we'll use synthetic data
        # In production, implement actual download logic here
        logger.warning(f"Dataset {name} not found. Using synthetic data.")
        logger.info(f"To use real data: Download from {config['url']} and place in {cache_file}")
        
        return self.generate_synthetic_data(name, config)
    
    def generate_synthetic_data(self, name: str, config: Dict) -> pd.DataFrame:
        """Generate clinically realistic synthetic data"""
        logger.info(f"Generating synthetic data for {name}")
        
        np.random.seed(SYNTHETIC_DATA_CONFIG["random_seed"])
        n_samples = config.get("samples", 1000)
        
        data = {}
        
        # Generate data based on dataset type
        if name == "palliative_performance_scale":
            data = self._generate_pps_data(n_samples)
        elif name == "symptom_assessment":
            data = self._generate_esas_data(n_samples)
        elif name == "cognitive_assessment":
            data = self._generate_cognitive_data(n_samples)
        elif name == "medication_adherence":
            data = self._generate_medication_adherence_data(n_samples)
        elif name == "functional_status":
            data = self._generate_barthel_data(n_samples)
        elif name == "caregiver_burden":
            data = self._generate_caregiver_data(n_samples)
        elif name == "vital_signs":
            data = self._generate_vital_signs_data(n_samples)
        elif name == "mental_health":
            data = self._generate_mental_health_data(n_samples)
        elif name == "admission_risk":
            data = self._generate_admission_risk_data(n_samples)
        else:
            raise ValueError(f"Unknown dataset type: {name}")
        
        df = pd.DataFrame(data)
        
        # Save to cache
        cache_file = self.data_dir / f"{name}.csv"
        df.to_csv(cache_file, index=False)
        logger.info(f"Saved synthetic data to {cache_file}")
        
        return df
    
    def _generate_pps_data(self, n: int) -> Dict:
        """Generate PPS assessment data"""
        ages = np.random.normal(72, 12, n).clip(18, 100).astype(int)
        pps_scores = np.random.normal(55, 20, n).clip(10, 100).astype(int)
        
        # Generate correlated functional assessments
        # Barthel Index (0-100, higher = better function)
        # Correlates with PPS
        barthel_score = (pps_scores * 0.8 + np.random.normal(0, 10, n)).clip(0, 100).astype(int)
        
        # ECOG Performance Status (0-5, lower = better)
        # Inverse relationship with PPS
        ecog_score = ((100 - pps_scores) / 20 + np.random.uniform(-0.5, 0.5, n)).clip(0, 5).astype(int)
        
        # Karnofsky Performance Scale (0-100, higher = better)
        # Very similar to PPS
        karnofsky_score = (pps_scores + np.random.normal(0, 5, n)).clip(0, 100).astype(int)
        
        # Recent hospitalizations
        recent_hospitalizations = np.random.poisson(0.5, n).clip(0, 5).astype(int)
        
        # PPS correlates with survival
        # Lower PPS = shorter survival
        survival_days = []
        for pps in pps_scores:
            if pps < 30:
                days = np.random.exponential(14)  # ~2 weeks median
            elif pps < 50:
                days = np.random.exponential(45)  # ~6 weeks median
            elif pps < 70:
                days = np.random.exponential(120)  # ~4 months median
            else:
                days = np.random.exponential(365)  # ~1 year median
            survival_days.append(int(days))
        
        diagnoses = np.random.choice(
            ["cancer", "heart_failure", "copd", "dementia", "renal_failure"],
            n,
            p=[0.45, 0.20, 0.15, 0.12, 0.08]
        )
        
        comorbidities = np.random.poisson(2.5, n)
        
        # Outcome: significant decline in 30 days
        decline_30day = (pps_scores < 50) & (np.random.random(n) < 0.4)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "pps_score": pps_scores,
            "barthel_score": barthel_score,
            "ecog_score": ecog_score,
            "karnofsky_score": karnofsky_score,
            "primary_diagnosis": diagnoses,
            "comorbidities_count": comorbidities,
            "recent_hospitalizations": recent_hospitalizations,
            "survival_days": survival_days,
            "significant_decline_30day": decline_30day.astype(int)
        }
    
    def _generate_esas_data(self, n: int) -> Dict:
        """Generate ESAS symptom assessment data"""
        ages = np.random.normal(70, 13, n).clip(18, 100).astype(int)
        
        # Primary diagnosis categories (encoded as integers for ML)
        # 0=cancer, 1=heart_failure, 2=copd, 3=dementia, 4=kidney_disease, 5=liver_disease
        diagnosis_probs = [0.45, 0.20, 0.15, 0.10, 0.06, 0.04]
        primary_diagnosis = np.random.choice(range(6), size=n, p=diagnosis_probs)
        
        # Generate correlated symptom scores
        # Pain and tiredness often correlate
        pain = np.random.gamma(2, 2, n).clip(0, 10).astype(int)
        tiredness = (pain * 0.6 + np.random.gamma(2, 1.5, n)).clip(0, 10).astype(int)
        
        nausea = np.random.gamma(1.5, 1.5, n).clip(0, 10).astype(int)
        depression = np.random.gamma(1.8, 2, n).clip(0, 10).astype(int)
        anxiety = (depression * 0.5 + np.random.gamma(1.5, 1.5, n)).clip(0, 10).astype(int)
        drowsiness = (tiredness * 0.4 + np.random.gamma(1.5, 1.5, n)).clip(0, 10).astype(int)
        appetite = np.random.gamma(1.5, 2, n).clip(0, 10).astype(int)
        wellbeing = (10 - pain * 0.3 - tiredness * 0.3 + np.random.normal(0, 1.5, n)).clip(0, 10).astype(int)
        shortness_of_breath = np.random.gamma(1.5, 1.8, n).clip(0, 10).astype(int)
        
        esas_total = pain + tiredness + nausea + depression + anxiety + drowsiness + appetite + wellbeing + shortness_of_breath
        
        # High symptom burden predicts need for intervention
        high_symptom_burden = (esas_total > 40).astype(int)
        
        medications_count = np.random.poisson(6, n)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "primary_diagnosis": primary_diagnosis,
            "esas_pain": pain,
            "esas_tiredness": tiredness,
            "esas_nausea": nausea,
            "esas_depression": depression,
            "esas_anxiety": anxiety,
            "esas_drowsiness": drowsiness,
            "esas_appetite": appetite,
            "esas_wellbeing": wellbeing,
            "esas_shortness_of_breath": shortness_of_breath,
            "esas_total": esas_total,
            "medications_count": medications_count,
            "high_symptom_burden": high_symptom_burden
        }
    
    def _generate_cognitive_data(self, n: int) -> Dict:
        """Generate cognitive assessment data"""
        ages = np.random.normal(75, 10, n).clip(50, 100).astype(int)
        education_years = np.random.normal(12, 4, n).clip(0, 20).astype(int)
        
        # Medications affecting cognition (anticholinergics, benzodiazepines, opioids)
        medications_affecting_cognition = np.random.poisson(1.5, n).clip(0, 10).astype(int)
        
        # Recent delirium episode (binary)
        recent_delirium = (np.random.random(n) < 0.15).astype(int)  # 15% prevalence
        
        # MMSE: 0-30, lower with age, lower education, and cognitive risk factors
        mmse_base = 30 - (ages - 65) * 0.15 + education_years * 0.3 - medications_affecting_cognition * 0.8 - recent_delirium * 3
        mmse_scores = (mmse_base + np.random.normal(0, 3, n)).clip(0, 30).astype(int)
        
        # MoCA: typically 2-3 points lower than MMSE
        moca_scores = (mmse_scores - 2 + np.random.normal(0, 1.5, n)).clip(0, 30).astype(int)
        
        # Cognitive decline detection
        cognitive_decline = ((mmse_scores < 24) | (moca_scores < 26)).astype(int)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "education_years": education_years,
            "medications_affecting_cognition": medications_affecting_cognition,
            "recent_delirium": recent_delirium,
            "mmse_score": mmse_scores,
            "moca_score": moca_scores,
            "cognitive_decline_detected": cognitive_decline
        }
    
    def _generate_medication_adherence_data(self, n: int) -> Dict:
        """Generate medication adherence data"""
        ages = np.random.normal(68, 14, n).clip(18, 100).astype(int)
        medications_count = np.random.poisson(5, n).clip(1, 20)
        
        # High-risk medications (anticoagulants, insulin, opioids, etc.)
        high_risk_medications = np.random.binomial(medications_count, 0.3)
        
        # Drug-drug interactions
        # More medications = more potential interactions
        interaction_probability = np.minimum(medications_count * 0.15, 0.8)
        drug_interactions = np.random.binomial(3, interaction_probability)
        
        # Kidney function (eGFR: ml/min/1.73m2)
        # Lower with age, affects drug clearance
        kidney_function = (120 - (ages - 20) * 0.8 + np.random.normal(0, 15, n)).clip(15, 120).astype(int)
        
        # Liver function (ALT: U/L, normal <40)
        # Elevated in some patients
        liver_function = np.random.gamma(2, 15, n).clip(10, 200).astype(int)
        
        # MMAS-8: 0-8, lower scores with more medications
        mmas8_base = 8 - medications_count * 0.2
        mmas8_scores = (mmas8_base + np.random.normal(0, 1.5, n)).clip(0, 8)
        
        side_effects_count = (medications_count * 0.3 + np.random.poisson(1, n)).astype(int)
        
        # Adverse drug events more likely with:
        # - low adherence
        # - high-risk meds
        # - drug interactions
        # - poor kidney/liver function
        ade_risk = (
            (mmas8_scores < 6) * 0.25 +
            (high_risk_medications > 0) * 0.20 +
            (drug_interactions > 1) * 0.15 +
            (kidney_function < 45) * 0.15 +
            (liver_function > 60) * 0.10
        )
        adverse_drug_event = (np.random.random(n) < ade_risk).astype(int)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "medications_count": medications_count,
            "high_risk_medications": high_risk_medications,
            "drug_interactions": drug_interactions,
            "mmas8_score": mmas8_scores,
            "kidney_function": kidney_function,
            "liver_function": liver_function,
            "side_effects_count": side_effects_count,
            "adverse_drug_event_30day": adverse_drug_event
        }
    
    def _generate_barthel_data(self, n: int) -> Dict:
        """Generate Barthel Index (ADL) data"""
        ages = np.random.normal(76, 11, n).clip(18, 100).astype(int)
        
        # Barthel: 0-100, lower with age
        barthel_base = 100 - (ages - 65) * 1.5
        barthel_scores = (barthel_base + np.random.normal(0, 15, n)).clip(0, 100).astype(int)
        
        # Round to nearest 5 (Barthel uses 5-point increments)
        barthel_scores = (barthel_scores / 5).round() * 5
        
        diagnoses = np.random.choice(
            ["stroke", "dementia", "parkinson", "cancer", "frailty"],
            n,
            p=[0.25, 0.20, 0.15, 0.25, 0.15]
        )
        
        # Independence level based on Barthel score
        independence_level = []
        for score in barthel_scores:
            if score >= 80:
                independence_level.append("independent")
            elif score >= 60:
                independence_level.append("mildly_dependent")
            elif score >= 40:
                independence_level.append("moderately_dependent")
            elif score >= 20:
                independence_level.append("severely_dependent")
            else:
                independence_level.append("totally_dependent")
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "barthel_score": barthel_scores,
            "primary_diagnosis": diagnoses,
            "independence_level": independence_level
        }
    
    def _generate_caregiver_data(self, n: int) -> Dict:
        """Generate caregiver burden data"""
        patient_ages = np.random.normal(78, 10, n).clip(50, 100).astype(int)
        caregiver_ages = (patient_ages - np.random.normal(5, 10, n)).clip(18, 100).astype(int)
        
        relationships = np.random.choice(
            ["spouse", "adult_child", "other_family", "professional"],
            n,
            p=[0.40, 0.35, 0.15, 0.10]
        )
        
        care_hours = np.random.gamma(8, 5, n).clip(5, 168).astype(int)  # hours per week
        
        # Patient functional status (0-100, higher = better function)
        patient_functional_status = np.random.normal(45, 20, n).clip(0, 100).astype(int)
        
        # Financial strain (0-10 scale, higher = more strain)
        financial_strain = np.random.gamma(2, 2, n).clip(0, 10).astype(int)
        
        # Respite care access (0-10 scale, higher = better access)
        respite_care_access = np.random.normal(4, 2.5, n).clip(0, 10).astype(int)
        
        # Zarit: 0-88, higher with more care hours, lower function, financial strain
        zarit_base = (
            care_hours * 0.3 + 
            (caregiver_ages - 60) * 0.2 + 
            (100 - patient_functional_status) * 0.15 +
            financial_strain * 2 -
            respite_care_access * 1.5
        )
        zarit_scores = (zarit_base + np.random.normal(0, 10, n)).clip(0, 88).astype(int)
        
        # Patient functional status affects burden (also save as patient_barthel_score)
        patient_barthel = patient_functional_status
        
        # Caregiver burnout risk
        burnout_risk = (
            (zarit_scores > 40) & 
            (care_hours > 60) &
            (np.random.random(n) < 0.5)
        ).astype(int)
        
        return {
            "patient_id": range(1, n+1),
            "patient_age": patient_ages,
            "caregiver_age": caregiver_ages,
            "relationship": relationships,
            "care_hours_per_week": care_hours,
            "zarit_score": zarit_scores,
            "patient_functional_status": patient_functional_status,
            "financial_strain": financial_strain,
            "respite_care_access": respite_care_access,
            "patient_barthel_score": patient_barthel,
            "caregiver_burnout_risk": burnout_risk
        }
    
    def _generate_vital_signs_data(self, n: int) -> Dict:
        """Generate vital signs data"""
        ages = np.random.normal(71, 15, n).clip(18, 100).astype(int)
        
        # Generate weight and height
        # Weight decreases in palliative care
        base_weight = np.random.normal(70, 15, n).clip(40, 150)
        weight = base_weight * np.random.uniform(0.8, 1.0, n)  # Weight loss common
        
        # Height (in cm)
        height = np.random.normal(168, 10, n).clip(145, 200)
        
        # Calculate BMI
        bmi = weight / ((height / 100) ** 2)
        
        # Generate correlated vital signs
        # Hypertension more common with age
        bp_sys = (120 + (ages - 50) * 0.5 + np.random.normal(0, 15, n)).clip(80, 200).astype(int)
        bp_dia = (80 + (ages - 50) * 0.2 + np.random.normal(0, 10, n)).clip(50, 120).astype(int)
        
        # Heart rate
        heart_rate = np.random.normal(78, 12, n).clip(40, 140).astype(int)
        
        # O2 saturation (lower with respiratory disease)
        has_resp_disease = np.random.random(n) < 0.25
        o2_base = np.where(has_resp_disease, 92, 96)
        oxygen_saturation = (o2_base + np.random.normal(0, 2, n)).clip(80, 100).astype(int)
        
        # Temperature
        temperature = np.random.normal(36.8, 0.4, n).clip(35, 40).round(1)
        
        # Respiratory rate
        respiratory_rate = np.random.normal(16, 3, n).clip(8, 30).astype(int)
        
        # Critical vital event (any vital outside safe range)
        critical_event = (
            (bp_sys > 180) | (bp_sys < 90) |
            (heart_rate > 110) | (heart_rate < 50) |
            (oxygen_saturation < 90) |
            (temperature > 38.5) | (temperature < 36)
        ).astype(int)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "heart_rate": heart_rate,
            "blood_pressure_sys": bp_sys,
            "blood_pressure_dia": bp_dia,
            "oxygen_saturation": oxygen_saturation,
            "temperature": temperature,
            "respiratory_rate": respiratory_rate,
            "weight": weight.round(1),
            "height": height.round(1),
            "bmi": bmi.round(1),
            "has_respiratory_disease": has_resp_disease.astype(int),
            "critical_vital_event_7day": critical_event
        }
    
    def _generate_mental_health_data(self, n: int) -> Dict:
        """Generate mental health assessment data"""
        ages = np.random.normal(65, 18, n).clip(18, 100).astype(int)
        genders = np.random.choice(["M", "F"], n, p=[0.45, 0.55])
        
        # PHQ-9: 0-27, depression severity
        phq9_scores = np.random.gamma(2.5, 3, n).clip(0, 27).astype(int)
        
        # GAD-7: 0-21, anxiety severity (correlated with PHQ-9)
        gad7_scores = (phq9_scores * 0.6 + np.random.gamma(1.5, 2, n)).clip(0, 21).astype(int)
        
        # ESAS depression and anxiety (0-10 scales, correlated with PHQ-9/GAD-7)
        esas_depression = (phq9_scores * 0.35 + np.random.normal(0, 1, n)).clip(0, 10).astype(int)
        esas_anxiety = (gad7_scores * 0.45 + np.random.normal(0, 1, n)).clip(0, 10).astype(int)
        
        # Social support score (0-10, higher = better support)
        social_support_score = np.random.normal(6, 2.5, n).clip(0, 10).astype(int)
        
        # Recent stressful life events (0-5)
        recent_life_events = np.random.poisson(0.8, n).clip(0, 5).astype(int)
        
        # Treatment response (better with moderate severity, worse with severe)
        treatment_response = np.zeros(n)
        for i in range(n):
            if phq9_scores[i] < 5:  # Minimal
                treatment_response[i] = np.random.random() < 0.3  # Not much to treat
            elif phq9_scores[i] < 15:  # Mild-moderate
                treatment_response[i] = np.random.random() < 0.70  # Good response
            else:  # Severe
                treatment_response[i] = np.random.random() < 0.45  # Harder to treat
        
        # Intervention needed
        intervention_needed = (
            (phq9_scores > 15) | (gad7_scores > 15)
        ).astype(int)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "gender": genders,
            "phq9_score": phq9_scores,
            "gad7_score": gad7_scores,
            "esas_depression": esas_depression,
            "esas_anxiety": esas_anxiety,
            "social_support_score": social_support_score,
            "recent_life_events": recent_life_events,
            "treatment_response": treatment_response.astype(int),
            "mental_health_intervention_needed": intervention_needed
        }
    
    def _generate_admission_risk_data(self, n: int) -> Dict:
        """Generate comprehensive admission risk data combining multiple assessments"""
        ages = np.random.normal(72, 12, n).clip(18, 100).astype(int)
        
        # PPS score (functional status)
        pps_scores = np.random.normal(55, 20, n).clip(10, 100).astype(int)
        
        # ESAS total (symptom burden)
        esas_total = np.random.gamma(4, 8, n).clip(0, 90).astype(int)
        
        # Comorbidities count
        comorbidities_count = np.random.poisson(2.5, n).clip(0, 10).astype(int)
        
        # Social support (0-10, higher = better)
        social_support_score = np.random.normal(6, 2.5, n).clip(0, 10).astype(int)
        
        # Medications count
        medications_count = np.random.poisson(6, n).clip(0, 20).astype(int)
        
        # Recent ED visits (in past 30 days)
        recent_ed_visits = np.random.poisson(0.3, n).clip(0, 5).astype(int)
        
        # Hospital admission risk in next 7 days
        # Risk factors: low PPS, high symptoms, recent ED visits, low social support
        admission_probability = (
            (100 - pps_scores) / 200 +  # 0-0.45
            esas_total / 180 +            # 0-0.5
            recent_ed_visits * 0.15 +     # 0-0.75
            (10 - social_support_score) / 50 +  # 0-0.2
            comorbidities_count / 50      # 0-0.2
        ).clip(0, 1)
        
        hospital_admission_7day = (np.random.random(n) < admission_probability).astype(int)
        
        return {
            "patient_id": range(1, n+1),
            "age": ages,
            "recent_ed_visits": recent_ed_visits,
            "pps_score": pps_scores,
            "esas_total": esas_total,
            "comorbidities_count": comorbidities_count,
            "social_support_score": social_support_score,
            "medications_count": medications_count,
            "hospital_admission_7day": hospital_admission_7day
        }


def download_all_medical_data():
    """Main function to download all medical datasets"""
    downloader = MedicalDataDownloader()
    
    logger.info("="*80)
    logger.info("MEDICAL DATA DOWNLOAD STARTING")
    logger.info("="*80)
    
    datasets = downloader.download_all_datasets()
    
    logger.info("="*80)
    logger.info("DOWNLOAD SUMMARY")
    logger.info("="*80)
    
    total_samples = 0
    for name, df in datasets.items():
        samples = len(df)
        total_samples += samples
        features = len(df.columns)
        logger.info(f"✅ {name}: {samples} samples, {features} features")
    
    logger.info(f"\nTotal samples across all datasets: {total_samples:,}")
    logger.info(f"Data saved to: {DATA_DIR}")
    
    return datasets


if __name__ == "__main__":
    datasets = download_all_medical_data()
    
    # Display sample data
    for name, df in datasets.items():
        print(f"\n{'='*80}")
        print(f"Sample data from {name}:")
        print(f"{'='*80}")
        print(df.head())
        print(f"\nShape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
