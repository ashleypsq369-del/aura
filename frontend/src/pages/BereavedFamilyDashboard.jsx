/**
 * Bereavement Support Dashboard
 * -----------------------------
 * WHO: Bereaved family members AFTER a patient has passed away.
 * PURPOSE: Grief healing · support groups, counseling, grief screening, resources.
 * NOT the same as Continuity Bridge (which is for building a legacy while alive).
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Book, Users, Phone, Calendar, FileText,
  HeartHandshake, MessageCircle, ChevronRight, Loader2,
  Flower2, AlertCircle, ArrowRight, CheckCircle,
  Globe, Shield, Star, Clock, ExternalLink,
  Sun, Wind, BarChart3, Smile, Meh, Frown, Quote
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import GriefProgressTracker from '../components/GriefProgressTracker';
import { bereavementAPI } from '../api/client';
import { useCareTeamChat } from '../hooks/useCareTeamChat';
import { usePersonalisationFlags } from '../context/PersonalisationContext';

const TABS = [
  { id: 'home',       label: 'Home',          icon: Heart      },
  { id: 'grief',      label: 'Grief Journey',  icon: BarChart3  },
  { id: 'support',    label: 'Support Groups', icon: Users      },
  { id: 'counseling', label: 'Counseling',     icon: Phone      },
  { id: 'resources',  label: 'Resources',      icon: Book       },
];

const CRISIS = [
  { name: 'Ghana Ambulance',        number: '193',          tag: '24 / 7' },
  { name: 'Mental Health Authority', number: '0800-900-888', tag: 'Free · 24 / 7' },
  { name: 'Befrienders Ghana',       number: '0244-846-701', tag: '24 / 7' },
];

const COUNSELORS = [
  { name: 'Ghana Bereavement Counselling Services', phone: '0302-681109', desc: 'Professional grief counseling in Accra', hours: 'Mon · Fri  8 am · 5 pm' },
  { name: 'Mental Health Authority Ghana',           phone: '0800-900-888', desc: 'Toll-free national mental health line',  hours: '24 / 7 Free' },
  { name: 'Befrienders Ghana',                       phone: '0244-846-701', desc: 'Emotional support & crisis listening',   hours: '24 / 7' },
  { name: 'KASA Initiative Ghana',                   phone: null,           desc: 'Community grief workshops & groups',     hours: 'Weekly sessions' },
];

import PageHeader from '../components/PageHeader';

export default function BereavedFamilyDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { chatWithCareTeam } = useCareTeamChat();
  const tabParam = searchParams.get('tab');
  const { uiFlags } = usePersonalisationFlags();

  // Filter tabs based on personalisation · hide Grief Journey if not bereaved
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'grief'   && uiFlags.isBereaved === false) return false;
    if (t.id === 'support' && uiFlags.showCommunity === false) return false;
    return true;
  });

  const [tab, setTab] = useState(
    visibleTabs.some(t => t.id === tabParam) ? tabParam : (visibleTabs[0]?.id || 'home')
  );

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) setTab(tabParam);
  }, [tabParam]);

  const go = (id) => { setTab(id); setSearchParams({ tab: id }); };

  const { data: supportData, isLoading } = useQuery({
    queryKey: ['bereavement-support'],
    queryFn: async () => { try { return (await bereavementAPI.getSupportData()).data; } catch { return {}; } },
    retry: false,
  });
  const { data: screeningData } = useQuery({
    queryKey: ['grief-screening-status'],
    queryFn: async () => { try { return (await bereavementAPI.getScreeningStatus()).data; } catch { return { completed_recently: false }; } },
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* -- Header ------------------------------------------------- */}
      <PageHeader
        image="/resources/african/african-family-support.jpg"
        title="Bereavement Support"
        subtitle="You are not alone · healing resources, community, and professional care rooted in Ghanaian culture"
        icon={Flower2}
      />

      {/* -- Sticky tab bar ----------------------------------------- */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => go(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  tab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- Content ------------------------------------------------ */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {tab === 'home'       && <HomeTab screeningData={screeningData} go={go} chatWithCareTeam={chatWithCareTeam} />}
            {tab === 'grief'      && <GriefJourneyTab screeningData={screeningData} />}
            {tab === 'support'    && <SupportGroupsTab />}
            {tab === 'counseling' && <CounselingTab />}
            {tab === 'resources'  && <ResourcesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -- Home --------------------------------------------------------------- */
function HomeTab({ screeningData, go, chatWithCareTeam }) {
  const moodOptions = [
    { icon: Frown,  label: 'Struggling',   color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
    { icon: Meh,    label: 'Getting by',   color: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200' },
    { icon: Smile,  label: 'Coping well',  color: 'text-green-500',  bg: 'bg-green-50 border-green-200' },
  ];
  const [mood, setMood] = useState(null);

  return (
    <div className="space-y-6">

      {/* Mood check-in */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">How are you feeling today?</p>
        <div className="flex gap-3">
          {moodOptions.map(({ icon: Icon, label, color, bg }) => (
            <button key={label} onClick={() => setMood(label)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border text-xs font-semibold transition-all ${
                mood === label ? bg + ' ring-2 ring-offset-1 ring-purple-400' : 'border-slate-200 hover:bg-slate-50'}`}>
              <Icon size={22} className={color} />
              <span className="text-slate-700">{label}</span>
            </button>
          ))}
        </div>
        {mood && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 text-xs text-slate-500 text-center italic">
            {mood === 'Struggling' ? "It's okay to not be okay. Consider talking to a counselor today."
              : mood === 'Getting by' ? 'One day at a time. The support groups are always here for you.'
              : 'That is wonderful. Grief has no timeline · you are doing great.'}
          </motion.p>
        )}
      </div>

      {/* Quote */}
      <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-3 right-5 opacity-15"><Quote size={44} className="text-white" /></div>
        <p className="text-purple-100 text-sm italic leading-relaxed max-w-lg">
          "Grief is not a disorder, a disease or sign of weakness. It is an emotional, physical and spiritual necessity, the price you pay for love."
        </p>
        <p className="text-purple-400 text-xs mt-3 font-medium">— Earl Grollman</p>
      </div>

      {/* Quick access · compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Track My Grief',   sub: 'Screening & progress',  color: 'from-teal-700 to-teal-800', img: '/resources/african/african-prayer-peace.jpg',    tab: 'grief' },
          { label: 'Join a Group',     sub: 'Peer support community', color: 'from-teal-600 to-emerald-700',  img: '/resources/african/african-community-group.jpg', tab: 'support' },
          { label: 'Get Counseling',   sub: 'Professional support',   color: 'from-rose-600 to-pink-700',    img: '/resources/african/african-nurse-patient.jpg',   tab: 'counseling' },
          { label: 'Learn & Heal',     sub: 'Articles & guides',      color: 'from-amber-600 to-orange-600', img: '/resources/african/journal-writing.jpg',         tab: 'resources' },
        ].map(({ label, sub, color, img, tab }) => (
          <motion.div key={label} whileHover={{ y: -3 }} onClick={() => go(tab)}
            className="relative rounded-xl overflow-hidden cursor-pointer h-32 shadow-sm group">
            <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <div className="absolute inset-0 p-3 flex flex-col justify-end">
              <p className="text-white font-semibold text-sm leading-tight">{label}</p>
              <p className="text-white/65 text-xs mt-0.5">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grief check-in CTA */}
      {!screeningData?.completed_recently && (
        <div className="bg-white border border-purple-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Calendar size={17} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Grief Screening Due</p>
            <p className="text-xs text-slate-500 mt-0.5">Helps us personalise your bereavement support plan</p>
          </div>
          <button onClick={() => go('grief')}
            className="flex-shrink-0 flex items-center gap-1.5 bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-800 transition-colors">
            Start <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Message care team button */}
      <button
        onClick={() => chatWithCareTeam('Hello, I wanted to get in touch regarding bereavement support for my family.')}
        className="w-full flex items-center gap-3 bg-white border border-teal-200 rounded-xl p-4 hover:bg-teal-50 transition-all text-left"
      >
        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <MessageCircle size={16} className="text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Message Your Care Team</p>
          <p className="text-xs text-slate-500 mt-0.5">Ask questions or share how you're doing</p>
        </div>
        <ChevronRight size={16} className="text-teal-500 flex-shrink-0" />
      </button>

      {/* Emergency strip */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-red-700 mb-2.5 flex items-center gap-1.5">
          <AlertCircle size={13} /> Crisis Support · Ghana
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CRISIS.map(({ name, number, tag }) => (
            <div key={name} className="bg-white border border-red-100 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500 mb-0.5">{name}</p>
              <p className="font-bold text-red-600 text-sm">{number}</p>
              <p className="text-xs text-slate-400">{tag}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -- Grief Journey ------------------------------------------------------ */
function GriefJourneyTab({ screeningData }) {
  const stages = [
    { stage: 'Denial',      desc: 'Shock and disbelief · a natural protective response',   color: 'bg-slate-100 border-slate-300' },
    { stage: 'Anger',       desc: 'Frustration, helplessness and "why" questions arise',   color: 'bg-red-50 border-red-200' },
    { stage: 'Bargaining',  desc: '"What if" thoughts as the mind searches for control',   color: 'bg-amber-50 border-amber-200' },
    { stage: 'Depression',  desc: 'Deep sadness as the full weight of the loss is felt',   color: 'bg-blue-50 border-blue-200' },
    { stage: 'Acceptance',  desc: 'Finding a way to live alongside · not over · the grief', color: 'bg-green-50 border-green-200' },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <GriefProgressTracker screeningData={screeningData} />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Understanding the Grief Journey</h3>
          <p className="text-xs text-slate-500 mt-0.5">Grief is not linear · you may move between these stages many times</p>
        </div>
        <div className="divide-y divide-slate-100">
          {stages.map(({ stage, desc, color }, i) => (
            <div key={stage} className="flex items-start gap-4 px-5 py-4">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 ${color}`}>{i + 1}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{stage}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-700 leading-relaxed">
        <strong>Remember:</strong> There is no right or wrong way to grieve. Cultural and spiritual practices · including Ghanaian mourning traditions · are all valid parts of your healing journey.
      </div>
    </div>
  );
}

/* -- Support Groups ----------------------------------------------------- */
function SupportGroupsTab() {
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl overflow-hidden">
        <img src="/resources/african/african-community-group.jpg" alt="" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/70 to-teal-700/25" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h2 className="text-white font-bold text-xl mb-1">Bereavement Support Groups</h2>
          <p className="text-teal-100 text-sm mb-4">Connect with others who truly understand what you are going through</p>
          <Link to="/community" className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold text-sm px-4 py-2 rounded-lg w-fit hover:bg-teal-50 transition-colors">
            <Users size={14} /> Join Community <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          [Shield,  'Safe & Moderated',   'Trained facilitators maintain a respectful space'],
          [Star,    'Anonymous',           'Share under a display name · identity protected'],
          [Clock,   'Always Available',    'Post and read messages any time, day or night'],
          [Globe,   'Culturally Grounded', 'Groups that understand Ghanaian grief traditions'],
        ].map(([Icon, title, desc]) => (
          <div key={title} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0"><Icon size={15} className="text-teal-600" /></div>
            <div><p className="text-sm font-semibold text-slate-800">{title}</p><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Counseling --------------------------------------------------------- */
function CounselingTab() {
  const warnSigns = [
    'Intense grief not lessening after 6+ months',
    'Difficulty functioning at work or home',
    'Thoughts of self-harm or suicide',
    'Severe depression or anxiety',
    'Using substances to cope',
  ];
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl overflow-hidden">
        <img src="/resources/african/african-nurse-patient.jpg" alt="" className="w-full h-44 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/65 to-slate-800/25" />
        <div className="absolute inset-0 p-6 flex flex-col justify-center">
          <h2 className="text-white font-bold text-lg mb-1">Professional Grief Counseling</h2>
          <p className="text-white/80 text-sm">Trusted services available across Ghana</p>
        </div>
      </div>
      <div className="space-y-3">
        {COUNSELORS.map((r, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Phone size={15} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              <p className="text-xs text-slate-400 mt-0.5">{r.hours}</p>
            </div>
            {r.phone && <p className="font-bold text-purple-700 text-sm flex-shrink-0">{r.phone}</p>}
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3"><AlertCircle size={14} className="text-amber-600" />
          <h3 className="font-semibold text-amber-800 text-sm">When to seek professional help</h3>
        </div>
        <div className="space-y-2">
          {warnSigns.map(s => (
            <div key={s} className="flex items-start gap-2 text-xs text-amber-800">
              <CheckCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -- Resources ---------------------------------------------------------- */
function ResourcesTab() {
  const sections = [
    { label: 'Understanding Grief', dotColor: 'bg-amber-400', items: [
      { title: 'The Five Stages of Grief',                url: 'https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm',        type: 'Article' },
      { title: 'Grief vs Depression: Knowing the Difference', url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/grief-and-bereavement/', type: 'Article' },
      { title: 'Complicated Grief: What to Know',         url: 'https://www.mayoclinic.org/diseases-conditions/complicated-grief/symptoms-causes/syc-20360374', type: 'Article' },
    ]},
    { label: 'Coping Strategies', dotColor: 'bg-teal-500', items: [
      { title: 'Self-Care During Grief',                  url: 'https://www.cruse.org.uk/understanding-grief/effects-of-grief/self-care-during-grief/', type: 'Guide' },
      { title: 'Mindfulness for Bereavement',             url: 'https://www.youtube.com/watch?v=ZToicYcHIOU', type: 'Video' },
      { title: 'Ghanaian Funeral Customs & Grief',        url: 'https://www.ghanaweb.com/GhanaHomePage/features/Funeral-rites-in-Ghana-476231', type: 'Article' },
    ]},
    { label: 'Honouring Your Loved One', dotColor: 'bg-purple-500', items: [
      { title: "Memory Vault · Their Legacy",             nav: '/memory-vault',          type: 'In-App' },
      { title: "Continuity Bridge · Their Journal",       nav: '/continuity-bridge',     type: 'In-App' },
      { title: 'Spiritual Perspectives on Loss',          url: 'https://www.helpguide.org/articles/grief/bereavement-grieving-the-loss.htm', type: 'Article' },
    ]},
  ];
  return (
    <div className="space-y-4">
      {sections.map(({ label, dotColor, items }) => (
        <div key={label} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <h3 className="font-semibold text-slate-800 text-sm">{label}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <button key={item.title}
                onClick={() => item.nav ? (window.location.href = item.nav) : window.open(item.url, '_blank', 'noopener')}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <FileText size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.type}</p>
                  </div>
                </div>
                {item.url
                  ? <ExternalLink size={13} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                  : <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
