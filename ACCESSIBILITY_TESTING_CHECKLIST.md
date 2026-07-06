# ♿ Accessibility Testing Checklist

## 🧪 Complete Testing Guide for ProjectAura Accessibility

Use this checklist to verify all accessibility features are working correctly.

---

## 🚀 Quick Visual Test (5 minutes)

### 1. Find Accessibility Button
- [ ] Open http://localhost:5173 in browser
- [ ] Login with: nurse@projectaura.com / nurse123
- [ ] Look for **⚙️ floating button** in bottom-right corner
- [ ] Button should be visible on EVERY page

### 2. Open Accessibility Panel
- [ ] Click the ⚙️ button
- [ ] Modal should open with settings
- [ ] Should see sections: Vision & Display, Assistive Technology, Navigation
- [ ] All toggle switches should work

### 3. Test High Contrast Mode
- [ ] Toggle "High Contrast Mode" ON
- [ ] All backgrounds should become white
- [ ] All text should become black
- [ ] Borders should become bold (3px)
- [ ] Toggle OFF to return to normal

### 4. Test Font Size
- [ ] Click each font size option (Small → XXL)
- [ ] ALL text should resize proportionally
- [ ] Layout should remain intact
- [ ] XXL should be significantly larger

### 5. Test Reduced Motion
- [ ] Toggle "Reduce Motion" ON
- [ ] Navigate to different pages
- [ ] Animations should stop
- [ ] Page transitions should be instant

---

## ⌨️ Keyboard Navigation Test (10 minutes)

### 1. Enable Keyboard Mode
- [ ] Open accessibility panel
- [ ] Toggle "Keyboard Navigation Mode" ON
- [ ] Close panel with Esc key

### 2. Test Skip Links
- [ ] Press `Tab` once (first element should be skip link)
- [ ] Should see "Skip to main content" appear
- [ ] Press `Enter` to use skip link
- [ ] Focus should jump to main content area

### 3. Test Keyboard Shortcuts
- [ ] Press `Alt + H` → Should go to home/dashboard
- [ ] Press `Alt + M` → Should go to messages
- [ ] Press `Alt + P` → Should go to patients (if you have access)
- [ ] Press `Alt + 1` → Should focus main content

### 4. Test Tab Navigation
- [ ] **Unplug your mouse** (yes, really!)
- [ ] Use `Tab` to navigate through entire page
- [ ] Every interactive element should be reachable
- [ ] Blue outline + shadow should show current focus
- [ ] Use `Shift + Tab` to go backwards
- [ ] Use `Enter` or `Space` to activate buttons

### 5. Test Modal Keyboard Access
- [ ] Tab to any button that opens a modal
- [ ] Press `Enter` to open modal
- [ ] Press `Esc` to close modal
- [ ] Focus should return to button that opened it

### 6. Test Form Keyboard Access
- [ ] Navigate to a page with forms (e.g., Add Patient)
- [ ] Use `Tab` to move between fields
- [ ] Use `Space` to check/uncheck checkboxes
- [ ] Use `Arrow Keys` in dropdown menus
- [ ] Use `Enter` to submit form

**Result:** If you can do everything without a mouse, ✅ PASS

---

## 🎤 Voice Control Test (10 minutes)

### Requirements
- Chrome or Edge browser (best support)
- Working microphone
- Quiet environment

### 1. Enable Voice Control
- [ ] Open accessibility panel
- [ ] Toggle "Voice Control" ON
- [ ] Grant microphone permission when browser asks
- [ ] Should hear: "Voice control activated"
- [ ] Visual indicator "🎤 Voice Control Active" should appear top-right

### 2. Test Navigation Commands
Speak these commands clearly:
- [ ] Say "Go home" → Should navigate to home
- [ ] Say "Go to messages" → Should navigate to messages
- [ ] Say "Go to patients" → Should navigate to patients
- [ ] Say "Dashboard" → Should navigate to dashboard

### 3. Test Action Commands
- [ ] Navigate to a page with a form
- [ ] Say "Save" → Should click save button (or speak error if no button)
- [ ] Say "Cancel" → Should close or go back
- [ ] Say "Scroll down" → Page should scroll down
- [ ] Say "Scroll up" → Page should scroll up

