#!/usr/bin/env python3
"""
Archive old pages - zip them for reference but remove from active use
"""
import os
import shutil
from datetime import datetime
import zipfile

print("=" * 70)
print("ARCHIVING OLD PAGES FOR REFERENCE")
print("=" * 70)

# Create archive directory
archive_dir = 'archived_old_ui'
if not os.path.exists(archive_dir):
    os.makedirs(archive_dir)

# Create timestamp for archive
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
zip_filename = f'{archive_dir}/old_pages_backup_{timestamp}.zip'

print(f"\n[1/3] Creating archive: {zip_filename}")

# Create zip file with all old pages
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Archive pages folder
    if os.path.exists('pages'):
        for file in os.listdir('pages'):
            if file.endswith('.py'):
                file_path = os.path.join('pages', file)
                zipf.write(file_path, f'pages/{file}')
                print(f"  ✓ Archived: {file}")
    
    # Archive page_modules folder
    if os.path.exists('page_modules'):
        for file in os.listdir('page_modules'):
            if file.endswith('.py'):
                file_path = os.path.join('page_modules', file)
                zipf.write(file_path, f'page_modules/{file}')
                print(f"  ✓ Archived: page_modules/{file}")
    
    # Archive backup folder if exists
    if os.path.exists('pages_backup_before_restructure'):
        for file in os.listdir('pages_backup_before_restructure'):
            if file.endswith('.py'):
                file_path = os.path.join('pages_backup_before_restructure', file)
                zipf.write(file_path, f'backup/{file}')
                print(f"  ✓ Archived: backup/{file}")

print(f"\n✓ Archive created: {zip_filename}")

# Create inventory of what was archived
print("\n[2/3] Creating inventory...")

inventory = f"""# ARCHIVED OLD UI - {timestamp}

All old pages and modules have been archived for reference.
You can extract functionalities from these files when needed.

## Archive Location
`{zip_filename}`

## Archived Contents

### Pages (pages/)
"""

if os.path.exists('pages'):
    for file in sorted(os.listdir('pages')):
        if file.endswith('.py'):
            inventory += f"- {file}\n"

inventory += "\n### Page Modules (page_modules/)\n"
if os.path.exists('page_modules'):
    for file in sorted(os.listdir('page_modules')):
        if file.endswith('.py'):
            inventory += f"- {file}\n"

inventory += """
## How to Extract Functionality

1. Unzip the archive:
   ```bash
   unzip """ + zip_filename + """
   ```

2. Open the old file to copy functionality
3. Integrate into new custom UI

## Note
These files are preserved for reference only.
The new UI is being built from scratch in app.py and custom modules.
"""

inventory_file = f'{archive_dir}/INVENTORY_{timestamp}.md'
with open(inventory_file, 'w', encoding='utf-8') as f:
    f.write(inventory)

print(f"✓ Inventory created: {inventory_file}")

# Remove old pages from active use (but keep in archive)
print("\n[3/3] Removing old pages from active pages folder...")

# Move pages to archived folder instead of deleting
archived_pages_dir = f'{archive_dir}/extracted_pages'
if not os.path.exists(archived_pages_dir):
    os.makedirs(archived_pages_dir)

if os.path.exists('pages'):
    for file in os.listdir('pages'):
        if file.endswith('.py'):
            src = os.path.join('pages', file)
            dst = os.path.join(archived_pages_dir, file)
            shutil.move(src, dst)
            print(f"  ✓ Moved to archive: {file}")

print("\n" + "=" * 70)
print("✅ OLD PAGES ARCHIVED!")
print("=" * 70)

print(f"\n📦 Archive Details:")
print(f"  • Zip file: {zip_filename}")
print(f"  • Inventory: {inventory_file}")
print(f"  • Extracted files: {archived_pages_dir}/")

print("\n💡 All old functionality is preserved and accessible!")
print("   You can reference these files anytime to copy functionality.")

print("\n🎨 Ready for new custom UI development!")
print("=" * 70)
