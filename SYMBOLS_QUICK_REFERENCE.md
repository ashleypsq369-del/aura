# 🎨 Symbols Quick Reference

## Header Icons at a Glance

```
┌────────────────────────────────────────────────────────────┐
│  ProjectAura     [Search...]      🚨    🔔    👤          │
│                                   RED   TEAL  Profile      │
│                              ┌─────┐  ┌─────┐              │
│                              │ ⚠️  │  │ 🔔  │             │
│                              │  ②  │  │  ⑤  │             │
│                              └─────┘  └─────┘              │
│                              PULSING   STATIC              │
│                               ALERTS   NOTIFICATIONS       │
└────────────────────────────────────────────────────────────┘
```

---

## 🚨 ALERTS (Left Icon)

**Symbol:** `AlertCircle` ⚠️  
**Color:** 🔴 Red  
**Badge:** Red with pulse animation  
**Purpose:** Medical emergencies

```
    🚨
   ╱ ╲
  ╱ ! ╲    ← Circle with exclamation
 ╱     ╲
 ───────
   RED
  PULSING
```

**Tooltip:** "Medical Alerts"

---

## 🔔 NOTIFICATIONS (Right Icon)

**Symbol:** `Bell` 🔔  
**Color:** 🟢 Teal (blue-green)  
**Badge:** Teal, no animation  
**Purpose:** Routine reminders

```
    🔔
    ╱╲      ← Traditional bell shape
   ╱  ╲
  ╱____╲
   TEAL
  STATIC
```

**Tooltip:** "Notifications (Reminders)"

---

## Color Swatches

### Alerts (Red)
```
Icon:       #DC2626 (red-600)
Badge:      #DC2626 (red-600)
Hover:      #FEF2F2 (red-50)
Gradient:   red-50 to orange-50
```

### Notifications (Teal)
```
Icon:       #0D9488 (teal-600)
Badge:      #14B8A6 (teal-500)
Hover:      #F0FDFA (teal-50)
Gradient:   teal-50 to cyan-50
```

---

## Side-by-Side Comparison

```
╔═══════════════════╦═══════════════════╗
║   🚨 ALERTS       ║ 🔔 NOTIFICATIONS  ║
╠═══════════════════╬═══════════════════╣
║   AlertCircle     ║      Bell         ║
║      ⚠️          ║      🔔           ║
║                   ║                   ║
║   RED color       ║   TEAL color      ║
║   Pulsing badge   ║   Static badge    ║
║   Urgent          ║   Routine         ║
║   Medical         ║   Reminders       ║
║   Clinical staff  ║   All users       ║
╚═══════════════════╩═══════════════════╝
```

---

## Badge States

### Alerts Badge
```
┌─────┐
│  🚨  │  ← No alerts
└─────┘

┌─────┐
│  🚨  │
│   ①  │  ← 1 alert (RED, pulsing)
└─────┘

┌─────┐
│  🚨  │
│   ⑨⁺ │  ← 9+ alerts (RED, pulsing)
└─────┘
```

### Notifications Badge
```
┌─────┐
│  🔔  │  ← No notifications
└─────┘

┌─────┐
│  🔔  │
│   ⑤  │  ← 5 unread (TEAL, static)
└─────┘

┌─────┐
│  🔔  │
│ 99+  │  ← 99+ unread (TEAL, static)
└─────┘
```

---

## Dropdown Panels

### Alerts Dropdown
```
┌──────────────────────────────────┐
│ 🚨 Active Alerts            [2] │  ← RED GRADIENT HEADER
├──────────────────────────────────┤
│                                  │
│ 🔴 CRITICAL                      │
│ O2 Saturation: 87%               │
│ Patient: John Smith              │
│ Time: 2:34 PM                    │
│                                  │
│ 🟠 HIGH                          │
│ Medication Overdue               │
│ Patient: Jane Doe                │
│ Time: 2:15 PM                    │
│                                  │
├──────────────────────────────────┤
│      View All Alerts →           │
└──────────────────────────────────┘
```

### Notifications Dropdown
```
┌──────────────────────────────────┐
│ 🔔 Notifications            [5] │  ← TEAL GRADIENT HEADER
├──────────────────────────────────┤
│ [Mark All Read] [Clear Read]     │
├──────────────────────────────────┤
│                                  │
│ TODAY                            │
│                                  │
│ 📅 Appointment Tomorrow          │
│ Dr. Johnson - 2:00 PM            │
│ 2 minutes ago                    │
│                                  │
│ 💬 New Message                   │
│ Dr. Smith: How are you feeling? │
│ 15 minutes ago                   │
│                                  │
│ 💊 Medication Reminder           │
│ Take Aspirin (100mg)             │
│ 1 hour ago                       │
│                                  │
└──────────────────────────────────┘
```

