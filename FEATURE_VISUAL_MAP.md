# 🎨 VISUAL FEATURE MAP - ChatBot & AI Assistant

## 🗺️ COMPLETE FEATURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                      ProjectAura Platform                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Main Application                       │    │
│  │                                                         │    │
│  │  [Dashboard] [Patients] [Alerts] [Settings] ...        │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────┐          │    │
│  │  │                                           │          │    │
│  │  │        Page Content Area                 │          │    │
│  │  │                                           │          │    │
│  │  └──────────────────────────────────────────┘          │    │
│  │                                                         │    │
│  │                                    ┌──────────────┐    │    │
│  │                                    │   🧠 TEAL   │←───┼────┤ AI Assistant
│  │                                    │  Draggable  │    │    │ (Clinical)
│  │                                    └──────────────┘    │    │
│  │                                         ↓ 90px         │    │
│  │                                    ┌──────────────┐    │    │
│  │                                    │   🤖 BLUE   │←───┼────┤ ChatBot
│  │                                    │  Draggable  │    │    │ (Personal)
│  │                                    └──────────────┘    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 FLOATING BUTTONS (Initial State)

### **Default Positions:**
```
Screen Coordinates:

(0,0) ─────────────────────────────── (width, 0)
  │                                         │
  │                                         │
  │                                         │
  │                              ┌────┐     │
  │                              │🧠  │ ← (width-90, height-180)
  │                              └────┘     │
  │                                ↓        │
  │                              ┌────┐     │
  │                              │🤖  │ ← (width-90, height-90)
  │                              └────┘     │
  │                                         │
(0, height) ───────────────────── (width, height)
```

### **Button Features:**
```
┌──────────────┐
│   Icon 🤖    │ ← Icon (28px)
│   or  🧠     │
└──────────────┘
     ↑
     │
  On Hover:
┌──────────────────┐
│ 💬 ChatBot       │ ← Tooltip
│ (Drag me!)       │
└──────────────────┘

Properties:
• Size: 56x56px (3.5rem)
• Border radius: 50% (circle)
• Shadow: xl (large)
• Cursor: move
• Drag threshold: 5px
```

---

## 💬 CHATBOT WINDOW (Opened)

```
┌─────────────────────────────────────────────┐
│ 🤖 💬 ChatBot                    [⚙️] [—] [×] │ ← Header (draggable)
│ Personal AI Companion                   🟢   │    Blue/Purple gradient
├─────────────────────────────────────────────┤
│ [+ New Chat] [📋 History (3)]  [⚙️] [💾] [🗑️] │ ← Toolbar
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ User message                        │   │ ← User (right-aligned)
│  │ Timestamp              Sent 10:23am │   │    Blue/purple bubble
│  └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ AI response                         │    │ ← AI (left-aligned)
│ │ With confidence bar [████░] 85%     │    │    White bubble
│ │ Timestamp                 10:23am   │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ Welcome! I can help you with...     │    │ ← Empty state
│ │ [Button] What can you help with?    │    │    (when no messages)
│ └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│ [Type your message...          ] [Send →]  │ ← Input area
│ 0/1000  Press Enter to send • Shift+Enter  │    Character counter
└─────────────────────────────────────────────┘

Size: 420px × 600px (default)
Maximized: Fills screen (with margins)
```

---

## 🧠 AI ASSISTANT WINDOW (Opened)

