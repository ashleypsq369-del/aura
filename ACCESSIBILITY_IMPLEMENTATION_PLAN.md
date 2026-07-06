# ♿ Accessibility Implementation Plan - WCAG 2.1 AAA

**Project:** ProjectAura - Palliative Care Platform  
**Target:** Full accessibility for disabled users (blind, deaf, motor impairments, cognitive disabilities)  
**Standards:** WCAG 2.1 Level AAA, Section 508, EN 301 549

---

## 🎯 User Groups & Needs

### 1. Blind Users (Screen Reader Users)
**Needs:**
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Semantic HTML
- ARIA labels and roles
- Text alternatives for images
- Clear focus indicators
- Skip navigation links

### 2. Low Vision Users
**Needs:**
- High contrast themes
- Text resizing (up to 200%)
- Zoom support (up to 400%)
- Clear visual hierarchy
- Large touch targets (44x44px minimum)
- Color not sole indicator
- Readable fonts (16px+ base)

### 3. Deaf/Hard of Hearing Users
**Needs:**
- Captions for videos
- Transcripts for audio
- Visual indicators for audio cues
- Sign language support (future)
- Text alternatives for audio content

### 4. Motor Impairment Users (Bedridden, Limited Mobility)
**Needs:**
- Keyboard-only operation
- Voice control support
- Large clickable areas
- No time limits (or adjustable)
- Minimal precision required
- Switch control compatible
- One-handed operation

### 5. Cognitive/Neurological Users
**Needs:**
- Simple language
- Clear instructions
- Consistent navigation
- Error prevention
- Multiple ways to find content
- No flashing/blinking (seizure safety)
- Reduced motion option

---

## 🛠️ Implementation Components

### Phase 1: Core Accessibility Infrastructure (Priority: CRITICAL)

#### 1.1 Keyboard Navigation ✅
```jsx
// components/KeyboardNav.jsx
- Tab order management
- Focus trap for modals
- Skip to content link
- Keyboard shortcuts
- Focus indicators
```

#### 1.2 Screen Reader Support ✅
```jsx
// ARIA labels, roles, live regions
- Semantic HTML5 elements
- ARIA landmarks
- ARIA live regions for notifications
- Alt text for all images
- Hidden text for icon buttons
```

#### 1.3 High Contrast Mode ✅
```jsx
// themes/HighContrast.js
- High contrast color scheme
- 7:1 contrast ratio minimum
- Border enhancements
- No color-only indicators
```

#### 1.4 Text Resizing ✅
```css
/* Use rem/em instead of px */
- Base font: 16px (1rem)
- Support 200% zoom
- Fluid typography
- No horizontal scrolling
```

### Phase 2: Assistive Technologies (Priority: HIGH)

#### 2.1 Voice Control ✅
```jsx
// components/VoiceControl.jsx
- Voice commands for navigation
- Voice dictation for forms
- Voice feedback
- Multi-language support
```

#### 2.2 Switch Control Support ✅
```jsx
// Support for adaptive switches
- Sequential navigation
- Dwell activation option
- Large target areas
- Single-switch scanning
```

#### 2.3 Screen Magnification ✅
```jsx
// Zoom-friendly design
- SVG icons (scalable)
- Responsive breakpoints
- No fixed pixel dimensions
- Reflow at 400% zoom
```

### Phase 3: Content Accessibility (Priority: HIGH)

#### 3.1 Captions & Transcripts ✅
```jsx
// components/MediaPlayer.jsx
- Video captions (WebVTT)
- Audio transcripts
- Auto-caption generation (future)
```

#### 3.2 Plain Language ✅
```jsx
// Content guidelines
- 8th grade reading level
- Clear headings
- Short paragraphs
- Simple sentences
```

#### 3.3 Visual Indicators ✅
```jsx
// Never rely on color alone
- Icons + color
- Patterns + color
- Text + color
- Status indicators with text
```

### Phase 4: Forms & Interactions (Priority: CRITICAL)

#### 4.1 Accessible Forms ✅
```jsx
// components/AccessibleForm.jsx
- Clear labels
- Error messages
- Required field indicators
- Field instructions
- Auto-complete support
- Error recovery
```

