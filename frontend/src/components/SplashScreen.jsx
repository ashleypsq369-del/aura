/**
 * SplashScreen.jsx — Project Aura intro animation
 * Fetches project-aura-splash.html and injects it directly into the DOM
 * using dangerouslySetInnerHTML — no iframe, no CSP/X-Frame-Options issues.
 * Plays a soothing ambient chord via Web Audio API.
 * Shows once per browser session (sessionStorage flag).
 */
import { useEffect, useRef, useState } from 'react';

function playChord() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.0);
    master.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 4.0);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 7.0);
    master.connect(ctx.destination);

    // Simple reverb
    const rev = ctx.createConvolver();
    const rb = ctx.createBuffer(2, ctx.sampleRate * 2, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = rb.getChannelData(c);
      for (let i = 0; i < rb.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rb.length, 2);
    }
    rev.buffer = rb;
    const rg = ctx.createGain(); rg.gain.value = 0.28;
    rev.connect(rg); rg.connect(master);

    // A-maj-7 chord
    [220, 277.18, 329.63, 415.30].forEach((f, i) => {
      [0, 1.3].forEach(det => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f + det;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.065, ctx.currentTime + 0.4 + i * 0.14);
        g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 3.0);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 7.0);
        o.connect(g); g.connect(master); g.connect(rev);
        o.start(ctx.currentTime + i * 0.11);
        o.stop(ctx.currentTime + 7.5);
      });
    });

    // Bell overtone A5
    const bo = ctx.createOscillator(), bg = ctx.createGain();
    bo.type = 'sine'; bo.frequency.value = 880;
    bg.gain.setValueAtTime(0.05, ctx.currentTime);
    bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
    bo.connect(bg); bg.connect(master);
    bo.start(ctx.currentTime + 0.3); bo.stop(ctx.currentTime + 3.5);
  } catch (_) {}
}

const SPLASH_KEY = 'aura_splash_v4';

export default function SplashScreen({ onDone }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [opacity, setOpacity]         = useState(1);
  const [gone, setGone]               = useState(false);
  const dismissing                    = useRef(false);
  const timer                         = useRef(null);
  const containerRef                  = useRef(null);

  const dismiss = () => {
    if (dismissing.current) return;
    dismissing.current = true;
    clearTimeout(timer.current);
    setOpacity(0);
    setTimeout(() => {
      setGone(true);
      sessionStorage.setItem(SPLASH_KEY, '1');
      onDone?.();
    }, 700);
  };

  useEffect(() => {
    // Fetch and inject the HTML
    fetch('/project-aura-splash.html')
      .then(r => r.text())
      .then(html => {
        // Extract just the <body> content and <style> tags
        // so we don't get nested <html>/<head>/<body> elements
        const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
        const bodyMatch  = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const styles     = styleMatch.join('\n');
        const body       = bodyMatch ? bodyMatch[1] : html;
        setHtmlContent(styles + body);
      })
      .catch(() => {
        // Fetch failed — use fallback logo screen
        setHtmlContent('');
      });

    // Play sound
    const snd = setTimeout(playChord, 350);

    // Listen for skip from injected HTML skip button
    const msg = (e) => { if (e.data === 'skip') dismiss(); };
    window.addEventListener('message', msg);

    // Auto-dismiss
    timer.current = setTimeout(dismiss, 7500);

    return () => {
      clearTimeout(snd);
      clearTimeout(timer.current);
      window.removeEventListener('message', msg);
    };
  }, []);

  // Re-run any <script> tags in the injected HTML
  useEffect(() => {
    if (!containerRef.current || !htmlContent) return;
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach(old => {
      const fresh = document.createElement('script');
      Array.from(old.attributes).forEach(a => fresh.setAttribute(a.name, a.value));
      fresh.textContent = old.textContent;
      old.parentNode?.replaceChild(fresh, old);
    });
  }, [htmlContent]);

  if (gone) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     99999,
        background: '#fefdf8',
        cursor:     'pointer',
        opacity,
        transition: 'opacity 0.7s ease',
        overflow:   'hidden',
      }}
    >
      {htmlContent ? (
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        /* Fallback while fetching or if fetch fails */
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 24, background: '#fefdf8',
        }}>
          <img src="/logo.png" alt="Project Aura"
            style={{ width: 140, height: 140, objectFit: 'contain',
              animation: 'spin 1.2s ease-in-out' }} />
          <p style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700,
            color: '#0d3b36', letterSpacing: '-0.5px', margin: 0 }}>
            Project <span style={{ color: '#e31c3e' }}>Aura</span>
          </p>
          <p style={{ fontStyle: 'italic', color: '#475569', fontSize: 13,
            textAlign: 'center', maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
            "You matter because you are you..."
          </p>
          <style>{`@keyframes spin{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}
    </div>
  );
}
