# 🗺️ Navigation Flow Guide - ProjectAura

## Visual Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
│  - Patient List Table (5 columns: Name, Age, Risk, Contact)    │
│  - "View Details" button on each row                            │
│  - "View All Patients" button at bottom                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ Click Patient Row or "View Details"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PATIENT DETAIL                              │
│  📋 Patient Overview (Avatar, Name, Age, Risk, Diagnosis)       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│  🎯 6 Summary Cards (Click to Drill Down):                      │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │   VITALS     │ MEDICATIONS  │   SYMPTOMS   │                │
│  │ "Last BP..."  │ "X active..." │ "Track..."   │                │
│  └──────────────┴──────────────┴──────────────┘                │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │  CARE PLAN   │ APPOINTMENTS │  WELLBEING   │                │
│  │ "Phase X..."  │ "View..."     │ "Holistic..." │                │
│  └──────────────┴──────────────┴──────────────┘                │
└─────────────────────────────────────────────────────────────────┘
         │              │              │
         │              │              └──────────────┐
         │              └──────┐                      │
         ▼                     ▼                      ▼
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  VITALS DETAIL  │   │ MEDICATIONS      │   │  SYMPTOMS        │
│  ❤️ Latest Vitals│   │ 💊 Active Meds   │   │  ⚠️ Pain Tracking│
│  📊 BP Trend     │   │ 💊 Inactive Meds │   │  📊 Pain Trend   │
│  📊 HR & O2      │   │ 📋 Full History  │   │  📊 Frequency    │
│  📋 Full History │   │ ➕ Prescribe     │   │  📋 Full History │
│  ➕ Record New   │   └──────────────────┘   │  ➕ Log Symptoms │
└─────────────────┘                           └──────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                           ┌──────────────────┐
│  CARE PLAN      │                           │  WELLBEING       │
│  🎯 Phase Info  │                           │  ❤️ Overall Score│
│  🎯 Goals       │                           │  🧠 6 Dimensions │
│  👥 Team        │                           │  📊 Radar Chart  │
│  📋 Interventions│                           │  📊 Trends       │
│  ➕ Add Goal    │                           │  📋 Full History │
└─────────────────┘                           │  ➕ New Assessment│
                                               └──────────────────┘
```

---

## 🎯 Navigation Patterns

### Pattern 1: Overview → Detail
**Used for:** Drilling down into specific health data

```
Dashboard Table → Patient Detail → Section Detail
     ↓                  ↓               ↓
  Summary          6 Cards         Full Data
```

**Example Flow:**
1. Dashboard shows "Sarah Johnson - High Risk"
2. Click row → PatientDetail shows 6 summary cards
3. Click "Vitals" card → VitalsDetail shows complete vital signs history

---

### Pattern 2: Breadcrumb Navigation
**Used for:** Quick jumps to any level

```
Dashboard > Patients > Sarah Johnson > Vitals
    ↑          ↑            ↑            ↑
  Click     Click        Click      Current
```

**Example:**
- Current page: Vitals Detail
- Click "Sarah Johnson" → Jump to Patient Detail
- Click "Dashboard" → Jump to Dashboard

---

### Pattern 3: Back Button
**Used for:** Single step backward

```
Vitals Detail → [Back Button] → Patient Detail
```

**Behavior:**
- Always goes to previous page in history
- Animated with arrow icon
- Smooth transition

---

### Pattern 4: Related Navigation
**Used for:** Moving between related sections

```
Care Plan Detail → [View Full Team] → Care Team Detail
                 → [Appointments] → Appointments
```

---

## 🎨 Visual Design Elements

### Summary Cards (On Overview Pages)
```
┌─────────────────────────────────────────────┐
│ 🩺 [Icon Badge]  VITALS            [Badge]  │
│                                              │
│ Last recorded Jan 15. BP: 120/80,           │
│ HR: 72. All values within normal range.     │
│                                              │
│ View Details →                               │
└─────────────────────────────────────────────┘
```

**Elements:**
- Icon badge (colored background)
- Title (bold, uppercase)
- 1-2 line summary (concise)
- Status indicator (optional badge)
- "View Details" CTA with arrow

---

### Detail Page Headers
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                                                       │
│                                                              │
│ ╔════════════════════════════════════════════════╗         │
│ ║ 🩺 [Icon]  Sarah Johnson - Vitals              ║ [Button]│
│ ║           Complete vital signs history          ║ [Button]│
│ ╚════════════════════════════════════════════════╝         │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Back button with arrow
- Gradient header (teal-to-cyan)
- Large icon (white)
- Title (4xl, serif, bold)
- Subtitle (base, lighter)
- Action buttons (right side)

---

### Data Tables (Detail Pages)
```
┌──────────────────────────────────────────────────────────────┐
│ Recent Vitals                                                 │
│ Complete record of all vital sign measurements               │
├──────────────────────────────────────────────────────────────┤
│ DATE & TIME    │ BP (mmHg) │ HR │ TEMP │ O2 │ RESP RATE    │
├──────────────────────────────────────────────────────────────┤
│ Jan 15, 2:30PM │ 120/80    │ 72 │ 36.6 │ 98 │ 16          │
│ Jan 14, 10:00AM│ 118/78    │ 70 │ 36.5 │ 99 │ 15          │
├──────────────────────────────────────────────────────────────┤
```

**Elements:**
- Header with title and description
- Bold uppercase column headers
- 3px borders (header and rows)
- 56px minimum row height
- Hover states on rows

---

## 🎯 User Journeys

### Journey 1: Check Patient Vitals
```
1. Dashboard → See "Sarah Johnson - High Risk"
2. Click row → PatientDetail
3. See Vitals card: "Last recorded Jan 15. BP: 120/80..."
4. Click Vitals card → VitalsDetail
5. View charts: BP trend, HR & O2 trend
6. Scroll to table: See all historical readings
7. Click "Record New Vitals" → Open modal (TODO)
```

**Pages Visited:** 2 (Dashboard → PatientDetail → VitalsDetail)
**Clicks:** 2 (patient row, vitals card)
**Time:** ~5 seconds

---

### Journey 2: Review Medications
```
1. Dashboard → Click patient row
2. PatientDetail → Click Medications card
3. MedicationsDetail:
   - See 5 active medications
   - Review dosages and frequencies
   - Check inactive medication history
