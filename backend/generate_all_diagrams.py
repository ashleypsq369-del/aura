# -*- coding: utf-8 -*-
"""
ProjectAura -- Dissertation Diagrams (Pure Academic Style)
==========================================================
White boxes, thin black borders, black text, clean arrows.
Matches standard dissertation / IEEE flowchart appearance.

RUN:  python generate_all_diagrams.py   (from backend/ folder)
"""
import sys
import os
# Force UTF-8 output so unicode chars in labels don't crash on Windows cp1252
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import warnings
warnings.filterwarnings('ignore')

OUT = os.path.dirname(os.path.abspath(__file__))

BG   = '#ffffff'
FG   = '#111111'   # box border + text + arrows
GRAY = '#888888'   # subtle annotation text only

plt.rcParams.update({
    'font.family':      'DejaVu Sans',
    'font.size':        11,
    'axes.facecolor':   BG,
    'figure.facecolor': BG,
})

def savefig(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, dpi=200, bbox_inches='tight',
                facecolor=BG, edgecolor='none')
    plt.close(fig)
    print(f'  {name}  ({os.path.getsize(path)//1024} KB)')


# ── Primitives ────────────────────────────────────────────────

def rect(ax, cx, cy, w, h, text, fs=11, bold=True):
    """White rounded box, black border, black text. Returns edge dict."""
    p = FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                       boxstyle='round,pad=0.04',
                       facecolor=BG, edgecolor=FG,
                       linewidth=1.2, zorder=3, clip_on=False)
    ax.add_patch(p)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs,
            color=FG, fontweight='bold' if bold else 'normal',
            zorder=4, multialignment='center', clip_on=False)
    return _box(cx, cy, w, h)

def diamond(ax, cx, cy, w, h, text, fs=11):
    """White diamond, black border."""
    hw, hh = w/2, h/2
    pts = [[cx, cy+hh], [cx+hw, cy], [cx, cy-hh], [cx-hw, cy]]
    poly = plt.Polygon(pts, facecolor=BG, edgecolor=FG,
                       linewidth=1.2, zorder=3)
    ax.add_patch(poly)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs,
            color=FG, fontweight='bold', zorder=4, multialignment='center')
    return dict(top=cy+hh, bottom=cy-hh,
                left=cx-hw, right=cx+hw, cx=cx, cy=cy)

def oval(ax, cx, cy, w, h, text, fs=11):
    """White ellipse, black border."""
    e = mpatches.Ellipse((cx, cy), w, h,
                         facecolor=BG, edgecolor=FG,
                         linewidth=1.2, zorder=3)
    ax.add_patch(e)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs,
            color=FG, fontweight='bold', zorder=4)
    return _box(cx, cy, w, h)

def _box(cx, cy, w, h):
    return dict(top=cy+h/2, bottom=cy-h/2,
                left=cx-w/2, right=cx+w/2, cx=cx, cy=cy)

def arrow_down(ax, b_above, b_below):
    """Arrow from bottom-centre of b_above to top-centre of b_below."""
    ax.annotate('',
        xy=(b_below['cx'], b_below['top']),
        xytext=(b_above['cx'], b_above['bottom']),
        arrowprops=dict(arrowstyle='->', color=FG, lw=1.2,
                        shrinkA=0, shrinkB=0))

def arrow_right(ax, b_left, b_right):
    """Arrow from right-centre of b_left to left-centre of b_right."""
    ax.annotate('',
        xy=(b_right['left'], b_right['cy']),
        xytext=(b_left['right'], b_left['cy']),
        arrowprops=dict(arrowstyle='->', color=FG, lw=1.2,
                        shrinkA=0, shrinkB=0))

def arrow_xy(ax, x1, y1, x2, y2, rad=0.0):
    """Free arrow between two exact points."""
    ax.annotate('',
        xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle='->', color=FG, lw=1.2,
                        shrinkA=0, shrinkB=0,
                        connectionstyle=f'arc3,rad={rad}'))

def fig_title(ax, cx, y, text):
    ax.text(cx, y, text, ha='center', va='top',
            fontsize=12, fontweight='bold', color=FG)

