from sqlalchemy import create_engine, text
PROD_DB = "postgresql://neondb_owner:npg_NS4PdsGFKx2t@ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(PROD_DB)
with engine.connect() as conn:
    for tbl in ["users", "user_extended", "provider_applications", "user_profiles"]:
        cols = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{tbl}' ORDER BY ordinal_position")).fetchall()
        print(f"{tbl}: {[c[0] for c in cols]}")
