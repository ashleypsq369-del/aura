"""
Replace all 10 slideshow images with verified African/Black healthcare photos.
Each URL was manually selected for correct content.
"""
import urllib.request, os, time

dest = r"c:\xampp\htdocs\ProjectAura_React\frontend\public\resources\slideshow"
os.makedirs(dest, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
}

# Each tuple: (filename, url, description)
# All Unsplash free-to-use. Selected specifically for African/Black subjects.
slides = [
    # 1 — Black male doctor reviewing patient records / clinical monitoring
    ("care-1.jpg",
     "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&q=80",
     "Black male doctor reviewing patient"),

    # 2 — Black female nurse caring for elderly patient
    ("care-2.jpg",
     "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&q=80",
     "Black female nurse caring for elderly patient"),

    # 3 — Black nurse at patient bedside
    ("care-3.jpg",
     "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80",
     "Black nurse at bedside"),

    # 4 — Black doctor holding patient hand / palliative care compassion
    ("care-4.jpg",
     "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80",
     "Doctor holding patient hand - palliative"),

    # 5 — African family together in hospital / care team
    ("care-5.jpg",
     "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80",
     "African family in hospital"),

    # 6 — Black doctor using tablet/laptop — AI insights (NOT surgery)
    ("care-6.jpg",
     "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
     "Doctor using digital tablet - AI"),

    # 7 — Black clinician checking patient symptoms / consultation
    ("care-7.jpg",
     "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&q=80",
     "Black clinician with patient - symptoms"),

    # 8 — Medications / pills organised — pharmacist context
    ("care-8.jpg",
     "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80",
     "Medications pills organised"),

    # 9 — Black family comfort scene / bereavement support
    ("care-9.jpg",
     "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
     "Black family comfort scene"),

    # 10 — Black person writing in journal / memory preservation
    ("care-10.jpg",
     "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
     "Person writing journal memories"),
]

print(f"Downloading {len(slides)} images to:\n  {dest}\n")

for name, url, desc in slides:
    path = os.path.join(dest, name)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            data = r.read()
            f.write(data)
        kb = os.path.getsize(path) // 1024
        print(f"  OK  {name}  ({kb} KB)  —  {desc}")
    except Exception as e:
        print(f"  FAIL {name}: {e}")
    time.sleep(0.4)

print("\nAll done.")