def sublabel(ax, cx, y, text):
    ax.text(cx, y, text, ha='center', va='top',
            fontsize=9, color=GRAY, style='italic')


# ══════════════════════════════════════════════════════════════
# FIG 3.1 - SDLC WATERFALL
# ══════════════════════════════════════════════════════════════
def fig3_1():
    # Exactly 5 phases as described in report Section 3.3.1-3.3.5
    BH, GAP = 0.72, 0.35
    N       = 5
    W       = 5.5
    fig_h   = 0.9 + N * (BH + GAP) + 0.5

    fig, ax = plt.subplots(figsize=(W, fig_h))
    ax.set_xlim(0, W); ax.set_ylim(0, fig_h); ax.axis('off')
    fig_title(ax, W/2, fig_h - 0.08,
              'Figure 3.1 - Software Development Life Cycle')
    sublabel(ax, W/2, fig_h - 0.40,
             'Project AURA - Waterfall Model (Royce, 1970)')

    labels = [
        '1.  Requirements Analysis',
        '2.  System Design',
        '3.  Implementation',
        '4.  Testing',
        '5.  Deployment and Documentation',
    ]

    boxes = []
    for i, lbl in enumerate(labels):
        cy = fig_h - 0.88 - i * (BH + GAP)
        b  = rect(ax, W/2, cy, W - 0.5, BH, lbl, fs=11)
        boxes.append(b)

    for i in range(len(boxes)-1):
        arrow_down(ax, boxes[i], boxes[i+1])

    savefig(fig, 'fig3_1_sdlc.png')


# ══════════════════════════════════════════════════════════════
# FIG 3.2 - SYSTEM ARCHITECTURE
# Matches report Section 3.4: 5 functional pillars as named
# in the figure caption: Data Input Layer, Intelligent
# Monitoring Core, Adaptive Care Guide, Unified Care
# Dashboard, and Continuity Bridge
# ══════════════════════════════════════════════════════════════
def fig3_2():
    fig, ax = plt.subplots(figsize=(9, 12))
    ax.set_xlim(0, 9); ax.set_ylim(0, 12); ax.axis('off')
    fig_title(ax, 4.5, 11.88,
              'Figure 3.2 - System Architecture')
    sublabel(ax, 4.5, 11.55,
             'Data Input Layer, Intelligent Monitoring Core, Adaptive Care Guide,\n'
             'Unified Care Dashboard, and Continuity Bridge')

    BH = 0.65
    BW = 7.0
    CX = 4.5

    # ── Five functional pillars (vertical stack) ─────────────────
    # 1. Data Input Layer (top - users enter data here)
    r1 = rect(ax, CX, 10.60, BW, BH,
              '1.  Data Input Layer\n'
              'Vitals  |  Symptoms  |  Medications  |  ESAS  |  PPS  |  Barthel  |  PHQ-9  |  GAD-7',
              fs=9.5)

    # 2. Intelligent Monitoring Core
    r2 = rect(ax, CX, 8.95, BW, BH,
              '2.  Intelligent Monitoring Core\n'
              '8 x XGBoost Classifiers  +  SHAP TreeExplainer  +  Weighted Risk Aggregation',
              fs=9.5)

    # 3. Adaptive Care Guide
    r3 = rect(ax, CX, 7.30, BW, BH,
              '3.  Adaptive Care Guide\n'
              'Care Plan Engine  |  Personalisation Engine  |  Journey Tracker  |  Clinical Rules',
              fs=9.5)

    # 4. Unified Care Dashboard (split into 2 side boxes to show roles)
    r4_l = rect(ax, 2.6, 5.60, 3.4, BH,
                '4.  Unified Care Dashboard\n'
                'Clinician  |  Caregiver  |  Patient  |  Admin',
                fs=9.5)
    r4_r = rect(ax, 6.5, 5.60, 3.4, BH,
                'Messaging  |  Alerts  |  Notifications\n'
                'AI Insights  |  Drug Interactions',
                fs=9.5)

    # 5. Continuity Bridge
    r5 = rect(ax, CX, 3.95, BW, BH,
              '5.  Continuity Bridge\n'
              'Memory Vault  |  Grief Journal  |  Grief Screening  |  Digital Legacy  |  Heir Access',
              fs=9.5)

    # ── Infrastructure band (bottom) ──────────────────────────────
    ax.text(CX, 3.05,
            'FastAPI Backend  (Port 8000)  +  SQLAlchemy  +  SQLite / PostgreSQL  +  WebSocket',
            ha='center', va='center', fontsize=9, color=GRAY, style='italic')
    ax.text(CX, 2.65,
            'React 19 + Vite Frontend  |  JWT Auth + RBAC  |  Audit Log  |  Offline-First Cache',
            ha='center', va='center', fontsize=9, color=GRAY, style='italic')

    # ── Users (top) ───────────────────────────────────────────────
    ax.text(CX, 11.25,
            'Users:  Clinician  |  Caregiver  |  Patient  |  Family  |  Admin',
            ha='center', va='center', fontsize=10, color=FG, fontweight='bold')

    # ── Arrows down the pillar spine ─────────────────────────────
    arrow_down(ax, r1, r2)
    arrow_down(ax, r2, r3)
    arrow_xy(ax, r3['cx'], r3['bottom'], r4_l['cx'], r4_l['top'])
    arrow_xy(ax, r3['cx'], r3['bottom'], r4_r['cx'], r4_r['top'])
    arrow_xy(ax, r4_l['cx'], r4_l['bottom'], r5['cx'], r5['top'])
    arrow_xy(ax, r4_r['cx'], r4_r['bottom'], r5['cx'], r5['top'])

    # User → Data Input
    arrow_xy(ax, CX, 11.08, CX, r1['top'])

    savefig(fig, 'fig3_2_architecture.png')


