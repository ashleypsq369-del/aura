"""
Check actual database schema
"""
import sqlite3

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

# Check users table
print("=" * 60)
print("USERS TABLE")
print("=" * 60)
cursor.execute("PRAGMA table_info(users)")
users_columns = cursor.fetchall()
for col in users_columns:
    print(f"  {col[1]:25} {col[2]:15} {'NOT NULL' if col[3] else ''}")

# Check patients table
print("\n" + "=" * 60)
print("PATIENTS TABLE")
print("=" * 60)
cursor.execute("PRAGMA table_info(patients)")
patients_columns = cursor.fetchall()
for col in patients_columns:
    print(f"  {col[1]:25} {col[2]:15} {'NOT NULL' if col[3] else ''}")

# Check vitals table
print("\n" + "=" * 60)
print("VITALS TABLE")
print("=" * 60)
cursor.execute("PRAGMA table_info(vitals)")
vitals_columns = cursor.fetchall()
for col in vitals_columns:
    print(f"  {col[1]:25} {col[2]:15} {'NOT NULL' if col[3] else ''}")

conn.close()
