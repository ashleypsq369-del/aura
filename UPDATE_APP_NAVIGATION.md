# Update App Navigation

## Add New Pages to Sidebar

To make the new pages accessible, update your `app.py` file to include the new pages in the navigation.

### Option 1: Manual Update

Add these entries to your sidebar navigation in `app.py`:

```python
# Add to your page navigation dictionary or sidebar
pages = {
    # ... existing pages ...
    "Medication Management": "pages/11_Medication_Management.py",
    "Appointment Scheduling": "pages/12_Appointment_Scheduling.py",
    "Caregiver Portal": "pages/13_Caregiver_Portal.py",
    "Memory Vault": "pages/14_Memory_Vault.py",
    "Personal Journal": "pages/15_Journal.py",
    "Care Plan": "pages/16_Care_Plan.py",
    "Functional Status": "pages/17_Functional_Status.py",
}
```

### Option 2: Streamlit Auto-Discovery

Streamlit automatically discovers pages in the `pages/` directory. The new pages should appear in your sidebar automatically when you run:

```bash
streamlit run app.py
```

## Page Numbers

The pages are numbered to appear in logical order:
- 11: Medication Management
- 12: Appointment Scheduling
- 13: Caregiver Portal
- 14: Memory Vault
- 15: Personal Journal
- 16: Care Plan
- 17: Functional Status

## Icons Used

- 💊 Medication Management
- 📅 Appointment Scheduling
- 👥 Caregiver Portal
- 📸 Memory Vault
- 📔 Personal Journal
- 📋 Care Plan
- 📊 Functional Status

## Testing Navigation

After updating, test that:
1. All pages appear in the sidebar
2. Pages load without errors
3. Authentication is enforced
4. Database connections work
5. Forms submit correctly

## Next Steps

1. Run database migration: `python scripts/migrate_database.py`
2. Restart Streamlit: `streamlit run app.py`
3. Navigate to each new page
4. Test core functionality
5. Create demo data for testing
