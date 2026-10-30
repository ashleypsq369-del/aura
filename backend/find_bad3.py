import glob, re
files = glob.glob('routers/*.py') + glob.glob('services/*.py') + ['src/db.py', 'main.py']
for f in files:
    try:
        src = open(f, encoding='utf-8').read()
        pattern = re.compile(r'UserProfile\([^)]{0,500}?\)', re.DOTALL)
        for m in pattern.finditer(src):
            block = m.group()
            if any(k in block for k in ['gender=','date_of_birth=','avatar_url=','location=','address=']):
                line_no = src[:m.start()].count('\n') + 1
                print(f"\n*** FOUND in {f} line {line_no}:")
                print(block[:300])
    except Exception as e:
        print(f"Skip {f}: {e}")
print("Done")
