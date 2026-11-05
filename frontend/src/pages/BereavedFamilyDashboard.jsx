/**
 * BereavedFamilyDashboard — Bereavement Support
 * WHO: Bereaved family after a patient has passed.
 * PURPOSE: Grief healing — groups, counseling, grief screening, resources.
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Book, Users, Phone, Calendar, FileText,
  HeartHandshake, MessageCircle, ChevronRight, Loader2,
  Flower2, AlertCircle, ArrowRight, CheckCircle,
  Globe, Shield, Star, Clock, ExternalLink,
  Sun, BarChart3, Smile, Meh, Frown, Quote,
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import GriefProgressTracker from '../components/GriefProgressTracker';
import { bereavementAPI } from '../api/client';
import { useCareTeamChat } from '../hooks/useCareTeamChat';
import { usePersonalisationFlags } from '../context/PersonalisationContext';
import PageHeader from '../components/PageHeader';

const TABS = [
  { id: 'home',      label: 'Home',          icon: Heart     },
  { id: 'grief',     label: 'Grief Journey', icon: BarChart3 },
  { id: 'support',   label: 'Support Groups',icon: Users     },
  { id: 'counseling',label: 'Counseling',    icon: Phone     },
  { id: 'resources', label: 'Resources',     icon: Book      },
];

const CRISIS = [
  { name: 'Ghana Ambulance',       number: '193',           tag: '24 / 7'      },
  { name: 'Mental Health Authority',number: '0800-900-888', tag: 'Free · 24 / 7'},
  { name: 'Befrienders Ghana',     number: '0244-846-701',  tag: '24 / 7'      },
];

const COUNSELORS = [
  { name: 'Ghana Bereavement Counselling Services', phone: '0302-681109',    desc: 'Professional grief counseling in Accra',  hours: 'Mon – Fri · 8 am – 5 pm' },
  { name: 'Mental Health Authority Ghana',          phone: '0800-900-888',    desc: 'Toll-free national mental health line',   hours: '24 / 7 · Free'           },
  { name: 'Befrienders Ghana',                      phone: '0244-846-701',    desc: 'Emotional support & crisis listening',    hours: '24 / 7'                  },
  { name: 'KASA Initiative Ghana',                  phone: null,              desc: 'Community grief workshops & groups',      hours: 'Weekly sessions'         },
];

export default function BereavedFamilyDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { chatWithCareTeam } = useCareTeamChat();
  const tabParam = searchParams.get('tab');
  const { uiFlags } = usePersonalisationFlags();

  const visibleTabs = TABS.filter(t => {
    if (t.id === 'grief'   && uiFlags.isBereaved   === false) return false;
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
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        image="/resources/african/african-family-support.jpg"
        title="Bereavement Support"
        subtitle="You are not alone · healing, community, and care rooted in Ghanaian culture"
        icon={Flower2}
      />

      {/* Tab bar */}
      <div className="sticky top-0 z-20 bg-[var(--card-bg)] border-b border-[var(--card-border)] shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => go(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  tab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-[var(--text-600)] hover:bg-[var(--page-bg)]'}`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === 'home'      && <HomeTab screeningData={screeningData} go={go} chatWithCareTeam={chatWithCareTeam} />}
            {tab === 'grief'     && <GriefJourneyTab screeningData={screeningData} />}
            {tab === 'support'   && <SupportGroupsTab />}
            {tab === 'counseling'&& <CounselingTab />}
            {tab === 'resources' && <ResourcesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Home ─────────────────────────────────────────────────────────────── */
function HomeTab({ screeningData, go, chatWithCareTeam }) {
  const [mood, setMood] = useState(null);
  const moods = [
    { label: 'Struggling',   Icon: Frown, color: '#dc2626', bg: 'bg-red-50   border-red-300'   },
    { label: 'Getting by',   Icon: Meh,   color: '#d97706', bg: 'bg-amber-50 border-amber-300' },
    { label: 'Coping well',  Icon: Smile, color: '#16a34a', bg: 'bg-green-50 border-green-300' },
  ];
  const moodMsg = {
    'Struggling':  "It's okay to not be okay. Consider reaching out to a counselor today.",
    'Getting by':  'One day at a time. The support groups are always here for you.',
    'Coping well': 'Grief has no timeline — you are doing beautifully.',
  };

  const quickCards = [
    { label:'Track My Grief', sub:'Screening & progress',  img:'/resources/african/african-prayer-peace.jpg',    tab:'grief'     },
    { label:'Join a Group',   sub:'Peer support',          img:'/resources/african/african-community-group.jpg', tab:'support'   },
    { label:'Get Counseling', sub:'Professional support',  img:'/resources/african/african-nurse-patient.jpg',   tab:'counseling'},
    { label:'Learn & Heal',   sub:'Articles & guides',     img:'/resources/african/journal-writing.jpg',         tab:'resources' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* LEFT — main content */}
      <div className="lg:col-span-2 space-y-4">

        {/* Mood check-in */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
          <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-3">How are you feeling today?</p>
          <div className="flex gap-2">
            {moods.map(({ label, Icon, color, bg }) => (
              <button key={label} onClick={() => setMood(label)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                  mood === label ? bg : 'border-[var(--card-border)] hover:bg-[var(--page-bg)]'}`}>
                <Icon size={22} style={mood === label ? { color } : { color: 'var(--text-400)' }} />
                <span className="text-[var(--text-600)]">{label}</span>
              </button>
            ))}
          </div>
          {mood && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 text-xs text-[var(--text-500)] leading-relaxed border-t border-[var(--card-border)] pt-3">
              {moodMsg[mood]}
            </motion.p>
          )}
        </div>

        {/* Grief screening CTA */}
        {!screeningData?.completed_recently && (
          <div className="bg-[var(--card-bg)] rounded-xl border border-purple-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-900)]">Grief Screening Due</p>
              <p className="text-xs text-[var(--text-500)] mt-0.5">Helps us personalise your bereavement support plan</p>
            </div>
            <button onClick={() => go('grief')}
              className="flex-shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition">
              Start <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Quote */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-5 relative overflow-hidden">
          <Quote size={42} className="absolute top-2 right-4 text-white/10" aria-hidden />
          <p className="text-purple-100 text-sm italic leading-relaxed">
            "Grief is not a disorder, a disease or sign of weakness. It is an emotional, physical and spiritual necessity — the price you pay for love."
          </p>
          <p className="text-purple-400 text-xs mt-3 font-medium">— Earl Grollman</p>
        </div>

        {/* Quick access image cards */}
        <div className="grid grid-cols-2 gap-3">
          {quickCards.map(({ label, sub, img, tab }) => (
            <motion.button key={label} whileHover={{ y: -2 }} onClick={() => go(tab)}
              className="relative rounded-xl overflow-hidden h-28 group text-left">
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm leading-tight">{label}</p>
                <p className="text-white/65 text-xs mt-0.5">{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* RIGHT — contacts + crisis */}
      <div className="space-y-4">

        {/* Message care team */}
        <button onClick={() => chatWithCareTeam('Hello, I wanted to get in touch regarding bereavement support for my family.')}
          className="w-full flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-teal-300 hover:bg-teal-50 rounded-xl p-4 transition-all text-left group">
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-[var(--card-border)] flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
            <MessageCircle size={16} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-800)]">Message Your Care Team</p>
            <p className="text-xs text-[var(--text-500)]">Ask questions or share how you're doing</p>
          </div>
          <ChevronRight size={15} className="text-[var(--text-400)] group-hover:text-teal-500 flex-shrink-0" />
        </button>

        {/* Quick nav links */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden divide-y divide-[var(--card-border)]">
          {[
            { label: 'Grief Journey',   tab: 'grief',      color: '#7c3aed' },
            { label: 'Support Groups',  tab: 'support',    color: '#0d9488' },
            { label: 'Counseling',      tab: 'counseling', color: '#db2777' },
            { label: 'Resources',       tab: 'resources',  color: '#d97706' },
          ].map(({ label, tab, color }) => (
            <button key={tab} onClick={() => go(tab)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--page-bg)] transition-colors group text-left">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-[var(--text-700)] group-hover:text-[var(--text-900)] transition-colors">{label}</span>
              </div>
              <ChevronRight size={14} className="text-[var(--text-300)] group-hover:text-[var(--text-500)]" />
            </button>
          ))}
        </div>

        {/* Crisis numbers */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5">
            <AlertCircle size={13} /> Crisis Support · Ghana
          </p>
          <div className="divide-y divide-red-100">
            {CRISIS.map(({ name, number, tag }) => (
              <a key={name} href={`tel:${number.replace(/-/g,'')}`}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group">
                <span className="text-xs text-[var(--text-600)] group-hover:text-red-700 transition-colors leading-tight">{name}</span>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-sm font-bold text-red-600">{number}</p>
                  <p className="text-[10px] text-[var(--text-400)]">{tag}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Grief Journey ────────────────────────────────────────────────────── */
function GriefJourneyTab({ screeningData }) {
  const stages = [
    { stage:'Denial',       desc:'Shock and disbelief — a natural protective response',         color:'bg-slate-100 text-slate-600' },
    { stage:'Anger',        desc:'Frustration and helplessness — "why" questions arise',          color:'bg-red-50   text-red-700'   },
    { stage:'Bargaining',   desc:'"What if" thoughts as the mind searches for control',           color:'bg-amber-50 text-amber-700' },
    { stage:'Depression',   desc:'Deep sadness as the full weight of the loss is felt',           color:'bg-blue-50  text-blue-700'  },
    { stage:'Acceptance',   desc:'Finding a way to live alongside — not over — the grief',        color:'bg-green-50 text-green-700' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
        <GriefProgressTracker screeningData={screeningData} />
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--page-bg)]">
          <p className="text-sm font-bold text-[var(--text-800)]">Understanding the Grief Journey</p>
          <p className="text-xs text-[var(--text-400)] mt-0.5">Grief is not linear — you may move between these stages many times</p>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {stages.map(({ stage, desc, color }, i) => (
            <div key={stage} className="flex items-start gap-3 px-4 py-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${color}`}>{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-800)]">{stage}</p>
                <p className="text-xs text-[var(--text-500)] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-700 leading-relaxed">
        <strong>Remember:</strong> There is no right or wrong way to grieve. Cultural and spiritual practices — including Ghanaian mourning traditions — are all valid parts of your healing journey.
      </div>
    </div>
  );
}

/* ── Support Groups ───────────────────────────────────────────────────── */
function SupportGroupsTab() {
  const features = [
    [Shield,'Safe & Moderated',  'Trained facilitators maintain a respectful space'        ],
    [Star,  'Anonymous',         'Share under a display name — identity protected'          ],
    [Clock, 'Always Available',  'Post and read messages any time, day or night'            ],
    [Globe, 'Culturally Grounded','Groups that understand Ghanaian grief traditions'        ],
  ];
  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden">
        <img src="/resources/african/african-community-group.jpg" alt="" className="w-full h-44 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/70 to-teal-700/25" />
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <h2 className="text-white font-bold text-lg mb-1">Bereavement Support Groups</h2>
          <p className="text-teal-100 text-xs mb-3">Connect with others who truly understand what you are going through</p>
          <Link to="/community"
            className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold text-xs px-3.5 py-2 rounded-lg w-fit hover:bg-teal-50 transition-colors">
            <Users size={13} /> Join Community <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {features.map(([Icon, title, desc]) => (
          <div key={title} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3.5 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-[var(--card-border)] flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-800)]">{title}</p>
              <p className="text-[11px] text-[var(--text-500)] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Counseling ───────────────────────────────────────────────────────── */
function CounselingTab() {
  const warnSigns = [
    'Intense grief not lessening after 6+ months',
    'Difficulty functioning at work or home',
    'Thoughts of self-harm or suicide',
    'Severe depression or anxiety',
    'Using substances to cope',
  ];
  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden">
        <img src="/resources/african/african-nurse-patient.jpg" alt="" className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/65 to-slate-800/20" />
        <div className="absolute inset-0 p-5 flex flex-col justify-center">
          <h2 className="text-white font-bold text-base mb-0.5">Professional Grief Counseling</h2>
          <p className="text-white/75 text-xs">Trusted services available across Ghana</p>
        </div>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden divide-y divide-[var(--card-border)]">
        {COUNSELORS.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-[var(--card-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Phone size={14} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-800)]">{r.name}</p>
              <p className="text-xs text-[var(--text-500)] mt-0.5">{r.desc}</p>
              <p className="text-[11px] text-[var(--text-400)] mt-0.5">{r.hours}</p>
            </div>
            {r.phone && (
              <a href={`tel:${r.phone.replace(/-/g,'')}`}
                className="text-sm font-bold text-purple-700 flex-shrink-0 hover:text-purple-900 transition-colors">
                {r.phone}
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={14} className="text-amber-600" />
          <p className="text-xs font-bold text-amber-800">When to seek professional help</p>
        </div>
        <div className="space-y-2">
          {warnSigns.map(s => (
            <div key={s} className="flex items-start gap-2 text-xs text-amber-800">
              <CheckCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Resources ────────────────────────────────────────────────────────── */
function ResourcesTab() {
  const sections = [
    { label:'Understanding Grief', dotColor:'bg-amber-400', items:[
      { title:'The Five Stages of Grief',              url:'https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm',                                           type:'Article' },
      { title:'Grief vs Depression: Knowing the Difference', url:'https://www.mind.org.uk/information-support/types-of-mental-health-problems/grief-and-bereavement/',         type:'Article' },
      { title:'Complicated Grief: What to Know',       url:'https://www.mayoclinic.org/diseases-conditions/complicated-grief/symptoms-causes/syc-20360374',                    type:'Article' },
    ]},
    { label:'Coping Strategies', dotColor:'bg-teal-500', items:[
      { title:'Self-Care During Grief',                url:'https://www.cruse.org.uk/understanding-grief/effects-of-grief/self-care-during-grief/',                             type:'Guide'   },
      { title:'Mindfulness for Bereavement',           url:'https://www.youtube.com/watch?v=ZToicYcHIOU',                                                                       type:'Video'   },
      { title:'Ghanaian Funeral Customs & Grief',      url:'https://www.ghanaweb.com/GhanaHomePage/features/Funeral-rites-in-Ghana-476231',                                    type:'Article' },
    ]},
    { label:'Honouring Your Loved One', dotColor:'bg-purple-500', items:[
      { title:'Memory Vault · Their Legacy',           nav:'/memory-vault',        type:'In-App'  },
      { title:'Continuity Bridge · Their Journal',     nav:'/continuity-bridge',   type:'In-App'  },
      { title:'Spiritual Perspectives on Loss',        url:'https://www.helpguide.org/articles/grief/bereavement-grieving-the-loss.htm', type:'Article' },
    ]},
  ];
  return (
    <div className="space-y-3">
      {sections.map(({ label, dotColor, items }) => (
        <div key={label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--card-border)] bg-[var(--page-bg)]">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <p className="text-xs font-bold text-[var(--text-800)]">{label}</p>
          </div>
          <div className="divide-y divide-[var(--card-border)]">
            {items.map((item) => (
              <button key={item.title}
                onClick={() => item.nav ? (window.location.href = item.nav) : window.open(item.url, '_blank', 'noopener')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--page-bg)] transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <FileText size={13} className="text-[var(--text-400)] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-800)] group-hover:text-teal-700 transition-colors">{item.title}</p>
                    <p className="text-[11px] text-[var(--text-400)] mt-0.5">{item.type}</p>
                  </div>
                </div>
                {item.url ? <ExternalLink size={12} className="text-[var(--text-400)] flex-shrink-0" /> : <ChevronRight size={13} className="text-[var(--text-400)] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
