#!/usr/bin/env bash
# Project Aura — Setup and Launch (macOS / Linux)
set -e

echo ""
echo " ╔═══════════════════════════════════════════════════╗"
echo " ║         PROJECT AURA — AI Palliative Care         ║"
echo " ║              First-Run Setup + Launch             ║"
echo " ╚═══════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Check Python ────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo " [ERROR] Python 3 not found. Install from https://python.org"
  exit 1
fi

# ── Check Node.js ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo " [ERROR] Node.js not found. Install from https://nodejs.org"
  exit 1
fi

echo " [OK] Python $(python3 --version) and Node $(node --version) found."
echo ""

# ── Install Python packages ───────────────────────────────────────────────────
echo " Installing Python packages..."
cd "$SCRIPT_DIR/backend"
pip3 install -r requirements.txt -q
echo " [OK] Python packages ready."
echo ""

# ── Install + build frontend ──────────────────────────────────────────────────
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo " Installing frontend packages..."
  npm install --silent
fi
if [ ! -f "dist/index.html" ]; then
  echo " Building frontend (~30s)..."
  npm run build
fi
echo " [OK] Frontend ready."
echo ""

# ── Seed database ─────────────────────────────────────────────────────────────
cd "$SCRIPT_DIR/backend"
if [ ! -f "aura.db" ]; then
  echo " Setting up database..."
  python3 seed_medical_db.py
  echo " [OK] Database ready."
fi

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo " ┌─────────────────────────────────────────────────┐"
echo " │  App running at:  http://localhost:8000          │"
echo " │                                                   │"
echo " │  Admin login:   admin / admin123                 │"
echo " │  Patient login: patient / patient123             │"
echo " │                                                   │"
echo " │  Press Ctrl+C to stop                           │"
echo " └─────────────────────────────────────────────────┘"
echo ""

# Open browser after 3s
(sleep 3 && open "http://localhost:8000" 2>/dev/null || xdg-open "http://localhost:8000" 2>/dev/null || true) &

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level warning
