# 🎬 Animations - Quick Start Guide

## ⚡ Fastest Way to Add Animations

### 1. Page Transition (Easiest)
```javascript
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/animations';

<motion.div variants={pageTransition} initial="initial" animate="animate">
  {/* Your page content */}
</motion.div>
```

### 2. Fade In Any Element
```javascript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### 3. Scroll Animation (No JS!)
```html
<div data-aos="fade-up">
  Appears when scrolled into view
</div>
```

### 4. CSS Class (Simplest!)
```html
<div class="animate-fade-in">
  Fades in automatically
</div>
```

---

## 🎯 Common Use Cases

### Button with Hover
```javascript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

### Card with Lift Effect
```html
<div class="hover-lift bg-white p-6 rounded-lg">
  Card content
</div>
```

### Loading Spinner
```html
<div class="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
```

### Counting Number
```javascript
import { AnimatedNumber } from '../components/animations/HealthMetricAnimation';

<AnimatedNumber value={120} suffix=" bpm" />
```

### Progress Bar
```javascript
import { AnimatedProgressBar } from '../components/animations/HealthMetricAnimation';

<AnimatedProgressBar percentage={75} />
```

---

## 📦 Pre-Built Components

### Animated Card
```javascript
import AnimatedCard from '../components/animations/AnimatedCard';

<AnimatedCard hover={true}>
  Card content
</AnimatedCard>
```

### Animated Button
```javascript
import AnimatedButton from '../components/animations/AnimatedButton';

<AnimatedButton loading={isLoading}>
  Submit
</AnimatedButton>
```

### Animated Modal
```javascript
import AnimatedModal from '../components/animations/AnimatedModal';

<AnimatedModal isOpen={isOpen} onClose={close}>
  Modal content
</AnimatedModal>
```

---

## 🎨 CSS Classes Cheat Sheet

| Class | Effect |
|-------|--------|
| `animate-fade-in` | Fade in |
| `animate-slide-in-up` | Slide from bottom |
| `animate-gentle-pulse` | Subtle pulse |
| `animate-heartbeat` | Heartbeat (vitals) |
| `animate-spin` | Loading spinner |
| `hover-lift` | Lift on hover |
| `hover-scale` | Scale on hover |
| `hover-glow` | Glow on hover |

---

## 🏥 Healthcare Animations

### Critical Alert
```javascript
import { alertAnimation } from '../utils/animations';

<motion.div variants={alertAnimation}>
  ⚠️ Immediate attention needed
</motion.div>
```

### Vital Signs Pulse
```javascript
import { PulsingVital } from '../components/animations/HealthMetricAnimation';

<PulsingVital isPulse={isCritical}>
  BP: 180/120
</PulsingVital>
```

### Medication Reminder
```javascript
import { medicationReminder } from '../utils/animations';

<motion.div variants={medicationReminder}>
  💊 Medication time
</motion.div>
```

---

## ♿ Accessibility

All animations automatically respect `prefers-reduced-motion`!

No extra code needed - it just works. ✅

---

## 🚀 Start Using Now!

1. Import what you need
2. Add to your components
3. That's it!

**Everything is already set up and working!** 🎉