### 4. Test Help Commands
- [ ] Say "Help" → Should speak available commands
- [ ] Say "List pages" → Should speak list of pages

### 5. Test Voice Feedback
- [ ] After each command, system should speak confirmation
- [ ] Example: Say "Go home" → Hear "Navigating to home"
- [ ] If command not recognized → Hear "Command not recognized"

**Result:** If 80%+ of commands work, ✅ PASS

---

## 🔊 Screen Reader Test (20 minutes)

### Requirements
- **Windows:** NVDA (free) from https://www.nvaccess.org/download/
- **Mac:** VoiceOver (built-in, press Cmd + F5)

### 1. Enable Screen Reader
- [ ] Start NVDA (Windows) or VoiceOver (Mac)
- [ ] Open ProjectAura in browser
- [ ] Enable "Screen Reader Optimizations" in accessibility panel

### 2. Test Landmarks
- [ ] Press `D` (NVDA/JAWS) to jump between regions
- [ ] Should announce: "banner", "navigation", "main", etc.
- [ ] Each landmark should have descriptive label

### 3. Test Headings
- [ ] Press `H` (NVDA/JAWS) or `Cmd + Opt + H` (VoiceOver)
- [ ] Should navigate through page headings
- [ ] Headings should be in logical order (H1, H2, H3)

### 4. Test Buttons
- [ ] Tab to any button
- [ ] Screen reader should announce:
  - Button label (e.g., "Save patient assessment")
  - Role ("button")
  - State ("pressed" for toggles)

### 5. Test Forms
- [ ] Navigate to form field
- [ ] Screen reader should announce:
  - Label (e.g., "Patient name")
  - Field type (e.g., "text input")
  - Required status (if required)
  - Error messages (if invalid)

### 6. Test Dynamic Content
- [ ] Trigger an action that shows success/error message
- [ ] Screen reader should automatically announce the message
- [ ] Example: Save a form → Hear "Patient saved successfully"

### 7. Test Navigation
- [ ] Navigate entire app using only keyboard + screen reader
- [ ] Visit at least 5 different pages
- [ ] All content should be readable
- [ ] All buttons should be identifiable

**Result:** If screen reader announces all content clearly, ✅ PASS

---

## 👀 Visual Test (High Contrast & Zoom) (10 minutes)

### 1. Test High Contrast Mode
- [ ] Enable "High Contrast Mode"
- [ ] Check these elements are visible:
  - [ ] All text is black on white
  - [ ] All borders are thick and dark
  - [ ] All buttons have clear borders
  - [ ] Focus indicators are visible
  - [ ] Icons are visible
- [ ] Navigate to 5+ different pages
- [ ] All pages should maintain contrast

### 2. Test Font Sizing
- [ ] Set font size to "Small" (14px)
- [ ] Check all text is readable (may be small)
- [ ] Set font size to "XXL" (24px)
- [ ] Check all text is much larger
- [ ] Check layout doesn't break
- [ ] Check no text overlaps

### 3. Test Browser Zoom
- [ ] Set font size to "Medium"
- [ ] Press `Ctrl` and `+` repeatedly to zoom to 200%
- [ ] Check no horizontal scrolling appears
- [ ] All content should reflow vertically
- [ ] Continue to 400% zoom
- [ ] Content should still be usable

### 4. Test Color Contrast
- [ ] Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- [ ] In high contrast mode, check:
  - [ ] Text vs background = 7:1 or higher ✅
  - [ ] Button text vs button background = 7:1 or higher ✅

**Result:** If all text is readable at all sizes and zooms, ✅ PASS

---

## 👆 Touch & Motor Test (5 minutes)

### 1. Test Large Touch Targets
- [ ] Enable "Large Touch Targets"
- [ ] All buttons should become noticeably bigger
- [ ] Measure any button with browser inspector
- [ ] Should be at least 44x44 pixels
- [ ] Easy to click without precision

### 2. Test Mobile Touch
- [ ] Open browser DevTools (F12)
- [ ] Toggle device toolbar (mobile view)
- [ ] Enable "Large Touch Targets"
- [ ] All buttons should be easy to tap
- [ ] No accidental clicks on wrong buttons

**Result:** If all buttons are easily clickable, ✅ PASS

