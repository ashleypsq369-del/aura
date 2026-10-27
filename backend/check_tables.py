import psycopg2
conn = psycopg2.connect('postgresql://aura_user:vtVK7WlG1NQPIzqUaGclXIEP5iX6FfFq@localhost:5432/aura')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [r[0] for r in cur.fetchall()]
new = [t for t in tables if 'provider' in t or 'service_type' in t]
print('New tables:', new)
cur.close(); conn.close()