# ══════════════════════════════════════════════════════════════
# FIG 3.3 - ERD  (clean entity boxes)
# ══════════════════════════════════════════════════════════════
def fig3_3():
    fig, ax = plt.subplots(figsize=(13, 9))
    ax.set_xlim(0, 13); ax.set_ylim(0, 9); ax.axis('off')
    fig_title(ax, 6.5, 8.90, 'Figure 3.3 - Entity-Relationship Diagram (Key Tables)')

    ROW = 0.32

    def entity(cx, cy, name, attrs):
        hh  = 0.40
        bh  = len(attrs) * ROW
        top = cy + hh/2
        bot = cy - hh/2 - bh

        # Header (slightly shaded - lightest possible)
        hdr = FancyBboxPatch((cx-1.4, cy-hh/2), 2.8, hh,
                             boxstyle='round,pad=0.02',
                             facecolor='#eeeeee', edgecolor=FG, lw=1.1, zorder=3)
        ax.add_patch(hdr)
        ax.text(cx, cy, name, ha='center', va='center',
                fontsize=10, color=FG, fontweight='bold', zorder=4)

        # Body
        body = FancyBboxPatch((cx-1.4, bot), 2.8, bh,
                              boxstyle='round,pad=0.02',
                              facecolor=BG, edgecolor=FG, lw=1.0, zorder=2)
        ax.add_patch(body)
        for i, a in enumerate(attrs):
            bold = a.startswith('PK') or a.startswith('FK')
            ax.text(cx-1.28, top-hh-(i+0.55)*ROW, a,
                    fontsize=8.5, va='center', color=FG,
                    fontweight='bold' if bold else 'normal', zorder=4)

        return dict(
            r=(cx+1.4, cy), l=(cx-1.4, cy),
            top=(cx, top), bottom=(cx, bot),
            cx=cx, cy=cy
        )

    def rel(pt1, pt2, lbl=''):
        x1,y1 = pt1; x2,y2 = pt2
        arrow_xy(ax, x1, y1, x2, y2)
        if lbl:
            ax.text((x1+x2)/2, (y1+y2)/2+0.12, lbl,
                    fontsize=8, color=GRAY, ha='center')

    U  = entity(1.9,  8.1, 'USER',        ['PK  id','username','email','role'])
    P  = entity(5.8,  8.1, 'PATIENT',     ['PK  id','FK  user_id','patient_code','risk_level'])
    V  = entity(10.4, 8.1, 'VITAL',       ['PK  id','FK  patient_id','heart_rate','spo2'])
    M  = entity(10.4, 5.8, 'MEDICATION',  ['PK  id','FK  patient_id','name','dose'])
    AL = entity(10.4, 3.6, 'ALERT',       ['PK  id','FK  patient_id','severity','type'])
    CP = entity(5.8,  5.7, 'CARE_PLAN',   ['PK  id','FK  patient_id','phase','review_date'])
    G  = entity(5.8,  3.4, 'GOAL',        ['PK  id','FK  care_plan_id','title','status'])
    PR = entity(1.9,  5.7, 'PREDICTION',  ['PK  id','FK  patient_id','overall_risk','shap'])
    UP = entity(1.9,  3.3, 'USER_PREFS',  ['PK  id','FK  user_id','language','ai_consent'])

    rel(U['r'],  P['l'],   '1:1')
    rel(P['r'],  V['l'],   '1:N')
    rel((7.2,7.8), M['l'], '1:N')
    rel((7.2,7.5), AL['l'],'1:N')

    arrow_xy(ax, P['cx'], P['bottom'][1], CP['top'][0], CP['top'][1])
    ax.text(P['cx']+0.15, (P['bottom'][1]+CP['top'][1])/2, '1:1', fontsize=8, color=GRAY)

    arrow_xy(ax, CP['cx'], CP['bottom'][1], G['top'][0], G['top'][1])
    ax.text(CP['cx']+0.15, (CP['bottom'][1]+G['top'][1])/2, '1:N', fontsize=8, color=GRAY)

    rel(P['l'],  PR['r'],  '1:N')
    arrow_xy(ax, U['cx'], U['bottom'][1], PR['top'][0], PR['top'][1])
    arrow_xy(ax, PR['cx'], PR['bottom'][1], UP['top'][0], UP['top'][1])

    savefig(fig, 'fig3_3_erd.png')


