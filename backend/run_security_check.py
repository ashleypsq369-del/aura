import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))

findings = []

gi = open('../.gitignore').read()
gitignored = '.env' in gi
findings.append(('CRITICAL' if not gitignored else 'OK', '.env in .gitignore', gitignored))

auth = open('routers/auth.py').read()
hardcoded_key = 'a3f8e2d1c4b7a0f9e6d3c8b5a2f7e4d1c9b6a3f0e7d4c1b8a5f2e9d6c3b0a7' in auth
findings.append(('HIGH' if hardcoded_key else 'OK', 'Hardcoded fallback SECRET_KEY in code', hardcoded_key))

env = open('.env').read()
db_pw = 'vtVK7WlG1NQPIzqUaGclXIEP5iX6FfFq' in env
findings.append(('CRITICAL', 'Real DB password in .env (committed if not gitignored)', db_pw))

vapid = 'VAPID_PRIVATE_KEY=MIGHAgEAMBMGByq' in env
findings.append(('HIGH', 'VAPID private key hardcoded in .env', vapid))

main = open('main.py').read()
cors_wild = 'allow_origins=["*"]' in main
findings.append(('CRITICAL' if cors_wild else 'OK', 'CORS wildcard (*)', cors_wild))

rate = 'limiter' in auth
findings.append(('OK' if rate else 'HIGH', 'Rate limiting on login endpoint', rate))

lockout = 'locked_until' in auth
findings.append(('OK' if lockout else 'HIGH', 'Account lockout after failed logins', lockout))

sec_headers = 'X-Content-Type-Options' in main
findings.append(('OK' if sec_headers else 'HIGH', 'Security headers (X-Content-Type-Options etc)', sec_headers))

auth_ctx = open('../frontend/src/context/AuthContext.jsx').read()
ls_jwt = 'localStorage.setItem' in auth_ctx and 'auth_token' in auth_ctx
findings.append(('MEDIUM', 'JWT stored in localStorage (XSS risk - should be httpOnly cookie)', ls_jwt))

reg = open('routers/auth.py').read()
open_reg = 'role: str = "patient"' in reg
findings.append(('LOW', 'Open registration allows patient/family roles', open_reg))

for sev, label, flag in findings:
    symbol = '[!!]' if sev == 'CRITICAL' else '[W]' if sev == 'HIGH' else '[~]' if sev == 'MEDIUM' else '[i]' if sev == 'LOW' else '[OK]'
    status = 'ISSUE' if flag and sev != 'OK' else ('OK' if not flag else 'PRESENT')
    print(f"{symbol} {sev:<10} {label}: {status}")
