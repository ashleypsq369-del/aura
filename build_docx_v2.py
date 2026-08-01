"""
build_docx_v2.py
─────────────────
Clones the formatting of GROUP-31_PROJECT_REPORT_no_images.docx (the template)
and replaces every paragraph/table with the condensed content from
GROUP-31-PROJECT-REPORT-CONDENSED.md.

Strategy
────────
1. Open the template, read its styles (Normal, Heading 1/2/3, Table Grid)
2. Clear every paragraph and table from the template body (keeping the styles)
3. Re-populate from the markdown source using the exact same style names
4. Save as GROUP-31-PROJECT-REPORT-FINAL.docx

This preserves every formatting detail of the original (fonts, margins,
spacing, header/footer, page setup) while replacing only the content.
"""

import re
import copy
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, Emu, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

TEMPLATE = Path(r"C:\Users\User\Downloads\GROUP-31_PROJECT_REPORT_no_images.docx")
MD_SRC   = Path(r"c:\xampp\htdocs\ProjectAura_React\GROUP-31-PROJECT-REPORT-CONDENSED.md")
OUTPUT   = Path(r"c:\xampp\htdocs\ProjectAura_React\GROUP-31-PROJECT-REPORT-FINAL.docx")

# ─── helpers ──────────────────────────────────────────────────────────────────

def clear_document_body(doc):
    """Remove all paragraphs and tables from the document body."""
    body = doc.element.body
    # collect all child elements except sectPr (section properties — keeps margins/headers)
    to_remove = [
        child for child in body
        if child.tag != qn('w:sectPr')
    ]
    for el in to_remove:
        body.remove(el)

def add_para(doc, text, style='Normal', bold=None, italic=None,
             align=None, space_before=None, space_after=None, keep_with_next=False):
    """Add a paragraph using the named style; optionally override run-level formatting."""
    p = doc.add_paragraph(style=style)
    if align is not None:
        p.paragraph_format.alignment = align
    if space_before is not None:
        p.paragraph_format.space_before = Pt(space_before)
    if space_after is not None:
        p.paragraph_format.space_after = Pt(space_after)
    if keep_with_next:
        p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    return p

def add_page_break(doc):
    p = doc.add_paragraph(style='Normal')
    run = p.add_run()
    run.add_break(WD_BREAK.PAGE)
    return p

def shade_row(row, hex_color="D9D9D9"):
    for cell in row.cells:
        tc   = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd  = OxmlElement('w:shd')
        shd.set(qn('w:val'),   'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'),  hex_color)
        tcPr.append(shd)

def add_table_from_block(doc, caption, data_rows):
    """
    caption   : string, already added as italic Normal before calling this
    data_rows : list of lists of strings
    """
    if not data_rows:
        return
    ncols = max(len(r) for r in data_rows)
    data_rows = [r + [''] * (ncols - len(r)) for r in data_rows]

    tbl = doc.add_table(rows=len(data_rows), cols=ncols)
    tbl.style = 'Table Grid'
    tbl.alignment = WD_TABLE_ALIGNMENT.LEFT

    for ri, row_data in enumerate(data_rows):
        row = tbl.rows[ri]
        for ci, cell_text in enumerate(row_data):
            cell = row.cells[ci]
            cell.text = ''
            p = cell.paragraphs[0]
            run = p.add_run(cell_text)
            run.font.bold = (ri == 0)
            p.style = doc.styles['Normal']
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after  = Pt(2)
        if ri == 0:
            shade_row(row)

    # small spacer after table
    sp = doc.add_paragraph(style='Normal')
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after  = Pt(6)


# ─── parser ───────────────────────────────────────────────────────────────────