#### 4.2 Time Limits ✅
```jsx
// Adjustable or no time limits
- Session warnings
- Extend time option
- Save draft functionality
- No automatic timeouts
```

#### 4.3 Error Handling ✅
```jsx
// Clear error messages
- Descriptive error text
- Suggestions for fixes
- Error location highlighted
- No data loss on errors
```

---

## 📋 Features to Implement

### Immediate Implementation (Week 1)

1. **Accessibility Settings Panel** ⭐
   - High contrast toggle
   - Font size controls
   - Reduced motion toggle
   - Screen reader mode
   - Voice control enable

2. **Keyboard Navigation Enhancement**
   - Skip navigation links
   - Focus indicators
   - Keyboard shortcuts
   - Focus management

3. **ARIA Implementation**
   - Landmark regions
   - Live regions
   - Button labels
   - Form labels

4. **Voice Control Basic**
   - Voice commands
   - Voice navigation
   - Voice feedback

### Short-term (Week 2-3)

5. **Screen Reader Optimization**
   - Alt text audit
   - Heading structure
   - Link purpose
   - Form labels

6. **Visual Enhancements**
   - High contrast theme
   - Large text mode
   - Touch target sizing
   - Color indicators

7. **Captions & Transcripts**
   - Video captioning
   - Audio transcripts
   - Visual alerts

### Medium-term (Month 2)

8. **Advanced Voice Control**
   - Natural language commands
   - Voice dictation
   - Multi-language

9. **Switch Control**
   - Single-switch mode
   - Scanning interface
   - Dwell activation

10. **Cognitive Support**
    - Simple mode
    - Step-by-step guides
    - Visual instructions

---

## 🎨 Design Patterns

### Pattern 1: Accessible Button
```jsx
<button
  type="button"
  aria-label="Save assessment for John Doe"
  className="btn-primary focus:ring-4 focus:ring-blue-300"
  onClick={handleSave}
>
  <Save aria-hidden="true" />
  <span>Save</span>
</button>
```

### Pattern 2: Accessible Form Field
```jsx
<div className="form-field">
  <label htmlFor="pain-level" className="sr-readable">
    Pain Level (0-10 scale)
    <span className="required" aria-label="required">*</span>
  </label>
  <input
    id="pain-level"
    type="number"
    min="0"
    max="10"
    aria-describedby="pain-help"
    aria-required="true"
    aria-invalid={hasError}
  />
  <div id="pain-help" className="help-text">
    Rate your pain from 0 (no pain) to 10 (worst pain)
  </div>
  {hasError && (
    <div className="error" role="alert" aria-live="polite">
      Please enter a value between 0 and 10
    </div>
  )}
</div>
```

### Pattern 3: Accessible Modal
```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <button
    className="close-btn"
    aria-label="Close dialog"
    onClick={onClose}
  >
    <X aria-hidden="true" />
  </button>
  <h2 id="modal-title">Confirm Action</h2>
  <p id="modal-description">Are you sure you want to proceed?</p>
  {/* Focus trap keeps Tab within modal */}
</div>
```

### Pattern 4: Accessible Data Table
```jsx
<table role="table" aria-label="Patient vital signs">
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Blood Pressure</th>
      <th scope="col">Heart Rate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">June 4, 2026</th>
      <td>120/80</td>
      <td>72 bpm</td>
    </tr>
  </tbody>
</table>
```

---

## 🔧 Technical Implementation

### 1. Accessibility Context Provider
```jsx
// context/AccessibilityContext.jsx
const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState({
    highContrast: false,
    fontSize: 'medium', // small, medium, large, xlarge
    reducedMotion: false,
    screenReaderMode: false,
    voiceControl: false,
    keyboardOnly: false,
  });

  return (
    <AccessibilityContext.Provider value={{ settings, setSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
```

### 2. Keyboard Navigation Hook
```jsx
// hooks/useKeyboardNav.js
export function useKeyboardNav() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+1: Go to main content
      if (e.altKey && e.key === '1') {
        document.getElementById('main-content')?.focus();
      }
      // Alt+2: Go to navigation
      if (e.altKey && e.key === '2') {
        document.getElementById('main-nav')?.focus();
      }
      // Alt+3: Go to search
      if (e.altKey && e.key === '3') {
        document.getElementById('search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### 3. Voice Control Service
```jsx
// services/voiceControl.js
class VoiceControlService {
  constructor() {
    this.recognition = new (window.SpeechRecognition || 
                            window.webkitSpeechRecognition)();
    this.synthesis = window.speechSynthesis;
  }