---

## 🧠 Cognitive Test (5 minutes)

### 1. Test Simplified UI
- [ ] Enable "Simplified Interface"
- [ ] Background should become plain white
- [ ] Decorative elements should disappear
- [ ] Interface should feel cleaner
- [ ] Core functionality still works

### 2. Test Reduced Motion
- [ ] Enable "Reduce Motion"
- [ ] Click around the app
- [ ] Page transitions should be instant
- [ ] No animations should play
- [ ] Hover effects should be minimal

**Result:** If interface feels calm and minimal, ✅ PASS

---

## 🤖 Automated Testing (15 minutes)

### 1. Run axe DevTools
**Install:** https://www.deque.com/axe/devtools/

- [ ] Install axe DevTools browser extension
- [ ] Open ProjectAura
- [ ] Open DevTools (F12)
- [ ] Go to "axe DevTools" tab
- [ ] Click "Scan ALL of my page"
- [ ] Wait for results
- [ ] Check for:
  - **Critical issues:** Should be 0 ✅
  - **Serious issues:** Should be <5 ⚠️
  - **Moderate issues:** Acceptable
  - **Minor issues:** Acceptable

### 2. Run Lighthouse
**Built into Chrome DevTools**

- [ ] Open Chrome DevTools (F12)
- [ ] Go to "Lighthouse" tab
- [ ] Select "Accessibility" only
- [ ] Click "Analyze page load"
- [ ] Wait for report
- [ ] Check score:
  - **90-100:** ✅ Excellent
  - **80-89:** ⚠️ Good (review issues)
  - **<80:** ❌ Needs work

### 3. Run WAVE
**Web Tool:** https://wave.webaim.org/

- [ ] Go to https://wave.webaim.org/
- [ ] Enter: http://localhost:5173
- [ ] Click "Analyze"
- [ ] Review results:
  - **Errors:** Should be 0 ✅
  - **Contrast Errors:** Should be 0 ✅
  - **Alerts:** Review (may be informational)
  - **Features:** Check ARIA count
  - **Structural Elements:** Check landmark count

**Result:** If automated tools show minimal issues, ✅ PASS

---

## 📋 Settings Persistence Test (2 minutes)

### 1. Test LocalStorage
- [ ] Open accessibility panel
- [ ] Enable: High Contrast, Large Font, Voice Control
- [ ] Close browser completely
- [ ] Reopen browser and go to ProjectAura
- [ ] Login again
- [ ] Check if settings are still enabled
- [ ] Should remember all your choices ✅

### 2. Test Reset
- [ ] Open accessibility panel
- [ ] Click "Reset to Defaults"
- [ ] All settings should return to OFF/Medium
- [ ] Confirm reset worked

**Result:** If settings persist across sessions, ✅ PASS

---

## 🌐 Browser Compatibility Test (10 minutes)

### Test in Multiple Browsers

#### Chrome
- [ ] All accessibility features work
- [ ] Voice control works ✅
- [ ] Keyboard shortcuts work ✅
- [ ] Screen reader support ✅

#### Edge
- [ ] All accessibility features work
- [ ] Voice control works ✅
- [ ] Keyboard shortcuts work ✅
- [ ] Screen reader support ✅

#### Safari (Mac only)
- [ ] All accessibility features work
- [ ] Voice control works ⚠️ (may be limited)
- [ ] Keyboard shortcuts work ✅
- [ ] VoiceOver support ✅

#### Firefox
- [ ] All accessibility features work
- [ ] Voice control works ⚠️ (may be limited)
- [ ] Keyboard shortcuts work ✅
- [ ] Screen reader support ✅

**Result:** If works in Chrome/Edge with minimal issues, ✅ PASS

---

## 📱 Responsive Test (5 minutes)

### 1. Desktop (1920x1080)
- [ ] Accessibility button visible
- [ ] All features work
- [ ] Layout looks good

### 2. Laptop (1366x768)
- [ ] Accessibility button visible
- [ ] All features work
- [ ] Layout looks good

### 3. Tablet (768x1024)
- [ ] Accessibility button visible
- [ ] Touch targets easy to tap
- [ ] Layout responsive

