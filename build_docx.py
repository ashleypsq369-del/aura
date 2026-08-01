"""
build_docx.py
Converts GROUP-31-PROJECT-REPORT-CONDENSED.md to a properly formatted
UMaT-compliant .docx file.

UMaT formatting rules applied:
- Paper: A4
- Margins: top/bottom/right 2.54 cm, left 3.05 cm (binding)
- Font: Times New Roman 12pt body, 14pt chapter numbers
- Line spacing: 1.5
- Chapter headings: centred, bold, 12pt, ALL CAPS
- Second-level headings: bold, left-aligned, 12pt
- Third-level headings: regular, left-aligned, 12pt
- No headers or footers (UMaT rule 4.1.5)
- Page numbers: footer, centred, Arabic numerals
- Preliminary pages: Roman numerals (handled by note — docx limitation)
- Paragraph: justified, triple-space between paragraphs = 12pt space-after
- Tables: auto-width, header row shaded light grey, font 11pt
"""

import re
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ROW_HEIGHT_RULE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ── paths ──────────────────────────────────────────────────────────────────
SRC  = Path(r"c:\xampp\htdocs\ProjectAura_React\GROUP-31-PROJECT-REPORT-CONDENSED.md")
DEST = Path(r"c:\xampp\htdocs\ProjectAura_React\GROUP-31-PROJECT-REPORT.docx")

# ── helpers ────────────────────────────────────────────────────────────────
def set_page_margins(doc):
    from docx.oxml.ns import qn
    section = doc.sections[0]
    section.page_width  = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin   = Cm(3.05)
    section.right_margin  = Cm(2.54)
    section.top_margin    = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.header_distance = Cm(0)
    section.footer_distance = Cm(0)

def add_page_number(doc):
    """Add centred Arabic page number in footer."""
    section = doc.sections[0]
    footer  = section.footer
    para    = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.text = 'PAGE'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)

def base_para_fmt(para, space_before=0, space_after=6, justify=True):
    pf = para.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after  = Pt(space_after)
    pf.line_spacing = Pt(18)       # 1.5 × 12pt
    if justify:
        para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return para

def set_font(run, bold=False, italic=False, size=12):
    run.font.name  = 'Times New Roman'
    run.font.size  = Pt(size)
    run.font.bold  = bold
    run.font.italic = italic

