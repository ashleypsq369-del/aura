from sqlalchemy import create_engine, text
PROD_DB = "postgresql://neondb_owner:npg_NS4PdsGFKx2t@ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(PROD_DB)
with engine.connect() as conn:
    cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='feedback' ORDER BY ordinal_position")).fetchall()
    print("feedback columns:", [c[0] for c in cols])