```
┌─────────────────────────────────────────────┐
│ 🧠 🧠 AI Assistant               [⚙️] [×]    │ ← Header (draggable)
│ Navigation & Clinical Support               │    Teal/Cyan gradient
├─────────────────────────────────────────────┤
│ ⚠️ Not a substitute for professional advice │ ← Disclaimer
├─────────────────────────────────────────────┤
│ [📋 Patients] [❤️ Vitals] [💊 Meds] [🚨 Alerts] │ ← Quick Data Actions
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ User query                          │   │ ← User (right-aligned)
│  │ Show me patient vitals              │   │    Teal/cyan bubble
│  └─────────────────────────────────────┘   │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │ 🤔 Thinking...                        │  │ ← Thinking animation
│ │ • Analyzing query                     │  │
│ │ • Checking database                   │  │
│ │ • Preparing response                  │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ AI response with data               │    │ ← AI (left-aligned)
│ │ [Go to Page →] Navigation button    │    │    White bubble
│ │ Confidence: [███████░] 92%          │    │
│ └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│ [Ask about navigation, patients...] [Send] │ ← Input area
│ 0/500                                       │    Character counter
└─────────────────────────────────────────────┘

Size: 420px × 600px (fixed)
No maximize option
```

---

## ⚙️ SETTINGS PANEL (Overlay)

```
┌─────────────────────────────────────────────────┐
│ BACKDROP (semi-transparent, click to close)    │
│                                                 │
│     ┌───────────────────────────────────┐      │
│     │ 👤 John Doe              [×]      │      │ ← Header (gradient)
│     │ john@example.com                  │      │    Matches tool color
│     ├───────────────────────────────────┤      │
│     │ [Profile] [Prefs] [Notifs] [Help] │      │ ← Tab navigation
│     ├───────────────────────────────────┤      │
│     │                                   │      │
│     │  ┌─────────────────────────────┐ │      │
│     │  │  Large Avatar Circle        │ │      │
│     │  │        JD                   │ │      │
│     │  └─────────────────────────────┘ │      │
│     │                                   │      │
│     │  John Doe                         │      │
│     │  john@example.com                 │      │
│     │  [CLINICIAN]                      │      │ ← Role badge
│     │                                   │      │
│     │  ┌─────────────────────────────┐ │      │
│     │  │ Username: johndoe           │ │      │
│     │  │ Phone: +233 123456789       │ │      │
│     │  │ User ID: 42                 │ │      │
│     │  └─────────────────────────────┘ │      │
│     │                                   │      │
│     │  [Logout Button]                 │      │
│     │                                   │      │
│     └───────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘

Size: 600px × 700px
Position: Center of screen
Z-index: 70 (top layer)
```

### **Settings Tabs Content:**

#### **Tab 1: Profile** 👤
```
┌──────────────────────────┐
│    Avatar (initials)     │
│         JD              │
└──────────────────────────┘
    
Name: John Doe
Email: john@example.com
Role: [CLINICIAN]

Details:
├─ Username: johndoe
├─ Phone: +233 123456789
└─ User ID: 42

[Logout Button (Red)]
```

#### **Tab 2: Preferences** 🎨
```
Appearance:
┌────────────────────────┐
│ ☀️ Theme               │
│ [Light ▾]              │
└────────────────────────┘

Language & Region:
┌────────────────────────┐
│ 🌍 Language            │
│ [English ▾]            │
└────────────────────────┘

Audio:
┌────────────────────────┐
│ 🔊 Sound Effects       │
│ [Toggle ●──]           │
└────────────────────────┘
```

#### **Tab 3: Notifications** 🔔
```
┌────────────────────────┐
│ 🔔 Enable Notifications│
│ [Toggle ●──]           │
└────────────────────────┘

💡 Tip: Notifications help you
   stay updated with new messages
   and alerts.
```

#### **Tab 4: Help & About** ❓
```
┌────────────────────────┐
│ 💬 ChatBot             │
│ Version 2.0.0          │
│                        │
│ Your personal AI...    │
└────────────────────────┘

Quick Tips:
• Drag to reposition
• Click outside to close
• Shift+Enter for new line

[Export Settings (Blue)]
[Clear All Data (Red)]

⚠️ Privacy Note: All data
   stored locally in browser
```

---

## 🎨 COLOR SCHEMES

### **ChatBot (Personal):**
```
Primary: #2563eb → #9333ea (Blue to Purple)
Button: from-blue-600 to-purple-600
Header: bg-gradient-to-r from-blue-600 to-purple-600
Active: text-blue-600, border-blue-600
Hover: hover:bg-blue-700
```

