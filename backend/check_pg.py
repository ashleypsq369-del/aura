import psycopg2

DB = "postgresql://aura_user:vtVK7WlG1NQPIzqUaGclXIEP5iX6FfFq@localhost:5432/aura"

try:
    conn = psycopg2.connect(DB)
    cur = conn.cursor()

    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    tables = [r[0] for r in cur.fetchall()]
    print(f"Total tables: {len(tables)}")
    print("Tables:", tables)
    print()

    key_tables = ['users','patients','vitals','medications','appointments',
                  'community_groups','resources','alerts','notification_queue',
                  'audit_logs','care_plans','clinical_notes','symptoms',
                  'esas_assessments','pps_assessments','messages','conversations']
    for t in key_tables:
        if t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            print(f"  {t}: {cur.fetchone()[0]} rows")

    conn.close()
    print("\nPostgreSQL connection: OK")
except Exception as e:
    print(f"ERROR: {e}")