# ══════════════════════════════════════════════════════════════
# FIG 3.4 - AI / SHAP PIPELINE
# Same fan-out / fan-in pattern as reference image
# ══════════════════════════════════════════════════════════════
def fig3_4():
    fig, ax = plt.subplots(figsize=(7, 11))
    ax.set_xlim(0, 7); ax.set_ylim(0, 11); ax.axis('off')
    fig_title(ax, 3.5, 10.90, 'Figure 3.4 - AI Risk Prediction & SHAP Pipeline')

    BH = 0.58; BW = 3.2; BW_SM = 1.7

    r_in   = rect(ax, 3.5, 10.20, BW, BH, 'Patient Record', fs=11)
    r_feat = rect(ax, 3.5,  9.20, BW, BH, 'Feature Engineering  (28 features)', fs=11)
    r_sel  = rect(ax, 3.5,  8.00, BW, BH, 'Model Selection', fs=11)

    # Fan out - 3 models
    r_m1 = rect(ax, 1.1, 6.80, BW_SM, BH, 'Pain Risk\nModel', fs=10)
    r_m2 = rect(ax, 3.5, 6.80, BW_SM, BH, 'Mortality\nModel', fs=10)
    r_m3 = rect(ax, 5.9, 6.80, BW_SM, BH, 'Admission\nModel', fs=10)

    # Fan in - converge to training
    r_train = rect(ax, 3.5, 5.55, BW, BH, 'Model Training  (XGBoost x 8)', fs=11)
    r_score = rect(ax, 3.5, 4.55, BW, BH, 'Risk Score  (0.0 - 1.0)', fs=11)
    r_shap  = rect(ax, 3.5, 3.55, BW, BH, 'SHAP Explainer', fs=11)
    r_store = rect(ax, 3.5, 2.55, BW, BH, 'Prediction Stored  (Database)', fs=11)
    r_disp  = rect(ax, 3.5, 1.55, BW, BH, 'Frontend Display  (Clinician)', fs=11)

    arrow_down(ax, r_in,   r_feat)
    arrow_down(ax, r_feat, r_sel)

    # Fan out from Model Selection
    arrow_xy(ax, r_sel['cx'], r_sel['bottom'], r_m1['cx'], r_m1['top'])
    arrow_xy(ax, r_sel['cx'], r_sel['bottom'], r_m2['cx'], r_m2['top'])
    arrow_xy(ax, r_sel['cx'], r_sel['bottom'], r_m3['cx'], r_m3['top'])

    # Fan in to Model Training
    arrow_xy(ax, r_m1['cx'], r_m1['bottom'], r_train['cx'], r_train['top'])
    arrow_xy(ax, r_m2['cx'], r_m2['bottom'], r_train['cx'], r_train['top'])
    arrow_xy(ax, r_m3['cx'], r_m3['bottom'], r_train['cx'], r_train['top'])

    arrow_down(ax, r_train, r_score)
    arrow_down(ax, r_score, r_shap)
    arrow_down(ax, r_shap,  r_store)
    arrow_down(ax, r_store, r_disp)

    savefig(fig, 'fig3_4_ai_pipeline.png')


