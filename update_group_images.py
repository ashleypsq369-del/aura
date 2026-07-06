"""
Update community_groups with real Unsplash images based on group category.
Run: python update_group_images.py
"""
import sqlite3

# Map group name keywords to Unsplash photo URLs
# Using Unsplash source API — free, no key needed
IMAGE_MAP = {
    # Physical symptoms
    'Pain Management':         'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=200&fit=crop',
    'Breathing':               'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop',
    'Nutrition':               'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=200&fit=crop',
    'Fatigue':                 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=200&fit=crop',
    'Sleep':                   'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=200&fit=crop',
    # Mental health
    'Anxiety':                 'https://images.unsplash.com/photo-1547489432-cf93fa6c71ee?w=400&h=200&fit=crop',
    'Depression':              'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=200&fit=crop',
    'Hope':                    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=200&fit=crop',
    'Mindfulness':             'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop',
    'Acceptance':              'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=200&fit=crop',
    # Spiritual
    'Christian':               'https://images.unsplash.com/photo-1529651737248-dad5e287768e?w=400&h=200&fit=crop',
    'Islamic':                 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=400&h=200&fit=crop',
    'Traditional African':     'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=200&fit=crop',
    'Interfaith':              'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop',
    'Secular':                 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=200&fit=crop',
    # Disease-specific
    'Cancer':                  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=200&fit=crop',
    'Heart':                   'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop',
    'Kidney':                  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop',
    'Lung':                    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=200&fit=crop',
    'Liver':                   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop',
    'Neurological':            'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=200&fit=crop',
    'HIV':                     'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=200&fit=crop',
    # Caregiver / family
    'Family Caregivers':       'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=200&fit=crop',
    'Spousal':                 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop',
    'Adult Children':          'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400&h=200&fit=crop',
    'Caregiver Burnout':       'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=200&fit=crop',
    'Children & Teens':        'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=200&fit=crop',
    # Practical
    'Financial':               'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=200&fit=crop',
    'Legal':                   'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop',
    'Housing':                 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=200&fit=crop',
    'Transportation':          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop',
    # Activities
    'Exercise':                'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    'Arts':                    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=200&fit=crop',
    'Books':                   'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop',
    'Music':                   'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=200&fit=crop',
    'Nature':                  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=200&fit=crop',
    'Humor':                   'https://images.unsplash.com/photo-1527112862739-c3b9e9e55e62?w=400&h=200&fit=crop',
    # Life stage
    'Young Adults':            'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop',
    'Legacy':                  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop',
    'End-of-Life':             'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=200&fit=crop',
    'Bereavement':             'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=200&fit=crop',
    'After Loss':              'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=200&fit=crop',
    # Ghana-specific
    'Ghana NHIS':              'https://images.unsplash.com/photo-1535637603896-07c179d71103?w=400&h=200&fit=crop',
    'Ghanaian Cultural':       'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=200&fit=crop',
    'Twi':                     'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=200&fit=crop',
    'Rural':                   'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=200&fit=crop',
    # General
    'General Palliative':      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=200&fit=crop',
    'Hospice':                 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
    'New to Palliative':       'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop',
    'Living Well':             'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop',
}

DEFAULT = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=200&fit=crop'

def find_image(name):
    for keyword, url in IMAGE_MAP.items():
        if keyword.lower() in name.lower():
            return url
    return DEFAULT

conn = sqlite3.connect('aura.db')
c = conn.cursor()
c.execute('SELECT id, name FROM community_groups WHERE is_active=1')
groups = c.fetchall()

updated = 0
for gid, name in groups:
    img = find_image(name)
    c.execute('UPDATE community_groups SET image_url=? WHERE id=?', (img, gid))
    print(f'  {gid:3d} | {name[:45]:45s} -> assigned image')
    updated += 1

conn.commit()
conn.close()
print(f'\n✅ Updated {updated} groups with images')