  startListening(onCommand) {
    this.recognition.continuous = true;
    this.recognition.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript;
      onCommand(command.toLowerCase());
    };
    this.recognition.start();
  }

  speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    this.synthesis.speak(utterance);
  }

  processCommand(command) {
    const commands = {
      'go home': () => navigate('/'),
      'go to dashboard': () => navigate('/dashboard'),
      'go to patients': () => navigate('/patients'),
      'save form': () => document.querySelector('form')?.submit(),
      'cancel': () => document.querySelector('[aria-label*="cancel"]')?.click(),
      'help': () => this.speak('Available commands: go home, go to dashboard, save form, cancel'),
    };

    for (const [key, action] of Object.entries(commands)) {
      if (command.includes(key)) {
        action();
        this.speak(`Executing: ${key}`);
        return;
      }
    }

    this.speak('Command not recognized. Say "help" for available commands.');
  }
}
```

---

## 📊 WCAG 2.1 Compliance Checklist

### Level A (Must Have)
- [ ] Non-text content has text alternative
- [ ] Audio/video has captions
- [ ] Content adaptable to different presentations
- [ ] Color not sole indicator
- [ ] Keyboard accessible
- [ ] No keyboard traps
- [ ] Adjustable time limits
- [ ] Pause, stop, hide moving content
- [ ] No flashing content (seizure safety)
- [ ] Skip navigation
- [ ] Page titles
- [ ] Focus order
- [ ] Link purpose
- [ ] Multiple ways to find pages
- [ ] Headings and labels
- [ ] Focus visible
- [ ] Language of page
- [ ] On focus behavior
- [ ] On input behavior
- [ ] Error identification
- [ ] Form labels
- [ ] Error suggestion

### Level AA (Should Have)
- [ ] Captions (live)
- [ ] Audio description
- [ ] Contrast ratio 4.5:1
- [ ] Text resize 200%
- [ ] Images of text avoided
- [ ] Reflow at 400% zoom
- [ ] Non-text contrast 3:1
- [ ] Text spacing
- [ ] Content on hover/focus
- [ ] Multiple ways navigation
- [ ] Consistent navigation
- [ ] Consistent identification
- [ ] Error prevention
- [ ] Status messages

### Level AAA (Best Practice)
- [ ] Sign language interpretation
- [ ] Extended audio description
- [ ] Audio-only alternative
- [ ] Contrast ratio 7:1
- [ ] Low/no background audio
- [ ] Visual presentation customizable
- [ ] Unusual words explained
- [ ] Abbreviations explained
- [ ] Reading level (8th grade)
- [ ] Pronunciation
- [ ] Location indicator
- [ ] Section headings
- [ ] No timing
- [ ] Animation from interactions
- [ ] Help available
- [ ] Error prevention (all)
- [ ] Context-sensitive help

---

## 🎯 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Screen Reader Compatibility** | 100% | NVDA, JAWS, VoiceOver testing |
| **Keyboard Navigation** | 100% | All features accessible via keyboard |
| **WCAG 2.1 Level** | AAA | Automated + manual testing |
| **Color Contrast** | 7:1 | Contrast checker tools |
| **Voice Control Accuracy** | >90% | Command recognition rate |
| **User Testing** | 20+ users | Including disabled users |
| **Load Time (Accessible)** | <3s | With screen reader active |

---

## 📚 Resources & Tools

### Testing Tools
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Google's accessibility audit
- **Screen Readers** - NVDA (free), JAWS, VoiceOver
- **Color Contrast Analyzer** - Paciello Group
- **Keyboard Navigation Tester** - Manual testing

### Guidelines
- **WCAG 2.1** - https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices** - https://www.w3.org/WAI/ARIA/apg/
- **Section 508** - US Federal accessibility standard
- **EN 301 549** - European accessibility standard

---

## Next: Implementation

Ready to implement all accessibility features!

