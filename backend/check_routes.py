from main import app
print("=== ROUTES WITH feedback or catch-all ===")
for r in app.routes:
    p = getattr(r,'path','')
    m = getattr(r,'methods',None)
    if 'feedback' in p or 'path:path' in p or '{path' in p:
        print(m, p)
print("=== LAST 5 ROUTES ===")
for r in list(app.routes)[-5:]:
    print(getattr(r,'methods',None), getattr(r,'path','?'))
