"""Quick PostgreSQL browser — generates HTML report and opens in browser."""
import webbrowser, os
from datetime import datetime
import psycopg2

conn = psycopg2.connect("postgresql://postgres:bieber4ev@localhost:5432/aura")
cur = conn.cursor()

cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
tables = [r[0] for r in cur.fetchall()]

html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<title>ProjectAura — PostgreSQL {datetime.now().strftime('%d %b %Y %H:%M')}</title>
<style>
body{{font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}}
h1{{background:linear-gradient(135deg,#0d9488,#7c3aed);margin:0;padding:16px 24px;font-size:18px;color:white}}
.pg{{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);border-radius:20px;color:#34d399;font-size:11px;font-weight:700;margin:8px 20px 0}}
.nav{{display:flex;flex-wrap:wrap;gap:6px;padding:10px 20px;background:#1e293b;border-bottom:1px solid #334155}}
.nav a{{padding:4px 10px;border-radius:6px;background:#334155;color:#94a3b8;text-decoration:none;font-size:12px;font-weight:600}}
.nav a:hover{{background:#7c3aed;color:white}}
.section{{padding:12px 20px;border-bottom:1px solid #1e293b}}
.section h2{{font-size:13px;color:#818cf8;margin:0 0 6px;display:flex;align-items:center;gap:8px}}
.badge{{background:#334155;color:#94a3b8;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}}
table{{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}}
th{{background:#1e293b;color:#94a3b8;padding:5px 10px;text-align:left;font-weight:700;border-bottom:1px solid #334155;white-space:nowrap}}
td{{padding:4px 10px;border-bottom:1px solid #1e293b;color:#cbd5e1;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
tr:hover td{{background:#1e293b}}
.empty{{color:#475569;font-style:italic;padding:8px 0;font-size:12px}}
</style></head><body>
<h1>🐘 ProjectAura PostgreSQL — {len(tables)} tables — {datetime.now().strftime('%d %b %Y %H:%M')}</h1>
<div class="pg">✓ PostgreSQL 18 · localhost:5432 · aura</div>
<div class="nav">"""

for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    cnt = cur.fetchone()[0]
    html += f'<a href="#{t}">{t} ({cnt})</a>'

html += "</div>"

for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    cnt = cur.fetchone()[0]
    html += f'<div class="section" id="{t}"><h2>{t} <span class="badge">{cnt} rows</span></h2>'
    if cnt == 0:
        html += '<p class="empty">Empty table</p>'
    else:
        cur.execute(f'SELECT * FROM "{t}" LIMIT 20')
        rows = cur.fetchall()
        if rows:
            cols = [d[0] for d in cur.description]
            html += "<table><tr>" + "".join(f"<th>{c}</th>" for c in cols) + "</tr>"
            for row in rows:
                html += "<tr>" + "".join(f"<td title='{str(v)}'>{str(v)[:80] if v is not None else '<em>null</em>'}</td>" for v in row) + "</tr>"
            html += "</table>"
            if cnt > 20:
                html += f'<p style="color:#475569;font-size:11px;margin:4px 0 0">Showing 20 of {cnt} rows</p>'
    html += "</div>"

html += "</body></html>"
cur.close(); conn.close()

out = os.path.abspath("pg_report.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Report: {out}")
webbrowser.open(f"file:///{out.replace(chr(92), '/')}")
print("Opening in browser...")
