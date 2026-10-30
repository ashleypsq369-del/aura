import glob
keywords = ['gender=','date_of_birth=','address=data','location=data','avatar_url=']
for f in glob.glob('routers/*.py') + ['src/db.py']:
    try:
        lines = open(f, encoding='utf-8').readlines()
        for i, line in enumerate(lines, 1):
            if 'UserProfile(' in line and any(k in line for k in keywords):
                print(f"{f}:{i}: {line.rstrip()}")
    except Exception as e:
        print(f"Skip {f}: {e}")
print("Scan complete")
