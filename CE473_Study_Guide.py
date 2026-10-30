from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, HRFlowable, KeepTogether)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import ListFlowable, ListItem

# ── document setup ──────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    "CE473_Complete_Study_Guide.pdf",
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm,   bottomMargin=2*cm,
    title="CE 473 Logic of Computer Science – Complete Study Guide",
    author="Compiled from UMaT Handout"
)

W = A4[0] - 4*cm   # usable width

# ── colour palette ───────────────────────────────────────────────────────────
C_DARK   = colors.HexColor("#1a1a2e")
C_BLUE   = colors.HexColor("#1565C0")
C_LBLUE  = colors.HexColor("#1976D2")
C_GREEN  = colors.HexColor("#2E7D32")
C_AMBER  = colors.HexColor("#E65100")
C_PURPLE = colors.HexColor("#6A1B9A")
C_TEAL   = colors.HexColor("#00695C")
C_RED    = colors.HexColor("#B71C1C")
C_BG1    = colors.HexColor("#E3F2FD")   # light blue bg
C_BG2    = colors.HexColor("#F3E5F5")   # light purple bg
C_BG3    = colors.HexColor("#E8F5E9")   # light green bg
C_BG4    = colors.HexColor("#FFF8E1")   # light amber bg
C_BG5    = colors.HexColor("#FCE4EC")   # light red/pink bg

# ── styles ───────────────────────────────────────────────────────────────────
SS = getSampleStyleSheet()

def mkStyle(name, parent='Normal', **kw):
    s = ParagraphStyle(name, parent=SS[parent], **kw)
    return s

TITLE  = mkStyle('TITLE',  fontSize=22, textColor=C_DARK,  alignment=TA_CENTER,
                 fontName='Helvetica-Bold', spaceAfter=6)
SUB    = mkStyle('SUB',    fontSize=13, textColor=C_BLUE,  alignment=TA_CENTER,
                 fontName='Helvetica', spaceAfter=4)
CH     = mkStyle('CH',     fontSize=16, textColor=colors.white, fontName='Helvetica-Bold',
                 spaceAfter=4, spaceBefore=14, backColor=C_BLUE,
                 borderPad=6, leading=20)
SEC    = mkStyle('SEC',    fontSize=13, textColor=C_LBLUE, fontName='Helvetica-Bold',
                 spaceBefore=10, spaceAfter=4, borderPadding=(0,0,2,0))
SSEC   = mkStyle('SSEC',   fontSize=11, textColor=C_PURPLE, fontName='Helvetica-Bold',
                 spaceBefore=6, spaceAfter=2)
BODY   = mkStyle('BODY',   fontSize=10, fontName='Helvetica',
                 leading=14, spaceAfter=4, alignment=TA_JUSTIFY)
MONO   = mkStyle('MONO',   fontSize=9,  fontName='Courier',
                 leading=13, spaceAfter=2, leftIndent=12)
NOTE   = mkStyle('NOTE',   fontSize=9,  fontName='Helvetica-Oblique',
                 textColor=C_TEAL, spaceAfter=3, leftIndent=8)
RULE   = mkStyle('RULE',   fontSize=10, fontName='Helvetica-Bold',
                 textColor=C_GREEN, spaceAfter=2)
WARN   = mkStyle('WARN',   fontSize=9,  fontName='Helvetica',
                 textColor=C_RED,   spaceAfter=2)
STEP   = mkStyle('STEP',   fontSize=10, fontName='Helvetica',
                 leading=14, spaceAfter=3, leftIndent=16)
DEF    = mkStyle('DEF',    fontSize=10, fontName='Helvetica-Bold',
                 textColor=C_AMBER, spaceAfter=2)
SOLN   = mkStyle('SOLN',   fontSize=10, fontName='Courier',
                 leading=13, spaceAfter=2, leftIndent=16, textColor=C_GREEN)

story = []

# ── helpers ──────────────────────────────────────────────────────────────────
def H(text, style=BODY): return Paragraph(text, style)
def SP(n=4):  return Spacer(1, n)
def HR(color=C_BLUE, w=1): return HRFlowable(width="100%", thickness=w, color=color)

def chapter(num, title):
    story.append(SP(8))
    story.append(HR(C_DARK, 2))
    story.append(H(f"  CHAPTER {num}: {title}", CH))
    story.append(HR(C_DARK, 2))
    story.append(SP(4))

def section(num, title, color=C_LBLUE):
    story.append(SP(6))
    s = mkStyle(f's{num}', fontSize=12, textColor=color, fontName='Helvetica-Bold',
                spaceBefore=6, spaceAfter=3,
                borderPadding=(3,4,3,4), backColor=C_BG1)
    story.append(H(f"{num}  {title}", s))

def subsection(title):
    story.append(H(title, SSEC))

def body(*lines):
    for l in lines:
        story.append(H(l, BODY))

def mono(*lines):
    for l in lines:
        story.append(H(l, MONO))

def note(text):
    story.append(H("📝 " + text, NOTE))

def rule(text):
    story.append(H("✔ " + text, RULE))

def warn(text):
    story.append(H("⚠ " + text, WARN))

def defn(term, definition):
    story.append(H(f"<b>{term}:</b>  {definition}", BODY))

def example_box(label, lines, bg=C_BG3):
    data = [[H(f"<b>{label}</b>", mkStyle('EH', fontSize=10, fontName='Helvetica-Bold',
                                           textColor=C_GREEN))]]
    for l in lines:
        data.append([H(l, mkStyle('EL', fontSize=9, fontName='Courier', leading=13))])
    t = Table(data, colWidths=[W])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_BG3),
        ('BACKGROUND', (0,1), (-1,-1), bg),
        ('BOX',        (0,0), (-1,-1), 1, C_GREEN),
        ('TOPPADDING',  (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0),(-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(SP(4))

def proof_box(label, lines, bg=C_BG4):
    data = [[H(f"<b>{label}</b>", mkStyle('PH', fontSize=10, fontName='Helvetica-Bold',
                                           textColor=C_AMBER))]]
    for l in lines:
        data.append([H(l, mkStyle('PL', fontSize=9, fontName='Courier', leading=13))])
    t = Table(data, colWidths=[W])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_BG4),
        ('BACKGROUND', (0,1), (-1,-1), bg),
        ('BOX',        (0,0), (-1,-1), 1, C_AMBER),
        ('TOPPADDING',  (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0),(-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(SP(4))

def truth_table(headers, rows, caption=""):
    if caption:
        story.append(H(f"<i>{caption}</i>", NOTE))
    col_w = W / len(headers)
    data = [headers] + rows
    t = Table(data, colWidths=[col_w]*len(headers))
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), C_BLUE),
        ('TEXTCOLOR',     (0,0), (-1,0), colors.white),
        ('FONTNAME',      (0,0), (-1,-1), 'Courier'),
        ('FONTSIZE',      (0,0), (-1,-1), 9),
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('GRID',          (0,0), (-1,-1), 0.5, colors.grey),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, C_BG1]),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t)
    story.append(SP(6))

