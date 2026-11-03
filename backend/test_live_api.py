"""Test the live Render API to diagnose zero stats on deployed site."""
import urllib.request, json

BASE = 'https://aura-atjj.onrender.com'

def post(path, body_dict, token=None):
    body = json.dumps(body_dict).encode()
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())

def get(path, token):
    req = urllib.request.Request(BASE + path, headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())

# Login as clinician
print('=== Testing as clinician ===')
login = post('/api/auth/login', {'username': 'clinician', 'password': 'Clinician1234'})
token = login['access_token']
print(f'  Logged in: id={login["user"]["id"]} role={login["user"]["role"]}')

# Test dashboard
try:
    dash = get('/api/dashboard', token)
    print(f'  Dashboard: {json.dumps(dash)[:200]}')
except Exception as e:
    print(f'  Dashboard ERROR: {e}')

# Test patients
try:
    pts = get('/api/patients', token)
    plist = pts if isinstance(pts, list) else pts.get('patients', pts.get('data', []))
    print(f'  Patients: {len(plist)} returned')
    for p in plist[:3]:
        name   = p.get('full_name', '?')
        status = p.get('status', '?')
        risk   = p.get('risk_level', '?')
        print(f'    {name}  status={status}  risk={risk}')
except Exception as e:
    print(f'  Patients ERROR: {e}')

# Test as superadmin
print()
print('=== Testing as superadmin ===')
login2 = post('/api/auth/login', {'username': 'superadmin', 'password': 'SuperAdmin@2026'})
token2 = login2['access_token']
print(f'  Logged in: id={login2["user"]["id"]} role={login2["user"]["role"]}')

try:
    pts2 = get('/api/patients', token2)
    plist2 = pts2 if isinstance(pts2, list) else pts2.get('patients', pts2.get('data', []))
    print(f'  Patients: {len(plist2)} returned')
    for p in plist2[:3]:
        name   = p.get('full_name', '?')
        status = p.get('status', '?')
        risk   = p.get('risk_level', '?')
        print(f'    {name}  status={status}  risk={risk}')
except Exception as e:
    print(f'  Patients ERROR: {e}')

try:
    dash2 = get('/api/dashboard', token2)
    print(f'  Dashboard keys: {list(dash2.keys()) if isinstance(dash2, dict) else type(dash2)}')
    if isinstance(dash2, dict):
        print(f'  total_patients={dash2.get("total_patients")} critical={dash2.get("critical_patients")}')
except Exception as e:
    print(f'  Dashboard ERROR: {e}')
