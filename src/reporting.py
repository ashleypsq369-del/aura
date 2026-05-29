"""Reporting Module - Comprehensive Report Generation"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import json

@dataclass
class ReportMetadata:
    """Report metadata"""
    report_id: str
    report_type: str
    generated_at: datetime
    generated_by: str
    date_range: Tuple[datetime, datetime]
    parameters: Dict

class ReportGenerator:
    """Generate various clinical and administrative reports"""
    
    def __init__(self):
        self.report_templates = self._load_templates()
    
    def _load_templates(self) -> Dict:
        """Load report templates"""
        return {
            'patient_summary': {
                'sections': ['demographics', 'diagnosis', 'medications', 'vitals', 'care_plan'],
                'format': 'detailed'
            },
            'pain_management': {
                'sections': ['pain_trends', 'medication_effectiveness', 'interventions'],
                'format': 'analytical'
            },
            'quality_metrics': {
                'sections': ['outcomes', 'satisfaction', 'compliance', 'efficiency'],
                'format': 'dashboard'
            }
        }
    
    def generate_patient_summary_report(self, patient_id: str, 
                                       start_date: datetime, 
                                       end_date: datetime) -> Dict:
        """Generate comprehensive patient summary report"""
        report_id = f"PSR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Collect patient data (in production, query from database)
        report_data = {
            'metadata': {
                'report_id': report_id,
                'patient_id': patient_id,
                'date_range': f"{start_date.date()} to {end_date.date()}",
                'generated_at': datetime.now().isoformat()
            },
            'demographics': {
                'name': 'John Doe',
                'age': 68,
                'gender': 'Male',
                'admission_date': '2024-01-15'
            },
            'diagnosis': {
                'primary': 'Stage IV Lung Cancer',
                'secondary': ['COPD', 'Hypertension'],
                'prognosis': '3-6 months'
            },
            'pain_summary': {
                'average_pain': 5.2,
                'max_pain': 8,
                'min_pain': 2,
                'pain_free_days': 3,
                'breakthrough_episodes': 12
            },
            'medication_summary': {
                'total_medications': 8,
                'pain_medications': 3,
                'adherence_rate': 0.92,
                'adjustments_made': 2
            },
            'vital_signs_summary': {
                'bp_average': '128/82',
                'hr_average': 78,
                'temp_average': 98.4,
                'rr_average': 18,
                'abnormal_readings': 5
            },
            'functional_status': {
                'mobility': 'Wheelchair dependent',
                'adl_score': 45,
                'iadl_score': 20,
                'decline_rate': 'Moderate'
            },
            'care_activities': {
                'nurse_visits': 24,
                'physician_visits': 4,
                'social_worker_visits': 3,
                'chaplain_visits': 2,
                'total_care_hours': 48
            },
            'family_engagement': {
                'primary_caregiver': 'Spouse',
                'caregiver_stress_level': 'Moderate',
                'family_meetings': 2,
                'education_sessions': 5
            },
            'goals_of_care': {
                'primary_goal': 'Pain management and comfort',
                'goals_met': 4,
                'goals_in_progress': 2,
                'goals_revised': 1
            }
        }
        
        return report_data
    
    def generate_pain_management_report(self, patient_id: str, days: int = 30) -> Dict:
        """Generate pain management effectiveness report"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Generate synthetic pain data for demonstration
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        pain_levels = np.random.normal(5, 1.5, len(dates)).clip(0, 10)
        
        report = {
            'summary': {
                'period': f"{days} days",
                'average_pain': float(np.mean(pain_levels)),
                'pain_control_rate': float(np.sum(pain_levels <= 4) / len(pain_levels)),
                'severe_pain_days': int(np.sum(pain_levels >= 7)),
                'trend': 'Improving' if pain_levels[-7:].mean() < pain_levels[:7].mean() else 'Stable'
            },
            'pain_trends': {
                'dates': [d.strftime('%Y-%m-%d') for d in dates],
                'pain_levels': pain_levels.tolist(),
                'moving_average': pd.Series(pain_levels).rolling(window=7).mean().tolist()
            },
            'medication_effectiveness': {
                'breakthrough_doses_used': 15,
                'average_relief_time': 25,  # minutes
                'medication_adjustments': 2,
                'side_effects_reported': 3
            },
            'interventions': {
                'pharmacological': ['Morphine increase', 'Added gabapentin'],
                'non_pharmacological': ['Heat therapy', 'Positioning', 'Relaxation techniques'],
                'effectiveness_rating': 0.78
            },
            'recommendations': [
                'Continue current pain management protocol',
                'Monitor for tolerance development',
                'Consider adjuvant therapy for neuropathic component',
                'Increase non-pharmacological interventions'
            ]
        }
        
        return report
    
    def generate_quality_metrics_report(self, facility_id: str, 
                                       start_date: datetime, 
                                       end_date: datetime) -> Dict:
        """Generate quality metrics and outcomes report"""
        report = {
            'metadata': {
                'facility_id': facility_id,
                'reporting_period': f"{start_date.date()} to {end_date.date()}",
                'generated_at': datetime.now().isoformat()
            },
            'patient_outcomes': {
                'total_patients': 45,
                'pain_control_rate': 0.87,
                'symptom_management_score': 0.82,
                'patient_satisfaction': 0.91,
                'family_satisfaction': 0.89,
                'goals_of_care_met': 0.85
            },
            'clinical_quality': {
                'comprehensive_assessment_rate': 0.98,
                'care_plan_update_rate': 0.95,
                'medication_reconciliation_rate': 0.97,
                'advance_directive_completion': 0.92,
                'pain_assessment_frequency': 0.96
            },
            'operational_efficiency': {
                'average_response_time': 18,  # minutes
                'visit_completion_rate': 0.94,
                'documentation_timeliness': 0.91,
                'staff_utilization': 0.88,
                'resource_efficiency': 0.85
            },
            'compliance_metrics': {
                'regulatory_compliance': 0.98,
                'policy_adherence': 0.96,
                'training_completion': 0.94,
                'safety_protocols': 0.97
            },
            'financial_metrics': {
                'cost_per_patient_day': 245.50,
                'revenue_per_patient': 8750.00,
                'collection_rate': 0.93,
                'budget_variance': -0.02
            },
            'benchmarks': {
                'national_average_pain_control': 0.82,
                'national_average_satisfaction': 0.85,
                'regional_ranking': 'Top 15%'
            }
        }
        
        return report
    
    def generate_medication_report(self, patient_id: str, days: int = 30) -> Dict:
        """Generate medication management report"""
        report = {
            'summary': {
                'total_medications': 8,
                'scheduled_doses': 240,
                'doses_administered': 221,
                'adherence_rate': 0.92,
                'missed_doses': 19
            },
            'medications': [
                {
                    'name': 'Morphine',
                    'dose': '15mg',
                    'frequency': 'Every 4 hours',
                    'adherence': 0.95,
                    'effectiveness': 0.85,
                    'side_effects': ['Constipation']
                },
                {
                    'name': 'Lorazepam',
                    'dose': '0.5mg',
                    'frequency': 'Twice daily',
                    'adherence': 0.90,
                    'effectiveness': 0.88,
                    'side_effects': []
                },
                {
                    'name': 'Gabapentin',
                    'dose': '300mg',
                    'frequency': 'Three times daily',
                    'adherence': 0.87,
                    'effectiveness': 0.75,
                    'side_effects': ['Dizziness']
                }
            ],
            'adjustments': [
                {
                    'date': '2024-01-20',
                    'medication': 'Morphine',
                    'change': 'Increased from 10mg to 15mg',
                    'reason': 'Inadequate pain control'
                },
                {
                    'date': '2024-01-25',
                    'medication': 'Gabapentin',
                    'change': 'Added to regimen',
                    'reason': 'Neuropathic pain component'
                }
            ],
            'side_effects': {
                'total_reported': 5,
                'managed': 4,
                'ongoing': 1,
                'severity': 'Mild to moderate'
            },
            'recommendations': [
                'Continue current regimen',
                'Monitor for constipation',
                'Consider bowel regimen adjustment',
                'Reassess gabapentin effectiveness in 2 weeks'
            ]
        }
        
        return report
    
    def generate_caregiver_report(self, patient_id: str) -> Dict:
        """Generate caregiver support and burden report"""
        report = {
            'caregiver_info': {
                'name': 'Jane Doe',
                'relationship': 'Spouse',
                'primary_caregiver': True,
                'support_level': 'High'
            },
            'burden_assessment': {
                'overall_burden_score': 45,  # 0-100, higher is more burden
                'physical_burden': 'Moderate',
                'emotional_burden': 'High',
                'financial_burden': 'Low',
                'social_isolation': 'Moderate'
            },
            'support_provided': {
                'education_sessions': 5,
                'counseling_sessions': 3,
                'respite_care_hours': 24,
                'support_group_attendance': 4
            },
            'caregiver_needs': [
                'Additional respite care',
                'Stress management techniques',
                'Financial planning assistance',
                'Grief counseling preparation'
            ],
            'interventions': [
                'Scheduled weekly respite care',
                'Connected with support group',
                'Provided stress management resources',
                'Arranged social worker consultation'
            ],
            'outcomes': {
                'stress_reduction': 0.25,
                'confidence_improvement': 0.35,
                'satisfaction_with_support': 0.88
            }
        }
        
        return report
    
    def generate_end_of_life_report(self, patient_id: str) -> Dict:
        """Generate end-of-life care quality report"""
        report = {
            'advance_care_planning': {
                'advance_directive': True,
                'living_will': True,
                'dnr_status': True,
                'healthcare_proxy': True,
                'polst_completed': True
            },
            'symptom_management': {
                'pain_controlled': True,
                'dyspnea_managed': True,
                'anxiety_addressed': True,
                'secretions_managed': True,
                'comfort_maintained': True
            },
            'psychosocial_support': {
                'patient_counseling': 'Provided',
                'family_support': 'Ongoing',
                'spiritual_care': 'Provided',
                'legacy_work': 'In progress',
                'life_review': 'Completed'
            },
            'family_preparation': {
                'education_provided': True,
                'expectations_discussed': True,
                'bereavement_planning': True,
                'memorial_planning': 'In progress'
            },
            'quality_indicators': {
                'died_in_preferred_location': True,
                'family_present': True,
                'pain_free_at_death': True,
                'dignity_maintained': True,
                'wishes_honored': True
            },
            'bereavement_support': {
                'follow_up_calls': 3,
                'grief_counseling_offered': True,
                'support_group_referral': True,
                'memorial_service_support': True
            }
        }
        
        return report
    
    def export_report_to_pdf(self, report_data: Dict, filename: str) -> str:
        """Export report to PDF format (placeholder)"""
        # In production, use reportlab or similar library
        return f"Report exported to {filename}.pdf"
    
    def export_report_to_excel(self, report_data: Dict, filename: str) -> str:
        """Export report to Excel format (placeholder)"""
        # In production, use openpyxl or pandas
        return f"Report exported to {filename}.xlsx"
    
    def schedule_report(self, report_type: str, frequency: str, 
                       recipients: List[str]) -> Dict:
        """Schedule automated report generation"""
        schedule_id = f"SCH-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        schedule = {
            'schedule_id': schedule_id,
            'report_type': report_type,
            'frequency': frequency,
            'recipients': recipients,
            'next_run': datetime.now() + timedelta(days=1),
            'status': 'active'
        }
        
        return schedule

# Global report generator instance
report_generator = ReportGenerator()

def get_report_generator() -> ReportGenerator:
    """Get the global report generator instance"""
    return report_generator
