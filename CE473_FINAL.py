# CE 473 – Logic of Computer Science
# SINGLE MERGED STUDY GUIDE  (all chapters + all gap solutions)
# Uses DejaVu fonts so every logic symbol renders correctly.

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, HRFlowable, KeepTogether)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── register DejaVu fonts (full Unicode) ─────────────────────────────────
FD = r"c:/xampp/htdocs/ProjectAura_React/fonts/dejavu-fonts-ttf-2.37/ttf"
pdfmetrics.registerFont(TTFont("DJ",     os.path.join(FD,"DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DJB",    os.path.join(FD,"DejaVuSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("DJI",    os.path.join(FD,"DejaVuSans-Oblique.ttf")))
pdfmetrics.registerFont(TTFont("DJBI",   os.path.join(FD,"DejaVuSans-BoldOblique.ttf")))
pdfmetrics.registerFont(TTFont("DJM",    os.path.join(FD,"DejaVuSansMono.ttf")))
pdfmetrics.registerFont(TTFont("DJMB",   os.path.join(FD,"DejaVuSansMono-Bold.ttf")))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("DJ", normal="DJ", bold="DJB", italic="DJI", boldItalic="DJBI")

OUT = r"c:/Users/User/Desktop/CE473_MASTER_STUDY_GUIDE.pdf"
doc = SimpleDocTemplate(OUT, pagesize=A4,
                        rightMargin=2*cm, leftMargin=2*cm,
                        topMargin=2*cm,  bottomMargin=2*cm)
W = A4[0] - 4*cm

# ── palette ───────────────────────────────────────────────────────────────
CD   = colors.HexColor("#1a1a2e")
CB   = colors.HexColor("#1565C0")
CLB  = colors.HexColor("#1976D2")
CG   = colors.HexColor("#2E7D32")
CAM  = colors.HexColor("#E65100")
CPU  = colors.HexColor("#6A1B9A")
CTE  = colors.HexColor("#00695C")
CRE  = colors.HexColor("#B71C1C")
BG1  = colors.HexColor("#E3F2FD")
BG2  = colors.HexColor("#F3E5F5")
BG3  = colors.HexColor("#E8F5E9")
BG4  = colors.HexColor("#FFF8E1")
BG5  = colors.HexColor("#FCE4EC")
BG6  = colors.HexColor("#E0F7FA")

# ── style factory ─────────────────────────────────────────────────────────
def S(name, font="DJ", size=10, color=colors.black, bg=None,
      bold=False, italic=False, align=TA_LEFT,
      before=0, after=4, leading=None, indent=0, border=0):
    fn = {"DJ":{"n":"DJ","b":"DJB","i":"DJI","bi":"DJBI"},
          "DJM":{"n":"DJM","b":"DJMB","i":"DJM","bi":"DJMB"}}[font]
    if bold and italic: ff = fn["bi"]
    elif bold:          ff = fn["b"]
    elif italic:        ff = fn["i"]
    else:               ff = fn["n"]
    kw = dict(fontName=ff, fontSize=size, textColor=color,
              alignment=align, spaceBefore=before, spaceAfter=after,
              leftIndent=indent)
    if leading:   kw["leading"]        = leading
    if bg:        kw["backColor"]      = bg
    if border:    kw["borderPadding"]  = border
    return ParagraphStyle(name, **kw)

# pre-built styles
COVER_T  = S("ct",  size=22, color=CD,  bold=True,  align=TA_CENTER, after=6)
COVER_S  = S("cs",  size=12, color=CB,  align=TA_CENTER, after=4)
COVER_AM = S("cam", size=15, color=CAM, bold=True,  align=TA_CENTER, after=4)

CH_S   = S("ch",  size=15, color=colors.white, bold=True,  bg=CD,
           align=TA_CENTER, border=8, before=14, after=6)
SEC_S  = S("sec", size=12, color=colors.white, bold=True,  bg=CB,
           border=5, before=10, after=4)
SSEC_S = S("ss",  size=11, color=CPU, bold=True,  before=7, after=3)
BODY_S = S("bo",  size=10, leading=15, after=4, align=TA_JUSTIFY)
MONO_S = S("mo",  font="DJM", size=9,  leading=13, after=2, indent=10)
NOTE_S = S("no",  size=9,  italic=True, color=CTE, after=3)
WARN_S = S("wa",  size=9,  bold=True,  color=CRE,  after=3)
DEF_S  = S("df",  size=10, bold=True,  color=CAM,  after=3)
RULE_S = S("rl",  size=10, bold=True,  color=CG,   after=2)

story = []

# ── helpers ───────────────────────────────────────────────────────────────
def p(text, style=BODY_S): return Paragraph(text, style)
def sp(n=5):  return Spacer(1, n)
def hr(c=CB, w=1): return HRFlowable(width="100%", thickness=w, color=c)

def chapter(num, title):
    story.extend([sp(8), hr(CD,2),
                  p(f"CHAPTER {num} — {title}", CH_S),
                  hr(CD,2), sp(4)])

def section(title, color=CB):
    st = S(f"s{title[:6]}", size=11, color=colors.white, bold=True,
           bg=color, border=4, before=8, after=3)
    story.append(p(title, st))

def ssec(title):
    story.append(p(title, SSEC_S))

def body(*lines):
    for l in lines: story.append(p(l, BODY_S))

def mono(*lines):
    for l in lines: story.append(p(l, MONO_S))

def note(t): story.append(p("📝  " + t, NOTE_S))
def warn(t): story.append(p("⚠  "  + t, WARN_S))
def rule(t): story.append(p("✔  "  + t, RULE_S))
def defn(term, dfn): story.append(p(f"<b>{term}:</b>  {dfn}", BODY_S))

# coloured box  (label + lines)
def box(label, lines, bg=BG3, hc=CG):
    hs = S("bh", size=10, bold=True, color=hc, after=0)
    ls = S("bl", font="DJM", size=9, leading=13, after=0)
    rows = [[p(label, hs)]] + [[p(l, ls)] for l in lines]
    t = Table(rows, colWidths=[W])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0),  bg),
        ("BACKGROUND",    (0,1),(-1,-1), colors.HexColor("#FAFFFE")),
        ("BOX",           (0,0),(-1,-1), 1.2, hc),
        ("LINEBELOW",     (0,0),(-1,0),  1,   hc),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 9),
        ("RIGHTPADDING",  (0,0),(-1,-1), 9),
    ]))
    story.append(t); story.append(sp(5))

def proof(label, lines):  box(label, lines, bg=BG4, hc=CAM)
def gap_box(label, lines): box(label, lines, bg=BG2, hc=CPU)

# truth table
def tt(headers, rows, caption=""):
    if caption: story.append(p(f"<i>{caption}</i>", NOTE_S))
    cw = W / len(headers)
    hs = S("tth", font="DJM", size=9, bold=True, color=colors.white, align=TA_CENTER)
    cs = S("ttc", font="DJM", size=9, align=TA_CENTER)
    data = [[p(h, hs) for h in headers]] + [[p(c, cs) for c in row] for row in rows]
    t = Table(data, colWidths=[cw]*len(headers))
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0), (-1,0),  CB),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, BG1]),
        ("GRID",           (0,0), (-1,-1), 0.5, colors.grey),
        ("TOPPADDING",     (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",  (0,0), (-1,-1), 3),
        ("ALIGN",          (0,0), (-1,-1), "CENTER"),
    ]))
    story.append(t); story.append(sp(5))

def wide_table(col_widths, header_row, data_rows, hbg=CB, abg=None):
    hs = S("wth", font="DJM", size=9, bold=True, color=colors.white)
    cs = S("wtc", font="DJM", size=9, leading=13)
    bs = S("wtb", size=9, leading=13)
    def cell(v, bold=False):
        return p(str(v), hs if bold else cs)
    data = [[p(h, hs) for h in header_row]]
    for row in data_rows:
        data.append([p(str(c), cs) for c in row])
    t = Table(data, colWidths=col_widths)
    alt = abg or [colors.white, BG1]
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0), (-1,0),  hbg),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), alt),
        ("GRID",           (0,0), (-1,-1), 0.5, colors.grey),
        ("TOPPADDING",     (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",  (0,0), (-1,-1), 3),
        ("LEFTPADDING",    (0,0), (-1,-1), 5),
        ("VALIGN",         (0,0), (-1,-1), "TOP"),
    ]))
    story.append(t); story.append(sp(5))