### 4. Mobile (375x667)
- [ ] Accessibility button visible
- [ ] Touch targets easy to tap
- [ ] Layout stacks vertically
- [ ] Text remains readable

**Result:** If works on all screen sizes, ✅ PASS

---

## 👥 User Testing (Optional but Recommended)

### Test with Real Users

#### Blind User Test
- [ ] Ask blind user to navigate with screen reader
- [ ] Can they find all pages?
- [ ] Can they complete a task (e.g., view messages)?
- [ ] Get feedback on experience

#### Low Vision User Test
- [ ] Ask low vision user to use high contrast + large text
- [ ] Can they read all text?
- [ ] Is contrast sufficient?
- [ ] Get feedback on readability

#### Motor-Impaired User Test
- [ ] Ask motor-impaired user to use voice control OR keyboard
- [ ] Can they navigate without mouse?
- [ ] Are buttons easy to click?
- [ ] Get feedback on usability

#### Cognitive User Test
- [ ] Ask user to use simplified UI mode
- [ ] Is interface clear and simple?
- [ ] Can they understand instructions?
- [ ] Get feedback on clarity

**Result:** If users can complete tasks, ✅ PASS

---

## 📊 Final Scoring

### Count Your Passes

**Critical Tests (Must Pass):**
- [ ] Accessibility button visible and working
- [ ] Keyboard navigation works completely
- [ ] Screen reader announces all content
- [ ] High contrast mode achieves 7:1 ratio
- [ ] Settings persist across sessions

**Important Tests (Should Pass):**
- [ ] Voice control works (in Chrome/Edge)
- [ ] Font sizing works at all levels
- [ ] Large touch targets enabled
- [ ] Reduced motion stops animations
- [ ] No critical errors in axe DevTools

**Optional Tests (Nice to Have):**
- [ ] User testing with disabled users
- [ ] Works in all browsers (including Firefox/Safari voice)
- [ ] Lighthouse score 95+
- [ ] WAVE shows 0 errors

### Scoring
- **All Critical + Important Pass:** ✅ EXCELLENT - Deploy!
- **All Critical Pass:** ✅ GOOD - Minor improvements needed
- **Some Critical Fail:** ⚠️ NEEDS WORK - Fix critical issues
- **Many Critical Fail:** ❌ NOT READY - Major work required

---

## 🐛 Common Issues & Fixes

### Issue: Voice Control Not Working
**Cause:** Browser doesn't support Speech Recognition
**Fix:** Use Chrome or Edge browser

### Issue: Keyboard Shortcuts Not Working
**Cause:** Keyboard only mode not enabled
**Fix:** Enable "Keyboard Navigation Mode" in settings

### Issue: Screen Reader Silent
**Cause:** Screen reader not running or not focused on browser
**Fix:** Ensure NVDA/JAWS/VoiceOver is running

### Issue: High Contrast Not Strong Enough
**Cause:** Need system high contrast too
**Fix:** Enable Windows High Contrast (Settings → Ease of Access)

### Issue: Settings Not Persisting
**Cause:** Browser blocking localStorage
**Fix:** Allow cookies/storage for localhost

---

## ✅ Sign-Off Checklist

**Before declaring accessibility complete:**

- [ ] Passed all critical tests
- [ ] Passed most important tests
- [ ] Lighthouse score >85
- [ ] axe DevTools shows 0 critical errors
- [ ] WAVE shows 0 errors
- [ ] Tested with real screen reader
- [ ] Tested with keyboard only
- [ ] Tested voice control (in Chrome)
- [ ] Settings persist across sessions
- [ ] Documented any known limitations

**Signed off by:** _________________  
**Date:** _________________  
**Role:** _________________

---

## 📞 Need Help?

### Resources
- **Technical docs:** ACCESSIBILITY_COMPLETE.md
- **User guide:** ACCESSIBILITY_USER_GUIDE.md
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **NVDA Download:** https://www.nvaccess.org/download/
- **axe DevTools:** https://www.deque.com/axe/devtools/

### Quick Test Command
```bash
# If you just want to verify the build works:
cd frontend
npm run build
npm run preview
```

---

**Good luck with testing! 🎉**

*Remember: Accessibility is not a feature, it's a right. Test thoroughly!* ♿❤️
