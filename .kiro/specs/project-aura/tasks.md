(# Implementation Plan

## Overview

This implementation plan follows the four-pillar architecture of Project Aura, building each component incrementally with property-based testing integrated throughout. The plan is organized into phases that align with the master development prompt:

- **Phase 0**: Project foundation and environment setup ✓ (Complete)
- **Phase 1**: Build Pillar 1 (Intelligent Core - XAI Engine) and Pillar 4 (Validation Engine - Synthetic Data)
- **Phase 2**: Build Pillar 3 (Human Bridge - Dashboard and Alerts)
- **Phase 3**: Build Pillar 2 (Safety Layer - Support Hub and Bereavement Bridge)
- **Phase 4**: Integration, validation, and finalization

Each task builds incrementally on previous work, with property-based tests integrated close to implementation to catch errors early. Optional tasks (marked with *) focus on comprehensive testing and can be skipped for a faster MVP.

## Tasks

- [x] 1. Set up project structure and dependencies (PHASE 0 - COMPLETE)



  - Create directory structure: src/, data/, docs/, tests/, logs/
  - Create requirements.txt with all dependencies (streamlit, xgboost, shap, sdv, sqlalchemy, pandas, numpy, matplotlib, seaborn, pytest, hypothesis, joblib, python-dotenv)
  - Create .env.example file for API key configuration
  - Create .gitignore for Python project
  - Initialize Git repository
  - _Requirements: 10.5_

## PHASE 1: BUILD INTELLIGENT CORE & VALIDATION ENGINE (Pillars 1 & 4)

- [x] 2. Implement database layer (db.py) - FOUNDATION



  - Create SQLAlchemy models for all tables (User, Patient, Vital, Symptom, Prediction, Alert, BereavementEntry)
  - Implement database initialization function with table creation
  - Implement session management and connection handling
  - Implement user management functions (add_user, get_user, authenticate_user)
  - Implement patient CRUD operations (add_patient, get_patient, update_patient_status)
  - Implement data logging functions (log_vital, log_symptom)
  - Implement query functions for trend data (get_patient_history, get_recent_vitals, get_recent_symptoms)
  - Implement prediction persistence (save_prediction, get_predictions)
  - Implement alert management (create_alert, get_pending_alerts, acknowledge_alert)
  - Implement bereavement data functions (save_bereavement_entry, get_bereavement_entries)
  - _Requirements: 2.3, 3.2, 9.2_



- [ ] 2.1 Write property test for data persistence with metadata
  - **Property 10: Data persistence with metadata**

  - **Validates: Requirements 3.2, 5.5, 6.4**

- [x] 2.2 Write property test for local storage verification

  - **Property 7: Local storage verification**
  - **Validates: Requirements 2.3, 9.2**



- [ ] 2.3 Write property test for cross-component data consistency
  - **Property 31: Cross-component data consistency**
  - **Validates: Requirements 10.2**




- [ ] 2.4 Write unit tests for database operations
  - Test user authentication with valid/invalid credentials
  - Test patient CRUD operations
  - Test vital and symptom logging with edge cases
  - Test foreign key constraints
  - _Requirements: 2.3, 3.2_


- [ ] 3. Implement synthetic data generator (simulator.py - Part 1) - PILLAR 4
  - Install and configure SDV library
  - Define data schema for synthetic patient generation (demographics, vitals, symptoms)

  - Implement diversity constraints for bias mitigation (age, gender, ethnicity distributions)
  - Implement generate_synthetic_cohort function to create diverse patient datasets
  - Implement functions to generate stage-appropriate vitals (generate_vital_reading)

  - Implement functions to generate stage-appropriate symptoms (generate_symptom_log)
  - _Requirements: 2.1, 2.2, 2.3_


- [ ] 3.1 Write property test for synthetic patient record completeness
  - **Property 5: Synthetic patient record completeness**
  - **Validates: Requirements 2.1**



- [ ] 3.2 Write property test for demographic diversity in cohorts
  - **Property 6: Demographic diversity in cohorts**
  - **Validates: Requirements 2.2**

- [ ] 3.3 Write property test for synthetic data exclusivity
  - **Property 4: Synthetic data exclusivity**
  - **Validates: Requirements 1.4, 2.4, 9.1, 9.3**

- [ ] 3.4 Write unit tests for synthetic data generation
  - Test SDV data generation with various parameters
  - Test diversity constraint enforcement

  - Test data schema compliance
  - _Requirements: 2.1, 2.2_


- [ ] 4. Implement XAI Engine (models.py) - PILLAR 1
  - Implement feature engineering functions (normalize vitals, encode symptoms)
  - Implement train_models function using XGBoost for care pathway classification and risk regression

  - Implement model persistence (save/load with Joblib)
  - Implement load_models function to load pre-trained models
  - Implement predict_care_pathway function
  - Implement predict_risk_score function
  - Implement SHAP explainer initialization (TreeExplainer for XGBoost)



  - Implement explain_prediction function to generate SHAP values
  - Implement plot_shap_summary function for global explanations
  - Implement plot_shap_waterfall function for local explanations
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 4.1 Write property test for care pathway generation completeness
  - **Property 1: Care pathway generation completeness**

  - **Validates: Requirements 1.1, 1.5**

- [ ] 4.2 Write property test for SHAP explanation presence
  - **Property 2: SHAP explanation presence**
  - **Validates: Requirements 1.2**

- [ ] 4.3 Write unit tests for XAI Engine
  - Test model loading from saved files
  - Test prediction with known synthetic data
  - Test SHAP value computation
  - Test feature engineering with edge cases
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 5. Train initial ML models with synthetic data - PILLAR 1
  - Generate initial synthetic training dataset using simulator
  - Train XGBoost models (care pathway classifier + risk regressor)
  - Validate models on holdout test set
  - Save trained models to models/ directory
  - Document model performance metrics
  - _Requirements: 1.1, 1.4_

## PHASE 2: BUILD HUMAN BRIDGE (Pillar 3)

- [ ] 6. Implement Alert System (alerts.py) - PILLAR 3
  - Implement detect_deterioration function to analyze vital trends
  - Implement detect_pain_spike function to analyze symptom changes
  - Implement any_critical_vital function to check threshold violations
  - Implement check_alerts function as main monitoring loop
  - Implement create_alert function to persist alerts to database
  - Implement get_alert_config function to retrieve notification preferences
  - Implement send_alert_email function with SendGrid API integration
  - Implement start_monitoring_thread function for background monitoring
  - Add error handling and retry logic for email sending
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 6.1 Write property test for deterioration pattern detection
  - **Property 13: Deterioration pattern detection**
  - **Validates: Requirements 4.1**

- [ ] 6.2 Write property test for alert notification triggering
  - **Property 14: Alert notification triggering**
  - **Validates: Requirements 4.2**

- [ ] 6.3 Write property test for alert message completeness
  - **Property 16: Alert message completeness**
  - **Validates: Requirements 4.4**

- [ ] 6.4 Write property test for non-blocking background monitoring
  - **Property 17: Non-blocking background monitoring**
  - **Validates: Requirements 4.5**

- [ ] 6.5 Write unit tests for Alert System
  - Test deterioration detection with known patterns
  - Test alert creation and persistence
  - Test email notification formatting (mock SendGrid)
  - Test alert configuration retrieval
  - _Requirements: 4.1, 4.2, 4.4_

## PHASE 3: BUILD SAFETY LAYER (Pillar 2)

- [ ] 7. Implement Support Hub (chat.py) - PILLAR 2
  - Create resource knowledge base JSON file with curated content (symptom management, medication info, comfort measures, communication guides, emergency contacts)
  - Implement load_resource_database function to load JSON
  - Implement display_main_menu function for Streamlit menu rendering
  - Implement handle_symptom_logging function with structured questions
  - Implement validate_symptom_input function for data validation
  - Implement save_symptom_log function to persist via db.py
  - Implement display_resources function to show curated content by category
  - Implement get_recent_logs function to retrieve and display recent entries
  - Add safety disclaimers and warnings
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.1 Write property test for structured interaction flow
  - **Property 18: Structured interaction flow**
  - **Validates: Requirements 5.2**

- [ ] 7.2 Write property test for knowledge base response sourcing
  - **Property 19: Knowledge base response sourcing**
  - **Validates: Requirements 5.3**

- [ ] 7.3 Write property test for generative AI avoidance
  - **Property 20: Generative AI avoidance**
  - **Validates: Requirements 5.4**

- [ ] 7.4 Write unit tests for Support Hub
  - Test menu navigation and selection
  - Test symptom logging form validation
  - Test resource retrieval from knowledge base
  - Test template response generation
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 8. Implement Bereavement Bridge (bereavement.py) - PILLAR 2
  - Create grief resources JSON file with curated content (organized by grief stages and support types)
  - Implement load_bereavement_resources function to load JSON
  - Implement activate_bereavement_bridge function to enable module after death event
  - Implement display_journal_prompts function with guided writing prompts
  - Implement save_journal_entry function to persist entries
  - Implement display_memory_form function for memory submission
  - Implement save_memory function to persist memories
  - Implement display_grief_resources function to show stage-appropriate content
  - Implement get_user_entries function to retrieve past journals/memories
  - Add compassionate messaging throughout
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.1 Write property test for death event triggers bereavement activation
  - **Property 21: Death event triggers bereavement activation**
  - **Validates: Requirements 6.1, 7.4**

- [ ] 8.2 Write property test for grief resource availability
  - **Property 22: Grief resource availability**
  - **Validates: Requirements 6.3**

- [ ] 8.3 Write property test for resource organization structure
  - **Property 23: Resource organization structure**
  - **Validates: Requirements 6.5**

- [ ] 8.4 Write unit tests for Bereavement Bridge
  - Test activation on death event
  - Test journal entry persistence
  - Test resource loading and categorization
  - Test access control (family only)
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 9. Implement Scenario Simulator (simulator.py - Part 2) - PILLAR 4
  - Implement simulate_patient_journey function to progress through care stages
  - Implement journey stage definitions (admission, stable, deterioration, crisis, death, bereavement)
  - Implement simulate_deterioration function to create alert-worthy trends
  - Implement simulate_death_event function to record death and activate bereavement
  - Implement validate_system_response function to check alert firing and bereavement activation
  - Implement generate_simulation_report function with logs, visualizations, and validation results
  - Implement main simulation runner to generate multiple diverse journeys
  - _Requirements: 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Write property test for patient journey completeness
  - **Property 8: Patient journey completeness**
  - **Validates: Requirements 2.5, 7.2**

- [ ] 9.2 Write property test for journey diversity in simulations
  - **Property 24: Journey diversity in simulations**
  - **Validates: Requirements 7.1**

- [ ] 9.3 Write property test for alert system integration validation
  - **Property 25: Alert system integration validation**
  - **Validates: Requirements 7.3**

- [ ] 9.4 Write property test for simulation report completeness
  - **Property 26: Simulation report completeness**
  - **Validates: Requirements 7.5**

- [ ] 9.5 Write unit tests for Scenario Simulator
  - Test journey stage progression
  - Test integration with alert system
  - Test report generation
  - _Requirements: 7.2, 7.3, 7.5_

## PHASE 2 (Continued): DASHBOARD PAGES

- [ ] 10. Implement main Streamlit application (app.py) - PILLAR 3
  - Create main application entry point with routing logic
  - Implement initialize_app function (database setup, model loading, alert thread start)
  - Implement session state management for authentication
  - Implement render_sidebar function with navigation menu
  - Implement check_authentication function with redirect logic
  - Implement apply_theme function for empathetic UI styling
  - Add error handling and logging setup
  - _Requirements: 10.1, 10.3_

- [ ] 10.1 Write property test for subsystem initialization on launch
  - **Property 30: Subsystem initialization on launch**
  - **Validates: Requirements 10.1**

- [ ] 10.2 Write unit tests for main application
  - Test initialization sequence
  - Test session state management
  - Test routing logic
  - _Requirements: 10.1_

- [ ] 11. Implement Login page (pages/1_Login.py) - PILLAR 3
  - Create login form with username and password fields
  - Implement authentication logic using db.py
  - Implement role assignment on successful login
  - Store user info in session state
  - Add error messages for failed login
  - Implement logout functionality
  - _Requirements: 8.1_

- [ ] 11.1 Write property test for authentication and role assignment
  - **Property 27: Authentication and role assignment**
  - **Validates: Requirements 8.1**

- [ ] 11.2 Write unit tests for login functionality
  - Test authentication with valid/invalid credentials
  - Test role assignment
  - Test session state updates
  - _Requirements: 8.1_

- [ ] 12. Implement Dashboard Home page (pages/2_Dashboard_Home.py) - PILLAR 3
  - Create overview page with quick statistics
  - Display patient summary (active patients, recent alerts)
  - Show recent activity feed
  - Add role-based content visibility
  - Implement empathetic welcome messaging
  - _Requirements: 3.1, 3.4_

- [ ] 13. Implement Log Data page (pages/3_Log_Data.py) - PILLAR 3
  - Create forms for vital sign entry (heart rate, blood pressure, oxygen saturation, temperature)
  - Create forms for symptom entry (pain level, nausea, fatigue, anxiety, notes)
  - Implement form validation
  - Implement data submission to database via db.py
  - Add success/error messages
  - Add timestamp and user attribution automatically
  - _Requirements: 3.2_

- [ ] 14. Implement View Trends page (pages/4_View_Trends.py) - PILLAR 3
  - Implement patient selection dropdown
  - Query historical data from database
  - Create line charts for vital trends over time (using Matplotlib/Streamlit)
  - Create charts for symptom progression
  - Add date range filters
  - Implement interactive chart features
  - _Requirements: 3.3_

- [ ] 14.1 Write property test for trend visualization presence
  - **Property 11: Trend visualization presence**
  - **Validates: Requirements 3.3**

- [ ] 14.2 Write unit tests for trend visualization
  - Test chart generation with various data
  - Test date range filtering
  - _Requirements: 3.3_

- [ ] 15. Implement AI Insights page (pages/5_AI_Insights.py) - PILLAR 1 + 3
  - Implement patient selection dropdown
  - Fetch current patient data from database
  - Call XAI Engine to generate prediction (care pathway + risk score)
  - Display care pathway recommendation with clear formatting
  - Display risk score with visual indicator (progress bar, color coding)
  - Generate and display SHAP visualizations (summary plot and waterfall plot)
  - Add explanatory text for interpreting SHAP plots
  - Store prediction in database for audit trail
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 15.1 Write property test for recommendation display completeness
  - **Property 3: Recommendation display completeness**
  - **Validates: Requirements 1.3**

- [ ] 15.2 Write unit tests for AI Insights page
  - Test prediction generation and display
  - Test SHAP visualization rendering
  - Test prediction persistence
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 16. Implement Support Hub page (pages/6_Support_Hub.py) - PILLAR 2 + 3
  - Integrate chat.py functions into Streamlit interface
  - Display main menu with symptom logging and resource access options
  - Implement symptom logging workflow with structured forms
  - Implement resource browsing by category
  - Display recent symptom logs
  - Add safety disclaimers prominently
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 17. Implement Alerts page (pages/7_Alerts.py) - PILLAR 3
  - Display alert history for selected patient
  - Show alert details (type, timestamp, message, status)
  - Implement alert configuration form (thresholds, notification preferences)
  - Save alert configuration to database
  - Add alert acknowledgment functionality
  - Display pending vs. acknowledged alerts
  - _Requirements: 4.3_

- [ ] 17.1 Write property test for alert configuration persistence
  - **Property 15: Alert configuration persistence**
  - **Validates: Requirements 4.3**

- [ ] 17.2 Write unit tests for Alerts page
  - Test alert display and filtering
  - Test configuration persistence
  - Test acknowledgment functionality
  - _Requirements: 4.3_

- [ ] 18. Implement Bereavement page (pages/8_Bereavement.py) - PILLAR 2 + 3
  - Integrate bereavement.py functions into Streamlit interface
  - Check if bereavement module is active for selected patient
  - Display access denied message if not active
  - Display journal prompts and submission form
  - Display memory submission form
  - Display grief resources organized by stage and type
  - Show user's past journal entries and memories
  - Use compassionate, supportive language throughout
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## PHASE 4: INTEGRATION & FINALIZATION

- [ ] 19. Implement role-based access control across all pages - CROSS-PILLAR
  - Add role checks to each page
  - Implement feature visibility based on role (clinician vs. family)
  - Restrict sensitive data access for family members
  - Add role indicators in UI
  - Test access control with different user roles
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 19.1 Write property test for role-based interface rendering
  - **Property 9: Role-based interface rendering**
  - **Validates: Requirements 3.1, 8.2, 8.3, 8.4**

- [ ] 19.2 Write property test for session state persistence
  - **Property 12: Session state persistence**
  - **Validates: Requirements 8.5**

- [ ] 19.3 Write unit tests for role-based access control
  - Test feature visibility for clinicians
  - Test feature restrictions for family members
  - Test role-based data filtering
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 20. Implement audit logging throughout system - CROSS-PILLAR
  - Add audit log table to database schema (if not already present)
  - Implement log_audit_event function in db.py
  - Add audit logging to all data access operations
  - Add audit logging to all AI predictions
  - Add audit logging to authentication events
  - Add audit logging to alert triggers
  - Implement audit log viewer (optional admin page)
  - _Requirements: 9.4_

- [ ] 20.1 Write property test for audit logging for transparency
  - **Property 28: Audit logging for transparency**
  - **Validates: Requirements 9.4**

- [ ] 20.2 Write unit tests for audit logging
  - Test audit log creation for various operations
  - Test audit log retrieval and filtering
  - _Requirements: 9.4_

- [ ] 21. Add synthetic data indicators throughout UI - CROSS-PILLAR
  - Add banner or watermark to all pages indicating synthetic data
  - Add tooltips explaining synthetic data purpose
  - Add visual indicators (icons, labels) on data displays
  - Ensure indicators are prominent but not intrusive
  - _Requirements: 9.5_

- [ ] 21.1 Write property test for synthetic data indicators in UI
  - **Property 29: Synthetic data indicators in UI**
  - **Validates: Requirements 9.5**

- [ ] 22. Implement empathetic UI design and accessibility - PILLAR 3
  - Define color palette (soft blues, greens, warm neutrals)
  - Create custom CSS for Streamlit theme
  - Set minimum font sizes (14pt body text)
  - Ensure high contrast for accessibility
  - Test with screen readers (basic accessibility check)
  - Add ARIA labels where appropriate
  - Implement mobile-responsive layouts
  - Use compassionate language in all UI text
  - _Requirements: 3.5_

- [ ] 23. Create seed data and initial setup script - PILLAR 4
  - Create setup.py script to initialize database
  - Generate initial synthetic patient cohort
  - Create default user accounts (clinician and family examples)
  - Train initial ML models if not already trained
  - Populate resource knowledge bases
  - Create README instructions for first-time setup
  - _Requirements: 10.5_

- [ ] 24. Run end-to-end simulation validation - PILLAR 4
  - Execute Scenario Simulator with multiple patient journeys
  - Verify all system components respond correctly
  - Check that alerts are triggered appropriately
  - Verify bereavement activation on death events
  - Review simulation report for any errors
  - Fix any issues discovered during simulation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 25. Create comprehensive documentation - FINALIZATION
  - Write README.md with project overview, setup instructions, and usage guide
  - Write docs/architecture.md with detailed system architecture
  - Write docs/ethics.md covering ethical considerations (bias mitigation, privacy, transparency)
  - Write docs/user_guide.md with screenshots and workflows
  - Write docs/developer_guide.md for future development
  - Document API keys setup (SendGrid)
  - Create demo script for presentation
  - _Requirements: 10.5_

- [ ] 26. Final integration testing and bug fixes - FINALIZATION
  - Test complete user workflows (clinician and family perspectives)
  - Test all page navigation and transitions
  - Test error handling and edge cases
  - Verify all alerts are working correctly
  - Test with multiple concurrent users (if possible)
  - Fix any bugs discovered during testing
  - Ensure all tests pass (unit and property tests)
  - _Requirements: 10.1, 10.2_

- [ ] 27. Prepare for deployment and demo - FINALIZATION
  - Create requirements.txt with pinned versions
  - Test installation in fresh virtual environment
  - Create demo data set for presentation
  - Prepare demo script highlighting key features
  - Test application performance and responsiveness
  - Create video demo outline (optional)
  - Finalize all documentation
  - _Requirements: 10.3, 10.5_
