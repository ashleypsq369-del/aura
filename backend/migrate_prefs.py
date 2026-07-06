import sqlite3
conn = sqlite3.connect('aura.db')
cur = conn.cursor()
cur.execute('PRAGMA table_info(patient_preferences)')
existing = {r[1] for r in cur.fetchall()}

new_cols = [
    ('primary_condition', 'VARCHAR(200)'),
    ('esas_pain', 'INTEGER DEFAULT 0'),
    ('esas_tiredness', 'INTEGER DEFAULT 0'),
    ('esas_nausea', 'INTEGER DEFAULT 0'),
    ('esas_shortness_of_breath', 'INTEGER DEFAULT 0'),
    ('esas_depression', 'INTEGER DEFAULT 0'),
    ('esas_anxiety', 'INTEGER DEFAULT 0'),
    ('esas_wellbeing', 'INTEGER DEFAULT 0'),
    ('esas_appetite', 'INTEGER DEFAULT 0'),
    ('weight_change', 'VARCHAR(50)'),
    ('swallowing_difficulty', 'VARCHAR(50)'),
    ('mobility_aid', 'VARCHAR(50)'),
    ('care_team_sharing', 'VARCHAR(20)'),
    ('ai_analysis_consent', 'VARCHAR(20)'),
    ('ai_data_sharing_consent', 'VARCHAR(20)'),
    ('cultural_practices', 'TEXT'),
]

added = 0
for col, coldef in new_cols:
    if col not in existing:
        cur.execute(f'ALTER TABLE patient_preferences ADD COLUMN {col} {coldef}')
        added += 1
        print(f'  Added: {col}')
    else:
        print(f'  Already exists: {col}')

conn.commit()
conn.close()
print(f'Done  --  {added} columns added')