def parse_and_fill(doc, md_text):
    lines = md_text.splitlines()
    total = len(lines)
    i = 0

    # prelim section names that use Heading 1 centred
    PRELIM = {
        'DECLARATION', 'ABSTRACT', 'ACKNOWLEDGEMENTS',
        'TABLE OF CONTENTS', 'LIST OF FIGURES', 'LIST OF TABLES',
        'REFERENCES'
    }

    in_table   = False
    tbl_caption = ''
    tbl_rows   = []
    in_list_section = False   # True when inside LIST OF FIGURES or LIST OF TABLES

    def flush_table():
        nonlocal in_table, tbl_caption, tbl_rows
        if in_table and tbl_rows:
            add_table_from_block(doc, tbl_caption, tbl_rows)
        in_table    = False
        tbl_caption = ''
        tbl_rows    = []

    def parse_monospace_row(line):
        """Split a monospace-aligned row into columns."""
        line = line.strip()
        if '|' in line:
            parts = [c.strip() for c in line.strip('|').split('|') if c.strip() or True]
            return [c.strip() for c in line.strip('|').split('|')]
        # split on 3+ spaces
        parts = re.split(r' {3,}', line)
        return [p.strip() for p in parts if p.strip()]

    while i < total:
        raw     = lines[i]
        stripped = raw.strip()

        # blank / horizontal rule
        if stripped == '' or stripped == '---':
            # only flush table on --- separator; blank lines inside tables are OK
            if stripped == '---':
                flush_table()
            elif in_table:
                # blank line inside table block — skip but stay in table mode
                pass
            else:
                flush_table()
            i += 1
            continue

        # ── CHAPTER heading: "CHAPTER N" alone on a line ──────────────────
        ch = re.match(r'^CHAPTER\s+(\d+)\s*$', stripped)
        if ch:
            flush_table()
            in_list_section = False   # chapters are never list sections
            flush_table()
            doc.add_page_break()
            num = ch.group(1)
            # peek next non-blank for title
            j = i + 1
            while j < total and not lines[j].strip():
                j += 1
            title = lines[j].strip() if j < total else ''
            # Chapter number line
            p_num = doc.add_paragraph(style='Heading 1')
            p_num.clear()
            r = p_num.add_run(f"CHAPTER {num}")
            # title line
            p_tit = doc.add_paragraph(style='Heading 1')
            p_tit.clear()
            r2 = p_tit.add_run(title.upper())
            i = j + 1
            continue

        # ── Prelim heading (DECLARATION, ABSTRACT, etc.) ─────────────────
        if stripped.upper() in PRELIM:
            flush_table()
            doc.add_page_break()
            p = doc.add_paragraph(style='Heading 1')
            p.clear()
            p.add_run(stripped.upper())
            # track whether we're in a list section
            in_list_section = stripped.upper() in ('LIST OF FIGURES', 'LIST OF TABLES',
                                                    'TABLE OF CONTENTS')
            i += 1
            continue

        # ── Level 3 heading: "4.7.2 ..." ─────────────────────────────────
        h3m = re.match(r'^(\d+\.\d+\.\d+)\s+(.+)$', stripped)
        if h3m and not in_list_section:
            flush_table()
            p = doc.add_paragraph(style='Heading 3')
            p.clear()
            p.add_run(f"{h3m.group(1)}  {h3m.group(2)}")
            i += 1
            continue

        # ── Level 2 heading: "X.Y Title" — section numbers only ─────────
        h2m = re.match(r'^(\d+\.\d+)\s+(.+)$', stripped)
        if h2m and not in_list_section:
            num_part = h2m.group(1)
            try:
                major, minor = int(num_part.split('.')[0]), int(num_part.split('.')[1])
                valid = (1 <= major <= 10) and (1 <= minor <= 30)
            except Exception:
                valid = False
            # Reject list-of-figures/tables entries: they end with a page number
            rest = h2m.group(2).strip()
            ends_with_page_num = bool(re.search(r'\s+\d+\s*$', rest))
            if valid and not ends_with_page_num:
                flush_table()
                p = doc.add_paragraph(style='Heading 2')
                p.clear()
                p.add_run(f"{h2m.group(1)}  {h2m.group(2)}")
                i += 1
                continue

        # ── Table caption: "Table N.N: ..." ──────────────────────────────
        tc = re.match(r'^(Table\s+\d+\.\d+[:.].+)$', stripped)
        if tc:
            flush_table()
            # emit caption as italic Normal
            p = doc.add_paragraph(style='Normal')
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after  = Pt(4)
            run = p.add_run(stripped)
            run.font.bold   = True
            run.font.italic = False
            tbl_caption = stripped
            in_table = True
            tbl_rows = []
            i += 1
            continue

        # ── Figure caption: "Figure N.N: ..." ────────────────────────────
        fc = re.match(r'^(Figure\s+\d+\.\d+[:.].+)$', stripped)
        if fc:
            flush_table()
            p = doc.add_paragraph(style='Normal')
            p.paragraph_format.alignment    = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after  = Pt(4)
            run = p.add_run(stripped)
            run.font.italic = True
            i += 1
            continue

        # ── Detect if line looks like a table data row ────────────────────
        is_separator = bool(re.match(r'^[-|\s+]+$', stripped))
        has_table_spacing = (bool(re.search(r'   +', stripped)) or
                             stripped.count('|') >= 2 or
                             raw.startswith('  ') or  # indented continuation
                             raw.startswith('\t'))

        if in_table:
            if is_separator:
                i += 1
                continue
            if has_table_spacing:
                cols = parse_monospace_row(stripped)
                if cols:
                    tbl_rows.append(cols)
                i += 1
                continue
            else:
                # line looks like prose — end of table
                flush_table()

        # skip figure placeholders
        if stripped.startswith('[See dissertation'):
            i += 1
            continue

        # ── Normal body paragraph ─────────────────────────────────────────
        flush_table()
        p = doc.add_paragraph(style='Normal')
        p.add_run(stripped)
        i += 1

    flush_table()


# ─── entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("Loading template...")
    doc = Document(str(TEMPLATE))

    print("Clearing document body (keeping styles/margins/headers)...")
    clear_document_body(doc)

    print("Reading markdown...")
    md_text = MD_SRC.read_text(encoding='utf-8')

    print("Building content...")
    parse_and_fill(doc, md_text)

    print(f"Saving to {OUTPUT}...")
    doc.save(str(OUTPUT))

    size_kb = OUTPUT.stat().st_size / 1024
    paras   = len([p for p in doc.paragraphs if p.text.strip()])
    tables  = len(doc.tables)
    print(f"Done.  File: {size_kb:.1f} KB  |  Paragraphs: {paras}  |  Tables: {tables}")
