import psycopg2
conn = psycopg2.connect('postgresql://aura_user:vtVK7WlG1NQPIzqUaGclXIEP5iX6FfFq@localhost:5432/aura')
cur = conn.cursor()
cur.execute("SELECT tablename, tableowner FROM pg_tables WHERE schemaname='public' AND tablename IN ('users','user_profiles') ORDER BY tablename")
for row in cur.fetchall(): print(row)
cur.execute("SELECT current_user, pg_has_role(current_user, 'pg_database_owner', 'member')")
print("current_user:", cur.fetchone())
cur.close(); conn.close()
