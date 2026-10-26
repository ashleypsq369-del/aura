import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Brain, Users, Calendar, MessageSquare,
  Shield, Activity, Stethoscope, ChevronLeft, ChevronRight
} from 'lucide-react';

// Local images — downloaded to /resources/slideshow/
const SLIDES = [
  {
    img: '/resources/slideshow/care-1.jpg',
    icon: Stethoscope,
    tag: 'Clinical Monitoring',
    title: 'Real-time Patient Monitoring',
    body: 'Clinicians track symptoms, vitals and ESAS scores with live alerts - so no patient moment goes unnoticed.',
    color: 'from-teal-950/85 via-teal-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-2.jpg',
    icon: Heart,
    tag: 'Elder Care',
    title: 'Compassionate Care for Every Age',
    body: 'Tailored support for elderly patients - from medication tracking to emotional wellbeing, always with dignity.',
    color: 'from-slate-950/85 via-slate-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-3.jpg',
    icon: Users,
    tag: 'Nursing & Bedside Care',
    title: 'Bedside Care, Reimagined',
    body: 'Nurses and caregivers get real-time handover notes, alert flags, and care tasks - all on one screen.',
    color: 'from-teal-950/85 via-teal-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-4.jpg',
    icon: Heart,
    tag: 'Palliative Support',
    title: 'Personalised Palliative Journeys',
    body: "Every care journey is unique. Project Aura builds a care plan tailored to each patient's condition, culture, and values.",
    color: 'from-slate-950/85 via-slate-700/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-5.jpg',
    icon: Users,
    tag: 'Family & Care Team',
    title: 'Connecting Families & Clinicians',
    body: 'Family members stay informed and care teams stay coordinated - shared updates, messaging, and care notes in one place.',
    color: 'from-teal-950/85 via-teal-900/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-6.jpg',
    icon: Brain,
    tag: 'AI-Powered Insights',
    title: 'Aura AI - Your Care Companion',
    body: 'AI-powered guidance, symptom analysis, and empathetic responses - available around the clock for every patient.',
    color: 'from-cyan-950/85 via-cyan-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-7.jpg',
    icon: Activity,
    tag: 'Symptom Tracking',
    title: 'Smart Symptom & ESAS Tracking',
    body: 'Patients record daily symptoms and pain scores. Clinicians receive instant alerts for any concerning changes.',
    color: 'from-teal-950/85 via-teal-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-8.jpg',
    icon: Calendar,
    tag: 'Appointments & Medications',
    title: 'Seamless Care Coordination',
    body: 'Manage appointments, track medications and get reminders - keeping the entire care team on the same page.',
    color: 'from-teal-950/85 via-teal-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-9.jpg',
    icon: MessageSquare,
    tag: 'Family Support',
    title: 'Supporting Families Through It All',
    body: 'Dedicated family spaces, bereavement support, and a memory vault for preserving precious moments together.',
    color: 'from-slate-950/85 via-slate-800/55 to-transparent',
  },
  {
    img: '/resources/slideshow/care-10.jpg',
    icon: Shield,
    tag: 'Memory & Wellbeing',
    title: 'Memory Vault & Spiritual Wellbeing',
    body: 'Preserve precious memories, track emotional health, and access Ghanaian community and spiritual support resources.',
    color: 'from-slate-950/85 via-slate-800/55 to-transparent',
  },
];

const AUTO_ADVANCE_MS = 5500;

export default function LoginSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = useCallback((i) => {
    setCurrent(i);
    setPaused(true);
    setTimeout(() => setPaused(false), 3000);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [current, paused, next]);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background images - crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`bg-${current}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <img
            src={slide.img}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          {/* Overlay - darker so title always pops */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Header branding */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-white/25 overflow-hidden">
            <img src="/logo.png" alt="Project Aura" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide leading-none">Project Aura</p>
            <p className="text-white/55 text-[10px]  mt-0.5">Palliative Care · Ghana</p>
          </div>
        </div>
      </div>

      {/* Slide text content - sits in the upper-middle third on desktop, centred on mobile */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center p-5 lg:px-8" style={{ paddingBottom: '15%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-full border border-white/25">
              <Icon size={12} className="text-teal-300 flex-shrink-0" />
              <span className="text-[11px] font-bold text-white ">{slide.tag}</span>
            </div>
            {/* Frosted dark pill wraps title + body - guaranteed contrast on any photo */}
            <div className="bg-black/55 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-sm border border-teal-400/60">
              <h2 className="img-heading font-serif text-xl lg:text-2xl font-bold leading-snug mb-1.5 [text-shadow:0_2px_6px_rgba(0,0,0,1),0_0_12px_rgba(0,0,0,0.8)]">
                {slide.title}
              </h2>
              <p className="text-white text-sm leading-relaxed hidden sm:block"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next arrows - positioned in lower half so they don't clash with text */}
      <div className="absolute top-[60%] left-0 right-0 z-30 flex items-center justify-between px-3 pointer-events-none">
        <button onClick={prev} aria-label="Previous slide"
          className="pointer-events-auto w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all opacity-50 hover:opacity-100">
          <ChevronLeft size={14} />
        </button>
        <button onClick={next} aria-label="Next slide"
          className="pointer-events-auto w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all opacity-50 hover:opacity-100">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Bottom controls - hidden on tiny mobile banner, visible on sm+ */}
      <div className="absolute bottom-6 lg:bottom-8 left-0 right-0 z-30 hidden sm:flex flex-col items-center gap-2">
        {/* Progress bar */}
        <div className="w-24 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            key={`prog-${current}`}
            className="h-full bg-white/65 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: paused ? 0 : AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
          />
        </div>
        {/* Dots */}
        <div className="flex gap-1.5 flex-wrap justify-center px-4">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/65'
              }`} />
          ))}
        </div>
        <p className="text-white/35 text-[9px] font-medium tabular-nums">{current + 1} / {SLIDES.length}</p>
      </div>

      {/* Service icon strip - right side */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-1.5">
        {SLIDES.map((s, i) => {
          const SIcon = s.icon;
          return (
            <button key={i} onClick={() => goTo(i)} aria-label={s.tag} title={s.tag}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                i === current
                  ? 'bg-white/25 backdrop-blur-sm border border-white/40 text-white'
                  : 'text-white/35 hover:bg-white/15 hover:text-white/65'
              }`}>
              <SIcon size={11} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