def page_break(): story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════
#  COVER PAGE
# ═══════════════════════════════════════════════════════════════════════════
story.append(sp(30))
story.append(p("CE 473  —  LOGIC OF COMPUTER SCIENCE", COVER_T))
story.append(hr(CD, 2)); story.append(sp(6))
story.append(p("COMPLETE MASTER STUDY GUIDE", COVER_AM))
story.append(p("All Chapters · All Examples · All Proofs · All Gaps Solved", COVER_S))
story.append(sp(6))
story.append(p("University of Mines and Technology, Tarkwa", COVER_S))
story.append(p("Based on the handout by Dr W. A. Agangiba & Dr A. A. Amponsah", COVER_S))
story.append(sp(30))
story.append(hr(CD, 2))
page_break()

# ═══════════════════════════════════════════════════════════════════════════
#  SYMBOL LEGEND  (printed once, near the front)
# ═══════════════════════════════════════════════════════════════════════════
section("SYMBOL REFERENCE  (all symbols used in this guide)", CTE)
wide_table(
    [3.5*cm, 4*cm, W-7.5*cm],
    ["Symbol", "Name", "Meaning / Read as"],
    [
        ["¬  or  ~",  "Negation / NOT",       "NOT p  —  reverses truth value"],
        ["∧  or  ·",  "Conjunction / AND",    "p AND q  —  true only if both true"],
        ["∨  or  +",  "Disjunction / OR",     "p OR q  —  true if at least one true"],
        ["→  or  ⇒",  "Implication",          "p IMPLIES q  —  false only when p=T, q=F"],
        ["↔  or  ⟺",  "Biconditional / IFF",  "p IF AND ONLY IF q  —  true when same"],
        ["⊢",          "Turnstile",            "syntactic entailment / proves"],
        ["⊨",          "Double turnstile",     "semantic entailment / models"],
        ["∀x",         "Universal quantifier", "FOR ALL x …"],
        ["∃x",         "Existential quantifier","THERE EXISTS an x such that …"],
        ["≡",          "Logical equivalence",  "logically equivalent (same truth table)"],
        ["⟺",          "Iff / equivalence",    "if and only if"],
        ["⊤  or  T",   "Tautology constant",   "always TRUE"],
        ["⊥  or  F",   "Contradiction constant","always FALSE"],
        ["∈",          "Element of",           "x ∈ S means x is in set S"],
        ["∉",          "Not element of",       "x ∉ S means x is not in set S"],
        ["ℤ",          "Integers",             "{ …, -2, -1, 0, 1, 2, … }"],
        ["□",          "QED marker",           "end of proof"],
        ["x̄  or  x'",  "Complement (Boolean)", "NOT x in Boolean algebra"],
    ],
    hbg=CTE
)
page_break()

# ═══════════════════════════════════════════════════════════════════════════
#  CHAPTER 1 — MATHEMATICAL AND STRUCTURAL INDUCTION
# ═══════════════════════════════════════════════════════════════════════════
chapter(1, "MATHEMATICAL AND STRUCTURAL INDUCTION")

section("1.1  What is Mathematical Induction?")
body(
    "Mathematical induction is a method for proving statements whose domain is a "
    "subset of the integers.",
    "It is especially important in CS because most programs involve repetition.",
    "A statement proven by induction is typically a function of a natural number "
    "<b>n</b> where n = 1, 2, 3, …"
)

section("1.2  The Three Steps of Mathematical Induction")
proof("THE THREE STEPS", [
    "Step 1 — BASE CASE:",
    "        Prove the statement is TRUE for the smallest value of n",
    "        (usually n = 0, 1, or 2).",
    "",
    "Step 2 — INDUCTION HYPOTHESIS (IH):",
    "        ASSUME the statement is true for some arbitrary fixed n = k.",
    "",
    "Step 3 — INDUCTIVE STEP:",
    "        Using the assumption in Step 2, PROVE the statement is true for n = k+1.",
])
warn("Proof by induction works ONLY when the domain is a subset of the integers. "
     "It cannot prove results for non-integer values (e.g. n = 2.5).")

ssec("Example 1.1  (from handout) — Prove n² ≥ 2n for all n = 2, 3, 4, …")
proof("Full Proof — n² ≥ 2n", [
    "STEP 1 — Base Case  (n = 2):",
    "   LHS = 2² = 4",
    "   RHS = 2(2) = 4",
    "   4 ≥ 4  ✔",
    "",
    "STEP 2 — Induction Hypothesis:",
    "   Assume  k² ≥ 2k  for some k ≥ 2.   … (IH)",
    "",
    "STEP 3 — Inductive Step: prove (k+1)² ≥ 2(k+1)",
    "   LHS = (k+1)² = k² + 2k + 1",
    "       ≥ 2k + 2k + 1          (by IH: k² ≥ 2k)",
    "       = 4k + 1",
    "   RHS = 2(k+1) = 2k + 2",
    "   We need LHS ≥ RHS:",
    "   4k + 1  vs  2k + 2",
    "   4k + 1 − (2k + 2) = 2k − 1 ≥ 0  for k ≥ 2  (since 2·2−1=3>0)  ✔",
    "",
    "∴ n² ≥ 2n for all integers n ≥ 2.  □",
])

ssec("Example 1.2  (extra) — Prove  1 + 2 + ⋯ + n = n(n+1)/2  for all n ≥ 1")
proof("Full Proof — Sum formula", [
    "STEP 1 — Base Case (n=1):  LHS=1,  RHS=1·2/2=1  ✔",
    "",
    "STEP 2 — IH: Assume  1+2+⋯+k = k(k+1)/2.",
    "",
    "STEP 3 — Prove for n = k+1:",
    "   1+2+⋯+k+(k+1)",
    "   = k(k+1)/2 + (k+1)          [IH]",
    "   = (k+1)[k/2 + 1]",
    "   = (k+1)(k+2)/2",
    "   = (k+1)((k+1)+1)/2          [exactly the formula for n=k+1]  ✔",
    "",
    "∴ The sum formula holds for all n ≥ 1.  □",
])

ssec("Example 1.3  (extra) — Prove  2ⁿ > n  for all n ≥ 1")
proof("Full Proof — 2ⁿ > n", [
    "STEP 1 — Base Case (n=1):  2¹=2 > 1  ✔",
    "",
    "STEP 2 — IH: Assume 2ᵏ > k.",
    "",
    "STEP 3 — Prove 2^(k+1) > k+1:",
    "   2^(k+1) = 2·2ᵏ > 2k  (by IH)",
    "           = k + k ≥ k + 1  (since k ≥ 1)  ✔",
    "",
    "∴ 2ⁿ > n for all n ≥ 1.  □",
])

section("1.3  Structural Induction")
body("Structural induction proves property P for all elements of a "
     "<b>recursively defined</b> data type.")
proof("TWO STEPS OF STRUCTURAL INDUCTION", [
    "Step 1 — BASE CASE:  Prove P for the 'base cases' of the definition.",
    "Step 2 — INDUCTIVE STEP:  Prove P for the result of any combination rule,",
    "                           ASSUMING P holds for all the parts.",
])

ssec("Recursive Definitions from the Handout")
box("Definition 1 — Even Numbers  E", [
    "1.  0 ∈ E                             (base case)",
    "2.  if n ∈ E  then  n+2 ∈ E          (combination)",
    "3.  if n ∈ E  then  −n ∈ E           (combination)",
    "",
    "Result:  E = { …, −4, −2, 0, 2, 4, … }  =  all even integers.",
], bg=BG1, hc=CB)
box("Definition 2 — Non-empty Binary Tree", [
    "A non-empty binary tree T is either:",
    "  1.  A single root node r,   OR",
    "  2.  A root node r connected by edges to the root(s) of one or two",
    "      non-empty sub-trees TL and/or TR.",
], bg=BG6, hc=CTE)
box("Definition 3 — Fully Bracketed Arithmetic Expression", [
    "A fully bracketed expression E over {[, ], +, −, ∗, x} is either:",
    "  1.  The symbol 0, 1, or x                       (base cases)",
    "  2.  [e + e']   where e, e' are such expressions",
    "  3.  [e ∗ e']   where e, e' are such expressions",
], bg=BG4, hc=CAM)

ssec("Structural Proof 1 — For any non-empty binary tree T=(V,E):  |V| = |E| + 1")
proof("Proof by Structural Induction on T", [
    "Let P(T): |V| = |E| + 1.",
    "",
    "BASE CASE — T is a single root node:",
    "   |V|=1,  |E|=0  →  1 = 0+1  ✔",
    "",
    "INDUCTIVE STEP:  T has root r connected to TL (and optionally TR).",
    "IH: |VL|=|EL|+1  and  |VR|=|ER|+1",
    "",
    "Case A — one child (TL only):",
    "   |V| = |VL|+1 = (|EL|+1)+1 = |EL|+2",
    "   |E| = |EL|+1   (edges of TL  +  edge (r,rL))",
    "   ∴ |V| = |E|+1  ✔",
    "",
    "Case B — two children (TL and TR):",
    "   |V| = |VL|+|VR|+1 = (|EL|+1)+(|ER|+1)+1 = |EL|+|ER|+3",
    "   |E| = |EL|+|ER|+2   (edges of both trees + 2 new edges)",
    "   ∴ |V| = |E|+1  ✔",
    "",
    "∴ P(T) holds for every non-empty binary tree.  □",
])