4. Click "Prescribe Medication" → Open modal (TODO)
```

**Pages Visited:** 2
**Clicks:** 2
**Time:** ~8 seconds

---

### Journey 3: Update Care Plan
```
1. Dashboard → Click patient
2. PatientDetail → Click Care Plan card
3. CarePlanDetail:
   - Review Phase 2 (Unstable)
   - Check 3 active goals, 2 completed
   - Review 5 active interventions
4. Click "Add Goal" → Open modal (TODO)
```

**Pages Visited:** 2
**Clicks:** 2
**Time:** ~10 seconds

---

## 🔄 State Management

### Loading States
```
┌─────────────────────────────────────────┐
│ [Gray Rectangle Pulse]                  │  ← Skeleton Screen
│ [Gray Rectangle Pulse]                  │
│ [Gray Rectangle Pulse]                  │
└─────────────────────────────────────────┘
```

**Used when:** Fetching patient data, loading charts

---

### Empty States
```
┌─────────────────────────────────────────┐
│           [Large Gray Icon]             │
│                                         │
│        No Vitals Recorded               │
│   Start recording vital signs           │
│                                         │
└─────────────────────────────────────────┘
```

**Used when:** No data available for section

---

### Error States
```
┌─────────────────────────────────────────┐
│           [Red Alert Icon]              │
│                                         │
│        Patient Not Found                │
│   Unable to load patient information    │
│                                         │
│        [Back to Patients]               │
└─────────────────────────────────────────┘
```

**Used when:** API error, patient not found

---

## 📱 Responsive Behavior

### Desktop (>1024px)
- 3-column grid for summary cards
- Side-by-side charts
- Full table width
- All columns visible

### Tablet (768px - 1024px)
- 2-column grid for summary cards
- Stacked charts
- Table horizontal scroll
- Most important columns visible

### Mobile (<768px)
- Single column for cards
- Stacked charts
- Table horizontal scroll
- Compact spacing

---

## ⚡ Performance Optimizations

### React Query Caching
- Patient data cached for 5 minutes
- Vitals/medications refetch on page visit
- Background refetch on window focus

### Lazy Loading
- Charts loaded only when visible
- Images lazy loaded
- Code splitting per route

### Smooth Transitions
- 200ms transitions (not too fast, not too slow)
- GPU-accelerated animations
- Minimal layout shifts

---

## 🎨 Color-Coded Status System

### Risk Levels
- 🔴 **Crisis:** Red (red-100, red-700, red-400 border)
- 🟠 **High:** Orange (orange-100, orange-700, orange-400)
- 🟡 **Medium:** Amber (amber-100, amber-700, amber-400)
- 🟢 **Low:** Green (green-100, green-700, green-400)

### Vital Signs
- 🟢 **Normal:** Within range (green border)
- 🟡 **Warning:** Outside range (amber border)
- 🔴 **Critical:** Dangerous levels (red border)

### Medication Status
- 🟢 **Active:** Green badge
- ⚪ **Inactive:** Gray badge

### Care Phase
- 🟢 **Phase 1 - Stable:** Green
- 🟡 **Phase 2 - Unstable:** Amber
- 🟠 **Phase 3 - Deteriorating:** Orange
- 🟣 **Phase 4 - Terminal:** Purple
- ⚪ **Phase 5 - End of Life:** Slate

---

## ✅ Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals (TODO)
- Arrow keys for table navigation

### Screen Reader Support
- Semantic HTML elements
- ARIA labels on icons
- Descriptive button text
- Table headers properly associated

### Visual Accessibility
- WCAG 2.1 AA contrast ratios (4.5:1)
- 3px borders for clarity
- Large touch targets (44px minimum)
- Clear focus indicators

---

## 🚀 Future Enhancements

### Phase 2: Interactive Actions
- [ ] Modal forms for data entry
- [ ] Inline editing for tables
- [ ] Drag-and-drop for care plans
- [ ] Real-time updates via WebSocket

### Phase 3: Advanced Features
- [ ] Advanced filtering and search
- [ ] Export to PDF/Excel
- [ ] Print-friendly views
- [ ] Offline mode support

### Phase 4: Analytics
- [ ] Trend predictions
- [ ] Risk scoring visualization
- [ ] Population health dashboard
- [ ] Custom report builder

---

**Status:** ✅ Navigation Architecture Complete  
**Pages:** 5 detail pages + 1 overview page  
**Transitions:** Smooth 200ms animations  
**Design:** Medical-grade professional  
**Ready for:** Production use with API integration