# ══════════════════════════════════════════════════════════════
# FIG 3.5 - SECURITY / DATA-FLOW
# ══════════════════════════════════════════════════════════════
def fig3_5():
    BH, GAP = 0.58, 0.44
    N       = 7
    W       = 6.0
    fig_h   = 1.2 + N*(BH+GAP)

    fig, ax = plt.subplots(figsize=(W, fig_h))
    ax.set_xlim(0, W); ax.set_ylim(0, fig_h); ax.axis('off')
    fig_title(ax, W/2, fig_h-0.08, 'Figure 3.5 - Security & Data-Flow Architecture')
    sublabel(ax, W/2, fig_h-0.42, 'Request lifecycle: Client to Database')

    layers = [
        'Client  (Browser / Desktop)',
        'HTTPS Transport  (TLS Encrypted)',
        'JWT Authentication Middleware',
        'RBAC Authorisation  (5 Roles)',
        'Endpoint Handler + Input Validation',
        'Audit Log  (HIPAA Compliance)',
        'SQLite Database  (bcrypt hashed)',
    ]

    boxes = []
    for i, lbl in enumerate(layers):
        cy = fig_h - 0.85 - i*(BH+GAP)
        b  = rect(ax, W/2, cy, W-0.4, BH, lbl, fs=11)
        boxes.append(b)

    for i in range(len(boxes)-1):
        arrow_down(ax, boxes[i], boxes[i+1])

    savefig(fig, 'fig3_5_security.png')