### **AI Assistant (Clinical):**
```
Primary: #0d9488 → #0891b2 (Teal to Cyan)
Button: from-teal-600 to-cyan-600
Header: bg-gradient-to-r from-teal-600 to-cyan-600
Active: text-teal-600, border-teal-600
Hover: hover:bg-teal-700
```

### **Settings Panel:**
```
Adapts to tool:
ChatBot: Blue/Purple header
AI Assistant: Teal/Cyan header

Common:
Background: white (#ffffff)
Text: gray-900 (#111827)
Border: gray-200 (#e5e7eb)
Backdrop: black/40 (rgba(0,0,0,0.4))
```

---

## 🔄 STATE FLOW DIAGRAM

### **Opening Chat:**
```
[Button Closed]
      ↓ Click
[Check Drag?]
      ↓ No (< 5px)
[Open Chat Window]
      ↓
[Show Backdrop]
      ↓
[Focus Input]
      ↓
[Ready for Messages]
```

### **Dragging Button:**
```
[Button Visible]
      ↓ MouseDown
[Track Start Position]
      ↓ MouseMove (>5px)
[Set Dragging = true]
      ↓ MouseMove
[Update Button Position]
      ↓ MouseUp
[Set Dragging = false]
      ↓
[Button in New Position]
```

### **Opening Settings:**
```
[Chat Open]
      ↓ Click ⚙️
[Open Settings Panel]
      ↓
[Show Settings Backdrop]
      ↓
[Load Saved Preferences]
      ↓
[Display Active Tab]
      ↓
[User Adjusts Settings]
      ↓ Save
[Write to localStorage]
      ↓ Close
[Hide Settings Panel]
```

---

## 📊 Z-INDEX LAYERS

```
Layer 70: Settings Panel (top)
         ▲
Layer 60: Settings Backdrop
         ▲
Layer 50: Chat Windows + Buttons
         ▲
Layer 40: Chat Backdrop
         ▲
Layer 0:  Page Content (base)
```

**Visual:**
```
┌─────────────────────────────┐ ← Layer 70: Settings
│     Settings Panel          │
└─────────────────────────────┘
      ▲ Backdrop (60)
      │
┌─────────────────────────────┐ ← Layer 50: Chat
│     Chat Window + Buttons   │
└─────────────────────────────┘
      ▲ Backdrop (40)
      │
┌─────────────────────────────┐ ← Layer 0: Page
│     Application Content     │
└─────────────────────────────┘
```

---

## 🎭 ANIMATION FLOWS

### **Button Appearance:**
```
Initial:     scale(0), opacity(0)
             ↓ 300ms ease-out
Animate:     scale(1), opacity(1)
             ↓
Hover:       scale(1.05)
             ↓
Click:       scale(0.95)
             ↓
Exit:        scale(0), opacity(0)
```

### **Window Opening:**
```
Initial:     y: 20px, scale(0.95), opacity(0)
             ↓ 200ms ease-out
Animate:     y: 0, scale(1), opacity(1)
             ↓
Exit:        y: 20px, scale(0.95), opacity(0)
```

### **Backdrop Fade:**
```
Initial:     opacity(0)
             ↓ 150ms ease
Animate:     opacity(1)
             ↓
Exit:        opacity(0)
```

### **Settings Panel:**
```
Initial:     scale(0.95), opacity(0)
             ↓ 200ms ease-out
Animate:     scale(1), opacity(1)
             ↓
Exit:        scale(0.95), opacity(0)
```

---

## 📱 RESPONSIVE BREAKPOINTS

```
Desktop (≥1920px):
├─ Full features
├─ Default positioning
└─ Optimal experience

Laptop (1366px - 1919px):
├─ Full features
├─ Adjusted spacing
└─ Good experience

Tablet (768px - 1365px):
├─ Most features
├─ Responsive layout
└─ Acceptable (not optimized)

Mobile (< 768px):
├─ Basic features
├─ Needs optimization
└─ Limited testing
```

