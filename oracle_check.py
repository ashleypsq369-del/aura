"""Oracle Project Health Check"""
import sqlite3, os, sys, json
from pathlib import Path

ROOT = Path(r"C:\Users\User\Documents\oracle")

print("=" * 60)
print("ORACLE PROJECT HEALTH CHECK")
print("=" * 60)

# 1. Database
print("\n[1] DATABASE STATUS")
db_path = ROOT / "data" / "oracle.db"
if db_path.exists():
    size_mb = db_path.stat().st_size / 1_048_576
    print(f"  oracle.db  {size_mb:.1f} MB")
    conn = sqlite3.connect(str(db_path))
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    print(f"  Tables ({len(tables)}):")
    for (t,) in tables:
        n = conn.execute(f"SELECT COUNT(*) FROM [{t}]").fetchone()[0]
        flag = " *** EMPTY ***" if n == 0 else ""
        print(f"    {t:<30} {n:>8,} rows{flag}")
    conn.close()
else:
    print("  MISSING: data/oracle.db")

# 2. Training data
print("\n[2] TRAINING DATA")
csv_path = ROOT / "data" / "training" / "oracle_training_data.csv"
if csv_path.exists():
    mb = csv_path.stat().st_size / 1_048_576
    with open(csv_path, encoding="utf-8", errors="replace") as f:
        lines = sum(1 for _ in f) - 1
    print(f"  oracle_training_data.csv  {mb:.1f} MB  ~{lines:,} rows")
    # Peek at columns
    with open(csv_path, encoding="utf-8", errors="replace") as f:
        header = f.readline().strip()
    print(f"  Columns: {header[:150]}")
else:
    print("  MISSING: training CSV")

# 3. Models
print("\n[3] TRAINED MODEL FILES")
models_dir = ROOT / "models"
if models_dir.exists():
    pkls = sorted(models_dir.rglob("*.pkl"))
    for f in pkls:
        mb = f.stat().st_size / 1_048_576
        rel = str(f).replace(str(models_dir), "")
        print(f"  {rel:<55} {mb:>8.1f} MB")
else:
    print("  models/ directory missing")

# 4. Gate weights
print("\n[4] GATE WEIGHTS")
gw = ROOT / "data" / "gate_weights.json"
if gw.exists():
    weights = json.loads(gw.read_text(encoding="utf-8"))
    for k, v in weights.items():
        print(f"  {k:<30} {v}")
else:
    print("  MISSING: data/gate_weights.json")

# 5. Core imports
print("\n[5] CORE MODULE IMPORTS")
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "web"))
checks = [
    ("model.engine",          "DixonColesEngine"),
    ("model.markets",         "derive_all_markets"),
    ("model.monte_carlo",     "simulate_match"),
    ("model.gates",           "apply_all_gates"),
    ("model.kelly_criterion", "kelly_stake"),
    ("training.trainer",      "DixonColesTrainer"),
    ("training.validator",    "ModelValidator"),
    ("training.historical_loader", "HistoricalDataLoader"),
    ("player_intelligence",   "build_team_intelligence"),
    ("live_predictor",        "LivePredictor"),
    ("nba_player_intelligence_complete", "NBATeamIntelligence"),
]
for mod, cls in checks:
    try:
        m = __import__(mod, fromlist=[cls])
        getattr(m, cls)
        print(f"  OK   {mod}")
    except Exception as e:
        print(f"  FAIL {mod} — {e}")

# 6. Web app
print("\n[6] WEB APP")
app_py = ROOT / "web" / "app.py"
if app_py.exists():
    src = app_py.read_text(encoding="utf-8", errors="replace")
    try:
        compile(src, "app.py", "exec")
        lines = src.count("\n")
        routes = src.count("@app.route")
        print(f"  OK   app.py  ({lines} lines, {routes} routes)")
    except SyntaxError as e:
        print(f"  SYNTAX ERROR: {e}")

# 7. Dependencies
print("\n[7] PYTHON DEPENDENCIES")
import importlib.metadata as meta
req_txt = ROOT / "requirements.txt"
req_content = req_txt.read_text() if req_txt.exists() else ""
required = [
    "flask","flask-cors","numpy","scipy","pandas",
    "scikit-learn","anthropic","requests","beautifulsoup4",
    "aiohttp","apscheduler","jinja2","python-dotenv",
]
missing_pkgs = []
for pkg in required:
    try:
        v = meta.version(pkg)
        in_req = "yes" if pkg.lower().replace("-","") in req_content.lower().replace("-","") else "NOT in requirements.txt"
        print(f"  OK   {pkg:<25} {v:<12} {in_req}")
    except Exception:
        print(f"  MISSING  {pkg}")
        missing_pkgs.append(pkg)

# 8. Issue summary
print("\n" + "=" * 60)
print("ISSUES SUMMARY")
print("=" * 60)
issues = []

if req_txt.exists():
    if "flask" not in req_content.lower():
        issues.append("CRITICAL: flask not in requirements.txt (server can't be installed from scratch)")
    if "flask-cors" not in req_content.lower():
        issues.append("CRITICAL: flask-cors not in requirements.txt")
    if "scikit-learn" not in req_content.lower():
        issues.append("CRITICAL: scikit-learn not in requirements.txt")

if db_path.exists():
    conn = sqlite3.connect(str(db_path))
    all_tables = [t[0] for t in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    
    if "team_params" in all_tables:
        n = conn.execute("SELECT COUNT(*) FROM team_params").fetchone()[0]
        if n == 0:
            issues.append("CRITICAL: team_params is EMPTY — Dixon-Coles model NOT trained. "
                          "Run: python scripts/train_model.py")
        else:
            leagues = conn.execute("SELECT DISTINCT league FROM team_params").fetchall()
            print(f"\n  Trained leagues: {[l[0] for l in leagues]}")
    else:
        issues.append("CRITICAL: team_params table missing — run setup_db.py first")

    if "results" in all_tables:
        n = conn.execute("SELECT COUNT(*) FROM results").fetchone()[0]
        if n == 0:
            issues.append("WARNING: results table empty — self-learning has no feedback data")

    if "predictions" in all_tables:
        n = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        if n == 0:
            issues.append("WARNING: predictions table empty")
    
    conn.close()

if missing_pkgs:
    issues.append(f"MISSING packages: {', '.join(missing_pkgs)}")

# Check for run_daily.py
if not (ROOT / "scripts" / "run_daily.py").exists():
    issues.append("WARNING: scripts/run_daily.py missing — no daily automation script")

if not (ROOT / "scripts" / "backtest.py").exists():
    issues.append("WARNING: scripts/backtest.py missing — no backtesting script")

if issues:
    for i, iss in enumerate(issues, 1):
        print(f"\n  {i}. {iss}")
else:
    print("  No critical issues found.")

print("\n" + "=" * 60)
print("WHAT YOU HAVE BUILT")
print("=" * 60)
print("""
  Core Engine:      Dixon-Coles Poisson model (industry standard)
  Gates System:     8 contextual adjustment gates (injuries, form, H2H,
                    UCL fatigue, home advantage, motivation, rest, weather)
  Markets:          1X2, BTTS, O/U 2.5, O/U 3.5, AH-1, Win to Nil, HT O0.5
  Staking:          Kelly Criterion (quarter Kelly, max 5% per bet)
  Monte Carlo:      10,000-simulation match outcome modelling
  Self-learning:    Gate recalibration from tracked results
  Web App:          Flask app with 80+ routes
  Sports:           Football (Dixon-Coles) + NBA (separate ML model)
  Data:             ESPN scrapers, live odds, injury feeds
""")
print("Done.")
