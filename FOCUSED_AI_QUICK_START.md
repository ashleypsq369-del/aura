# 🚀 Focused AI Quick Start Guide

## ✅ What's New?

You now have **contextual AI explanations** on detail pages! When a vital sign is abnormal, a purple Brain icon appears - click it to understand WHY that specific reading is concerning for this patient.

---

## 🎯 Try It Now (5 Steps)

### 1. Open the App
```
http://localhost:5173/patients
```

### 2. Select Patient 8
Click on "Patient 8" card (has test data with abnormal vitals)

### 3. Go to Vitals
Click the "Vitals" card, or navigate to:
```
http://localhost:5173/patients/8/vitals
```

### 4. Look for Brain Icons 🧠
You'll see:
- **Amber-bordered cards** = Abnormal vitals
- **Purple Brain icon** in top-right corner = AI explanation available

### 5. Click Brain Icon
Modal opens showing:
- Current reading vs baseline
- Trend (increasing/decreasing/stable)
- Why it's concerning
- Contributing factors
- Specific recommendations

---

## 📊 What You'll See

### Example: Low Oxygen (84%)

**Card Shows**:
```
O₂ SATURATION
84%
%
```
With amber border + Brain icon 🧠

**Click Brain → Modal Shows**:
```
O₂ SATURATION
84%
⚠️ WARNING RISK

Trend: ↘️ Decreasing
Baseline: 87%

Why is this concerning?
"Oxygen Saturation 84% is below normal range. 
This is 3% below their baseline (87%)."

Contributing Factors:
1. Oxygen Saturation: 84% ↗️ Increases risk

Recommended Actions:
1. Consider supplemental oxygen therapy
2. Monitor closely and reassess in 30 minutes
```

---

## 🎨 Visual Guide

### Brain Button States

**Normal Vital** (No button)
```
┌─────────────────┐
│ HEART RATE      │
│ 75 bpm          │
│                 │
└─────────────────┘
Normal - No Brain icon
```

**Warning Vital** (Button appears)
```
┌─────────────────┐
│ O₂ SAT      🧠  │ ← Purple Brain icon
│ 84%             │
│ %               │
└─────────────────┘
Amber border = Warning
```

**Hovering** (Button highlights)
```
┌─────────────────┐
│ O₂ SAT      🧠  │ ← Darker purple
│ 84%             │
└─────────────────┘
Cursor: pointer
```

**Loading** (Button disabled)
```
┌─────────────────┐
│ O₂ SAT      🧠  │ ← 50% opacity
│ 84%             │
└─────────────────┘
Loading explanation...
```

---

## 🧪 Test Data (Patient 8)

| Vital | Value | Status | Brain Button? |
|-------|-------|--------|---------------|
| Blood Pressure | 81/53 mmHg | ⚠️ Low | ✅ Yes |
| Heart Rate | 122 bpm | ⚠️ High | ✅ Yes |
| O₂ Saturation | 84% | 🔴 Critical | ✅ Yes |
| Temperature | 37.4°C | ⚠️ Slight | ✅ Yes |
| Respiratory Rate | Normal | ✅ Normal | ❌ No |

---

## 🆚 Two Types of AI

### Comprehensive AI (Patient Monitor)
- **Button**: "Explain AI Risk" (big blue-purple button)
- **Location**: Patient Monitor page (`/patient/8`)
- **Analyzes**: All 38+ patient features
- **Shows**: Overall risk score + component breakdown
- **Use When**: Want full picture of patient status

### Focused AI (Detail Pages) ← NEW!
- **Button**: Brain icon 🧠 (small purple icon in card corner)
- **Location**: Detail pages (Vitals, etc.)
- **Analyzes**: Single data point
- **Shows**: Why THIS reading is concerning
- **Use When**: Need to understand specific abnormal value

---

## ❓ FAQ

### Q: Why don't I see a Brain icon?
**A**: Brain icon only appears when vital is in warning range:
- BP: >140/90 or <90/60
- HR: >100 or <60
- Temp: >38°C or <36°C
- O2: <95%

### Q: What if it says "Failed to get AI explanation"?
**A**: Check:
1. Backend is running (Terminal 10)
2. Frontend is running (Terminal 3)
3. No CORS errors in browser console
4. Patient has vital history data

### Q: Can I add this to other pages?
**A**: Yes! See `FOCUSED_AI_COMPLETE.md` Section "Implementation Pattern"

### Q: Where's the data coming from?
**A**: 
- Patient vitals history (last 10 readings)
- Current symptoms, medications
- Clinical assessments (ESAS, PHQ-9, etc.)
- Care plans and allergies

---

## 🔧 Troubleshooting

### Backend Not Running
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Not Running
```bash
cd frontend
npm run dev
```

### CORS Errors
Check `backend/main.py` has:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    ...
)
```

### Modal Not Opening
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for API calls

---

## 📚 More Information

- **Full Documentation**: `FOCUSED_AI_COMPLETE.md`
- **Implementation Details**: `CONTEXT_TRANSFER_SUMMARY.md`
- **Original Plan**: `FOCUSED_AI_EXPLANATIONS_PLAN.md`

---

## 🎉 You're Ready!

Go try it now: **http://localhost:5173/patients/8** → Click "Vitals" → Click Brain icon 🧠

**Enjoy your contextual AI explanations!** 🎊