---

## 🎯 INTERACTION HOTSPOTS

### **Draggable Areas:**
```
ChatBot:
├─ Button: Entire button (56×56px)
└─ Window: Header bar only

AI Assistant:
├─ Button: Entire button (56×56px)
└─ Window: Header bar only

Settings:
└─ Not draggable (modal)
```

### **Clickable Areas:**
```
ChatBot Window:
├─ Header: Settings, Maximize, Close
├─ Toolbar: New Chat, History, Download, Clear
├─ Messages: (read-only)
└─ Input: Text area, Send button

AI Assistant Window:
├─ Header: Settings, Close
├─ Quick Actions: 4 data buttons
├─ Messages: Navigation buttons (if present)
└─ Input: Text area, Send button

Settings Panel:
├─ Header: Close button
├─ Tabs: 4 tab buttons
├─ Content: Varies by tab
└─ Actions: Export, Clear, Logout (varies)
```

---

## 🔒 LOCALSTORAGE STRUCTURE

```
localStorage
├─ auth_token: "jwt_token_here"
├─ user: {id, username, email, role, ...}
│
├─ chatbot_conversations: [
│   {
│     id: timestamp,
│     title: "First 40 chars...",
│     messages: [{role, content, created_at, confidence}],
│     createdAt: ISO string,
│     updatedAt: ISO string
│   }
│ ]
│
├─ chatbot_notifications: "true"
├─ chatbot_sound: "true"
├─ chatbot_theme: "light"
├─ chatbot_language: "en"
│
├─ assistant_notifications: "true"
├─ assistant_sound: "true"
├─ assistant_theme: "light"
└─ assistant_language: "en"
```

---

## ✅ FEATURE CHECKLIST VISUAL

```
┌──────────────────────────────────────────────┐
│              FEATURE STATUS                   │
├──────────────────────────────────────────────┤
│ ✅ Draggable Buttons (Both)                  │
│ ✅ Draggable Windows (Both)                  │
│ ✅ Backdrop (Click to Close)                 │
│ ✅ Distinct Icons (🤖 vs 🧠)                 │
│ ✅ Settings Panel (Complete)                 │
│ ✅ Profile Tab (Avatar, Info)                │
│ ✅ Preferences Tab (Theme, Lang, Sound)      │
│ ✅ Notifications Tab (Toggle)                │
│ ✅ Help Tab (Tips, Export, Clear)            │
│ ✅ Logout Functionality                      │
│ ✅ LocalStorage Integration                  │
│ ✅ Smooth Animations                         │
│ ✅ Professional UI                           │
│ ✅ Documentation Complete                    │
│ ✅ No Console Errors                         │
└──────────────────────────────────────────────┘

STATUS: 🎉 100% COMPLETE
```

---

## 🚀 DEPLOYMENT DIAGRAM

```
Development:
┌────────────────┐     ┌────────────────┐
│   Backend      │────▶│   Frontend     │
│   Port 8000    │     │   Port 5173    │
│   (FastAPI)    │     │   (React+Vite) │
└────────────────┘     └────────────────┘
         │                      │
         └──────────┬──────────┘
                    ▼
              ┌──────────┐
              │ Database │
              │ (SQLite) │
              └──────────┘

Production (Future):
┌────────────────┐     ┌────────────────┐
│   Nginx        │────▶│   Static Files │
│   Reverse      │     │   (Built)      │
│   Proxy        │     └────────────────┘
└────────────────┘
         │
         ├─────▶ Backend API
         │       (Dockerized)
         │
         └─────▶ Database
                 (PostgreSQL)
```

---

**Last Updated:** Current Session  
**Version:** 2.0.0  
**Status:** ✅ Complete

🎨 **Visual Guide Complete!** 🎨
