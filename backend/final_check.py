import requests

tests = [
    ('admin', 'admin123'),
    ('patient', 'patient123'),
]

endpoints = [
    '/health',
    '/api/compliance/my-tasks',
    '/api/patients',
    '/api/medications/1',
    '/api/appointments/1',
    '/api/preferences/my',
    '/api/reports/types',
    '/api/ml/patients/batch-risk',
]

for username, password in tests:
    r = requests.post('http://localhost:8000/api/auth/login', json={'username': username, 'password': password})
    if r.status_code != 200:
        print('LOGIN FAIL', username, r.status_code)
        continue
    u = r.json().get('user', {})
    token = r.json()['access_token']
    h = {'Authorization': 'Bearer ' + token}
    role = u.get('role', '?')
    cs = u.get('care_setting', 'none')
    print('=== ' + username + ' (' + role + ') cs=' + str(cs) + ' ===')
    for ep in endpoints:
        resp = requests.get('http://localhost:8000' + ep, headers=h)
        ok = 'OK  ' if resp.status_code in (200, 401, 403) else 'FAIL'
        data = resp.json()
        info = ''
        if resp.status_code == 200:
            if isinstance(data, list):
                info = str(len(data)) + ' items'
            elif isinstance(data, dict):
                if 'tasks' in data:
                    info = str(len(data.get('tasks', []))) + ' tasks'
                elif 'patients' in data:
                    info = str(len(data.get('patients', []))) + ' patients'
                elif 'reports' in data:
                    info = str(len(data.get('reports', []))) + ' types'
                elif 'status' in data:
                    info = data['status']
                else:
                    info = str(list(data.keys())[:3])
        print('  ' + ok + str(resp.status_code) + ' ' + ep + ' | ' + info)
    print()