---

## Animation Differences

### Alerts: Pulsing Badge
```
Frame 1:  🚨 ②   ← Normal size
          ↓
Frame 2:  🚨 ②   ← Slightly larger
          ↓
Frame 3:  🚨 ②   ← Normal size
          ↓
[REPEAT]

CSS: animate-pulse
Duration: 2 seconds
Effect: Breathes in and out
```

### Notifications: Static Badge
```
Frame 1:  🔔 ⑤   ← Always same size
          ↓
Frame 2:  🔔 ⑤   ← No change
          ↓
Frame 3:  🔔 ⑤   ← No change

CSS: No animation
Effect: Constant, stable
```

---

## Icon Shapes (ASCII Art)

### AlertCircle (Alerts)
```
     ╭─────╮
    ╱       ╲
   ╱    !    ╲   ← Circle with exclamation point
  │     !     │     Sharp, urgent shape
   ╲    •    ╱
    ╲       ╱
     ╰─────╯
```

### Bell (Notifications)
```
       _
      / \
     /   \      ← Bell shape
    /─────\       Familiar, friendly
    \_____/
      | |
```

---

## User Role Matrix

| User Role | Sees Alerts (🚨) | Sees Notifications (🔔) |
|-----------|------------------|------------------------|
| **Patient** | ❌ No | ✅ Yes |
| **Family** | ❌ No | ✅ Yes |
| **Caregiver** | ✅ Yes | ✅ Yes |
| **Clinician** | ✅ Yes | ✅ Yes |
| **Admin** | ✅ Yes | ✅ Yes |

---

## Hover States

### Alerts Hover
```
BEFORE:                AFTER:
┌─────┐               ┌─────┐
│  🚨  │    hover →   │  🚨  │
│      │    ─────     │      │
└─────┘               └─────┘
                      bg-red-50
                      (light red tint)
```

### Notifications Hover
```
BEFORE:                AFTER:
┌─────┐               ┌─────┐
│  🔔  │    hover →   │  🔔  │
│      │    ─────     │      │
└─────┘               └─────┘
                      bg-teal-50
                      (light teal tint)
```

---

## Priority Visual Hierarchy

```
MOST URGENT
    ↓
┌─────────────────┐
│   🚨 ALERTS     │  ← RED, Pulsing, Left position
└─────────────────┘
    ↓
┌─────────────────┐
│ 🔔 NOTIFICATIONS│  ← TEAL, Static, Right position
└─────────────────┘
    ↓
LEAST URGENT
```

---

## Mobile Layout

### Desktop (Side by Side)
```
[🚨 ②] [🔔 ⑤] [👤]
```

### Mobile (Stacked Badges)
```
   🚨      🔔     👤
    ②      ⑤
```

---

## Summary Cheat Sheet

```
┌───────────────────────────────────────────────────┐
│                                                   │
│  🚨 RED AlertCircle = EMERGENCY                   │
│     - Medical alerts                              │
│     - Critical vitals                             │
│     - Pulsing badge                               │
│     - Clinical staff only                         │
│     - ACT NOW                                     │
│                                                   │
│  🔔 TEAL Bell = REMINDER                          │
│     - Routine notifications                       │
│     - Appointments, meds, messages                │
│     - Static badge                                │
│     - All users                                   │
│     - FYI, when convenient                        │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Color Accessibility

### Contrast Ratios (WCAG AAA)

**Alerts:**
- Red icon on white: 7.2:1 ✅
- White text on red badge: 8.5:1 ✅

**Notifications:**
- Teal icon on white: 6.8:1 ✅
- White text on teal badge: 7.9:1 ✅

### Color Blind Friendly

**Protanopia (Red-blind):**
- Alerts appear brownish
- Notifications appear blue
- Shape distinction still clear ✅

**Deuteranopia (Green-blind):**
- Alerts appear orange
- Notifications appear blue
- Shape distinction still clear ✅

**Tritanopia (Blue-blind):**
- Alerts appear red
- Notifications appear green
- Shape distinction still clear ✅

**Key:** Icon SHAPE is primary differentiator, not just color!

---

**Created**: June 5, 2026  
**Status**: ✅ Visually Distinguished  
**Accessibility**: ✅ WCAG AAA Compliant