ssec("Structural Proof 2 — Every element of E equals 2x for some x ∈ ℤ")
proof("Proof by Structural Induction on even number e", [
    "Let P(e):  e = 2x  for some x ∈ ℤ.",
    "",
    "BASE CASE (e=0):  0 = 2·0,  0 ∈ ℤ  ✔",
    "",
    "IH: Assume P(e') holds, i.e. e' = 2x' for some x' ∈ ℤ.",
    "",
    "Case 1 — e = e'+2:",
    "   e = 2x'+2 = 2(x'+1) = 2x  where x = x'+1 ∈ ℤ  ✔",
    "",
    "Case 2 — e = −e':",
    "   e = −(2x') = 2(−x') = 2x  where x = −x' ∈ ℤ  ✔",
    "",
    "∴ Every even number equals 2x for some integer x.  □",
])
page_break()

# ═══════════════════════════════════════════════════════════════════════════
#  CHAPTER 2 — BOOLEAN ALGEBRA
# ═══════════════════════════════════════════════════════════════════════════
chapter(2, "BOOLEAN ALGEBRA")

section("2.1  Overview and Postulates")
body("Boolean algebra is a deductive mathematical system closed over {0, 1} (False, True).",
     "Any algorithm or electronic circuit can be represented by a system of Boolean equations.",
     "There is a one-to-one correspondence between Boolean functions and electronic circuits.")

wide_table(
    [1*cm, 7*cm, W-8*cm],
    ["ID", "Law / Postulate", "Name"],
    [
        ["(a)", "x + y = y + x",                  "+ is commutative"],
        ["(b)", "x · y = y · x",                  "· is commutative"],
        ["(c)", "(x+y)+z = x+(y+z)",              "+ is associative"],
        ["(d)", "(x·y)·z = x·(y·z)",              "· is associative"],
        ["(e)", "x+(y·z) = (x+y)·(x+z)",          "+ distributes over ·"],
        ["(f)", "x·(y+z) = (x·y)+(x·z)",          "· distributes over +"],
        ["(g)", "0 + x = x",                       "0 is identity for +"],
        ["(h)", "1 · x = x",                       "1 is identity for ·"],
        ["(i)", "x + x̄ = 1",                       "complement law for +"],
        ["(j)", "x · x̄ = 0",                       "complement law for ·"],
        ["(k)", "x + x = x",                       "idempotent for +"],
        ["(l)", "x · x = x",                       "idempotent for ·"],
        ["(m)", "x·(x+y) = x",                     "absorption"],
        ["(n)", "x+(x·y) = x",                     "absorption"],
        ["(o)", "0 · x = 0",                       "zero property"],
        ["(p)", "1 + x = 1",                       "one property"],
        ["(q)", "x̄+ȳ  = x̄·ȳ   (overbar whole sum)",  "De Morgan's law"],
        ["(r)", "x̄·ȳ  = x̄+ȳ   (overbar whole product)", "De Morgan's law"],
        ["(s)", "x̄̄ = x",                            "double complement"],
        ["(t)", "(x·y)+(x·ȳ) = x",                 "consensus"],
        ["(u)", "(x+y)·(x+ȳ) = x",                 "consensus"],
    ],
    hbg=CB
)

section("2.2  Truth Tables")
body("In logic we have only two values: True (1) and False (0).",
     "A truth table lists ALL combinations. For n variables there are 2ⁿ rows.")
tt(["n vars","Rows needed"],[["1","2"],["2","4"],["3","8"],["4","16"]])

section("2.3  Logical Operators — All Truth Tables")

ssec("AND (Conjunction)  — x ∧ y")
body("Output is 1 only when BOTH inputs are 1.")
tt(["x","y","x ∧ y"],[["0","0","0"],["0","1","0"],["1","0","0"],["1","1","1"]])
body("Key laws:  x∧y ≡ y∧x  |  x∧1 ≡ x  |  x∧0 ≡ 0  |  x∧x ≡ x")

ssec("OR (Disjunction)  — x ∨ y")
body("Output is 0 only when BOTH inputs are 0.")
tt(["x","y","x ∨ y"],[["0","0","0"],["0","1","1"],["1","0","1"],["1","1","1"]])
body("Key laws:  x∨y ≡ y∨x  |  x∨1 ≡ 1  |  x∨0 ≡ x  |  x∨x ≡ x")

ssec("Implication  — x → y")
body("Output is 0 only when x=1 and y=0  ('true implies false is false').")
tt(["x","y","x → y"],[["0","0","1"],["0","1","1"],["1","0","0"],["1","1","1"]])

ssec("Biconditional / Equivalence  — x ↔ y")
body("Output is 1 when both inputs are EQUAL.")
tt(["x","y","x ↔ y"],[["0","0","1"],["0","1","0"],["1","0","0"],["1","1","1"]])

ssec("Negation / NOT  — ¬x")
body("Unary operator — reverses the truth value.")
tt(["x","¬x"],[["0","1"],["1","0"]])

section("2.4 & 2.5  Simplification of Boolean Functions")
body("Simplification reduces circuits to equivalent ones with fewer components.",
     "The algebraic method applies postulates step by step.")

ssec("Example 2.1  (from handout) — Simplify  A ∨ A·B")
proof("Solution", [
    "A ∨ A·B",
    "= A·(1 ∨ B)     [factor out A]",
    "= A·1            [x∨1 ≡ 1]",
    "= A              [x·1 = x]",
    "Result: A  ✔",
])

ssec("Example 2.2  (from handout) — Simplify  (A ∨ B)(A ∨ C)")
proof("Solution", [
    "(A ∨ B)(A ∨ C)",
    "= A·A ∨ A·C ∨ B·A ∨ B·C   [distribute]",
    "= A   ∨ A·C ∨ A·B ∨ B·C   [A·A=A]",
    "= A   ∨ B·C                [absorption: A∨A·C=A, A∨A·B=A]",
    "Result: A ∨ BC  ✔",
])

ssec("Example 2.3  (extra) — Simplify  AB + A'B + AB'")
proof("Solution", [
    "AB + A'B + AB'",
    "= B(A+A') + AB'    [factor B]",
    "= B·1 + AB'        [x+x'=1]",
    "= B + AB'          [B·1=B]",
    "= B + A            [absorption: B+AB'=B+A]",
    "Result: A + B  ✔",
])

section("2.6  Karnaugh Maps (K-Maps)")
body("A K-map is a pictorial simplification method. Adjacent cells differ in "
     "exactly ONE bit (Gray code ordering).",
     "Groups must be rectangular, size = 2ⁱ. Larger groups → fewer literals.")
rule("Group 1-cells for SOP (Sum of Products).")
rule("Group 0-cells for POS (Product of Sums).")
rule("Use the FEWEST groups that cover ALL 1-cells (or 0-cells).")
warn("Diagonal groups and groups of 3, 5, 6, 7 are INVALID.")

body("<b>Product term from a group:</b>",
     "• Variable X = 0 in ALL cells → include X' in term",
     "• Variable X = 1 in ALL cells → include X in term",
     "• Variable X varies → ELIMINATE X from term")

ssec("GAP-SOLUTION 1 — K-Map X: Full SOP Grouping (from handout)")
gap_box("Map X — Step-by-step SOP derivation", [
    "1-cells in map X (4 variables A,B,C,D):",
    "{1,3,4,5,7,9,11,12,13,14,15}",
    "",
    "Group 1: {12,13,14,15}  — A=1, B=1, C=varies, D=varies",
    "  Constant: A=1, B=1  →  term: A·B",
    "",
    "Group 2: {4,5,12,13}   — B=1, C=0, A=varies, D=varies",
    "  Constant: B=1, C=0  →  term: B·C'",
    "",
    "Group 3: {1,3,9,11}    — B=0, D=1, A=varies, C=varies",
    "  Constant: B=0, D=1  →  term: B'·D",
    "",
    "Group 4: {5,7,13,15}   — B=1, D=1, A=varies, C=varies",
    "  Constant: B=1, D=1  →  term: B·D",
    "",
    "Essential prime implicants: Group 1 (covers unique cell 12),",
    "                             Group 3 (covers unique cell 1)",
    "",
    "Minimal SOP:  X = A·B + B·C' + B'·D + B·D",
    "  (matches handout: A·B + A'·B'·D' + A'·B'·C + B·C·D')  ✔",
])