# ══════════════════════════════════════════════════════════════
# FIG 3.6 - SYSTEM PROCESS FLOWCHART  (with diamonds + fan)
# ══════════════════════════════════════════════════════════════
def fig3_6():
    RW, RH = 4.0, 0.58
    DW, DH = 3.6, 0.56
    OW, OH = 3.0, 0.52

    fig, ax = plt.subplots(figsize=(7, 17))
    ax.set_xlim(0, 7); ax.set_ylim(0, 17); ax.axis('off')
    fig_title(ax, 3.5, 16.88, 'Figure 3.6 - System Process Flowchart')

    CX = 3.5  # centre x

    def R(cy, lbl):  return rect(ax,    CX, cy, RW, RH, lbl, fs=11)
    def D(cy, lbl):  return diamond(ax, CX, cy, DW, DH, lbl, fs=10)
    def O(cy, lbl):  return oval(ax,    CX, cy, OW, OH, lbl, fs=11)

    # Elements top → bottom
    e_start  = O(16.20, 'START')
    e_open   = R(15.30, 'User opens application')
    e_d_log  = D(14.30, 'Valid login?')
    e_jwt    = R(13.30, 'JWT token issued -- role assigned')
    e_d_first= D(12.30, 'First login?')
    e_quest  = R(11.30, 'Personalisation questionnaire')
    e_dash   = R(10.30, 'Role-specific dashboard loaded')

    # Role fan-out
    e_d_role = D( 9.30, 'Role?')
    e_clin   = R( 8.30, 'Clinician view')
    e_pat    = R( 8.30, 'Patient view')
    e_fam    = R( 8.30, 'Family view')

    # Clinician path continues in centre
    e_sel    = R( 7.20, 'Clinician selects patient record')
    e_ml     = R( 6.20, '8 x XGBoost models run in parallel')
    e_shap   = R( 5.20, 'SHAP explains top risk factors')
    e_d_risk = D( 4.20, 'Risk >= HIGH?')
    e_alert  = R( 3.20, 'Alert created + Push notification')
    e_care   = R( 2.20, 'Clinician reviews & updates care plan')
    e_end    = O( 1.20, 'REPEAT DAILY')

    # Main spine arrows
    arrow_down(ax, e_start,  e_open)
    arrow_down(ax, e_open,   e_d_log)
    arrow_down(ax, e_d_log,  e_jwt)
    arrow_down(ax, e_jwt,    e_d_first)
    arrow_down(ax, e_d_first,e_quest)
    arrow_down(ax, e_quest,  e_dash)
    arrow_down(ax, e_dash,   e_d_role)

    # Role fan-out: left / centre / right
    cx_l, cx_c, cx_r = 1.2, CX, 5.8
    arrow_xy(ax, CX, e_d_role['bottom'], cx_l, e_clin['top'])
    arrow_xy(ax, CX, e_d_role['bottom'], cx_c, e_pat['top'])
    arrow_xy(ax, CX, e_d_role['bottom'], cx_r, e_fam['top'])

    # Place the 3 role boxes explicitly at different x
    e_clin = rect(ax, cx_l, 8.30, 1.9, RH, 'Clinician\nview', fs=10)
    e_pat  = rect(ax, cx_c, 8.30, 1.9, RH, 'Patient\nview',   fs=10)
    e_fam  = rect(ax, cx_r, 8.30, 1.9, RH, 'Family\nview',    fs=10)

    arrow_xy(ax, CX, e_d_role['bottom'], cx_l, e_clin['top'])
    arrow_xy(ax, CX, e_d_role['bottom'], cx_c, e_pat['top'])
    arrow_xy(ax, CX, e_d_role['bottom'], cx_r, e_fam['top'])

    # Fan back in to clinician path
    arrow_xy(ax, cx_l, e_clin['bottom'], CX, e_sel['top'])
    arrow_xy(ax, cx_c, e_pat['bottom'],  CX, e_sel['top'])
    arrow_xy(ax, cx_r, e_fam['bottom'],  CX, e_sel['top'])

    arrow_down(ax, e_sel,   e_ml)
    arrow_down(ax, e_ml,    e_shap)
    arrow_down(ax, e_shap,  e_d_risk)
    arrow_down(ax, e_d_risk,e_alert)
    arrow_down(ax, e_alert, e_care)
    arrow_down(ax, e_care,  e_end)

    # Side notes on diamonds
    ax.text(CX + DW/2 + 0.12, e_d_log['cy'],
            '[X]  invalid -> error', ha='left', va='center', fontsize=9, color=GRAY)
    ax.text(CX + DW/2 + 0.12, e_d_first['cy'],
            '[Y]  yes -> questionnaire', ha='left', va='center', fontsize=9, color=GRAY)
    ax.text(CX + DW/2 + 0.12, e_d_risk['cy'],
            '[Y]  yes -> alert + notify', ha='left', va='center', fontsize=9, color=GRAY)

    savefig(fig, 'fig3_6_flowchart.png')


# ── Run all ───────────────────────────────────────────────────
print('=' * 52)
print('ProjectAura - Pure Academic Diagram Generator')
print('=' * 52)
fig3_1()
fig3_2()
fig3_3()
fig3_4()
fig3_5()
fig3_6()
print('\nAll saved to:', OUT)
print('Word: Insert -> Pictures -> This Device')
print('Resize to 80–90% page width, centre-align.')
print('=' * 52)
