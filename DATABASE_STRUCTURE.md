# Project Aura Database Structure

## Database Type: SQLite (`aura.db`)

## Complete Table List (20 Tables Total)

### Original Tables (5):
1. **users** - User accounts and authentication
2. **patients** - Patient demographic and medical records
3. **vitals** - Vital signs tracking
4. **symptoms** - Symptom logs
5. **alerts** - System alerts

### New Tables (15):
6. **bereavement_journal** - Grief journal with sentiment analysis
7. **family_contacts** - Family/guardian contact information
8. **appointments** - Appointment scheduling
9. **care_tasks** - Task management for caregivers
10. **care_goals** - Care plan goals tracking
11. **memory_items** - Memory vault (photos/videos)
12. **journal_entries** - Personal journal
13. **functional_assessments** - ADL/IADL assessments
14. **medication_schedules** - Medication plans
15. **medication_administration** - Medication records
16. **care_team_members** - Care team assignments
17. **team_messages** - Team communication
18. **training_scenarios** - Clinical simulations
19. **simulation_results** - Training results
20. **care_plan_documents** - Document storage

## Database Helper Functions Created

### File: `src/db_helpers.py`

All CRUD operations available:

#### Bereavement:
- `save_bereavement_journal()` - Save grief journal with sentiment
- `get_bereavement_journals()` - Retrieve entries

#### Family Contacts:
- `save_family_contact()` - Add family/guardian
- `get_family_contacts()` - Get all contacts
- `get_primary_contact()` - Get primary contact

#### Appointments:
- `save_appointment()` - Schedule appointment
- `get_appointments()` - Get appointments
- `update_appointment_status()` - Update status

#### Care Tasks:
- `save_care_task()` - Create task
- `get_care_tasks()` - Get tasks
- `complete_care_task()` - Mark complete

#### Care Goals:
- `save_care_goal()` - Add goal
- `update_goal_progress()` - Update progress
- `get_care_goals()` - Get goals

#### Memory Vault:
- `save_memory_item()` - Upload memory
- `get_memory_items()` - Get memories

#### Journal:
- `save_journal_entry()` - Save entry
- `get_journal_entries()` - Get entries

#### Functional Assessment:
- `save_functional_assessment()` - Save assessment
- `get_functional_assessments()` - Get assessments

#### Medications:
- `save_medication_schedule()` - Add medication
- `get_medication_schedules()` - Get schedules
- `record_medication_administration()` - Record administration

#### Team Communication:
- `save_team_message()` - Send message
- `get_team_messages()` - Get messages

#### Utilities:
- `get_patient_id_by_user()` - Get patient ID
- `get_user_info()` - Get user details

## Next Steps: Phase 3

Now we need to:
1. ✅ Update render functions to use database helpers
2. ✅ Connect forms to save data
3. ✅ Display real data from database
4. ✅ Add validation and error handling

Ready to proceed!