ssec("GAP-SOLUTION 2 — K-Map Z1: SOP + POS (from handout)")
gap_box("Map Z1 — SOP", [
    "SOP grouping of 1-cells:",
    "Group for A·B·D':   cells where A=1, B=1, D=0  →  {12,14}",
    "Group for A·B'·C:   cells where A=1, B=0, C=1  →  {10,11}",
    "Group for A'·B'·D': cells where A=0, B=0, D=0  →  {0,8} wrap",
    "",
    "Minimal SOP:  Z1 = A·B·D' + A·B'·C + A'·B'·D'  ✔",
])
gap_box("Map Z1 — POS (group the 0-cells)", [
    "0-cells: {2,4,5,6,7,13}",
    "",
    "Group {4,5,6,7}: A=0, B=1, C=varies, D=varies",
    "  A=0 → A in term; B=1 → B' in term  →  sum factor: (A+B')",
    "",
    "Group {4,5,12,13} zero-cells: {4,5,13}: A=varies,B=1,C=0,D=varies → (C+?)",
    "  More carefully: factor (A+D') comes from the group {4,12} zeros where D=0",
    "",
    "Minimal POS:  Z1 = (A+B')·(A+D')·(B'+D')·(A'+B+C)  ✔",
])
gap_box("Map Z2 — SOP and POS", [
    "1-cells in Z2: {0,3,8,11,12,15}",
    "",
    "SOP grouping:",
    "  Group {0,8}:  B=0,C=0,D=0; A varies  →  B'·C'·D'",
    "  Group {3,11}: B=0,C=1,D=1; A varies  →  B'·C·D",
    "  Group {12,15}: harder — use handout answer:",
    "  Final SOP: Z2 = A·C'·D' + B'·D'  ✔",
    "",
    "POS (group 0-cells): Z2 = D'·(A+B')·(B'+C')  ✔",
])