def add_body(doc, text, bold=False, italic=False, space_before=0, space_after=6,
             align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    para = doc.add_paragraph()
    base_para_fmt(para, space_before, space_after)
    para.alignment = align
    run = para.add_run(text)
    set_font(run, bold=bold, italic=italic)
    return para

def add_chapter_heading(doc, number, title):
    """Chapter heading: centred, bold, 12pt. Number on its own line above title."""
    doc.add_page_break()
    # chapter number line
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p1.add_run(f"CHAPTER {number}")
    set_font(r1, bold=True, size=14)
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after  = Pt(0)
    p1.paragraph_format.line_spacing = Pt(18)
    # title line
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p2.add_run(title.upper())
    set_font(r2, bold=True, size=12)
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after  = Pt(18)
    p2.paragraph_format.line_spacing = Pt(18)

def add_h2(doc, text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = para.add_run(text)
    set_font(run, bold=True, size=12)
    para.paragraph_format.space_before = Pt(12)
    para.paragraph_format.space_after  = Pt(6)
    para.paragraph_format.line_spacing = Pt(18)
    return para

def add_h3(doc, text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = para.add_run(text)
    set_font(run, bold=False, size=12)
    para.paragraph_format.space_before = Pt(10)
    para.paragraph_format.space_after  = Pt(4)
    para.paragraph_format.line_spacing = Pt(18)
    return para

def shade_row(row, hex_color="D9D9D9"):
    for cell in row.cells:
        tc   = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd  = OxmlElement('w:shd')
        shd.set(qn('w:val'),   'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'),  hex_color)
        tcPr.append(shd)

def add_table_from_lines(doc, lines):
    """
    Parse a monospace table (pipe-separated or space-aligned) into a docx table.
    lines: list of non-empty strings that form the table block.
    """
    # Split on 2+ consecutive spaces (monospace alignment) or on |
    rows = []
    for ln in lines:
        ln = ln.strip()
        if not ln or set(ln) <= {'-', ' ', '+', '|'}:
            continue
        if '|' in ln:
            cols = [c.strip() for c in ln.strip('|').split('|')]
        else:
            # split on 3+ spaces
            cols = [c.strip() for c in re.split(r'  {2,}', ln) if c.strip()]
        if cols:
            rows.append(cols)

    if not rows:
        return

    max_cols = max(len(r) for r in rows)
    # Pad short rows
    rows = [r + [''] * (max_cols - len(r)) for r in rows]

    tbl = doc.add_table(rows=len(rows), cols=max_cols)
    tbl.style = 'Table Grid'
    tbl.alignment = WD_TABLE_ALIGNMENT.LEFT

    for ri, row_data in enumerate(rows):
        row = tbl.rows[ri]
        for ci, cell_text in enumerate(row_data):
            cell = row.cells[ci]
            cell.text = ''
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = para.add_run(cell_text)
            set_font(run, bold=(ri == 0), size=11)
            para.paragraph_format.space_before = Pt(2)
            para.paragraph_format.space_after  = Pt(2)
            para.paragraph_format.line_spacing = Pt(14)
        if ri == 0:
            shade_row(row)

    # space after table
    tbl_para = doc.add_paragraph()
    tbl_para.paragraph_format.space_after = Pt(6)


# ── preliminary page builder ───────────────────────────────────────────────
def add_centred_block(doc, lines, bold=False, size=12, space_after=6):
    for ln in lines:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(ln)
        set_font(r, bold=bold, size=size)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(space_after)
        p.paragraph_format.line_spacing = Pt(18)

def add_prelim_heading(doc, title):
    """Unnumbered centred heading for prelim pages (DECLARATION, ABSTRACT etc.)"""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(title.upper())
    set_font(r, bold=True, size=12)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(12)
    p.paragraph_format.line_spacing = Pt(18)

# ── main parser ────────────────────────────────────────────────────────────
def parse_and_build(md_text, doc):
    set_page_margins(doc)
    add_page_number(doc)

    lines = md_text.splitlines()
    i = 0
    total = len(lines)

    # state
    in_table      = False
    table_lines   = []
    in_prelim     = False   # inside a prelim section block
    current_prelim = None

    # Prelim section names that get their own page
    PRELIM_HEADS = {
        'DECLARATION', 'ABSTRACT', 'ACKNOWLEDGEMENTS',
        'TABLE OF CONTENTS', 'LIST OF FIGURES', 'LIST OF TABLES'
    }

    # Chapter number → title mapping (detected dynamically)
    CHAPTER_MAP = {}

    while i < total:
        raw = lines[i]
        stripped = raw.strip()

        # ── blank / separator ───────────────────────────────────────────
        if stripped == '' or stripped == '---':
            if in_table and table_lines:
                add_table_from_lines(doc, table_lines)
                table_lines = []
                in_table = False
            i += 1
            continue

        # ── detect chapter heading: "CHAPTER N" on its own line ─────────
        ch_match = re.match(r'^CHAPTER\s+(\d+)\s*$', stripped)
        if ch_match:
            ch_num = ch_match.group(1)
            # peek next non-blank line for title
            j = i + 1
            while j < total and not lines[j].strip():
                j += 1
            ch_title = lines[j].strip() if j < total else ''
            add_chapter_heading(doc, ch_num, ch_title)
            i = j + 1
            in_prelim = False
            continue

        # ── detect prelim heading ────────────────────────────────────────
        if stripped.upper() in PRELIM_HEADS:
            if in_table and table_lines:
                add_table_from_lines(doc, table_lines)
                table_lines = []
                in_table = False
            doc.add_page_break()
            add_prelim_heading(doc, stripped)
            current_prelim = stripped.upper()
            in_prelim = True
            i += 1
            continue

        # ── numbered section headings ────────────────────────────────────
        # Level 2: "3.4 System Architecture"
        h2_match = re.match(r'^(\d+\.\d+)\s+(.+)$', stripped)
        # Level 3: "3.4.1 Data Input Layer"
        h3_match = re.match(r'^(\d+\.\d+\.\d+)\s+(.+)$', stripped)
        # Level 3 with dash: "3.3.1 Phase 1 — Requirements Analysis"
        h3d_match = re.match(r'^(\d+\.\d+\.\d+)\s+Phase\s+', stripped) or \
                    re.match(r'^(\d+\.\d+\.\d+)\s+', stripped)

        if h3_match:
            if in_table and table_lines:
                add_table_from_lines(doc, table_lines)
                table_lines = []
                in_table = False
            num   = h3_match.group(1)
            title = h3_match.group(2)
            add_h3(doc, f"{num}  {title}")
            i += 1
            continue

        if h2_match:
            if in_table and table_lines:
                add_table_from_lines(doc, table_lines)
                table_lines = []
                in_table = False
            num   = h2_match.group(1)
            title = h2_match.group(2)
            add_h2(doc, f"{num}  {title}")
            i += 1
            continue

        # ── table caption: "Table X.Y: Title" ───────────────────────────
        tbl_cap = re.match(r'^Table\s+\d+\.\d+[:.]', stripped)
        if tbl_cap:
            if in_table and table_lines:
                add_table_from_lines(doc, table_lines)
                table_lines = []
                in_table = False
            # Emit caption as italic body then collect table rows
            add_body(doc, stripped, italic=True, space_before=12, space_after=4,
                     align=WD_ALIGN_PARAGRAPH.LEFT)
            i += 1
            # Collect following non-blank lines as table content
            in_table = True
            table_lines = []
            continue

        # ── figure caption: "Figure X.Y: Title" ─────────────────────────
        fig_cap = re.match(r'^Figure\s+\d+\.\d+[:.]', stripped)
        if fig_cap:
            if in_table and table_lines:
                add_table_from_lines(doc, table_lines)
                table_lines = []
                in_table = False
            add_body(doc, stripped, italic=True, space_before=12, space_after=4,
                     align=WD_ALIGN_PARAGRAPH.CENTER)
            i += 1
            continue

        # ── detect table row (has 2+ consecutive spaces → monospace table) ──
        looks_like_table = (
            len(stripped) > 10 and
            (re.search(r'   +', stripped) or stripped.count('|') >= 2) and
            not stripped.startswith('Figure') and
            not stripped.startswith('Table ')
        )

        if looks_like_table:
            in_table = True
            table_lines.append(stripped)
            i += 1
            continue

        # ── flush pending table if current line looks like normal prose ──
        if in_table and table_lines:
            add_table_from_lines(doc, table_lines)
            table_lines = []
            in_table = False

        # ── normal body paragraph ────────────────────────────────────────
        # Skip [See dissertation figures guide…] placeholders
        if stripped.startswith('[See dissertation'):
            i += 1
            continue

        add_body(doc, stripped, space_before=0, space_after=6)
        i += 1

    # flush any remaining table
    if in_table and table_lines:
        add_table_from_lines(doc, table_lines)


# ── entry point ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Reading markdown...")
    md_text = SRC.read_text(encoding='utf-8')

    print("Creating document...")
    doc = Document()

    # Remove default styles noise — set Normal style base
    from docx.shared import Pt
    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(12)

    parse_and_build(md_text, doc)

    print(f"Saving to {DEST} ...")
    doc.save(str(DEST))
    print("Done.")
    print(f"File size: {DEST.stat().st_size / 1024:.1f} KB")
