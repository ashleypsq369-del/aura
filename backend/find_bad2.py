import glob, re
for f in glob.glob('routers/*.py') + ['src/db.py']:
    try:
        src = open(f, encoding='utf-8').read()
        # Find all UserProfile(...) multi-line blocks
        pattern = re.compile(r'UserProfile\([^)]{0,500}?\)', re.DOTALL)
        for m in pattern.finditer(src):
            block = m.group()
            if any(k in block for k in ['gender=','date_of_birth=','avatar_url=','location=']):
                line_no = src[:m.start()].count('\n') + 1
                print(f"\nFOUND in {f} at line {line_no}:")
                print(block[:200])
    except Exception as e:
        print(f"Skip {f}: {e}")
print("\nScan complete")
