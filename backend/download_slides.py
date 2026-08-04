"""
Download slideshow images with correct content.
Run from backend/ folder: python download_slides.py
"""
import urllib.request
import os

dest = r"c:\xampp\htdocs\ProjectAura_React\frontend\public\resources\slideshow"
os.makedirs(dest, exist_ok=True)

# Verified Unsplash photo IDs - each matched to its slide
slides = [
    # care-1: Clinical Monitoring - doctor/nurse checking patient vitals
    ("care-1.jpg", "https://images.unsplash.com/photo-1581595219315-a187dd40c322?w=1200&q=80"),
    # care-2: Elder Care - nurse with elderly patient
    ("care-2.jpg", "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&q=80"),
    # care-3: Bedside Care - healthcare worker at bedside
    ("care-3.jpg", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80"),
    # care-4: Palliative Support - doctor comforting patient
    ("care-4.jpg", "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&q=80"),
    # care-5: Family & Care Team - family with patient in hospital
    ("care-5.jpg", "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80"),
    # care-6: AI/Tech - doctor using digital tablet/laptop
    ("care-6.jpg", "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80"),
    # care-7: Symptom Tracking - patient with nurse checking symptoms
    ("care-7.jpg", "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80"),
    # care-8: Medications - pills/medication organised
    ("care-8.jpg", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80"),
    # care-9: Family Support - family holding hands in comfort
    ("care-9.jpg", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"),
    # care-10: Memory/Spiritual - person writing in journal/memory
    ("care-10.jpg", "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"),
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

for name, url in slides:
    path = os.path.join(dest, name)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            f.write(r.read())
        size = os.path.getsize(path) // 1024
        print(f"OK  {name}  {size} KB")
    except Exception as e:
        print(f"FAIL {name}: {e}")

print("\nDone.")
