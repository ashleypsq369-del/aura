"""
Download African/Black healthcare images for the login slideshow.
Run: python download_african_slides.py
"""
import urllib.request, os, time

dest = r"c:\xampp\htdocs\ProjectAura_React\frontend\public\resources\slideshow"
os.makedirs(dest, exist_ok=True)

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

# Verified Unsplash photos with Black/African subjects in healthcare contexts
slides = [
    # care-1: Black male doctor reviewing scans/monitor
    ("care-1.jpg", "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80"),
    # care-2: Black female nurse caring for elderly patient
    ("care-2.jpg", "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80"),
    # care-3: Black healthcare worker at bedside with patient
    ("care-3.jpg", "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&q=80"),
    # care-4: Black doctor holding patient hand - palliative support
    ("care-4.jpg", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&q=80"),
    # care-5: African family with patient in hospital
    ("care-5.jpg", "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80"),
    # care-6: Black doctor with laptop/tablet - AI insights
    ("care-6.jpg", "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=80"),
    # care-7: Black nurse checking symptoms with patient
    ("care-7.jpg", "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80"),
    # care-8: Black pharmacist with medications
    ("care-8.jpg", "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1200&q=80"),
    # care-9: African family comfort scene
    ("care-9.jpg", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"),
    # care-10: Black person writing/journaling - memory vault
    ("care-10.jpg", "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"),
]

for name, url in slides:
    path = os.path.join(dest, name)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            data = r.read()
            f.write(data)
        kb = os.path.getsize(path) // 1024
        print(f"OK  {name}  {kb} KB")
    except Exception as e:
        print(f"FAIL {name}: {e}")
    time.sleep(0.3)

print("\nDone.")
