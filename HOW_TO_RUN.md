c# Project Aura — How to Run

## What you need (install once)

| Tool | Where to get it | Required? |
|------|----------------|-----------|
| **Python 3.10+** | https://python.org/downloads | ✅ Yes |
| **Node.js 18+** | https://nodejs.org | ✅ Yes |

> **Windows users**: When installing Python, tick **"Add Python to PATH"**.

---

## Quickstart

### Windows
Double-click **`START_HERE.bat`**

It will automatically:
1. Install all Python packages
2. Install frontend packages
3. Build the frontend
4. Set up the database with demo data
5. Open your browser to the app

### macOS / Linux
```bash
chmod +x START_HERE_MAC_LINUX.sh
./START_HERE_MAC_LINUX.sh
```

---

## Logins (demo data pre-loaded)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Clinician | `dr_mensah` | `clinic123` |
| Patient | `patient` | `patient123` |
| Family | `kofi_family` | `family123` |
| Caregiver | `caregiver1` | `care123` |

---

## Accessing the app

Open your browser to: **http://localhost:8000**

The backend serves both the API and the frontend from the same port.

---

## Optional: AI Chat features

The app works fully without AI keys. If you want real LLM-powered chat:

1. Open `backend/.env`
2. Add a free Gemini key from https://aistudio.google.com
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Restart the app

---

## If a registered user can't see their data

This can happen if they registered before the patient auto-creation fix. Run this once:
```
cd backend
python fix_orphaned_patients.py
```
It's safe to run multiple times — skips users who are already properly linked.

---

## Desktop App (Windows)

To run as a native desktop app (no browser):
```
python projectaura_app.py
```

Requires `pywebview` to be installed:
```
pip install pywebview
```

---

## Folder structure

```
ProjectAura_React/
├── backend/
│   ├── aura.db              ← SQLite database (34 users, demo patients pre-loaded)
│   ├── .env                 ← Config (pre-set: SQLite, no external DB needed)
│   ├── requirements.txt     ← Python packages list
│   ├── main.py              ← FastAPI app entry point
│   ├── routers/             ← API endpoints
│   ├── services/            ← ML, AI, business logic
│   ├── src/db.py            ← Database models
│   └── ml_training/
│       └── models/          ← Trained XGBoost models (8 tasks + SHAP)
├── frontend/
│   ├── src/                 ← React source code
│   └── dist/                ← Pre-built app (built by START_HERE.bat)
├── START_HERE.bat           ← Windows one-click launcher ← START HERE
├── START_HERE_MAC_LINUX.sh  ← macOS/Linux launcher
└── HOW_TO_RUN.md            ← This file
```

## When sharing as a ZIP

Include everything **except**:
- `frontend/node_modules/` (auto-installed by launcher)
- `backend/venv/` (auto-created by pip install)
- `frontend/dist/` (auto-built by launcher)

The recipient just needs: Python 3.10+ and Node.js 18+, then runs `START_HERE.bat`.

---

## Troubleshooting

**"Port 8000 already in use"**
Something else is using port 8000. Either close it or change the port:
```
python -m uvicorn main:app --port 8001
```
Then open http://localhost:8001

**"Module not found" error**
```
cd backend
pip install -r requirements.txt
```

**Database errors**
Delete `backend/aura.db` and re-run `START_HERE.bat` — it will recreate with fresh demo data.

**Frontend shows old version**
```
cd frontend
npm run build
```
