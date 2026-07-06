# Authentication Fix Summary

## Problem
Users were able to log in successfully, but were immediately logged out when trying to access protected routes like the dashboard.

## Root Causes

### 1. JWT Token "sub" Field Type Mismatch
**Issue:** The JWT specification requires the `sub` (subject) field to be a string, but we were passing an integer (user ID).

**Error:** `Subject must be a string`

**Fix:**
- Modified `backend/routers/auth.py` to convert user ID to string when creating token:
  ```python
  "sub": str(user.id)  # Convert to string for JWT compliance
  ```
- Updated `backend/middleware/auth_middleware.py` to handle string conversion:
  ```python
  user_id_str: str = payload.get("sub")
  payload["user_id"] = int(user_id_str)  # Convert back to integer
  ```

### 2. SQLAlchemy Model Schema Mismatch
**Issue:** The SQLAlchemy ORM models defined fields that didn't exist in the actual database tables.

**Errors:**
- `no such column: users.password_hash` (expected `password`)
- `no such column: patients.name` (doesn't exist in DB)
- `no such column: patients.date_of_birth` (doesn't exist in DB)
- `no such column: patients.diagnosis` (doesn't exist in DB)
- `no such column: patients.assigned_clinician_id` (doesn't exist in DB)
- `no such column: vitals.vital_type` (doesn't exist in DB)
- `no such column: symptoms.symptom_type` (doesn't exist in DB)

**Fix:** Updated `backend/src/db.py` to match actual database schema:

#### User Model
```python
password = Column('password', String(256), nullable=False)  # Map to 'password' column
full_name = Column('full_name', String(200), nullable=True)  # Map to 'full_name' column

@property
def password_hash(self):
    """Alias for backward compatibility"""
    return self.password

@property
def name(self):
    """Alias for full_name field"""
    return self.full_name if self.full_name else self.username
```

#### Patient Model
Removed non-existent fields:
- `name`
- `date_of_birth`
- `diagnosis`
- `assigned_clinician_id`
- `assigned_clinician` relationship

#### Vital Model
Removed non-existent fields:
- `vital_type`
- `value`
- `unit`

#### Symptom Model
Removed non-existent fields:
- `symptom_type`
- `severity`

## Testing Results

### Before Fix
```
POST /api/auth/login → 200 OK ✓
GET /api/dashboard/summary → 401 Unauthorized ✗
GET /api/patients → 401 Unauthorized ✗
```

### After Fix
```
POST /api/auth/login → 200 OK ✓
GET /api/dashboard/summary → 200 OK ✓
GET /api/patients → 200 OK ✓
```

## Files Modified

1. `backend/routers/auth.py`
   - Convert user ID to string in JWT token
   - Handle string-to-int conversion in `/me` endpoint

2. `backend/middleware/auth_middleware.py`
   - Parse string `sub` from JWT
   - Convert to integer for internal use
   - Update `get_current_user_id()` to return integer version

3. `backend/src/db.py`
   - Fix User model column mappings
   - Remove non-existent fields from Patient model
   - Remove non-existent fields from Vital model
   - Remove non-existent fields from Symptom model
   - Remove invalid relationship references

## How to Test

1. Start the backend:
   ```cmd
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. Start the frontend:
   ```cmd
   cd frontend
   npm run dev
   ```

3. Open browser to http://localhost:5173/

4. Log in with any demo account:
   - Username: `clinician` / Password: `clinician123`
   - Username: `patient` / Password: `patient123`
   - Username: `family` / Password: `family123`
   - Username: `caregiver` / Password: `caregiver123`
   - Username: `admin` / Password: `admin123`

5. Verify you stay logged in and can access the dashboard

## Database Schema Reference

### Users Table
- id (INTEGER, PK)
- username (TEXT, NOT NULL)
- password (TEXT, NOT NULL) ← Note: NOT password_hash
- email (TEXT)
- role (TEXT, NOT NULL)
- created_at (TIMESTAMP)
- full_name (TEXT)
- phone, date_of_birth, gender, address, profile_picture, updated_at

### Patients Table
- id (INTEGER, PK)
- patient_code (VARCHAR(50), NOT NULL)
- age (INTEGER, NOT NULL)
- gender (VARCHAR(20), NOT NULL)
- ethnicity (VARCHAR(50), NOT NULL)
- admission_date (DATETIME)
- status (VARCHAR(20))
- death_date (DATETIME)

### Vitals Table
- id (INTEGER, PK)
- patient_id (INTEGER, FK)
- recorded_by (INTEGER, FK)
- timestamp (DATETIME)
- heart_rate (FLOAT, NOT NULL)
- blood_pressure_sys (FLOAT, NOT NULL)
- blood_pressure_dia (FLOAT, NOT NULL)
- oxygen_saturation (FLOAT, NOT NULL)
- temperature (FLOAT, NOT NULL)

### Symptoms Table
- id (INTEGER, PK)
- patient_id (INTEGER, FK)
- recorded_by (INTEGER, FK)
- timestamp (DATETIME)
- pain_level (INTEGER, NOT NULL)
- nausea (BOOLEAN)
- fatigue (BOOLEAN)
- anxiety (BOOLEAN)
- notes (TEXT)

## Prevention

To avoid similar issues in the future:

1. **Always check database schema before defining ORM models**
   ```python
   # Use this script to check schema
   python check_schema.py
   ```

2. **JWT Best Practices**
   - Always use strings for `sub` field
   - Convert to appropriate types in application code
   - Document type conversions

3. **Schema Validation**
   - Run integration tests that exercise database queries
   - Use migration tools to keep models in sync with database
   - Consider using Alembic for schema migrations

## Status
✅ **RESOLVED** - Users can now log in and stay authenticated throughout their session.