# ════════════════════════════════════════════════════════════════════════════
#  COVER PAGE
# ════════════════════════════════════════════════════════════════════════════
cover_data = [[
    H("UNIVERSITY OF MINES AND TECHNOLOGY, TARKWA", mkStyle('ct1', fontSize=14,
       textColor=C_DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ],[
    H("Faculty of Computing and Mathematical Sciences", mkStyle('ct2', fontSize=11,
       textColor=C_BLUE, fontName='Helvetica', alignment=TA_CENTER)),
    ],[
    H("Department of Computer Science and Engineering", mkStyle('ct3', fontSize=11,
       textColor=C_BLUE, fontName='Helvetica', alignment=TA_CENTER)),
    ],[
    SP(10)
    ],[
    H("CE 473 – LOGIC OF COMPUTER SCIENCE", mkStyle('ct4', fontSize=20,
       textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_CENTER,
       backColor=C_DARK, borderPadding=10)),
    ],[
    SP(6)
    ],[
    H("COMPLETE EXAM STUDY GUIDE", mkStyle('ct5', fontSize=16,
       textColor=C_AMBER, fontName='Helvetica-Bold', alignment=TA_CENTER)),
    ],[
    H("Every Example · Every Operation · Every Proof — Fully Worked", mkStyle('ct6',
       fontSize=11, textColor=C_PURPLE, fontName='Helvetica-Oblique', alignment=TA_CENTER)),
    ],[
    SP(8)
    ],[
    H("Compiled from the Official UMaT Handout by Dr. W.A. Agangiba & Dr. A.A. Amponsah",
      mkStyle('ct7', fontSize=9, textColor=colors.grey, alignment=TA_CENTER)),
    ],[
    H("January 2024 Edition", mkStyle('ct8', fontSize=9, textColor=colors.grey, alignment=TA_CENTER)),
]]
cover_t = Table([[row[0]] for row in cover_data], colWidths=[W])
cover_t.setStyle(TableStyle([
    ('BOX',     (0,0), (-1,-1), 2, C_DARK),
    ('LEFTPADDING',  (0,0), (-1,-1), 16),
    ('RIGHTPADDING', (0,0), (-1,-1), 16),
    ('TOPPADDING',   (0,0), (-1,-1), 6),
    ('BOTTOMPADDING',(0,0), (-1,-1), 6),
]))
story.append(cover_t)
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════════
#  TABLE OF CONTENTS (manual)
# ════════════════════════════════════════════════════════════════════════════
story.append(H("TABLE OF CONTENTS", mkStyle('toc_h', fontSize=15, fontName='Helvetica-Bold',
                textColor=C_DARK, alignment=TA_CENTER, spaceAfter=10)))
toc = [
    ("Chapter 1", "Mathematical and Structural Induction"),
    ("  1.1", "Mathematical Induction"),
    ("  1.2", "Principles of Mathematical Induction – Examples & Proofs"),
    ("  1.3", "Principles of Structural Induction – Examples & Proofs"),
    ("Chapter 2", "Boolean Algebra"),
    ("  2.1", "Overview & Postulates"),
    ("  2.2", "Truth Tables"),
    ("  2.3", "Logical Operators – All Truth Tables"),
    ("  2.4 & 2.5", "Simplification of Boolean Functions – All Examples"),
    ("  2.6", "Karnaugh Maps – All Examples"),
    ("  2.7", "Logic Gates – All 7 Gates"),
    ("Chapter 3", "Propositional Logic"),
    ("  3.1", "Language of Propositional Logic"),
    ("  3.2", "Truth Valuation"),
    ("  3.3", "Satisfiability of Formulae"),
    ("  3.4", "Tautologies, Contradictions, Contingencies"),
    ("  3.5", "Logical Equivalence – All Examples & Proofs"),
    ("  3.6", "Conjunctive Normal Form – All Examples"),
    ("  3.7", "Natural Deductions – All Rules & Worked Examples"),
    ("  3.8", "Limitations of Propositional Logic"),
    ("Chapter 4", "Predicate Logic"),
    ("  4.1", "Translation Key & Examples"),
    ("  4.2", "Quantifiers and Variables"),
    ("  4.3", "Syntax of Quantifiers"),
    ("  4.4", "Syllogistic Statements"),
    ("  4.5", "Conjunctive Predicate Combinations"),
    ("  4.6", "Disjunctive Predicate Combinations"),
    ("  4.7", "Laws and Rules of Inference – All Proofs"),
    ("  4.8", "Indirect Proof"),
    ("  4.9", "Conditional Proof"),
]
toc_data = [[H(a, BODY), H(b, BODY)] for a, b in toc]
toc_t = Table(toc_data, colWidths=[3*cm, W-3*cm])
toc_t.setStyle(TableStyle([
    ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
    ('FONTSIZE',  (0,0), (-1,-1), 9),
    ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.lightgrey),
    ('TOPPADDING',(0,0), (-1,-1), 2),
    ('BOTTOMPADDING',(0,0),(-1,-1), 2),
]))
story.append(toc_t)
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════════
#  CHAPTER 1 — MATHEMATICAL AND STRUCTURAL INDUCTION
# ════════════════════════════════════════════════════════════════════════════
chapter(1, "MATHEMATICAL AND STRUCTURAL INDUCTION")

section("1.1", "Mathematical Induction")
body(
    "<b>Mathematical induction</b> is a method for proving statements whose domain is a subset of the integers.",
    "It is useful for discovering and characterising regular patterns or sequences.",
    "It is especially important in CS because most programs involve <i>repetition of sequences of statements</i>.",
    "A statement proven by induction is typically a function of a natural number <b>n</b>, where n = 1, 2, 3, …"
)
SP(4)

section("1.2", "Principles of Mathematical Induction")
body(
    "To prove a statement holds for all positive integers <b>n</b>, follow <b>THREE steps</b>:"
)
proof_box("The Three Steps of Mathematical Induction", [
    "Step 1 – BASE CASE:    Prove the statement is true for the smallest value of n",
    "                       (usually n = 0, 1, or 2).",
    "",
    "Step 2 – INDUCTION HYPOTHESIS (IH):  Assume the statement is true for n = k",
    "                                     (some arbitrary fixed value, at least the base).",
    "",
    "Step 3 – INDUCTIVE STEP:  Prove the statement is true for n = k + 1,",
    "                          using the assumption in Step 2.",
])

warn("This technique ONLY works when the domain is a subset of the integers. "
     "It CANNOT prove results for non-integer values (e.g. n = 2.5).")

# ─── Example 1 (from handout, fully worked) ──────────────────────────────
subsection("Example 1: Show that n² ≥ 2n for all n = 2, 3, 4, …")
proof_box("Worked Solution – Example 1", [
    "STEP 1 — Base Case (n = 2):",
    "   LHS = 2² = 4",
    "   RHS = 2(2) = 4",
    "   Since 4 ≥ 4, the statement holds for n = 2.  ✔",
    "",
    "STEP 2 — Induction Hypothesis (IH):",
    "   Assume n² ≥ 2n holds for n = k  (where k ≥ 2).",
    "   Therefore:  k² ≥ 2k          …(IH)",
    "",
    "STEP 3 — Inductive Step: Prove for n = k + 1",
    "   Need to show: (k+1)² ≥ 2(k+1)",
    "",
    "   LHS = (k+1)² = k² + 2k + 1",
    "   By IH, k² ≥ 2k, so:",
    "   LHS = k² + 2k + 1  ≥  2k + 2k + 1  =  4k + 1",
    "",
    "   RHS = 2(k+1) = 2k + 2",
    "",
    "   We need LHS ≥ RHS:",
    "   k² + 2k + 1  vs  2k + 2",
    "   Since k ≥ 2:  2k > 1,  therefore  2k + 2k + 1 > 2k + 2",
    "   More directly: k² + 2k + 1 ≥ 2k + 2k + 1 > 2k + 2  ✔",
    "",
    "   ∴ (k+1)² ≥ 2(k+1) is TRUE.",
    "",
    "CONCLUSION: By the principle of mathematical induction, n² ≥ 2n for all n ≥ 2.  □",
])

# ─── Additional Example 2 (extra practice) ───────────────────────────────
subsection("Example 2 (Extra): Prove that 1 + 2 + 3 + … + n = n(n+1)/2 for all n ≥ 1")
proof_box("Worked Solution – Example 2 (Sum Formula)", [
    "STEP 1 — Base Case (n = 1):",
    "   LHS = 1",
    "   RHS = 1(1+1)/2 = 1",
    "   LHS = RHS  ✔",
    "",
    "STEP 2 — Induction Hypothesis:",
    "   Assume  1 + 2 + … + k = k(k+1)/2  for some k ≥ 1.",
    "",
    "STEP 3 — Inductive Step: Prove for n = k + 1",
    "   1 + 2 + … + k + (k+1)",
    "   = k(k+1)/2 + (k+1)          [using IH]",
    "   = (k+1)[ k/2 + 1 ]",
    "   = (k+1)(k + 2)/2",
    "   = (k+1)((k+1) + 1)/2        [this is exactly the formula for n = k+1]  ✔",
    "",
    "CONCLUSION: The sum formula holds for all n ≥ 1.  □",
])

# ─── Additional Example 3 ─────────────────────────────────────────────────
subsection("Example 3 (Extra): Prove 2ⁿ > n for all n ≥ 1")
proof_box("Worked Solution – Example 3", [
    "STEP 1 — Base Case (n = 1):",
    "   LHS = 2¹ = 2",
    "   RHS = 1",
    "   2 > 1  ✔",
    "",
    "STEP 2 — IH:  Assume 2ᵏ > k  for some k ≥ 1.",
    "",
    "STEP 3 — Show 2^(k+1) > k + 1:",
    "   2^(k+1) = 2 · 2ᵏ",
    "           > 2 · k         [by IH, 2ᵏ > k]",
    "           = 2k",
    "           = k + k",
    "           ≥ k + 1         [since k ≥ 1]",
    "   ∴ 2^(k+1) > k + 1  ✔",
    "",
    "CONCLUSION: 2ⁿ > n for all n ≥ 1.  □",
])

section("1.3", "Principles of Structural Induction")
body(
    "<b>Structural induction</b> is used to prove a property P holds for all elements of a "
    "<i>recursively defined data type</i>.",
    "Unlike mathematical induction (over integers), structural induction mirrors the recursive "
    "definition of the structure itself."
)
proof_box("Two Steps of Structural Induction", [
    "Step 1 — BASE CASE:  Prove P for the 'base cases' of the definition.",
    "Step 2 — INDUCTIVE STEP:  Prove P for the result of any combination rule,",
    "                           ASSUMING it is true for all the parts (sub-structures).",
])

subsection("Recursive Definition Examples from the Handout")
body("The handout gives three standard recursive definitions:")

example_box("Recursive Definition 1 – Even Numbers", [
    "E is defined as:",
    "  1.  0 ∈ E                          (base case)",
    "  2.  if n ∈ E  then  n + 2 ∈ E     (combination)",
    "  3.  if n ∈ E  then  -n ∈ E        (combination)",
    "",
    "Consequence: E = {…, -4, -2, 0, 2, 4, …} = the set of ALL even integers.",
], C_BG1)

example_box("Recursive Definition 2 – Non-empty Binary Tree", [
    "A non-empty binary tree T is either:",
    "  1.  A single root node r,  OR",
    "  2.  A root node r connected (by an edge) to the root(s) of one or two",
    "      non-empty binary trees TL and/or TR.",
], C_BG2)

example_box("Recursive Definition 3 – Fully Bracketed Arithmetic Expression", [
    "A fully bracketed arithmetic expression E over {[, ], +, -, *, x} is either:",
    "  1.  The symbol 0, 1, or x                          (base cases)",
    "  2.  [e + e']  where e, e' are such expressions",
    "  3.  [e * e']  where e, e' are such expressions",
], C_BG4)

# ─── Structural Induction Proof 1 (Binary Tree) ───────────────────────────
subsection("Structural Induction Proof 1: |V| = |E| + 1 for any non-empty binary tree")
body("Claim: For any non-empty binary tree T = (V, E),  the number of vertices equals "
     "the number of edges plus one:  |V| = |E| + 1")
proof_box("Proof by Structural Induction on T = (V, E)", [
    "Let P(T) be the property  |V| = |E| + 1.",
    "",
    "BASE CASE — T is a single root node:",
    "   |V| = 1  (just the root)",
    "   |E| = 0  (no edges)",
    "   1 = 0 + 1  ✔",
    "",
    "INDUCTIVE STEP:",
    "Suppose T = (V,E) has root r connected to:",
    "  • The root rL of tree TL = (VL, EL)     [always present]",
    "  • Possibly the root rR of tree TR = (VR, ER)",
    "",
    "Induction Hypothesis: P(TL) and P(TR) both hold, i.e.",
    "   |VL| = |EL| + 1   and   |VR| = |ER| + 1",
    "",
    "Case A – T has only TL (one child):",
    "   |V| = |VL| + 1                [r + all nodes of TL]",
    "        = (|EL| + 1) + 1         [by IH on TL]",
    "        = |EL| + 2",
    "   |E| = |EL| + 1                [edges of TL + edge (r, rL)]",
    "   ∴ |V| = |EL| + 2 = (|EL| + 1) + 1 = |E| + 1  ✔",
    "",
    "Case B – T has both TL and TR (two children):",
    "   |V| = |VL| + |VR| + 1",
    "        = (|EL|+1) + (|ER|+1) + 1   [by IH]",
    "        = |EL| + |ER| + 3",
    "   |E| = |EL| + |ER| + 2            [edges of TL + edges of TR + 2 new edges]",
    "   ∴ |V| = |EL| + |ER| + 3 = (|EL| + |ER| + 2) + 1 = |E| + 1  ✔",
    "",
    "In both cases P(T) holds.  By structural induction, P(T) is true for EVERY",
    "non-empty binary tree T.  □",
])

# ─── Structural Induction Proof 2 (Even Numbers) ─────────────────────────
subsection("Structural Induction Proof 2: Every element of E is of the form 2x, x ∈ ℤ")
proof_box("Proof by Structural Induction on even number e", [
    "Let P(e) be the property: e = 2x for some integer x ∈ ℤ.",
    "",
    "BASE CASE — e = 0:",
    "   0 = 2 · 0  and  0 ∈ ℤ  ✔",
    "",
    "INDUCTIVE STEP:  Two cases from the recursive definition.",
    "",
    "IH: Assume P(e') holds, i.e. e' = 2x' for some x' ∈ ℤ.",
    "",
    "Case 1 — e = e' + 2:",
    "   e = e' + 2 = 2x' + 2 = 2(x' + 1) = 2x",
    "   where x = x' + 1 ∈ ℤ (since x' ∈ ℤ)  ✔",
    "",
    "Case 2 — e = -e':",
    "   e = -e' = -(2x') = 2(-x') = 2x",
    "   where x = -x' ∈ ℤ (since x' ∈ ℤ)  ✔",
    "",
    "Therefore, for every even number e, P(e) holds.",
    "Hence  E = {2x | x ∈ ℤ}  (the set of all even integers).  □",
])

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════════
#  CHAPTER 2 — BOOLEAN ALGEBRA
# ════════════════════════════════════════════════════════════════════════════
chapter(2, "BOOLEAN ALGEBRA")

section("2.1", "Overview & Postulates")
body(
    "<b>Boolean logic</b> forms the basis for computation in modern binary computers. "
    "Any algorithm or circuit can be represented using Boolean equations.",
    "<b>Boolean algebra</b> is a deductive mathematical system closed over {0, 1} (False, True).",
    "A <i>binary operator</i> accepts two Boolean inputs and produces one Boolean output."
)
body("The fundamental <b>postulates</b> of Boolean algebra are:")

postulates = [
    ["(a)", "x + y = y + x", "+ is commutative"],
    ["(b)", "x · y = y · x", "· is commutative"],
    ["(c)", "(x+y)+z = x+(y+z)", "+ is associative"],
    ["(d)", "(x·y)·z = x·(y·z)", "· is associative"],
    ["(e)", "x+(y·z) = (x+y)·(x+z)", "+ distributes over ·"],
    ["(f)", "x·(y+z) = (x·y)+(x·z)", "· distributes over +"],
    ["(g)", "0 + x = x", "0 is identity for +"],
    ["(h)", "1 · x = x", "1 is identity for ·"],
    ["(i)", "x + x̄ = 1", "complement law for +"],
    ["(j)", "x · x̄ = 0", "complement law for ·"],
    ["(k)", "x + x = x", "idempotent law for +"],
    ["(l)", "x · x = x", "idempotent law for ·"],
    ["(m)", "x·(x+y) = x", "absorption law"],
    ["(n)", "x+(x·y) = x", "absorption law"],
    ["(o)", "0 · x = 0", "zero property"],
    ["(p)", "1 + x = 1", "one property"],
    ["(q)", "x̄+ȳ = x̄·ȳ", "de Morgan's law"],
    ["(r)", "x̄·ȳ = x̄+ȳ", "de Morgan's law"],
    ["(s)", "x̄̄ = x", "double complement law"],
    ["(t)", "(x·y)+(x·ȳ) = x", "consensus"],
    ["(u)", "(x+y)·(x+ȳ) = x", "consensus"],
]
hdr = [H("<b>ID</b>", mkStyle('ph', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
       H("<b>Law</b>", mkStyle('ph', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
       H("<b>Name</b>", mkStyle('ph', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white))]
p_data = [hdr] + [[H(a, MONO), H(b, MONO), H(c, BODY)] for a,b,c in postulates]
p_t = Table(p_data, colWidths=[1.2*cm, 7.5*cm, W-8.7*cm])
p_t.setStyle(TableStyle([
    ('BACKGROUND',  (0,0), (-1,0),  C_BLUE),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, C_BG1]),
    ('GRID',        (0,0), (-1,-1),  0.5, colors.grey),
    ('FONTSIZE',    (0,0), (-1,-1),  9),
    ('TOPPADDING',  (0,0), (-1,-1),  3),
    ('BOTTOMPADDING',(0,0),(-1,-1),  3),
    ('LEFTPADDING', (0,0), (-1,-1),  4),
]))
story.append(p_t)
story.append(SP(6))

section("2.2", "Truth Tables")
body(
    "In Boolean logic only two values exist: <b>True (1)</b> and <b>False (0)</b>.",
    "A truth table lists ALL possible combinations of input values and the resulting output.",
    "For n variables, there are <b>2ⁿ rows</b> in the truth table."
)
truth_table(
    [H("<b>n vars</b>",MONO), H("<b>Rows needed</b>",MONO)],
    [[H("1",MONO),H("2",MONO)],
     [H("2",MONO),H("4",MONO)],
     [H("3",MONO),H("8",MONO)],
     [H("4",MONO),H("16",MONO)]],
    "Number of rows required"
)

section("2.3", "Logical Operators – All Truth Tables")

subsection("1. Conjunction (AND) — x ∧ y")
body("Output is TRUE <b>only when both</b> inputs are TRUE.")
truth_table(
    [H("<b>x</b>",MONO),H("<b>y</b>",MONO),H("<b>x ∧ y</b>",MONO)],
    [["0","0","0"],["0","1","0"],["1","0","0"],["1","1","1"]]
)
body("Laws from AND:", "  (i) x∧y ≡ y∧x  (commutative)",
     "  (ii) x∧1 ≡ x", "  (iii) x∧0 ≡ 0", "  (iv) x∧x ≡ x  (idempotent)")

subsection("2. Disjunction (OR) — x ∨ y")
body("Output is FALSE <b>only when both</b> inputs are FALSE.")
truth_table(
    [H("<b>x</b>",MONO),H("<b>y</b>",MONO),H("<b>x ∨ y</b>",MONO)],
    [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","1"]]
)
body("Laws from OR:", "  (i) x∨y ≡ y∨x  (commutative)",
     "  (ii) x∨1 ≡ 1", "  (iii) x∨0 ≡ x", "  (iv) x∨x ≡ x  (idempotent)")

subsection("3. Equivalence (XNOR) — x ↔ y")
body("Output is TRUE when both inputs are <b>equal</b>.")
truth_table(
    [H("<b>x</b>",MONO),H("<b>y</b>",MONO),H("<b>x ↔ y</b>",MONO)],
    [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","1"]]
)

subsection("4. Implication — x → y")
body("Output is FALSE <b>only when</b> x is TRUE and y is FALSE.")
truth_table(
    [H("<b>x</b>",MONO),H("<b>y</b>",MONO),H("<b>x → y</b>",MONO)],
    [["0","0","1"],["0","1","1"],["1","0","0"],["1","1","1"]]
)

subsection("5. Negation / NOT — ¬x")
body("Unary operator. Reverses the truth value.")
truth_table(
    [H("<b>x</b>",MONO),H("<b>¬x</b>",MONO)],
    [["0","1"],["1","0"]]
)

section("2.4 & 2.5", "Simplification of Boolean Functions")
body(
    "Boolean simplification reduces circuits to equivalent ones with <i>fewer components</i>, "
    "increasing reliability and reducing cost.",
    "The <b>algebraic method</b> applies the postulates/laws step by step."
)

subsection("Example 1 (from handout): Simplify A ∨ A·B")
proof_box("Solution", [
    "A ∨ A·B",
    "= A·(1 ∨ B)        [factor out A]",
    "= A·1               [Law of 1 for disjunction: 1∨B = 1]",
    "= A                 [identity: A·1 = A]",
    "",
    "Result: A ∨ A·B  =  A   ✔",
])

subsection("Example 2 (from handout): Simplify (A ∨ B)(A ∨ C)")
proof_box("Solution", [
    "(A ∨ B)(A ∨ C)",
    "= A·A ∨ A·C ∨ B·A ∨ B·C    [distributive property, expand]",
    "= A ∨ A·C ∨ B·A ∨ B·C      [idempotent: A·A = A]",
    "= A ∨ B·C                   [absorption: A∨A·C = A  and  A∨B·A = A]",
    "",
    "Result: (A ∨ B)(A ∨ C)  =  A ∨ BC   ✔",
])

subsection("Example 3 (Extra): Simplify AB + A̅B + AB̅")
proof_box("Solution", [
    "AB + A'B + AB'",
    "= B(A + A') + AB'     [factor B from first two terms]",
    "= B·1 + AB'           [complement law: A + A' = 1]",
    "= B + AB'             [identity: B·1 = B]",
    "= B + A               [absorption: B + AB' = B + A  since B + B' = 1]",
    "",
    "Verification by truth table (A=0,B=0: 0+0+0=0; A=0,B=1: 0+1+0=1;",
    "  A=1,B=0: 0+0+1=1; A=1,B=1: 1+0+0=1) → same as A+B  ✔",
])

section("2.6", "Karnaugh Maps (K-Maps)")
body(
    "A <b>Karnaugh map (K-map)</b> is a pictorial method for simplifying Boolean expressions. "
    "It avoids the need to remember all algebraic laws.",
    "Adjacent cells differ in <b>exactly one bit</b> (Gray code ordering).",
    "Cells are grouped in powers of 2 (1, 2, 4, 8, …) to find prime implicants."
)
body("<b>Key Rules for Grouping:</b>")
rule("Groups must be rectangular and contain 2ⁱ cells (i ≥ 1).")
rule("Groups may wrap around edges (the map is a torus).")
rule("Larger groups give simpler (fewer literals) product terms.")
rule("Use the FEWEST groups to cover all 1-cells (for SOP) or 0-cells (for POS).")
warn("A diagonal grouping or groups of 3, 5, 6, 7 are INVALID.")

body("<b>Resulting Product Term from a Group:</b>")
body("• If variable X = 0 for ALL cells in the group → include X' in the term.")
body("• If variable X = 1 for ALL cells in the group → include X in the term.")
body("• If variable X changes (0 and 1) within the group → X is ELIMINATED.")

subsection("Worked K-map Example 1 (SOP from handout, map X)")
proof_box("Given map X — 4-variable (A,B,C,D):", [
    "Reading the 1-cells and grouping (as shown in handout):",
    "",
    "Group 1:  A·B cells          → product term: A·B",
    "Group 2:  A'·B'·D' cells     → product term: A'·B'·D'",
    "Group 3:  A'·B'·C cells      → product term: A'·B'·C",
    "Group 4:  B·C·D' cells       → product term: B·C·D'",
    "",
    "SOP Result:  X = A·B + A'·B'·D' + A'·B'·C + B·C·D'",
])

subsection("Worked K-map Example 2 (SOP from handout, map Y)")
proof_box("Given map Y:", [
    "Group 1:  A'·C' cells        → product term: A'·C'",
    "Group 2:  A·C·D' cells       → product term: A·C·D'",
    "Group 3:  A·B·C cells        → product term: A·B·C",
    "Group 4:  B·C'·D' cells      → product term: B·C'·D'",
    "",
    "SOP Result:  Y = A'·C' + A·C·D' + A·B·C + B·C'·D'",
])

subsection("Worked K-map Example 3 (POS from handout)")
proof_box("Product-of-Sums: group the 0-cells instead of the 1-cells", [
    "Given map Z (3-variable example from handout):",
    "0-cells are at positions where the output = 0.",
    "",
    "Group M3 and M7 (both zero cells):",
    "  M3·M7 = (A+B'+C')·(A'+B'+C')",
    "        = (A·A') + (B'+C')        [by distribution]",
    "        = 0 + (B'+C')",
    "        = B' + C'",
    "",
    "POS Result:  Z = B' + C'",
    "",
    "Verification from the example in the handout also shows:",
    "  Z = (A+D')·(B'+C+D)·(A'+B+C'+D)",
])

section("2.7", "Logic Gates – All Seven Basic Gates")

gates = [
    ("AND Gate",
     "Output = 1 ONLY when BOTH inputs are 1. (Acts like logical AND)",
     [["0","0","0"],["0","1","0"],["1","0","0"],["1","1","1"]]),
    ("OR Gate",
     "Output = 1 when AT LEAST ONE input is 1. (Acts like logical OR)",
     [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","1"]]),
    ("XOR Gate (Exclusive-OR)",
     "Output = 1 when inputs are DIFFERENT. Output = 0 when inputs are SAME.",
     [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","0"]]),
    ("NOT Gate (Inverter)",
     "Unary gate. Output is the COMPLEMENT of input.",
     None),   # special case
    ("NAND Gate",
     "AND followed by NOT. Output = 0 ONLY when both inputs are 1.",
     [["0","0","1"],["0","1","1"],["1","0","1"],["1","1","0"]]),
    ("NOR Gate",
     "OR followed by NOT. Output = 1 ONLY when both inputs are 0.",
     [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","0"]]),
    ("XNOR Gate (Exclusive-NOR)",
     "XOR followed by NOT. Output = 1 when inputs are SAME.",
     [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","1"]]),
]

for name, desc, rows in gates:
    subsection(name)
    body(desc)
    if rows:
        truth_table(
            [H("<b>In 1</b>",MONO),H("<b>In 2</b>",MONO),H("<b>Out</b>",MONO)],
            rows
        )
    else:  # NOT gate
        truth_table(
            [H("<b>Input</b>",MONO),H("<b>Output</b>",MONO)],
            [["0","1"],["1","0"]]
        )

body("Arrays of logic gates form <b>Integrated Circuits (ICs)</b>. As IC technology advances, "
     "gates shrink, enabling more complex operations at higher speeds.")

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════════
#  CHAPTER 3 — PROPOSITIONAL LOGIC
# ════════════════════════════════════════════════════════════════════════════
chapter(3, "PROPOSITIONAL LOGIC")

body(
    "Propositional logic (also called <b>sentential/statement logic</b>) deals with logical "
    "relationships between propositions taken as wholes.",
    "A <b>proposition</b> is a statement that is either TRUE or FALSE (never both, never neither).",
    "Propositional logic is interested in how the truth value of <i>compound claims</i> depends "
    "on the truth values of individual claims."
)

defn("Proposition", "A declarative statement with a definite truth value (T or F).")
defn("Non-proposition", "Statements with pronouns/variables like 'n is prime' or 'He is president' — "
     "not decidable until the variable is specified.")

subsection("Negation")
body("Given proposition p, its negation ~p always has the OPPOSITE truth value.",
     "Example: P2 = 'It is raining' → ~P2 = 'It is not raining'")

subsection("Connectives (Compound Propositions)")
body("Simple propositions are combined using <b>connectives</b>:")
example_box("Simple and Compound Proposition Examples", [
    "p1: It is raining.",
    "p2: I am wet.",
    "",
    "p3 = p1 ∧ p2 :  It is raining AND I am wet.   (conjunction)",
    "p4 = p1 ∨ p2 :  It is raining OR I am wet.    (disjunction)",
    "p5 = p1 ∧ ¬p2:  It is raining AND I am NOT wet.",
], C_BG1)

section("3.1", "Language of Propositional Logic")
body(
    "The language Lv is built from:",
    "  1. Propositional variables (uppercase letters A, B, C, P, Q, R, …)",
    "  2. Five connectives:  ¬ (NOT),  ∨ (OR),  ∧ (AND),  → (IMPLIES),  ↔ (IFF)",
    "  3. Parentheses ( and )"
)

defn("Propositional Formula", "A well-formed expression built by the grammar:")
body("  • Any variable V is a formula.",
     "  • If F is a formula, so is (¬F).",
     "  • If F and G are formulas, so are (F∨G), (F∧G), (F→G), (F↔G).")

subsection("Formation Trees")
body("A <b>formation tree</b> shows how a formula is built from its components. "
     "Bottom nodes are always propositional variables.")

example_box("Formation Tree Example: ((A⇒B)∧(B∨C)) ⇒ (A∨C)) ⇒ ¬(B∨D)", [
    "The main connective is the outer ⇒.",
    "Left sub-tree: ((A⇒B)∧(B∨C)) ⇒ (A∨C)",
    "Right sub-tree: ¬(B∨D)",
    "",
    "Abbreviated tree replaces each formula node with its main connective symbol.",
    "Bottom nodes remain as variable letters (A, B, C, D).",
])

subsection("Subformulas")
body("A <b>subformula</b> of formula P is any formula appearing as a node in P's formation tree.")
example_box("Subformulas of (P∧Q) ∨ ¬(P∧Q)", [
    "1.  (P∧Q) ∨ ¬(P∧Q)   [the whole formula]",
    "2.  P∧Q",
    "3.  ¬(P∧Q)",
    "4.  P",
    "5.  Q",
])

section("3.2", "Truth Valuation")
body(
    "A <b>truth assignment</b> M maps each variable to T or F:  M : V → {T, F}",
    "The unique extension VM : FV → {T,F} satisfies:"
)
example_box("Valuation Rules", [
    "1.  VM(A) = M(A)                                     [variables]",
    "2.  VM(¬P) = T  iff  VM(P) = F                      [negation]",
    "3.  VM(P∨Q) = T  iff  VM(P)=T or VM(Q)=T            [disjunction]",
    "4.  VM(P∧Q) = T  iff  VM(P)=T and VM(Q)=T           [conjunction]",
    "5.  VM(P→Q) = T  iff  VM(P)=F or VM(Q)=T            [implication]",
    "6.  VM(P↔Q) = T  iff  VM(P) = VM(Q)                 [equivalence]",
], C_BG2)

subsection("Worked Valuation Example (from handout)")
body("Formula P = ((A∧B) ↔ (A∨¬C))")
proof_box("Case (a): M(A)=T, M(B)=T, M(C)=F", [
    "VM(¬C) = T             [since M(C)=F]",
    "VM(A∨¬C) = T           [T ∨ T = T]",
    "VM(A∧B) = T            [T ∧ T = T]",
    "VM(P) = VM(T ↔ T) = T  [same truth values]  ✔",
])
proof_box("Case (b): M(A)=T, M(B)=F, M(C)=T", [
    "VM(¬C) = F             [since M(C)=T]",
    "VM(A∨¬C) = T           [T ∨ F = T]",
    "VM(A∧B) = F            [T ∧ F = F]",
    "VM(P) = VM(F ↔ T) = F  [different truth values]",
])

section("3.3", "Satisfiability of Formulae")
defn("Satisfiable", "Set S is satisfiable if there EXISTS a truth assignment M that makes "
     "every formula in S true simultaneously.")
defn("Unsatisfiable", "No truth assignment makes all formulae in S true.")

proof_box("Case (a) – Satisfiable Example", [
    "S = { (A∧B)⇒C,  A↔B,  (C∨A)∨B }",
    "",
    "Try M: M(A)=T, M(B)=T, M(C)=T",
    "  (A∧B)⇒C : T∧T⇒T = T⇒T = T  ✔",
    "  A↔B      : T↔T = T           ✔",
    "  (C∨A)∨B  : T∨T∨T = T        ✔",
    "",
    "All formulas are TRUE → S is SATISFIABLE.  M(A)=M(B)=M(C)=T satisfies S.",
])
proof_box("Case (b) – Unsatisfiable Example", [
    "S = { A⇒(B∨C),  ¬(A⇒B),  A↔¬C }",
    "",
    "Try M(A)=T:",
    "  A↔¬C requires ¬C=T → M(C)=F",
    "  A⇒(B∨C): T⇒(B∨F) = T⇒B, so we need M(B)=T",
    "  ¬(A⇒B) : ¬(T⇒T) = ¬T = F  ← CONTRADICTION",
    "",
    "Try M(A)=F:",
    "  ¬(A⇒B) : ¬(F⇒B) = ¬T = F  ← CONTRADICTION (regardless of B)",
    "",
    "No truth assignment makes all formulas true → S is UNSATISFIABLE.",
])

section("3.4", "Tautologies, Contradictions and Contingencies")
defn("Tautology", "A formula that is TRUE under EVERY possible truth assignment.")
defn("Contradiction", "A formula that is FALSE under EVERY possible truth assignment.")
defn("Contingency", "A formula that is NEITHER a tautology nor a contradiction.")

subsection("Tautology Laws")
body("If t is a tautology, c is a contradiction, p is any proposition:")
example_box("Tautology Laws", [
    "p ∧ t ≡ p",
    "p ∨ t ≡ t        (NOT p, because: t is always TRUE, so p∨t is always TRUE)",
    "¬t ≡ c",
], C_BG3)
example_box("Contradiction Laws", [
    "p ∧ c ≡ c",
    "p ∨ c ≡ p",
    "¬c ≡ t",
], C_BG5)

subsection("Truth Table Verification: p ∨ ¬p (Tautology) and p ∧ ¬p (Contradiction)")
truth_table(
    [H("<b>p</b>",MONO),H("<b>¬p</b>",MONO),H("<b>p∨¬p</b>",MONO),H("<b>p∧¬p</b>",MONO)],
    [["T","F","T","F"],["F","T","T","F"]],
    "p∨¬p is always T (tautology); p∧¬p is always F (contradiction)"
)

subsection("Worked Example: Show p ∨ (q ∨ ¬p) is a Tautology")
proof_box("Method 1 – Truth Table", [
    "p | q | ¬p | q∨¬p | p∨(q∨¬p)",
    "T | T |  F |  T   |    T",
    "T | F |  F |  F   |    T",
    "F | T |  T |  T   |    T",
    "F | F |  T |  T   |    T",
    "",
    "All rows give TRUE → it is a TAUTOLOGY.  ✔",
])
proof_box("Method 2 – Algebraic (from handout)", [
    "p ∨ (q ∨ ¬p)",
    "≡ p ∨ (¬p ∨ q)      [commutative]",
    "≡ (p ∨ ¬p) ∨ q      [associative]",
    "≡ t ∨ q              [p∨¬p = tautology t]",
    "≡ t                  [t∨q = t  by domination]",
    "",
    "Therefore p ∨ (q ∨ ¬p) is a tautology.  □",
])

section("3.5", "Logical Equivalence")
body("Propositions r and s are <b>logically equivalent</b> (written r ≡ s or r ⟺ s) if and only if "
     "r ↔ s is a <i>tautology</i>, i.e. they have the SAME truth value in EVERY assignment.")

subsection("Important Logical Equivalences to MEMORISE")
equiv_list = [
    ("(a)","P∨q ≡ q∨P","∨ is commutative"),
    ("(b)","P∧q ≡ q∧P","∧ is commutative"),
    ("(c)","(P∨q)∨r ≡ P∨(q∨r)","∨ is associative"),
    ("(d)","(P∧q)∧r ≡ P∧(q∧r)","∧ is associative"),
    ("(e)","P∨(q∧r) ≡ (P∨q)∧(P∨r)","∨ distributes over ∧"),
    ("(f)","P∧(q∨r) ≡ (P∧q)∨(P∧r)","∧ distributes over ∨"),
    ("(g)","F∨P ≡ P","Identity law (F = False)"),
    ("(h)","T∧P ≡ P","Identity law (T = True)"),
    ("(i)","P∨P ≡ P","Idempotent law for ∨"),
    ("(j)","P∧P ≡ P","Idempotent law for ∧"),
    ("(k)","P∧(P∨q) ≡ P","Absorption law"),
    ("(l)","P∨(P∧q) ≡ P","Absorption law"),
    ("(m)","F∧P ≡ F","Domination law"),
    ("(n)","T∨P ≡ T","Domination law"),
    ("(o)","¬(P∨q) ≡ ¬P∧¬q","De Morgan's law"),
    ("(p)","¬(P∧q) ≡ ¬P∨¬q","De Morgan's law"),
    ("(q)","P→q ≡ ¬P∨q","Implication law"),
    ("(r)","P→q ≡ ¬q→¬P","Contrapositive law"),
    ("(s)","P∨¬P ≡ T","Tautology"),
    ("(t)","P∧¬P ≡ F","Contradiction"),
    ("(u)","(P→q)∧(q→P) ≡ P↔q","Equivalence"),
]
eq_hdr = [H("<b>#</b>",mkStyle('eh',fontName='Helvetica-Bold',fontSize=9,textColor=colors.white)),
          H("<b>Equivalence</b>",mkStyle('eh',fontName='Helvetica-Bold',fontSize=9,textColor=colors.white)),
          H("<b>Law Name</b>",mkStyle('eh',fontName='Helvetica-Bold',fontSize=9,textColor=colors.white))]
eq_data = [eq_hdr]+[[H(a,MONO),H(b,MONO),H(c,BODY)] for a,b,c in equiv_list]
eq_t = Table(eq_data, colWidths=[0.8*cm, 8*cm, W-8.8*cm])
eq_t.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,0),  C_PURPLE),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, C_BG2]),
    ('GRID',         (0,0),(-1,-1),  0.5, colors.grey),
    ('FONTSIZE',     (0,0),(-1,-1),  9),
    ('TOPPADDING',   (0,0),(-1,-1),  3),
    ('BOTTOMPADDING',(0,0),(-1,-1),  3),
    ('LEFTPADDING',  (0,0),(-1,-1),  4),
]))
story.append(eq_t)
story.append(SP(6))

subsection("Worked Equivalence Example 1 (from handout): Show (p→q)∧(q→p) ≡ p↔q")
proof_box("Method – Truth Table", [
    "p | q | p→q | q→p | (p→q)∧(q→p) | p↔q",
    "T | T |  T  |  T  |      T       |  T",
    "T | F |  F  |  T  |      F       |  F",
    "F | T |  T  |  F  |      F       |  F",
    "F | F |  T  |  T  |      T       |  T",
    "",
    "Columns 5 and 6 are identical → (p→q)∧(q→p) ≡ p↔q  ✔  □",
])

subsection("Worked Equivalence Example 2 (from handout): Show (p∧q)→p is a tautology")
proof_box("Algebraic Proof", [
    "(p∧q)→p",
    "≡ ¬(p∧q) ∨ p          [implication law: A→B ≡ ¬A∨B]",
    "≡ (¬p∨¬q) ∨ p          [De Morgan]",
    "≡ (¬q∨¬p) ∨ p          [commutative]",
    "≡ ¬q ∨ (¬p ∨ p)        [associative]",
    "≡ ¬q ∨ T               [¬p∨p = T]",
    "≡ T                    [domination: T∨anything = T]",
    "",
    "∴ (p∧q)→p is a TAUTOLOGY.  □",
])

subsection("Worked Equivalence Example 3 (from handout): Show (p→q) ≡ (¬q→¬p)")
proof_box("Algebraic Proof (Contrapositive)", [
    "(¬q → ¬p)",
    "≡ ¬(¬q) ∨ (¬p)         [implication law]",
    "≡ q ∨ (¬p)             [double negation: ¬¬q = q]",
    "≡ ¬p ∨ q               [commutative]",
    "≡ p → q                [implication law: ¬p∨q = p→q]",
    "",
    "∴ (p→q) ≡ (¬q→¬p)  (Contrapositive Law)  □",
])

section("3.6", "Conjunctive Normal Form (CNF)")
defn("Literal", "An atom p or its negation ¬p.")
defn("Clause", "A disjunction of one or more literals:  l₁ ∨ l₂ ∨ … ∨ lₙ")
defn("CNF (Conjunctive Normal Form)", "A conjunction of clauses: (c₁) ∧ (c₂) ∧ … ∧ (cₙ), "
     "where each cᵢ is a clause.")

example_box("Examples of Clauses", [
    "• P             (single literal)",
    "• ¬p",
    "• p ∨ q",
    "• p ∨ ¬r ∨ ¬s",
])
example_box("CNF vs. Non-CNF", [
    "IN CNF:      (¬p∨q∨r) ∧ (¬q∨r) ∧ (¬r)",
    "NOT in CNF:  (¬p∨q∨r) ∧ ((p∧¬q)∨r) ∧ (¬r)   [middle clause is not a disjunction of literals]",
    "NOT in CNF:  (¬p∨q∨r) ∧ ¬(¬q∨r) ∧ (¬r)      [¬(...) inside is not a literal]",
])

body("<b>Transformation Algorithm to CNF:</b>")
body("  Step 1: Eliminate implications:  A→B  ≡  ¬A ∨ B",
     "  Step 2: Push negations inward using De Morgan: ¬(A∧B) ≡ ¬A∨¬B  and  ¬(A∨B) ≡ ¬A∧¬B",
     "  Step 3: Eliminate double negations:  ¬¬A ≡ A",
     "  Step 4: Distribute ∨ over ∧:  A∨(B∧C) ≡ (A∨B)∧(A∨C)")

subsection("Worked CNF Example (from handout): Convert (¬p→¬q)→(p→q) to CNF")
proof_box("Solution – Step by Step", [
    "Starting: (¬p→¬q) → (p→q)",
    "",
    "Step 1 – Eliminate implications (A→B ≡ ¬A∨B):",
    "   Inner: ¬p→¬q ≡ ¬(¬p)∨¬q = p∨¬q",
    "   Inner: p→q   ≡ ¬p∨q",
    "   Outer: (p∨¬q) → (¬p∨q)",
    "        ≡ ¬(p∨¬q) ∨ (¬p∨q)    [implication law]",
    "",
    "Step 2 – Push negation inward:",
    "   ¬(p∨¬q) ≡ ¬p ∧ ¬(¬q) = ¬p ∧ q    [De Morgan]",
    "   So: (¬p ∧ q) ∨ (¬p ∨ q)",
    "",
    "Step 3 – No double negations remain.",
    "",
    "Step 4 – Distribute ∨ over ∧:",
    "   (¬p ∧ q) ∨ (¬p ∨ q)",
    "   = (¬p ∨ (¬p ∨ q)) ∧ (q ∨ (¬p ∨ q))    [A∨(B∧C) = (A∨B)∧(A∨C)]",
    "   = (¬p ∨ ¬p ∨ q) ∧ (q ∨ ¬p ∨ q)        [associative]",
    "   = (¬p ∨ q) ∧ (¬p ∨ q)                  [idempotent: ¬p∨¬p=¬p, q∨q=q]",
    "   = (¬p ∨ q)                              [idempotent on the whole clause]",
    "",
    "CNF Result:  (¬p ∨ q)   ✔",
    "",
    "Note: This is also equivalent to p → q, confirming the formula simplifies nicely.",
])

subsection("Validity Testing with CNF")
body("A formula in CNF is <b>valid (tautology)</b> if every clause contains both a literal and "
     "its negation (i.e. contains Lᵢ ∨ ¬Lᵢ for some Lᵢ).")
example_box("Validity Examples", [
    "1.  ¬p ∨ q ∨ p ∨ r      → VALID  (contains p and ¬p)",
    "2.  (¬p ∨ q ∨ p) ∧ (r ∨ ¬r) → VALID  (each clause has complement pair)",
    "3.  (¬p ∨ q ∨ p) ∧ (r ∨ s)  → NOT VALID  (second clause has no complement pair)",
])

section("3.7", "Natural Deduction")
body(
    "<b>Natural deduction</b> is used to prove the validity of a sequent Γ ⊢ S.",
    "We assume all formulas in Γ are true, then apply rules to derive S.",
    "The goal is to show: <i>if the premises are true, the conclusion must also be true</i>."
)

rules_nd = [
    ("Modus Ponens (MP / E⇒)",
     "If A⇒B and A are both true, then B is true.",
     ["  m  A ⇒ B", "  n  A", "  ─────────", "       B       E⇒ m,n"]),
    ("Modus Tollens (MT)",
     "If A→B and ¬B, then ¬A.",
     ["  n  A → B", "  m  ¬B", "  ─────────", "       ¬A      MT n,m"]),
    ("Hypothetical Syllogism (HS)",
     "If A→B and B→C, then A→C. (Transitivity of implication / chain rule)",
     ["  n  A → B", "  m  B → C", "  ─────────", "       A → C   HS n,m"]),
    ("Disjunctive Syllogism (DS)",
     "If A∨B and ¬A, then B.",
     ["  n  A ∨ B", "  m  ¬A", "  ─────────", "       B       DS n,m"]),
    ("Disjunction Introduction (∨I)",
     "If A is true, then A∨B is true (for ANY B).",
     ["  n  A", "  ─────────", "       A ∨ B   ∨I n"]),
    ("Disjunction Elimination (∨E)",
     "If P→Q and R→Q and P∨R, then Q.",
     ["  n1  P → Q", "  n2  R → Q", "  n3  P ∨ R", "  ─────────", "        Q     ∨E"]),
    ("Negation Introduction (¬I / Reductio ad Absurdum)",
     "Assume A; if you derive both B and ¬B (contradiction), then ¬A.",
     ["  m  | A      H (hypothesis)", "  n  | B", "  p  | ¬B     I¬ m,n,p", "  ─────────────", "       ¬A"]),
    ("Negation Elimination (¬E / Double Negation)",
     "¬¬A implies A.",
     ["  n  ¬¬A", "  ─────────", "       A     E¬ n"]),
]

for rname, rdesc, rlines in rules_nd:
    subsection(rname)
    body(rdesc)
    proof_box(f"Rule: {rname}", rlines, C_BG4)

subsection("Worked Natural Deduction Example 1 (from handout): Prove B from A∨B, ¬A")
proof_box("Proof", [
    "Given: A∨B, ¬A     Goal: B",
    "",
    "1.  A ∨ B          (Premise)",
    "2.  ¬A             (Premise)",
    "3.  B              DS 1,2  [Disjunctive Syllogism: A∨B and ¬A → B]",
    "",
    "∴ B is proven.  □",
])

subsection("Worked Natural Deduction Example 2 (Extra): Prove ¬A from A→B, ¬B")
proof_box("Proof", [
    "Given: A→B, ¬B     Goal: ¬A",
    "",
    "1.  A → B          (Premise)",
    "2.  ¬B             (Premise)",
    "3.  ¬A             MT 1,2  [Modus Tollens]",
    "",
    "∴ ¬A is proven.  □",
])

subsection("Worked Natural Deduction Example 3 (Extra): Prove A→C from A→B, B→C")
proof_box("Proof", [
    "Given: A→B, B→C    Goal: A→C",
    "",
    "1.  A → B          (Premise)",
    "2.  B → C          (Premise)",
    "3.  A → C          HS 1,2  [Hypothetical Syllogism]",
    "",
    "∴ A→C is proven.  □",
])

section("3.8", "Limitations of Propositional Logic")
body(
    "In propositional logic, the <b>internal structure</b> of basic propositions is hidden.",
    "For example: 'John is a science student' is just p — we cannot reason about 'John' as "
    "an object or 'science student' as a property.",
    "This motivates <b>Predicate Logic</b> (Chapter 4), which exposes that internal structure."
)

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════════
#  CHAPTER 4 — PREDICATE LOGIC
# ════════════════════════════════════════════════════════════════════════════
chapter(4, "PREDICATE LOGIC")

body(
    "Predicate logic (First-Order Logic, FOL) extends propositional logic by exposing the "
    "<b>internal structure</b> of propositions: objects, properties, and relations.",
    "It adds <b>quantifiers</b> ∀ (for all) and ∃ (there exists) to express statements "
    "about quantities of objects.",
    "Predicate logic incorporates all propositional connectives: ∨, ∧, →, ↔, plus quantifiers."
)

defn("Constant", "A 'proper name' for a specific object: a, b, c, j (for John), m (for Mary), …")
defn("Variable", "Represents indefinite objects: x, y, z, …")
defn("Predicate (n-place)", "A property or relation applied to n objects. Written as a capital letter.")

body("<b>Types of predicates:</b>",
     "  • 1-place (unary): Wx = 'x walks'",
     "  • 2-place (binary): Sxy = 'x sees y'",
     "  • 3-place (ternary): Gxyz = 'x gives y to z'")

section("4.1", "Translation Key & Examples")
body("Choose a key that maps natural language expressions to logical letters and STICK TO IT.")

example_box("Translation Table (from handout)", [
    "Natural Language          →   Logical Formula",
    "─────────────────────────────────────────────",
    "John walks                →   Wj",
    "John is a boy             →   Bj",
    "He walks  (x = he)        →   Wx",
    "John sees Mary            →   Sjm   (S: 1st sees 2nd)",
    "John gives Mary the book  →   Gjmb  (G: 1st gives 2nd to 3rd)",
    "",
    "Note: Sjm ≠ Smj  (order matters for multi-argument predicates!)",
])

section("4.2", "Quantifiers and Variables")

subsection("Universal Quantifier ∀ ('for all')")
body("∀x P(x) means 'For every x, P(x) is true'.",
     "Universally quantified statements typically pair with <b>conditionals</b> (→).")

subsection("Existential Quantifier ∃ ('there exists')")
body("∃x P(x) means 'There exists at least one x such that P(x) is true'.",
     "Existentially quantified statements typically pair with <b>conjunctions</b> (∧).")

example_box("Quantification Examples (from handout)", [
    "Natural:  Everyone is smart",
    "Step 1 — unquantified: Sx  ('x is smart')",
    "Step 2 — quantify:     ∀xSx  ('for all x, x is smart')",
    "",
    "Natural:  John likes someone",
    "Step 1:   Ljx  ('John likes x')",
    "Step 2:   ∃xLjx  ('there exists an x that John likes')",
    "",
    "Natural:  Everyone liked the toad (t = toad)",
    "Step 1:   Lxt",
    "Step 2:   ∀xLxt  ('for every x, x liked the toad')",
    "",
    "Natural:  Nigel is taller than everyone (n = Nigel)",
    "Step 1:   Tnx",
    "Step 2:   ∀xTnx  ('for all x, Nigel is taller than x')",
])

rule("Universals go with CONDITIONALS:  'All A are B' → ∀x(Ax → Bx)")
rule("Existentials go with CONJUNCTIONS: 'Some A are B' → ∃x(Ax ∧ Bx)")

section("4.3", "Syntax of Quantifiers")
body("A quantifier must always be followed by one or more variables and then a formula.",
     "Complex formulas (with connectives and nested quantifiers) can appear inside quantifiers.")
example_box("Nested Quantifier Examples", [
    "∃x (Fx → Fa)",
    "∃y∀x ((Rxy & Ryx) → (Lxy & Lyx))",
])

subsection("Universe of Discourse")
body("Every quantifier implicitly ranges over a <b>domain (universe of discourse)</b> D.",
     "Example: ∀xHx for 'everyone is happy' implicitly assumes x ranges over people.",
     "If D = {all things}, then 'everyone is happy' must be written as ∀x(Px → Hx) "
     "(for all x, if x is a person, then x is happy).")

section("4.4", "Syllogistic Statements")
body("A syllogism is a logical argument with two premises and a conclusion.")
example_box("Classic Syllogism (from handout)", [
    "Major premise: All men are mortal",
    "Minor premise: Aristotle is a man",
    "Conclusion:    Aristotle is mortal",
    "",
    "In predicate logic:",
    "  ∀x(Mx → Rx)   (all men are mortal: if x is a man, x is mortal)",
    "  Ma             (Aristotle is a man)",
    "  ──────────────",
    "  Ra             (Aristotle is mortal) — by Universal Instantiation + Modus Ponens",
])

body("<b>Standard syllogistic forms:</b>")
example_box("Syllogistic Forms in Predicate Logic", [
    "'All A are B'      → ∀x(Ax → Bx)",
    "'Some A are B'     → ∃x(Ax ∧ Bx)",
    "'No A are B'       → ¬∃x(Ax ∧ Bx)  or equivalently  ∀x(Ax → ¬Bx)",
    "'Some A are not B' → ∃x(Ax ∧ ¬Bx)",
    "",
    "WARNING: 'All A are B' is NOT ∀x(Ax ∧ Bx)",
    "         That would mean 'Everything is both A and B' — incorrect!",
    "",
    "WARNING: 'Some A are B' is NOT ∃x(Ax → Bx)",
    "         That would be satisfied even if no A exists — incorrect!",
])

section("4.5", "Conjunctive Predicate Combinations")
body("When an adjective + noun combination genuinely means BOTH properties, use conjunction.")
example_box("Conjunctive Combination Examples (from handout)", [
    "(a) Every Purple Squid is Friendly",
    "    → ∀x((Px ∧ Sx) → Fx)",
    "    Read: For all x, if x is Purple AND x is a Squid, then x is Friendly.",
    "",
    "(b) Some Monsters are Hairy Drunkards",
    "    → ∃x(Mx ∧ (Hx ∧ Dx))",
    "    Read: There exists x such that x is a Monster AND Hairy AND a Drunkard.",
    "",
    "(c) No Invisible Lemur is a Criminal",
    "    → ¬∃x((Ix ∧ Lx) ∧ Cx)",
    "    Read: There is no x that is Invisible AND a Lemur AND a Criminal.",
])

warn("Some compound nouns CANNOT be split: 'alleged criminal', 'expectant mother', "
     "'deer hunter' — treat these as SINGLE predicates.")
warn("'Bostonian cabdriver' could mean (Bx∧Cx) or a single predicate depending on context.")

section("4.6", "Disjunctive Predicate Combinations")
body("Surface conjunctions ('and') in natural language can be LOGICAL DISJUNCTIONS.")
example_box("Worked Example: 'All cats and dogs make suitable pets'", [
    "First attempt (WRONG):",
    "  ∀x((Cx ∧ Dx) → Sx)  — this says 'everything that is BOTH a cat AND a dog'",
    "  But nothing is both a cat and a dog! This is always vacuously true. ✗",
    "",
    "Correct Translation 1 (conjunction of two universals):",
    "  ∀x(Cx → Sx) ∧ ∀x(Dx → Sx)",
    "",
    "Correct Translation 2 (disjunction in antecedent):",
    "  ∀x((Cx ∨ Dx) → Sx)",
    "  Read: For all x, if x is a cat OR a dog, then x makes a suitable pet.  ✔",
])

section("4.7", "Laws and Rules of Inference in Predicate Logic")
body("We need additional laws to reason with quantifiers.")

subsection("Laws of Quantifier Distribution")
qdlaws = [
    ("QD1", "¬(∀x)φ(x)  ⟺  (∃x)¬φ(x)",
     "If φ is not universally true, there exists an x for which it fails."),
    ("QD2", "(∀x)(φ(x)∧ψ(x))  ⟺  (∀x)φ(x)∧(∀x)ψ(x)",
     "∀ distributes over ∧ (both ways)."),
    ("QD3", "(∃x)(φ(x)∨ψ(x))  ⟺  (∃x)φ(x)∨(∃x)ψ(x)",
     "∃ distributes over ∨ (both ways)."),
    ("QD4", "(∀x)φ(x)∨(∀x)ψ(x)  ⟹  (∀x)(φ(x)∨ψ(x))",
     "∀ can be raised OUT of a disjunction (one direction only — implication, not equivalence)."),
    ("QD5", "(∃x)(φ(x)∧ψ(x))  ⟹  (∃x)φ(x)∧(∃x)ψ(x)",
     "∃ can be lowered INTO a conjunction (one direction only)."),
]
for lname, law, expl in qdlaws:
    proof_box(f"Law {lname}: {law}", [expl])

subsection("Laws of Quantifier Scope")
qslaws = [
    ("QS6","(∀x)(∀y)φ(x,y)  ⟺  (∀y)(∀x)φ(x,y)","Order of two ∀ quantifiers is irrelevant."),
    ("QS7","(∃x)(∃y)φ(x,y)  ⟺  (∃y)(∃x)φ(x,y)","Order of two ∃ quantifiers is irrelevant."),
    ("QS8","(∃x)(∀y)φ(x,y)  ⟹  (∀y)(∃x)φ(x,y)","∃ before ∀ implies ∀ before ∃ (NOT vice versa)."),
]
for lname, law, expl in qslaws:
    proof_box(f"Law {lname}: {law}", [expl])

warn("QS8 is NOT an equivalence! '∃x∀y' is STRONGER than '∀y∃x'.")

subsection("Four Rules of Inference for Quantifiers")
qi_rules = [
    ("Universal Instantiation (U.I.)",
     "From ∀xφ(x), conclude φ(c) for any constant c.",
     ["(∀x)φ(x)", ":. φ(c)        [for any constant c]",
      "Intuition: if φ is true of EVERYTHING, it is true of any specific thing."]),
    ("Universal Generalization (U.G.)",
     "From φ(v) for ARBITRARY v, conclude ∀xφ(x).",
     ["φ(v)", ":. (∀x)φ(x)    [v must be a completely arbitrary constant]",
      "Intuition: if φ holds for an arbitrary individual, it holds for ALL individuals."]),
    ("Existential Generalization (E.G.)",
     "From φ(c) for some specific c, conclude ∃xφ(x).",
     ["φ(c)", ":. (∃x)φ(x)",
      "Intuition: if φ holds for one specific thing, at least one thing satisfies φ."]),
    ("Existential Instantiation (E.I.)",
     "From ∃xφ(x), introduce a NEW constant w: φ(w).",
     ["(∃x)φ(x)", ":. φ(w)       [w is a brand new constant, never used before]",
      "Intuition: name the thing that satisfies φ, as long as we haven't named it yet."]),
]
for rname, rdesc, rlines in qi_rules:
    subsection(rname)
    body(rdesc)
    proof_box(f"Rule: {rname}", rlines, C_BG1)

subsection("Worked Proof 1 (U.I. example from handout): Prove H(a) from G(a) and ∀x(G(x)→H(x))")
proof_box("Proof", [
    "1.  (∀x)(G(x)→H(x))    Given",
    "2.  G(a)                Given",
    "3.  G(a)→H(a)           1, U.I.  [instantiate x to constant a]",
    "4.  H(a)                2,3, M.P.  [Modus Ponens]",
    "",
    "∴ H(a) is proven.  □",
])

subsection("Worked Proof 2 (U.G. example from handout): Prove ∀x(R(x)→W(x)) from ∀x(R(x)→Q(x)) and ∀x(Q(x)→W(x))")
proof_box("Proof", [
    "1.  (∀x)(R(x)→Q(x))    Given",
    "2.  (∀x)(Q(x)→W(x))    Given",
    "3.  R(v)→Q(v)           1, U.I.  [arbitrary constant v]",
    "4.  Q(v)→W(v)           2, U.I.",
    "5.  R(v)→W(v)           3,4, H.S.  [Hypothetical Syllogism]",
    "6.  (∀x)(R(x)→W(x))    5, U.G.  [v was arbitrary → generalise]",
    "",
    "∴ ∀x(R(x)→W(x)) is proven.  □",
])

subsection("Worked Proof 3 (E.I. example from handout): Prove (∃x)P(x)∧(∃x)Q(x) from ∃x(P(x)∧Q(x))")
proof_box("Proof", [
    "1.  (∃x)(P(x)∧Q(x))    Given",
    "2.  P(w)∧Q(w)           1, E.I.  [w is a brand new constant]",
    "3.  P(w)                2, Simplification",
    "4.  (∃x)P(x)            3, E.G.",
    "5.  Q(w)                2, Simplification",
    "6.  (∃x)Q(x)            5, E.G.",
    "7.  (∃x)P(x)∧(∃x)Q(x)  4,6, Conjunction",
    "",
    "∴ The result is proven.  □",
])

section("4.8", "Indirect Proof")
body("Also called <b>Reductio ad Absurdum</b> or <b>Proof by Contradiction</b>.",
     "Strategy: ASSUME the NEGATION of what you want to prove, derive a contradiction (A∧¬A), "
     "conclude the original statement must be true.")

subsection("Worked Indirect Proof (from handout): Prove (∀x)G(x)→(∃x)G(x) from no assumptions")
proof_box("Proof by Contradiction", [
    "1.  ¬((∀x)G(x)→(∃x)G(x))      Auxiliary Premise (assume negation of goal)",
    "2.  ¬(¬(∀x)G(x)∨(∃x)G(x))     1, Implication law: A→B ≡ ¬A∨B",
    "3.  (∀x)G(x) ∧ ¬(∃x)G(x)      2, De Morgan + Double Negation",
    "4.  (∀x)G(x)                   3, Simplification",
    "5.  ¬(∃x)G(x)                  3, Simplification",
    "6.  (∀x)¬G(x)                  5, QD1  [¬∃x ≡ ∀x¬]",
    "7.  G(a)                       4, U.I.  [instantiate to constant a]",
    "8.  ¬G(a)                      6, U.I.",
    "9.  G(a) ∧ ¬G(a)              7,8, Conjunction  ← CONTRADICTION",
    "10. (∀x)G(x)→(∃x)G(x)         1-9, Indirect Proof  □",
])

section("4.9", "Conditional Proof")
body("Strategy: ASSUME the antecedent as an auxiliary premise, then DERIVE the consequent. "
     "The whole conditional is then established by the Conditional Proof rule.")

subsection("Worked Conditional Proof (from handout): Prove (∀x)G(x)→(∃x)G(x)")
proof_box("Proof by Conditional Proof", [
    "1.  (∀x)G(x)             Auxiliary Premise (assume antecedent)",
    "2.  G(a)                 1, U.I.  [instantiate to constant a]",
    "3.  (∃x)G(x)             2, E.G.  [generalise existentially]",
    "4.  (∀x)G(x)→(∃x)G(x)   1-3, Conditional Proof",
    "",
    "We assumed (∀x)G(x) in line 1, derived (∃x)G(x) in line 3,",
    "so the conditional holds.  □",
])

note("Compare Indirect Proof (4.8) and Conditional Proof (4.9): both prove the same result "
     "but by different strategies. Conditional Proof is simpler here — assume antecedent, "
     "derive consequent.")

# ─── Final Summary / Exam Tips ────────────────────────────────────────────
story.append(PageBreak())
story.append(H("EXAM QUICK-REFERENCE SUMMARY", mkStyle('qr', fontSize=14,
               fontName='Helvetica-Bold', textColor=C_DARK, alignment=TA_CENTER,
               backColor=C_BG4, borderPadding=8)))
story.append(SP(6))

tips = [
    ("Mathematical Induction",
     "3 steps: Base Case → IH (assume k) → Show k+1. Only for integer domains."),
    ("Structural Induction",
     "2 steps: Base Case → Combination step (assume holds for parts, prove for whole)."),
    ("Boolean Simplification",
     "Apply postulates step by step. Use K-maps for up to 4-6 variables."),
    ("K-Map grouping",
     "Groups must be rectangular, size = power of 2. Larger group = fewer literals."),
    ("Truth table size",
     "n variables → 2ⁿ rows."),
    ("Tautology vs Contradiction",
     "Tautology: always T. Contradiction: always F. Contingency: sometimes T, sometimes F."),
    ("CNF Transformation",
     "Eliminate →, push ¬ inward (De Morgan), eliminate ¬¬, distribute ∨ over ∧."),
    ("Natural Deduction key rules",
     "MP (A→B, A ⊢ B), MT (A→B, ¬B ⊢ ¬A), HS (A→B, B→C ⊢ A→C), DS (A∨B, ¬A ⊢ B)."),
    ("Quantifier rules",
     "U.I.: ∀xφ → φ(c). U.G.: φ(v) → ∀xφ. E.G.: φ(c) → ∃xφ. E.I.: ∃xφ → φ(w, new)."),
    ("Universals with conditionals",
     "'All A are B' → ∀x(Ax→Bx)   NOT   ∀x(Ax∧Bx)."),
    ("Existentials with conjunctions",
     "'Some A are B' → ∃x(Ax∧Bx)  NOT   ∃x(Ax→Bx)."),
    ("QD1 (important!)",
     "¬∀xφ(x) ⟺ ∃x¬φ(x)   and   ¬∃xφ(x) ⟺ ∀x¬φ(x)."),
]
tip_hdr = [H("<b>Topic</b>", mkStyle('th', fontName='Helvetica-Bold', fontSize=9,
              textColor=colors.white)),
           H("<b>Key Fact</b>", mkStyle('th', fontName='Helvetica-Bold', fontSize=9,
              textColor=colors.white))]
tip_data = [tip_hdr] + [[H(a,BODY), H(b,BODY)] for a,b in tips]
tip_t = Table(tip_data, colWidths=[4*cm, W-4*cm])
tip_t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0),(-1,0), C_TEAL),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, C_BG3]),
    ('GRID',          (0,0),(-1,-1), 0.5, colors.grey),
    ('FONTSIZE',      (0,0),(-1,-1), 9),
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 5),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
]))
story.append(tip_t)
story.append(SP(10))
story.append(H("Good luck in your exams! Study every worked example above.",
               mkStyle('gl', fontSize=12, fontName='Helvetica-Bold',
                       textColor=C_DARK, alignment=TA_CENTER)))

# ── build ────────────────────────────────────────────────────────────────────
doc.build(story)
print("PDF generated: CE473_Complete_Study_Guide.pdf")
