"""
seed_pdf_resources.py
=====================
Downloads real open-access palliative care PDFs and upserts Resource rows.

URLs used are verified direct PDF endpoints (NCI, WHO IRIS stream, etc.).
Any that fail download gracefully  --  the DB row is still created with
external_url so the frontend can link out directly.

Run:  python seed_pdf_resources.py
"""

import os, sys, time, requests
from pathlib import Path
from datetime import datetime

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent))
from src.db import SessionLocal, Resource

PDF_DIR = Path(__file__).parent / "static" / "pdfs"
PDF_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/pdf,*/*",
}

# ─── Verified direct PDF download URLs ────────────────────────────────────────
# Format: (local_filename, download_url, external_url_fallback, metadata)
RESOURCES = [

    # ── Pain Management ───────────────────────────────────────────────────────
    (
        "nci_cancer_pain_control.pdf",
        "https://www.cancer.gov/publications/patient-education/paincontrol.pdf",
        "https://www.cancer.gov/publications/patient-education/pain-control",
        dict(
            title="Cancer Pain Control: NCI Patient Guide",
            summary="How to talk to your care team about pain, medicines to use, and managing side effects during cancer treatment.",
            category="pain_management", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["cancer","pain","palliative"]',
            topic_tags='["pain control","opioids","patient guide"]',
        ),
    ),
    (
        "nci_pain_and_cancer.pdf",
        "https://www.cancer.gov/publications/patient-education/pain.pdf",
        "https://www.cancer.gov/about-cancer/treatment/side-effects/pain",
        dict(
            title="Pain and Cancer Treatment (NCI)",
            summary="Overview of types of cancer pain, assessment tools, and treatment options including medicines and non-drug approaches.",
            category="pain_management", format="pdf", difficulty_level="standard",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["cancer","pain","opioid","palliative"]',
            topic_tags='["pain assessment","analgesics","pain management"]',
        ),
    ),

    # ── Nutrition ─────────────────────────────────────────────────────────────
    (
        "nci_eating_hints.pdf",
        "https://www.cancer.gov/publications/patient-education/eatinghints.pdf",
        "https://www.cancer.gov/publications/patient-education/eating-hints",
        dict(
            title="Eating Hints: Before, During and After Cancer Treatment (NCI)",
            summary="Practical tips for managing eating problems, nausea, taste changes, and weight loss during cancer care.",
            category="nutrition", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["cancer","nutrition","nausea"]',
            topic_tags='["nutrition","eating","appetite","nausea","weight"]',
        ),
    ),

    # ── Caregiver / Mental Health ─────────────────────────────────────────────
    (
        "nci_caring_for_caregiver.pdf",
        "https://www.cancer.gov/publications/patient-education/caregiver.pdf",
        "https://www.cancer.gov/publications/patient-education/caring-for-the-caregiver",
        dict(
            title="Caring for the Caregiver (NCI)",
            summary="Self-care and communication tips for family caregivers supporting someone through cancer treatment.",
            category="mental_health", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["caregiver","family","mental_health","burnout"]',
            topic_tags='["caregiver support","self care","burnout","family"]',
        ),
    ),
    (
        "nci_facing_forward.pdf",
        "https://www.cancer.gov/publications/patient-education/facing-forward.pdf",
        "https://www.cancer.gov/publications/patient-education/facing-forward",
        dict(
            title="Facing Forward: Life After Cancer Treatment (NCI)",
            summary="What to expect after cancer treatment ends  --  follow-up care, coping with emotions, relationships, and returning to daily life.",
            category="mental_health", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["cancer","survivorship","mental_health","anxiety"]',
            topic_tags='["survivorship","follow-up","emotional health"]',
        ),
    ),

    # ── Palliative / End of Life ──────────────────────────────────────────────
    (
        "nci_advanced_cancer.pdf",
        "https://www.cancer.gov/publications/patient-education/advanced-cancer.pdf",
        "https://www.cancer.gov/publications/patient-education/when-cancer-doesnt-go-away",
        dict(
            title="Advanced Cancer: Living Each Day (NCI)",
            summary="Guidance on living with advanced cancer  --  managing symptoms, making decisions, and getting support for patients and families.",
            category="pain_management", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["palliative","advanced_cancer","hospice","end_of_life"]',
            topic_tags='["advanced cancer","palliative care","hospice"]',
        ),
    ),
    (
        "nci_radiation_therapy.pdf",
        "https://www.cancer.gov/publications/patient-education/radiation.pdf",
        "https://www.cancer.gov/publications/patient-education/radiation-therapy-and-you",
        dict(
            title="Radiation Therapy and You (NCI)",
            summary="What to expect during radiation therapy, side effect management, and questions to ask your care team.",
            category="pain_management", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["cancer","radiation","treatment","palliative"]',
            topic_tags='["radiation therapy","side effects","treatment"]',
        ),
    ),

    # ── Spiritual / Grief ─────────────────────────────────────────────────────
    (
        "nci_when_someone_dies.pdf",
        "https://www.cancer.gov/publications/patient-education/when-someone-you-love-has-advanced-cancer.pdf",
        "https://www.cancer.gov/publications/patient-education/when-someone-you-love-is-being-treated-for-cancer",
        dict(
            title="When Someone You Love Has Advanced Cancer (NCI)",
            summary="Supporting a loved one with advanced cancer  --  understanding symptoms, caregiving, and preparing for end of life.",
            category="spiritual_care", format="pdf", difficulty_level="simple",
            is_ghana_specific=False, source="National Cancer Institute (NCI)",
            condition_tags='["grief","bereavement","family","end_of_life","caregiver"]',
            topic_tags='["grief","bereavement","advanced cancer","family support"]',
        ),
    ),

    # ── Ghana / Africa ────────────────────────────────────────────────────────
    (
        "who_palliative_care_primary_health.pdf",
        "https://apps.who.int/iris/bitstream/handle/10665/274399/9789241514477-eng.pdf",
        "https://www.who.int/publications/i/item/integrating-palliative-care-and-symptom-relief-into-primary-health-care",
        dict(
            title="Integrating Palliative Care into Primary Health Care (WHO)",
            summary="WHO guide for programme managers on integrating palliative care into primary health systems  --  highly relevant to Ghana's CHPS and district hospitals.",
            category="ghana_resources", format="pdf", difficulty_level="standard",
            is_ghana_specific=True, source="World Health Organization",
            condition_tags='["palliative","ghana","africa","primary_health"]',
            topic_tags='["palliative care integration","WHO","primary health","ghana"]',
        ),
    ),
    (
        "who_palliative_care_older_people.pdf",
        "https://apps.who.int/iris/bitstream/handle/10665/108506/e82933.pdf",
        "https://www.euro.who.int/en/health-topics/Life-stages/healthy-ageing/publications/palliative-care-for-older-people-better-practices2",
        dict(
            title="Palliative Care for Older People: Better Practices (WHO Euro)",
            summary="Evidence-based palliative care approaches for elderly patients  --  covering pain, dementia, dignity and family involvement.",
            category="ghana_resources", format="pdf", difficulty_level="standard",
            is_ghana_specific=True, source="WHO Regional Office for Europe",
            condition_tags='["palliative","elderly","dementia","africa","ghana"]',
            topic_tags='["older people","dementia","palliative care","dignity"]',
        ),
    ),
]


# ── Download helper ────────────────────────────────────────────────────────────
def download_pdf(filename: str, url: str) -> str | None:
    dest = PDF_DIR / filename
    if dest.exists() and dest.stat().st_size > 10_000:
        print(f"  [SKIP] {filename} already exists ({dest.stat().st_size // 1024} KB)")
        return str(dest)

    print(f"  [DL]   Downloading {filename}")
    print(f"         {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=45, stream=True, allow_redirects=True)
        resp.raise_for_status()

        # Verify it's actually a PDF not an HTML redirect page
        content_type = resp.headers.get("content-type", "")
        first_bytes = b""
        chunks = []
        for chunk in resp.iter_content(chunk_size=8192):
            chunks.append(chunk)
            if not first_bytes and chunk:
                first_bytes = chunk[:8]

        if b"%PDF" not in first_bytes and b"<!DOCTYPE" in first_bytes[:200].lower():
            print(f"         SKIP  --  server returned HTML instead of PDF")
            return None

        with open(dest, "wb") as f:
            for chunk in chunks:
                f.write(chunk)

        size_kb = dest.stat().st_size // 1024
        if size_kb < 10:
            print(f"         SKIP  --  file too small ({size_kb} KB), likely redirect HTML")
            dest.unlink()
            return None

        print(f"         OK  --  {size_kb} KB")
        time.sleep(0.8)
        return str(dest)

    except Exception as e:
        print(f"         FAILED: {e}")
        if dest.exists():
            dest.unlink()
        return None


# ── DB upsert ──────────────────────────────────────────────────────────────────
def upsert_resource(db, filename: str, pdf_path: str | None, external_url: str, meta: dict):
    rel_path = f"/static/pdfs/{filename}" if pdf_path else None
    existing = db.query(Resource).filter(Resource.title == meta["title"]).first()

    if existing:
        if rel_path:
            existing.pdf_path = rel_path
        existing.external_url = external_url
        existing.format = "pdf"
        existing.source = meta.get("source", existing.source)
        existing.is_published = True
        print(f"  [UPDATE] {meta['title'][:65]}")
    else:
        resource = Resource(
            title=meta["title"],
            summary=meta.get("summary", ""),
            content="",
            category=meta.get("category", "general"),
            format="pdf",
            pdf_path=rel_path,
            external_url=external_url,
            source=meta.get("source", ""),
            condition_tags=meta.get("condition_tags", "[]"),
            topic_tags=meta.get("topic_tags", "[]"),
            difficulty_level=meta.get("difficulty_level", "standard"),
            is_ghana_specific=meta.get("is_ghana_specific", False),
            is_published=True,
            helpful_count=0,
            view_count=0,
            created_at=datetime.utcnow(),
        )
        db.add(resource)
        print(f"  [INSERT] {meta['title'][:65]}")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print(f"\nPDF storage: {PDF_DIR}\n")
    db = SessionLocal()
    downloaded = failed = 0

    for filename, dl_url, ext_url, meta in RESOURCES:
        print(f"\n{'─'*65}")
        pdf_path = download_pdf(filename, dl_url)
        if pdf_path:
            downloaded += 1
        else:
            failed += 1
            print(f"  (Will store external link: {ext_url})")
        upsert_resource(db, filename, pdf_path, ext_url, meta)

    db.commit()
    db.close()

    print(f"\n{'='*65}")
    print(f"PDFs downloaded: {downloaded}  |  Failed/external-only: {failed}")
    print(f"All {len(RESOURCES)} resources upserted into database.")
    print(f"\nPDF files in: {PDF_DIR}")


if __name__ == "__main__":
    main()
