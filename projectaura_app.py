"""
ProjectAura — Standalone Desktop App
=====================================
Launches the full system in a native desktop window.
Backend (FastAPI) serves both the API and the pre-built React frontend.
No browser required. No address bar. Looks like a real desktop app.

BEFORE FIRST RUN:
  cd frontend && npm run build    ← build React once

USAGE:
  python projectaura_app.py

BUILD TO .EXE (self-contained):
  pip install pyinstaller
  pyinstaller projectaura_app.spec   ← use the .spec file for proper bundling
"""

import sys
import os
import time
import socket
import threading
import subprocess
import signal
from pathlib import Path

# ── Resolve project root correctly whether running as .py or frozen .exe ──────
# When frozen by PyInstaller:
#   sys.frozen = True
#   sys.executable = C:\...\dist\ProjectAura.exe
#   __file__       = inside a temp _MEIXXXXXX extraction folder (wrong for paths)
# The project layout is:  <root>/dist/ProjectAura.exe
#                         <root>/backend/
#                         <root>/frontend/dist/
# So the project root is always one level above the .exe.
if getattr(sys, "frozen", False):
    # Running as compiled .exe — go up from dist/ to project root
    ROOT = Path(sys.executable).parent.parent
    # Python interpreter to use for subprocesses — find system python
    _PYTHON = None
    for candidate in ["python", "python3", "python3.11", "python3.10", "python3.9"]:
        try:
            result = subprocess.run(
                [candidate, "--version"],
                capture_output=True, timeout=3
            )
            if result.returncode == 0:
                _PYTHON = candidate
                break
        except Exception:
            continue
    if _PYTHON is None:
        _PYTHON = "python"  # last resort
else:
    # Running as plain .py script — __file__ is reliable
    ROOT = Path(__file__).parent
    _PYTHON = sys.executable   # same interpreter that launched us

BACKEND_DIR = ROOT / "backend"
APP_PORT    = 8000   # FastAPI serves both API + React dist
APP_URL     = f"http://127.0.0.1:{APP_PORT}/"

backend_proc = None


def is_port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
        return False


def wait_for_backend(timeout: int = 45) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if is_port_open(APP_PORT):
            return True
        time.sleep(0.3)
    return False


def start_backend():
    """Start the backend, or skip if it's already running on the port."""
    global backend_proc

    # If something is already listening on the port, reuse it
    if is_port_open(APP_PORT):
        print(f"[launcher] Port {APP_PORT} already open — reusing existing backend")
        return

    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR)
    env.setdefault("ALLOWED_ORIGINS", f"http://127.0.0.1:{APP_PORT},http://localhost:{APP_PORT}")

    # Load .env into subprocess environment
    dotenv_path = BACKEND_DIR / ".env"
    if dotenv_path.exists():
        for line in dotenv_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env.setdefault(k.strip(), v.strip())

    kwargs = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

    log_path = ROOT / "projectaura_error.log"
    log_file = open(str(log_path), "w", encoding="utf-8")
    backend_proc = subprocess.Popen(
        [_PYTHON, "-m", "uvicorn", "main:app",
         "--host", "127.0.0.1",
         "--port", str(APP_PORT),
         "--log-level", "warning"],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=log_file,
        stderr=log_file,
        **kwargs,
    )


def cleanup(*_):
    if backend_proc:
        try:
            backend_proc.terminate()
        except Exception:
            pass