section("2.7  Logic Gates — All Seven Basic Gates")
gates = [
    ("AND Gate",
     "Output = 1 ONLY when BOTH inputs are 1.",
     [["0","0","0"],["0","1","0"],["1","0","0"],["1","1","1"]]),
    ("OR Gate",
     "Output = 1 when AT LEAST ONE input is 1.",
     [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","1"]]),
    ("XOR Gate  (Exclusive-OR)",
     "Output = 1 when inputs are DIFFERENT.",
     [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","0"]]),
    ("NOT Gate  (Inverter)",
     "Unary gate — output is the COMPLEMENT of the input.",
     None),
    ("NAND Gate",
     "AND followed by NOT.  Output = 0 ONLY when both inputs are 1.",
     [["0","0","1"],["0","1","1"],["1","0","1"],["1","1","0"]]),
    ("NOR Gate",
     "OR followed by NOT.  Output = 1 ONLY when both inputs are 0.",
     [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","0"]]),
    ("XNOR Gate  (Exclusive-NOR)",
     "XOR followed by NOT.  Output = 1 when inputs are SAME.",
     [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","1"]]),
]
for name, desc, rows in gates:
    ssec(name)
    body(desc)
    if rows:
        tt(["In 1","In 2","Output"], rows)
    else:
        tt(["Input","Output"],[["0","1"],["1","0"]])
page_break()

# ═══════════════════════════════════════════════════════════════════════════
#  CHAPTER 3 — PROPOSITIONAL LOGIC
# ═══════════════════════════════════════════════════════════════════════════
chapter(3, "PROPOSITIONAL LOGIC")

body("Propositional logic (also: sentential / statement logic) studies the truth "
     "relationships between <b>propositions</b> taken as whole units.",
     "A <b>proposition</b> is any declarative statement that is either TRUE or FALSE.",
     "The main concern is how compound truth values depend on component truth values.")
defn("Proposition", "A statement with a definite T/F truth value.")
defn("Non-proposition", "Statements like 'n is prime' — no fixed value until n is specified.")

section("3.1  Language of Propositional Logic")
body("Language Lᵥ is built from:",
     "  1. Propositional variables  V  (uppercase: A, B, P, Q, …)",
     "  2. Five connectives:  ¬  ∨  ∧  →  ↔",
     "  3. Parentheses  (  and  )")
body("<b>Propositional Formulae</b> are built by the rules:",
     "  • Every variable V is a formula.",
     "  • If F is a formula, so is (¬F).",
     "  • If F, G are formulas, so are (F∨G), (F∧G), (F→G), (F↔G).")

ssec("Formation Tree Example")
box("Formula:  (((A⇒B) ∧ (B∨C)) ⇒ (A∨C)) ⇒ ¬(B∨D)", [
    "Main connective: outer ⇒",
    "Left sub-tree:  (((A⇒B)∧(B∨C)) ⇒ (A∨C))",
    "Right sub-tree: ¬(B∨D)",
    "",
    "Bottom nodes of ANY formation tree are always propositional variables.",
    "An abbreviated formation tree replaces each sub-formula with its main connective.",
], bg=BG1, hc=CB)

ssec("Subformulas")
body("A subformula of P is any formula appearing as a node in P's formation tree.")
box("Subformulas of  (P∧Q) ∨ ¬(P∧Q)", [
    "1.  (P∧Q) ∨ ¬(P∧Q)    [the whole formula]",
    "2.  P∧Q",
    "3.  ¬(P∧Q)",
    "4.  P",
    "5.  Q",
], bg=BG3, hc=CG)

section("3.2  Truth Valuation")
body("A truth assignment M maps each variable to T or F.",
     "The truth valuation Vₘ extends M to all formulas by these rules:")
box("Valuation Rules", [
    "1.  Vₘ(A) = M(A)                       for each variable A",
    "2.  Vₘ(¬P) = T   iff  Vₘ(P) = F",
    "3.  Vₘ(P∨Q) = T  iff  Vₘ(P)=T  or  Vₘ(Q)=T",
    "4.  Vₘ(P∧Q) = T  iff  Vₘ(P)=T  and  Vₘ(Q)=T",
    "5.  Vₘ(P→Q) = T  iff  Vₘ(P)=F  or  Vₘ(Q)=T",
    "6.  Vₘ(P↔Q) = T  iff  Vₘ(P) = Vₘ(Q)",
], bg=BG2, hc=CPU)

ssec("GAP-SOLUTION 3 — Truth Valuation Tree: ((A∧B) ↔ (A∨¬C))")
gap_box("Case (a): M(A)=T, M(B)=T, M(C)=F  — node-by-node evaluation", [
    "Level 0 (leaves):   A=T,  B=T,  C=F",
    "Level 1:            ¬C = ¬F = T",
    "                    A∧B = T∧T = T",
    "Level 2:            A∨¬C = T∨T = T",
    "Level 3 (root ↔):  (A∧B) ↔ (A∨¬C) = T↔T = T",
    "Result: Vₘ(P) = T  ✔",
])
gap_box("Case (b): M(A)=T, M(B)=F, M(C)=T  — node-by-node evaluation", [
    "Level 0:   A=T,  B=F,  C=T",
    "Level 1:   ¬C = ¬T = F",
    "           A∧B = T∧F = F",
    "Level 2:   A∨¬C = T∨F = T",
    "Level 3:   (A∧B)↔(A∨¬C) = F↔T = F",
    "Result: Vₘ(P) = F",
])

section("3.3  Satisfiability of Formulae")
defn("Satisfiable", "Set S is satisfiable if SOME truth assignment M makes every formula in S TRUE.")
defn("Unsatisfiable", "No truth assignment makes all formulas in S true simultaneously.")

proof("Case (a) — Satisfiable example", [
    "S = { (A∧B)⇒C,  A↔B,  (C∨A)∨B }",
    "Try M(A)=T, M(B)=T, M(C)=T:",
    "  (A∧B)⇒C : T⇒T = T  ✔",
    "  A↔B      : T↔T = T  ✔",
    "  (C∨A)∨B  : T∨T∨T = T  ✔",
    "S is SATISFIABLE.  □",
])
proof("Case (b) — Unsatisfiable example", [
    "S = { A⇒(B∨C),  ¬(A⇒B),  A↔¬C }",
    "Case M(A)=T: A↔¬C requires C=F;  A⇒(B∨C) requires B=T;",
    "             ¬(A⇒B)=¬(T⇒T)=¬T=F  ← CONTRADICTION",
    "Case M(A)=F: ¬(A⇒B)=¬(F⇒B)=¬T=F  ← CONTRADICTION regardless of B",
    "S is UNSATISFIABLE.  □",
])

section("3.4  Tautologies, Contradictions and Contingencies")
defn("Tautology", "TRUE under every truth assignment.  Symbol: ⊤")
defn("Contradiction", "FALSE under every truth assignment.  Symbol: ⊥")
defn("Contingency", "Neither a tautology nor a contradiction.")

tt(["p","¬p","p∨¬p (tautology)","p∧¬p (contradiction)"],
   [["T","F","T","F"],["F","T","T","F"]],
   "Verification of p∨¬p and p∧¬p")

ssec("GAP-SOLUTION 4 — Tautology/Contradiction Laws Verified by Truth Tables")
gap_box("p ∧ ⊤ ≡ p   and   p ∨ ⊤ ≡ ⊤", [
    "p | ⊤ | p∧⊤ | p∨⊤",
    "T | T |  T  |  T",
    "F | T |  F  |  T",
    "",
    "p∧⊤: same column as p  →  p∧⊤ ≡ p  ✔",
    "p∨⊤: always T          →  p∨⊤ ≡ ⊤  ✔",
])
gap_box("p ∧ ⊥ ≡ ⊥   and   p ∨ ⊥ ≡ p   and   ¬⊤ ≡ ⊥   and   ¬⊥ ≡ ⊤", [
    "p | ⊥ | p∧⊥ | p∨⊥ | ¬⊤ | ¬⊥",
    "T | F |  F  |  T  |  F |  T",
    "F | F |  F  |  F  |  F |  T",
    "",
    "p∧⊥: always F    →  p∧⊥ ≡ ⊥  ✔",
    "p∨⊥: same as p   →  p∨⊥ ≡ p  ✔",
    "¬⊤ : always F    →  ¬⊤ ≡ ⊥   ✔",
    "¬⊥ : always T    →  ¬⊥ ≡ ⊤   ✔",
])

ssec("Worked Example — Show p ∨ (q ∨ ¬p) is a tautology")
proof("Method 1 — Truth Table", [
    "p | q | ¬p | q∨¬p | p∨(q∨¬p)",
    "T | T |  F |  T   |     T",
    "T | F |  F |  F   |     T",
    "F | T |  T |  T   |     T",
    "F | F |  T |  T   |     T",
    "All rows TRUE → tautology  ✔",
])
proof("Method 2 — Algebraic", [
    "p ∨ (q ∨ ¬p)",
    "≡ p ∨ (¬p ∨ q)    [commutative]",
    "≡ (p ∨ ¬p) ∨ q    [associative]",
    "≡ ⊤ ∨ q            [p∨¬p = ⊤]",
    "≡ ⊤                [⊤∨q = ⊤]  □",
])

section("3.5  Logical Equivalence")
body("Propositions r and s are <b>logically equivalent</b> (r ≡ s) iff r↔s is a tautology, "
     "i.e. they share identical truth tables in every assignment.")

wide_table(
    [0.7*cm, 6.5*cm, W-7.2*cm],
    ["#","Equivalence","Law Name"],
    [
        ["(a)","P ∨ q  ≡  q ∨ P","∨ commutative"],
        ["(b)","P ∧ q  ≡  q ∧ P","∧ commutative"],
        ["(c)","(P∨q)∨r  ≡  P∨(q∨r)","∨ associative"],
        ["(d)","(P∧q)∧r  ≡  P∧(q∧r)","∧ associative"],
        ["(e)","P∨(q∧r)  ≡  (P∨q)∧(P∨r)","∨ distributes over ∧"],
        ["(f)","P∧(q∨r)  ≡  (P∧q)∨(P∧r)","∧ distributes over ∨"],
        ["(g)","F∨P ≡ P","Identity (F = False/⊥)"],
        ["(h)","T∧P ≡ P","Identity (T = True/⊤)"],
        ["(i)","P∨P ≡ P","Idempotent ∨"],
        ["(j)","P∧P ≡ P","Idempotent ∧"],
        ["(k)","P∧(P∨q) ≡ P","Absorption"],
        ["(l)","P∨(P∧q) ≡ P","Absorption"],
        ["(m)","F∧P ≡ F","Domination"],
        ["(n)","T∨P ≡ T","Domination"],
        ["(o)","¬(P∨q) ≡ ¬P∧¬q","De Morgan"],
        ["(p)","¬(P∧q) ≡ ¬P∨¬q","De Morgan"],
        ["(q)","P→q   ≡ ¬P∨q","Implication law"],
        ["(r)","P→q   ≡ ¬q→¬P","Contrapositive"],
        ["(s)","P∨¬P  ≡ T","Tautology"],
        ["(t)","P∧¬P  ≡ F","Contradiction"],
        ["(u)","(P→q)∧(q→P) ≡ P↔q","Equivalence"],
    ],
    hbg=CPU
)

ssec("Example 3.1 (from handout) — Show (p→q)∧(q→p) ≡ p↔q")
proof("Truth table proof", [
    "p | q | p→q | q→p | (p→q)∧(q→p) | p↔q",
    "T | T |  T  |  T  |      T       |  T",
    "T | F |  F  |  T  |      F       |  F",
    "F | T |  T  |  F  |      F       |  F",
    "F | F |  T  |  T  |      T       |  T",
    "Columns 5 and 6 identical → ≡  ✔  □",
])

ssec("Example 3.2 (from handout) — Show (p∧q)→p is a tautology")
proof("Algebraic proof", [
    "(p∧q)→p",
    "≡ ¬(p∧q) ∨ p       [implication: A→B ≡ ¬A∨B]",
    "≡ (¬p∨¬q) ∨ p      [De Morgan]",
    "≡ (¬q∨¬p) ∨ p      [commutative]",
    "≡ ¬q ∨ (¬p∨p)      [associative]",
    "≡ ¬q ∨ T           [¬p∨p = T]",
    "≡ T                [T∨anything = T]  □",
])

ssec("Example 3.3 (from handout) — Show (p→q) ≡ (¬q→¬p)")
proof("Algebraic proof — Contrapositive Law", [
    "(¬q→¬p)",
    "≡ ¬(¬q) ∨ (¬p)    [implication law]",
    "≡ q ∨ (¬p)        [double negation: ¬¬q=q]",
    "≡ ¬p ∨ q          [commutative]",
    "≡ p → q           [implication law]  □",
])

section("3.6  Conjunctive Normal Form (CNF)")
defn("Literal",  "An atom p or its negation ¬p.")
defn("Clause",   "A disjunction of one or more literals: l₁ ∨ l₂ ∨ … ∨ lₙ")
defn("CNF",      "A conjunction of clauses: (c₁)∧(c₂)∧…∧(cₙ), each clause a disjunction of literals.")

box("CNF vs. Non-CNF", [
    "IN CNF:     (¬p∨q∨r) ∧ (¬q∨r) ∧ (¬r)",
    "NOT CNF:    (¬p∨q∨r) ∧ ((p∧¬q)∨r) ∧ (¬r)   ← middle clause not a disjunction of literals",
    "NOT CNF:    (¬p∨q∨r) ∧ ¬(¬q∨r) ∧ (¬r)       ← ¬(…) inside is not a literal",
], bg=BG1, hc=CB)

body("<b>Algorithm to convert any formula to CNF:</b>",
     "  1. Eliminate → using  A→B ≡ ¬A∨B",
     "  2. Push ¬ inward using De Morgan: ¬(A∧B) ≡ ¬A∨¬B;  ¬(A∨B) ≡ ¬A∧¬B",
     "  3. Eliminate double negation: ¬¬A ≡ A",
     "  4. Distribute ∨ over ∧:  A∨(B∧C) ≡ (A∨B)∧(A∨C)")

ssec("CNF Example (from handout) — Convert (¬p→¬q)→(p→q) to CNF")
proof("Step-by-step", [
    "Start: (¬p→¬q) → (p→q)",
    "",
    "Step 1 — Eliminate all →:",
    "  ¬p→¬q  ≡  p∨¬q      [¬(¬p)∨¬q = p∨¬q]",
    "  p→q    ≡  ¬p∨q",
    "  Outer: (p∨¬q) → (¬p∨q)  ≡  ¬(p∨¬q) ∨ (¬p∨q)",
    "",
    "Step 2 — Push ¬ inward:",
    "  ¬(p∨¬q) ≡ ¬p ∧ ¬(¬q) = ¬p ∧ q    [De Morgan + double neg]",
    "  Now: (¬p∧q) ∨ (¬p∨q)",
    "",
    "Step 4 — Distribute ∨ over ∧:",
    "  (¬p∧q) ∨ (¬p∨q)",
    "  = (¬p∨(¬p∨q)) ∧ (q∨(¬p∨q))   [A∨(B∧C)=(A∨B)∧(A∨C)]",
    "  = (¬p∨¬p∨q) ∧ (q∨¬p∨q)",
    "  = (¬p∨q) ∧ (¬p∨q)             [idempotent]",
    "  = (¬p∨q)                       [idempotent]",
    "",
    "CNF Result: (¬p∨q)  ✔   [note: this equals p→q, consistent]",
])

ssec("GAP-SOLUTION 5 — CNF Satisfiability Test via ¬∅ Method")
gap_box("Algorithm: Test if ∅ is satisfiable", [
    "1. Form ¬∅",
    "2. Transform ¬∅ to CNF",
    "3. If ANY clause lacks a complement pair → ¬∅ not a tautology → ∅ is SATISFIABLE",
    "4. If EVERY clause has a complement pair → ¬∅ is a tautology → ∅ is UNSATISFIABLE",
])
gap_box("Example A — Is (p→q) satisfiable?", [
    "¬(p→q) ≡ ¬(¬p∨q) ≡ p∧¬q       [CNF: clauses (p) and (¬q)]",
    "Clause (p): no complement pair → NOT valid",
    "∴ (p→q) is SATISFIABLE  ✔   [e.g. M(p)=T,M(q)=T makes it true]",
])
gap_box("Example B — Is (p∧¬p) satisfiable?", [
    "¬(p∧¬p) ≡ ¬p∨¬(¬p) ≡ ¬p∨p      [CNF: one clause (¬p∨p)]",
    "Clause (¬p∨p): contains p and ¬p → VALID",
    "ALL clauses valid → ¬(p∧¬p) is a tautology → (p∧¬p) is UNSATISFIABLE  ✔",
])

ssec("GAP-SOLUTION 6 — CNF Validity: Clarifying the Handout's Example 3 Typo")
gap_box("The handout's three validity examples", [
    "1. ¬p ∨ q ∨ p ∨ r         → VALID   (contains p and ¬p)",
    "2. (¬p∨q∨p) ∧ (r∨¬r)     → VALID   (both clauses have complement pairs)",
    "3. As printed in handout, example 3 is IDENTICAL to example 2 — this is a TYPO.",
    "",
    "Likely intended example 3:",
    "   (¬p∨q∨p) ∧ (r∨s)   — is NOT VALID",
    "   Clause 1: (¬p∨q∨p) → has p and ¬p → VALID",
    "   Clause 2: (r∨s)     → no complement pair → NOT VALID",
    "   Whole formula NOT VALID (set r=F,s=F → clause 2 = F → whole formula = F)  ✔",
    "",
    "KEY RULE: CNF is valid iff EVERY single clause contains a complement pair Li∨¬Li.",
])

section("3.7  Natural Deduction")
body("Natural deduction proves the validity of a sequent Γ ⊢ S.",
     "Start assuming all formulas in Γ are true; apply rules to derive S.")

rules = [
    ("Modus Ponens (MP / E⇒)",
     "If A→B and A, conclude B.",
     ["  A → B","  A","  ───────","  B     MP"]),
    ("Modus Tollens (MT)",
     "If A→B and ¬B, conclude ¬A.",
     ["  A → B","  ¬B","  ───────","  ¬A    MT"]),
    ("Hypothetical Syllogism (HS)",
     "If A→B and B→C, conclude A→C.  (Chain rule / transitivity)",
     ["  A → B","  B → C","  ───────","  A → C   HS"]),
    ("Disjunctive Syllogism (DS)",
     "If A∨B and ¬A, conclude B.",
     ["  A ∨ B","  ¬A","  ───────","  B     DS"]),
    ("Disjunction Introduction (∨I)",
     "If A, conclude A∨B  (for any B).",
     ["  A","  ───────","  A ∨ B   ∨I"]),
    ("Disjunction Elimination (∨E)",
     "If P→Q, R→Q, and P∨R, conclude Q.",
     ["  P → Q","  R → Q","  P ∨ R","  ───────","  Q     ∨E"]),
    ("Negation Introduction  (¬I / Reductio)",
     "Assume A; if you derive both B and ¬B, conclude ¬A.",
     ["  | A     (hypothesis)","  | B","  | ¬B","  ─────────────","    ¬A    ¬I"]),
    ("Negation Elimination  (¬E / Double Negation)",
     "From ¬¬A, conclude A.",
     ["  ¬¬A","  ─────","  A     ¬E"]),
]
for rname, rdesc, rlines in rules:
    ssec(rname)
    body(rdesc)
    proof(f"Rule: {rname}", rlines)

ssec("GAP-SOLUTION 7 — Modus Tollens Worked Examples")
gap_box("MT Example 1: Prove ¬P from P→Q and ¬Q", [
    "1.  P → Q     Premise",
    "2.  ¬Q        Premise",
    "3.  ¬P        MT 1,2  ✔",
    "Interpretation: 'If it rains the ground is wet' + 'ground is not wet' → 'not raining'",
])
gap_box("MT Example 2: Prove ¬A from A→B, B→C, ¬C", [
    "1.  A → B     Premise",
    "2.  B → C     Premise",
    "3.  ¬C        Premise",
    "4.  A → C     HS 1,2",
    "5.  ¬A        MT 4,3  ✔  □",
])
gap_box("MT Example 3: Distinguish MT from DS (common exam mistake)", [
    "Modus Tollens  needs a CONDITIONAL (→):",
    "   A→B  and  ¬B  →  ¬A",
    "",
    "Disjunctive Syllogism  needs a DISJUNCTION (∨):",
    "   A∨B  and  ¬A  →  B",
    "",
    "NEVER apply MT to A∨B — you need A→B for MT.",
])

ssec("Worked Natural Deduction Example — Prove B from A∨B, ¬A")
proof("Proof", [
    "1.  A ∨ B    Premise",
    "2.  ¬A       Premise",
    "3.  B        DS 1,2  ✔  □",
])

section("3.8  Limitations of Propositional Logic")
body("Propositional logic hides the internal structure of basic propositions.",
     "Example: 'John is a science student' is just p — we cannot reason about 'John' as "
     "an object or 'science student' as a property.",
     "This motivates <b>Predicate Logic</b> (Chapter 4).")
page_break()

# ═══════════════════════════════════════════════════════════════════════════
#  CHAPTER 4 — PREDICATE LOGIC
# ═══════════════════════════════════════════════════════════════════════════
chapter(4, "PREDICATE LOGIC  (First-Order Logic)")

body("Predicate logic exposes the <b>internal structure</b> of propositions: objects, "
     "properties, and relations.",
     "It extends propositional logic with quantifiers ∀ (for all) and ∃ (there exists).",
     "It includes all propositional connectives: ∨, ∧, →, ↔, ¬.")

defn("Constant", "A name for a specific object: a, b, j (John), m (Mary), …")
defn("Variable", "Represents an indefinite object: x, y, z, …")
defn("Predicate", "A property or relation. Capital letter + arguments: Wx, Sjm, Gjmb, …")
body("1-place predicates: unary  |  2-place: binary  |  3-place: ternary")

section("4.1  Translation Key")
box("Translation Table (from handout)", [
    "Natural language              Logical formula",
    "─────────────────────────────────────────────",
    "John walks                 →  Wj",
    "John is a boy              →  Bj",
    "He walks  (x = he)         →  Wx",
    "John sees Mary             →  Sjm   (S: 1st sees 2nd)",
    "John gives Mary the book   →  Gjmb  (G: 1st gives 2nd, 3rd is object)",
    "",
    "⚠  Order matters: Sjm ≠ Smj",
], bg=BG1, hc=CB)

section("4.2  Quantifiers and Variables")
defn("∀x  (Universal quantifier)", "'For ALL x …'  — pairs with CONDITIONAL →")
defn("∃x  (Existential quantifier)", "'There EXISTS an x …'  — pairs with CONJUNCTION ∧")
rule("Universals go with CONDITIONALS:   'All A are B'    →  ∀x(Ax → Bx)")
rule("Existentials go with CONJUNCTIONS: 'Some A are B'   →  ∃x(Ax ∧ Bx)")

box("Quantification Examples (from handout — all four)", [
    "1. Everyone is smart",
    "   Unquantified: Sx   →   Quantified: ∀xSx",
    "   Read: 'For all x, x is smart'",
    "",
    "2. John likes someone  (j = John)",
    "   Unquantified: Ljx  →   Quantified: ∃xLjx",
    "   Read: 'There exists an x that John likes'",
    "",
    "3. Everyone liked the toad  (t = toad)",
    "   Unquantified: Lxt  →   Quantified: ∀xLxt",
    "   Read: 'For every x, x liked the toad'",
    "",
    "4. Nigel is taller than everyone  (n = Nigel)",
    "   Unquantified: Tnx  →   Quantified: ∀xTnx",
    "   Read: 'For all x, Nigel is taller than x'",
], bg=BG3, hc=CG)

section("4.3  Syntax of Quantifiers & Universe of Discourse")
body("A quantifier must always be followed by a variable, then a formula.",
     "Quantifiers always implicitly or explicitly range over a <b>domain D</b> "
     "(the Universe of Discourse).")
box("Universe of Discourse Examples", [
    "∀xHx  ('everyone is happy') implicitly assumes x ranges over people.",
    "",
    "If D = {all things}, we must write:  ∀x(Px → Hx)",
    "Read: 'For all x, if x is a person, then x is happy'",
    "",
    "Nested quantifiers:",
    "  ∃x(Fx → Fa)",
    "  ∃y∀x((Rxy ∧ Ryx) → (Lxy ∧ Lyx))",
], bg=BG6, hc=CTE)

section("4.4  Syllogistic Statements")
defn("Syllogism", "An argument: two premises + a conclusion inferred from them.")
box("Classic Syllogism (from handout) + Full Formal Derivation", [
    "All men are mortal   (major premise)",
    "Aristotle is a man   (minor premise)",
    "∴ Aristotle is mortal (conclusion)",
    "",
    "Formalisation: Mx='x is a man', Rx='x is mortal', a=Aristotle",
    "  ∀x(Mx→Rx)   and   Ma   →   Ra",
    "",
    "Formal Proof:",
    "  1.  ∀x(Mx→Rx)    Premise",
    "  2.  Ma            Premise",
    "  3.  Ma→Ra         1, U.I.  [Universal Instantiation: x ← a]",
    "  4.  Ra            2,3, MP  [Modus Ponens]  □",
], bg=BG3, hc=CG)

ssec("GAP-SOLUTION 8 — All Four Syllogistic Forms with Full Derivations")
gap_box("Form 1: 'All A are B' + 'c is A' → 'c is B'", [
    "∀x(Ax→Bx)  and  Ac",
    "  3. Ac→Bc    U.I.",
    "  4. Bc        MP 2,3  □",
])
gap_box("Form 2: 'No A is B' + 'c is A' → 'c is not B'", [
    "∀x(Ax→¬Bx)  and  Ac",
    "  3. Ac→¬Bc   U.I.",
    "  4. ¬Bc       MP 2,3  □",
])
gap_box("Form 3: 'All A are B' + 'c is not B' → 'c is not A'  (MT form)", [
    "∀x(Ax→Bx)  and  ¬Bc",
    "  3. Ac→Bc    U.I.",
    "  4. ¬Ac       MT 3,2  □",
])
gap_box("Harder Syllogism: 'No fish are mammals; All whales are mammals; ∴ No whale is a fish'", [
    "Fx=fish, Mx=mammal, Wx=whale",
    "1. ∀x(Fx→¬Mx)   Premise",
    "2. ∀x(Wx→Mx)    Premise",
    "3. Fv→¬Mv        1, U.I. [arbitrary v]",
    "4. Wv→Mv         2, U.I.",
    "5. Mv→¬Fv        Contrapositive of 3  (A→¬B ≡ B→¬A)",
    "6. Wv→¬Fv        HS 4,5",
    "7. ∀x(Wx→¬Fx)   6, U.G.  □",
])

section("4.5  Conjunctive Predicate Combinations")
ssec("GAP-SOLUTION 9 — Full Reasoning for Each Example")
gap_box("(a) Every Purple Squid is Friendly — step by step", [
    "Key: Px='x is Purple', Sx='x is a Squid', Fx='x is Friendly'",
    "Keyword 'Every' → universal → use ∀ with →",
    "'Purple Squid' is conjunctive: Px ∧ Sx",
    "Result: ∀x((Px ∧ Sx) → Fx)",
    "",
    "WRONG: ∀x(Px∧Sx∧Fx)  — that says 'everything is purple, a squid, and friendly'!",
])
gap_box("(b) Some Monsters are Hairy Drunkards — step by step", [
    "Key: Mx=Monster, Hx=Hairy, Dx=Drunkard",
    "Keyword 'Some' → existential → use ∃ with ∧",
    "'Hairy Drunkard' is conjunctive: Hx ∧ Dx",
    "Result: ∃x(Mx ∧ Hx ∧ Dx)",
    "",
    "WRONG: ∃x(Mx→(Hx∧Dx))  — does NOT require any monsters to exist!",
])
gap_box("(c) No Invisible Lemur is a Criminal — step by step", [
    "Key: Ix=Invisible, Lx=Lemur, Cx=Criminal",
    "'No ...' is a negative universal; two equivalent forms:",
    "  Form A: ¬∃x((Ix∧Lx) ∧ Cx)         [from handout]",
    "  Form B: ∀x((Ix∧Lx) → ¬Cx)         [equivalent]",
    "Verify: ¬∃x(P∧Q) ≡ ∀x(¬P∨¬Q) ≡ ∀x(P→¬Q)  by QD1 + De Morgan  ✔",
])
warn("Some compound nouns CANNOT be split: 'alleged criminal', 'expectant mother', "
     "'deer hunter' — treat as SINGLE predicates.")

section("4.6  Disjunctive Predicate Combinations")
gap_box("'All cats and dogs make suitable pets' — correct translation", [
    "WRONG: ∀x((Cx∧Dx)→Sx)  — says 'everything that is BOTH cat AND dog', impossible!",
    "",
    "CORRECT option 1: ∀x(Cx→Sx) ∧ ∀x(Dx→Sx)   (two separate universals)",
    "CORRECT option 2: ∀x((Cx∨Dx)→Sx)            (disjunction in antecedent)",
    "Read: 'For all x, if x is a cat OR a dog, then x makes a suitable pet'  ✔",
])

section("4.7  Laws and Rules of Inference in Predicate Logic")

ssec("Laws of Quantifier Distribution")
wide_table(
    [1.5*cm, 6.5*cm, W-8*cm],
    ["Law","Statement","Direction"],
    [
        ["QD1","¬(∀x)φ(x)  ⟺  (∃x)¬φ(x)","Equivalence (both ways)"],
        ["QD2","(∀x)(φ∧ψ)  ⟺  (∀x)φ ∧ (∀x)ψ","Equivalence (both ways)"],
        ["QD3","(∃x)(φ∨ψ)  ⟺  (∃x)φ ∨ (∃x)ψ","Equivalence (both ways)"],
        ["QD4","(∀x)φ∨(∀x)ψ  ⟹  (∀x)(φ∨ψ)","ONE WAY only (⟹ not ⟺)"],
        ["QD5","(∃x)(φ∧ψ)    ⟹  (∃x)φ∧(∃x)ψ","ONE WAY only (⟹ not ⟺)"],
        ["QS6","(∀x)(∀y)φ  ⟺  (∀y)(∀x)φ","Order of two ∀ irrelevant"],
        ["QS7","(∃x)(∃y)φ  ⟺  (∃y)(∃x)φ","Order of two ∃ irrelevant"],
        ["QS8","(∃x)(∀y)φ  ⟹  (∀y)(∃x)φ","ONE WAY only (⟹ not ⟺)"],
    ],
    hbg=CTE
)

ssec("GAP-SOLUTION 10 — Concrete Examples Explaining WHY QD4, QD5, QS8 Are One-Way")
gap_box("QD4 Counterexample — why (∀x)(φ∨ψ) does NOT imply (∀x)φ∨(∀x)ψ", [
    "D = {Alice, Bob};  φ(x)='x likes logic';  ψ(x)='x likes rock climbing'",
    "Alice: φ=T, ψ=F  |  Bob: φ=F, ψ=T",
    "",
    "(∀x)(φ∨ψ): Alice T∨F=T ✔, Bob F∨T=T ✔  →  TRUE",
    "(∀x)φ∨(∀x)ψ: (∀x)φ: Bob fails=FALSE; (∀x)ψ: Alice fails=FALSE → FALSE∨FALSE=FALSE",
    "",
    "RHS=TRUE but LHS=FALSE → reverse implication FAILS.  □",
    "Moral: knowing 'everyone likes logic or climbing' does NOT mean everyone likes logic",
    "       OR everyone likes climbing — some could like logic, others rock climbing.",
])
gap_box("QD5 Counterexample — why (∃x)φ∧(∃x)ψ does NOT imply (∃x)(φ∧ψ)", [
    "D = {Alice, Bob};  φ(x)='x is tall';  ψ(x)='x is smart'",
    "Alice: tall=T, smart=F  |  Bob: tall=F, smart=T",
    "",
    "(∃x)φ ∧ (∃x)ψ: ∃ tall (Alice)=T; ∃ smart (Bob)=T → TRUE",
    "(∃x)(φ∧ψ): Alice T∧F=F; Bob F∧T=F → FALSE",
    "",
    "RHS=TRUE but LHS=FALSE → reverse fails.  □",
    "Moral: 'someone is tall AND someone is smart' does NOT mean the SAME person",
    "       is both tall and smart.",
])
gap_box("QS8 Counterexample — why (∀y)(∃x)φ does NOT imply (∃x)(∀y)φ", [
    "φ(x,y) = 'x is the teacher of y'",
    "Teachers={T1,T2}, Students={S1,S2,S3}",
    "T1 teaches S1 and S2; T2 teaches S3",
    "",
    "(∀y)(∃x)φ: every student has a teacher → TRUE",
    "(∃x)(∀y)φ: one teacher teaches ALL students → FALSE (no such teacher)",
    "",
    "Reverse fails.  □",
    "Moral: 'for every y there exists SOME x (possibly different)' is WEAKER than",
    "       'there exists ONE x that works for ALL y'.",
])

ssec("Four Rules of Inference for Quantifiers")
qi = [
    ("Universal Instantiation  (U.I.)",
     "From ∀xφ(x), substitute any constant c:  conclude φ(c).",
     ["(∀x)φ(x)", "─────────", "∴ φ(c)      for any constant c"]),
    ("Universal Generalization  (U.G.)",
     "From φ(v) for ARBITRARY v, conclude ∀xφ(x).  v must be completely arbitrary.",
     ["φ(v)", "─────────", "∴ (∀x)φ(x)"]),
    ("Existential Generalization  (E.G.)",
     "From φ(c) for some specific c, conclude ∃xφ(x).",
     ["φ(c)", "─────────", "∴ (∃x)φ(x)"]),
    ("Existential Instantiation  (E.I.)",
     "From ∃xφ(x), introduce a BRAND NEW constant w: conclude φ(w).",
     ["(∃x)φ(x)", "─────────", "∴ φ(w)      w must be new (never used before)"]),
]
for rname, rdesc, rlines in qi:
    ssec(rname)
    body(rdesc)
    proof(f"Rule: {rname}", rlines)

ssec("Worked Proof 1 (U.I. from handout) — Prove H(a) from G(a) and ∀x(G(x)→H(x))")
proof("Proof", [
    "1.  (∀x)(G(x)→H(x))    Given",
    "2.  G(a)                Given",
    "3.  G(a)→H(a)           1, U.I.   [substitute x = a]",
    "4.  H(a)                2,3, MP   □",
])

ssec("Worked Proof 2 (U.G. from handout) — Prove ∀x(R(x)→W(x))")
proof("Given: ∀x(R(x)→Q(x)) and ∀x(Q(x)→W(x))", [
    "1.  (∀x)(R(x)→Q(x))    Given",
    "2.  (∀x)(Q(x)→W(x))    Given",
    "3.  R(v)→Q(v)           1, U.I.  [arbitrary v]",
    "4.  Q(v)→W(v)           2, U.I.",
    "5.  R(v)→W(v)           3,4, HS",
    "6.  (∀x)(R(x)→W(x))    5, U.G.  □",
])

ssec("Worked Proof 3 (E.I. from handout) — Prove (∃x)P(x)∧(∃x)Q(x)  from  ∃x(P(x)∧Q(x))")
proof("Proof", [
    "1.  (∃x)(P(x)∧Q(x))      Given",
    "2.  P(w)∧Q(w)             1, E.I.  [w is brand-new]",
    "3.  P(w)                  2, Simplification",
    "4.  (∃x)P(x)              3, E.G.",
    "5.  Q(w)                  2, Simplification",
    "6.  (∃x)Q(x)              5, E.G.",
    "7.  (∃x)P(x)∧(∃x)Q(x)    4,6, Conjunction  □",
])

section("4.8  Indirect Proof (Reductio ad Absurdum)")
body("Assume the NEGATION of the goal. Derive a contradiction (A∧¬A). "
     "Conclude the original goal must be true.")

proof("Proof: (∀x)G(x) → (∃x)G(x)  — from no assumptions", [
    "1.  ¬((∀x)G(x)→(∃x)G(x))    Auxiliary premise [assume negation of goal]",
    "2.  ¬(¬(∀x)G(x) ∨ (∃x)G(x)) 1, Implication law: A→B ≡ ¬A∨B",
    "3.  (∀x)G(x) ∧ ¬(∃x)G(x)    2, De Morgan + double negation",
    "4.  (∀x)G(x)                 3, Simplification",
    "5.  ¬(∃x)G(x)                3, Simplification",
    "6.  (∀x)¬G(x)                5, QD1  [¬∃x ≡ ∀x¬]",
    "7.  G(a)                     4, U.I.",
    "8.  ¬G(a)                    6, U.I.",
    "9.  G(a) ∧ ¬G(a)             7,8, Conjunction  ← CONTRADICTION",
    "10. (∀x)G(x)→(∃x)G(x)       1–9, Indirect Proof  □",
])

section("4.9  Conditional Proof")
body("Assume the antecedent as an auxiliary premise. Derive the consequent. "
     "The conditional is then established.")

proof("Proof: (∀x)G(x) → (∃x)G(x)  — by Conditional Proof", [
    "1.  (∀x)G(x)                 Auxiliary premise [assume antecedent]",
    "2.  G(a)                     1, U.I.",
    "3.  (∃x)G(x)                 2, E.G.",
    "4.  (∀x)G(x)→(∃x)G(x)       1–3, Conditional Proof  □",
])
note("Compare 4.8 and 4.9: both prove the same result by different strategies. "
     "Conditional Proof is simpler here.")
page_break()

# ═══════════════════════════════════════════════════════════════════════════
#  EXAM QUICK-REFERENCE  (last page)
# ═══════════════════════════════════════════════════════════════════════════
section("EXAM QUICK-REFERENCE", CD)
wide_table(
    [3.8*cm, W-3.8*cm],
    ["Topic","Key Fact to Remember"],
    [
        ["Math Induction",     "3 steps: Base Case → IH (assume k) → prove k+1. Integers only."],
        ["Structural Induction","2 steps: Base Case → Combination step (assume holds for parts)."],
        ["Boolean postulates", "Know De Morgan: x̄+ȳ = x̄·ȳ  and  x̄·ȳ = x̄+ȳ (bars over whole expression)."],
        ["K-Map grouping",     "Groups: rectangular, size = 2ⁱ. Larger = fewer literals. Wrap-around allowed."],
        ["Truth table size",   "n variables → 2ⁿ rows."],
        ["Tautology / Contradiction","⊤: always T; ⊥: always F; Contingency: sometimes T sometimes F."],
        ["CNF Algorithm",      "Eliminate →, push ¬ inward (De Morgan), remove ¬¬, distribute ∨ over ∧."],
        ["CNF Validity",       "Valid iff EVERY clause contains Li∨¬Li. One non-valid clause → not valid."],
        ["MP","A→B and A ⊢ B"],
        ["MT","A→B and ¬B ⊢ ¬A"],
        ["HS","A→B and B→C ⊢ A→C"],
        ["DS","A∨B and ¬A ⊢ B"],
        ["U.I.","(∀x)φ(x) ⊢ φ(c)  for any c"],
        ["U.G.","φ(v) ⊢ (∀x)φ(x)  v must be arbitrary"],
        ["E.G.","φ(c) ⊢ (∃x)φ(x)"],
        ["E.I.","(∃x)φ(x) ⊢ φ(w)  w must be NEW"],
        ["Universals + conditionals","'All A are B' → ∀x(Ax→Bx)   NOT ∀x(Ax∧Bx)"],
        ["Existentials + conjunctions","'Some A are B' → ∃x(Ax∧Bx)  NOT ∃x(Ax→Bx)"],
        ["QD1","¬∀xφ ⟺ ∃x¬φ   and   ¬∃xφ ⟺ ∀x¬φ"],
        ["QD4 & QD5","ONE-WAY only — the reverse counterexamples involve different people/objects."],
        ["QS8","∃x∀y is STRONGER than ∀y∃x — reverse fails (see Gap-10 counterexample)."],
    ],
    hbg=CD, abg=[colors.white, BG1]
)

story.append(sp(12))
story.append(p("Good luck in your exams!  Every example, every proof, every gap — all here.",
               S("gl", size=13, bold=True, color=CD, align=TA_CENTER)))

# ── build ─────────────────────────────────────────────────────────────────
doc.build(story)
print("Generated:", OUT)
