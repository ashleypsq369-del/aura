
-- Rollback script for comprehensive hospice care migration
-- WARNING: This will delete all data in the new tables!

DROP TABLE IF EXISTS qol_assessments;
DROP TABLE IF EXISTS functional_status;
DROP TABLE IF EXISTS bereavement_plans;
DROP TABLE IF EXISTS bereavement_resources;
DROP TABLE IF EXISTS grief_assessments;
DROP TABLE IF EXISTS care_interventions;
DROP TABLE IF EXISTS care_goals;
DROP TABLE IF EXISTS care_plans;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS memory_entries;
DROP TABLE IF EXISTS communication_logs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS care_team_members;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS medication_administrations;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medications;
