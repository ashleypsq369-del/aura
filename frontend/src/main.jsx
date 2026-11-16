import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'

// T-1.3 / T-1.6: Respect OS "reduce motion" preference system-wide.
// With reducedMotion="user", framer-motion disables transform and layout
// animations for users who set "Reduce Motion" in their OS settings.
// Colour, opacity and other non-motion transitions still work.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user" transition={{ duration: 0.18, ease: 'easeOut' }}>
      <App />
    </MotionConfig>
  </StrictMode>,
)