# ── Loading screen shown while backend starts ─────────────────────────────────
LOADING_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  background:linear-gradient(160deg,#0b2d26 0%,#0d4f47 35%,#0c3347 65%,#0a1628 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100vh;font-family:'Segoe UI',system-ui,sans-serif;color:white;user-select:none;
}
.logo-wrap{
  width:110px;height:110px;border-radius:26px;
  background:white;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:22px;
  box-shadow:0 12px 50px rgba(0,0,0,0.4);
  overflow:hidden;
}
.logo-wrap img{width:100px;height:100px;object-fit:contain;}
h1{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:5px}
h1 span{color:#2dd4bf}
p{font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:38px}
.ring{
  width:44px;height:44px;border-radius:50%;
  border:3px solid rgba(45,212,191,0.15);
  border-top-color:#2dd4bf;
  animation:spin 0.75s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.sub{margin-top:14px;font-size:11px;color:rgba(255,255,255,0.3)}
</style></head>
<body>
  <div class="logo-wrap">
    <img src="data:image/png;base64,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" alt="Project Aura" style="width:100px;height:100px;object-fit:contain;" />
  </div>
  <h1>Project <span>Aura</span></h1>
  <p>AI Palliative Care Platform</p>
  <div class="ring"></div>
  <div class="sub">Starting services…</div>
</body></html>"""


def main():
    import webview

    signal.signal(signal.SIGTERM, cleanup)
    signal.signal(signal.SIGINT,  cleanup)

    # Check that the frontend build exists
    dist = ROOT / "frontend" / "dist" / "index.html"
    if not dist.exists():
        webview.create_window(
            "ProjectAura — Setup Required",
            html="""<body style="background:#0f172a;color:white;display:flex;
                    align-items:center;justify-content:center;height:100vh;
                    font-family:system-ui;text-align:center;padding:40px">
              <div>
                <h2 style="font-size:22px;margin-bottom:12px">Frontend not built</h2>
                <p style="color:rgba(255,255,255,0.5);line-height:1.6">
                  Run this command first:<br><br>
                  <code style="background:rgba(255,255,255,0.1);padding:8px 16px;
                               border-radius:8px;font-size:13px">
                    cd frontend &amp;&amp; npm run build
                  </code>
                </p>
              </div>
            </body>""",
            width=600, height=400,
        )
        webview.start(debug=False)
        return

    # Create window with loading screen — logo already embedded as base64
    loading_html = LOADING_HTML

    window = webview.create_window(
        title="ProjectAura",
        html=loading_html,
        width=1440,
        height=920,
        min_size=(1024, 768),
        resizable=True,
        text_select=True,
        easy_drag=False,
    )

    def boot():
        start_backend()
        # First launch loads 8 ML models — can take up to 3 minutes
        # Update status message while waiting
        import threading
        msgs = [
            (10,  "Starting Python backend…"),
            (25,  "Loading database…"),
            (50,  "Loading AI models (first launch takes 1-2 min)…"),
            (90,  "Initialising ML models…"),
            (130, "Almost ready — finishing startup…"),
        ]
        def update_msgs():
            for delay, msg in msgs:
                time.sleep(delay)
                if is_port_open(APP_PORT):
                    break
                try:
                    safe_msg = msg.replace("'", "\\'")
                    window.evaluate_js(
                        f"var s=document.querySelector('.sub');if(s)s.textContent='{safe_msg}';"
                    )
                except Exception:
                    pass
        threading.Thread(target=update_msgs, daemon=True).start()

        ready = wait_for_backend(timeout=180)
        if ready:
            time.sleep(0.5)
            window.load_url(APP_URL)
        else:
            # Show error with last log lines if available
            log_lines = ""
            log_path = ROOT / "projectaura_error.log"
            if log_path.exists():
                try:
                    with open(log_path, encoding="utf-8", errors="replace") as f:
                        log_lines = f.read()[-2000:]
                except Exception:
                    pass
            window.load_html(f"""
            <body style="background:#0f172a;color:white;display:flex;flex-direction:column;
                         align-items:center;justify-content:center;height:100vh;
                         font-family:system-ui;text-align:center;padding:40px">
              <div style="max-width:600px">
                <h2 style="font-size:20px;margin-bottom:12px;color:#f87171">Backend failed to start</h2>
                <p style="color:rgba(255,255,255,0.5);margin-bottom:16px;line-height:1.6">
                  The Python backend could not start within 3 minutes.<br>
                  This usually means Python packages are missing or the port is blocked.
                </p>
                <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-bottom:12px">
                  Try running <code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">START_HERE.bat</code> 
                  to install dependencies first.
                </p>
                {"<pre style='background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;text-align:left;font-size:11px;overflow:auto;max-height:300px;color:#94a3b8'>" + log_lines + "</pre>" if log_lines else ""}
                <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:16px">
                  See projectaura_error.log for details
                </p>
              </div>
            </body>""")

    threading.Thread(target=boot, daemon=True).start()

    webview.start(debug=False)
    cleanup()


if __name__ == "__main__":
    main()
