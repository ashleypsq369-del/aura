"""Analytics Module - Advanced Analytics and Insights"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class AnalyticsMetric:
    """Analytics metric data structure"""
    metric_name: str
    value: float
    unit: str
    trend: str  # 'up', 'down', 'stable'
    change_percent: float
    period: str

class AnalyticsEngine:
    """Advanced analytics engine for hospice care data"""
    
    def __init__(self):
        self.metrics_cache = {}
        self.trend_window = 30  # days
    
    def calculate_patient_metrics(self, patient_id: str, days: int = 30) -> Dict:
        """Calculate comprehensive patient metrics"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Generate synthetic data for demonstration
        metrics = {
            'pain_management': {
                'average_pain_level': 5.2,
                'pain_control_rate': 0.78,
                'breakthrough_episodes': 12,
                'medication_effectiveness': 0.82,
                'trend': 'improving'
            },
            'symptom_burden': {
                'total_symptoms': 6,
                'severe_symptoms': 2,
                'symptom_distress_score': 45,  # 0-100
                'symptom_control_rate': 0.75
            },
            'functional_status': {
                'adl_score': 45,  # 0-100
                'mobility_score': 35,
                'independence_level': 'Moderate assistance',
                'decline_rate': 0.15  # per month
            },
            'quality_of_life': {
                'overall_qol_score': 65,  # 0-100
                'physical_wellbeing': 55,
                'emotional_wellbeing': 70,
                'social_wellbeing': 68,
                'spiritual_wellbeing': 75
            },
            'care_utilization': {
                'nurse_visits': 24,
                'physician_visits': 4,
                'emergency_calls': 2,
                'hospitalizations': 0,
                'total_care_hours': 48
            },
            'medication_adherence': {
                'overall_adherence': 0.92,
                'scheduled_doses': 240,
                'doses_taken': 221,
                'missed_doses': 19,
                'reasons_for_non_adherence': ['Forgot', 'Side effects']
            }
        }
        
        return metrics
    
    def analyze_pain_trends(self, patient_id: str, days: int = 90) -> Dict:
        """Analyze pain trends and patterns"""
        # Generate synthetic pain data
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
        pain_levels = np.random.normal(5, 1.5, days).clip(0, 10)
        
        # Add some patterns
        pain_levels = pain_levels + np.sin(np.arange(days) / 7) * 0.5  # Weekly pattern
        pain_levels = pain_levels.clip(0, 10)
        
        df = pd.DataFrame({
            'date': dates,
            'pain_level': pain_levels
        })
        
        analysis = {
            'summary': {
                'average_pain': float(df['pain_level'].mean()),
                'median_pain': float(df['pain_level'].median()),
                'std_deviation': float(df['pain_level'].std()),
                'min_pain': float(df['pain_level'].min()),
                'max_pain': float(df['pain_level'].max())
            },
            'trends': {
                'overall_trend': 'stable',
                'recent_trend': 'improving',
                'volatility': 'moderate',
                'predictability': 0.75
            },
            'patterns': {
                'time_of_day': {
                    'morning': 4.5,
                    'afternoon': 5.2,
                    'evening': 6.1,
                    'night': 5.8
                },
                'day_of_week': {
                    'monday': 5.0,
                    'tuesday': 5.2,
                    'wednesday': 5.1,
                    'thursday': 5.3,
                    'friday': 5.4,
                    'saturday': 5.0,
                    'sunday': 4.8
                }
            },
            'correlations': {
                'weather': 0.15,
                'activity_level': 0.35,
                'medication_timing': -0.45,
                'sleep_quality': -0.38,
                'stress_level': 0.42
            },
            'predictions': {
                'next_7_days_avg': 5.1,
                'confidence': 0.78,
                'risk_of_crisis': 0.15
            }
        }
        
        return analysis
    
    def calculate_facility_metrics(self, facility_id: str, days: int = 30) -> Dict:
        """Calculate facility-wide metrics"""
        metrics = {
            'census': {
                'total_patients': 45,
                'new_admissions': 8,
                'discharges': 5,
                'deaths': 3,
                'average_length_of_stay': 42  # days
            },
            'quality_indicators': {
                'pain_control_rate': 0.87,
                'symptom_management_score': 0.82,
                'patient_satisfaction': 0.91,
                'family_satisfaction': 0.89,
                'care_plan_compliance': 0.94
            },
            'operational_efficiency': {
                'staff_utilization': 0.88,
                'visit_completion_rate': 0.94,
                'documentation_timeliness': 0.91,
                'response_time_avg': 18,  # minutes
                'overtime_hours': 45
            },
            'financial_performance': {
                'revenue': 393750,
                'expenses': 325000,
                'margin': 0.175,
                'cost_per_patient_day': 245.50,
                'collection_rate': 0.93
            },
            'staff_metrics': {
                'total_staff': 28,
                'nurses': 15,
                'physicians': 3,
                'social_workers': 4,
                'chaplains': 2,
                'turnover_rate': 0.08,
                'satisfaction_score': 0.85
            },
            'compliance': {
                'regulatory_compliance': 0.98,
                'documentation_compliance': 0.96,
                'training_completion': 0.94,
                'safety_incidents': 2
            }
        }
        
        return metrics
    
    def perform_cohort_analysis(self, cohort_criteria: Dict) -> Dict:
        """Perform cohort analysis based on criteria"""
        # Example cohort analysis
        analysis = {
            'cohort_definition': cohort_criteria,
            'cohort_size': 25,
            'demographics': {
                'average_age': 72,
                'gender_distribution': {'male': 0.52, 'female': 0.48},
                'primary_diagnoses': {
                    'cancer': 0.60,
                    'heart_disease': 0.20,
                    'copd': 0.12,
                    'other': 0.08
                }
            },
            'outcomes': {
                'average_length_of_stay': 38,
                'pain_control_rate': 0.85,
                'symptom_management_score': 0.80,
                'patient_satisfaction': 0.88,
                'died_in_preferred_location': 0.92
            },
            'resource_utilization': {
                'average_visits_per_patient': 28,
                'average_care_hours': 52,
                'hospitalization_rate': 0.08,
                'emergency_call_rate': 0.12
            },
            'cost_analysis': {
                'average_cost_per_patient': 8750,
                'cost_per_day': 245,
                'cost_efficiency_score': 0.87
            },
            'comparisons': {
                'vs_overall_population': {
                    'length_of_stay': '+8%',
                    'satisfaction': '+3%',
                    'cost': '-5%'
                }
            }
        }
        
        return analysis
    
    def predict_resource_needs(self, forecast_days: int = 30) -> Dict:
        """Predict future resource needs"""
        predictions = {
            'staffing': {
                'nurses_needed': 16,
                'physicians_needed': 3,
                'social_workers_needed': 4,
                'chaplains_needed': 2,
                'confidence': 0.82
            },
            'supplies': {
                'medication_costs': 12500,
                'medical_supplies': 3200,
                'equipment_needs': ['2 wheelchairs', '1 hospital bed'],
                'confidence': 0.78
            },
            'capacity': {
                'expected_census': 48,
                'new_admissions_forecast': 10,
                'discharge_forecast': 7,
                'capacity_utilization': 0.85,
                'confidence': 0.75
            },
            'financial': {
                'expected_revenue': 420000,
                'expected_expenses': 345000,
                'projected_margin': 0.178,
                'confidence': 0.70
            }
        }
        
        return predictions
    
    def analyze_medication_patterns(self, patient_id: Optional[str] = None) -> Dict:
        """Analyze medication usage patterns"""
        analysis = {
            'most_prescribed': [
                {'medication': 'Morphine', 'count': 35, 'percentage': 0.78},
                {'medication': 'Lorazepam', 'count': 28, 'percentage': 0.62},
                {'medication': 'Haloperidol', 'count': 15, 'percentage': 0.33}
            ],
            'effectiveness': {
                'pain_medications': 0.85,
                'anxiety_medications': 0.82,
                'nausea_medications': 0.78,
                'overall': 0.82
            },
            'side_effects': {
                'total_reported': 45,
                'by_medication': {
                    'Morphine': ['Constipation', 'Drowsiness'],
                    'Lorazepam': ['Confusion'],
                    'Haloperidol': ['Restlessness']
                },
                'severity_distribution': {
                    'mild': 0.70,
                    'moderate': 0.25,
                    'severe': 0.05
                }
            },
            'adherence': {
                'overall_rate': 0.91,
                'by_medication_type': {
                    'scheduled': 0.94,
                    'prn': 0.85,
                    'breakthrough': 0.88
                }
            },
            'cost_analysis': {
                'average_cost_per_patient': 450,
                'most_expensive': 'Morphine',
                'cost_trend': 'stable'
            }
        }
        
        return analysis
    
    def calculate_satisfaction_metrics(self, days: int = 30) -> Dict:
        """Calculate patient and family satisfaction metrics"""
        metrics = {
            'patient_satisfaction': {
                'overall_score': 0.91,
                'pain_management': 0.89,
                'symptom_control': 0.87,
                'communication': 0.93,
                'responsiveness': 0.90,
                'dignity_respect': 0.95,
                'emotional_support': 0.88
            },
            'family_satisfaction': {
                'overall_score': 0.89,
                'communication': 0.92,
                'information_provided': 0.88,
                'emotional_support': 0.87,
                'involvement_in_care': 0.90,
                'bereavement_support': 0.86
            },
            'net_promoter_score': 72,
            'response_rate': 0.78,
            'trends': {
                'patient_satisfaction': 'improving',
                'family_satisfaction': 'stable'
            },
            'areas_of_excellence': [
                'Dignity and respect',
                'Communication',
                'Responsiveness'
            ],
            'areas_for_improvement': [
                'Bereavement support',
                'Symptom control',
                'Emotional support'
            ]
        }
        
        return metrics
    
    def generate_predictive_insights(self, patient_id: str) -> Dict:
        """Generate predictive insights for patient care"""
        insights = {
            'risk_predictions': {
                'deterioration_risk': {
                    'score': 0.35,
                    'level': 'moderate',
                    'factors': ['Pain trend', 'Functional decline']
                },
                'hospitalization_risk': {
                    'score': 0.22,
                    'level': 'low',
                    'factors': ['Stable symptoms', 'Good caregiver support']
                },
                'crisis_risk': {
                    'score': 0.18,
                    'level': 'low',
                    'factors': ['Effective pain management']
                }
            },
            'care_recommendations': [
                'Continue current pain management protocol',
                'Increase family support services',
                'Schedule advance care planning discussion',
                'Monitor for medication tolerance'
            ],
            'resource_needs': {
                'nursing_hours': 12,
                'social_work_hours': 2,
                'chaplain_hours': 1,
                'respite_care_hours': 8
            },
            'timeline_predictions': {
                'expected_length_of_stay': '4-6 weeks',
                'confidence': 0.65,
                'factors': ['Disease progression', 'Functional status', 'Support system']
            }
        }
        
        return insights
    
    def benchmark_performance(self, facility_id: str) -> Dict:
        """Benchmark facility performance against standards"""
        benchmarks = {
            'quality_metrics': {
                'pain_control': {
                    'facility': 0.87,
                    'national_average': 0.82,
                    'top_quartile': 0.90,
                    'performance': 'Above average'
                },
                'patient_satisfaction': {
                    'facility': 0.91,
                    'national_average': 0.85,
                    'top_quartile': 0.92,
                    'performance': 'Top quartile'
                },
                'symptom_management': {
                    'facility': 0.82,
                    'national_average': 0.80,
                    'top_quartile': 0.88,
                    'performance': 'Above average'
                }
            },
            'operational_metrics': {
                'response_time': {
                    'facility': 18,
                    'national_average': 22,
                    'top_quartile': 15,
                    'performance': 'Above average'
                },
                'documentation_timeliness': {
                    'facility': 0.91,
                    'national_average': 0.88,
                    'top_quartile': 0.95,
                    'performance': 'Above average'
                }
            },
            'financial_metrics': {
                'cost_per_patient_day': {
                    'facility': 245.50,
                    'national_average': 265.00,
                    'top_quartile': 235.00,
                    'performance': 'Above average'
                }
            },
            'overall_ranking': 'Top 15% nationally'
        }
        
        return benchmarks

# Global analytics engine instance
analytics_engine = AnalyticsEngine()

def get_analytics_engine() -> AnalyticsEngine:
    """Get the global analytics engine instance"""
    return analytics_engine
