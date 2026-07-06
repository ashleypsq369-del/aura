import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, BookOpen, Phone, Calendar, Book, Users, MessageCircle,
  ChevronRight, Loader2, HeartHandshake, FileText, Infinity as InfinityIcon, Plus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient, { bereavementAPI } from '../api/client';
import GriefProgressTracker from '../components/GriefProgressTracker';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';

const VALID_TABS = ['overview', 'legacy', 'my-journal', 'resources', 'support', 'counseling', 'progress'];

const ghanaResources = [
  { name: 'Ghana Bereavement Counselling Services', phone: '0302-681109', description: 'Professional grief counseling', type: 'counseling' },
  { name: 'Mental Health Authority Ghana', phone: '0800-900-888', description: 'Toll-free mental health support', type: 'hotline' },
  { name: 'Befrienders Ghana', phone: '0244-846-701', description: 'Emotional support helpline', type: 'hotline' },
  { name: 'KASA Initiative Ghana', description: 'Grief support groups and workshops', type: 'support_group' },
];

const tabs = [
  { id: 'overview', label: 'Overview', icon: Heart },
  { id: 'legacy', label: "Loved One's Legacy", icon: HeartHandshake },
  { id: 'my-journal', label: 'My Grief Journal', icon: BookOpen },
  { id: 'resources', label: 'Resources', icon: Book },
  { id: 'support', label: 'Support Groups', icon: Users },
  { id: 'counseling', label: 'Counseling', icon: Phone },
  { id: 'progress', label: 'My Journey', icon: Calendar },
];

export default function ContinuityBridge() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const selectedTab = VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  const setSelectedTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => {
      const response = await apiClient.get('/api/bereavement/my-patient');
      return response.data;
    },
  });

  const { data: supportData } = useQuery({
    queryKey: ['bereavement-support'],
    queryFn: async () => {
      try {
        const response = await bereavementAPI.getSupportData();
        return response.data;
      } catch {
        return { has_upcoming_support: false, screening_completed: false, screening_flagged: false };
      }
    },
    retry: false,
  });

  const { data: screeningData } = useQuery({
    queryKey: ['grief-screening-status'],
    queryFn: async () => {
      try {
        const response = await bereavementAPI.getScreeningStatus();
        return response.data;
      } catch {
        return { completed_recently: false, flagged: false };
      }
    },
    retry: false,
  });

  const patientId = patientData?.patient_id ?? null;
  const isDeceased = patientData?.deceased || patientData?.status === 'deceased';
  const isHeir = patientData?.is_heir;

  if (patientLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" >
        <Loader2 className="w-12 h-12 animate-spin text-purple-700" />
      </div>
    );
  }

  return (
    <div className="min-h-full" >
      <PageHeader
        image="/resources/headers/header-continuity.jpg"
        title="The Continuity Bridge"
        subtitle="A sacred space where memories live on and love transcends time"
        icon={InfinityIcon}
      />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header with image */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" className="bg-purple-700">
            <InfinityIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif" className="text-purple-700">The Continuity Bridge</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A sacred space where memories live on, grief finds expression, and love transcends time
          </p>
          {patientData?.patient_name && (
            <p className="text-sm font-semibold text-purple-600 bg-purple-100 inline-block px-4 py-1.5 rounded-full">
              {isDeceased ? 'In memory of' : 'Connected to'}: {patientData.patient_name}
              {isHeir && patientData.heir_relationship && ` · Your role: ${patientData.heir_relationship}`}
            </p>
          )}
        </motion.div>

        {/* Compassionate intro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-200 text-center"
        >
          <p className="text-slate-700 leading-relaxed">
            <strong>Your loved one's legacy</strong> (memories and journal they left behind) is kept separate from
            <strong> your own grief journal</strong> - a private space for your personal reflections.
          </p>
        </motion.div>

        {/* Tab navigation */}
        <div className="bg-white/90 rounded-xl shadow-lg border-2 border-purple-200 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedTab === tab.id
                      ? 'text-white shadow-md'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                  style={selectedTab === tab.id ? { backgroundColor: "#7c3aed" } : {}}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {selectedTab === 'overview' && (
            <OverviewTab
              patientData={patientData}
              screeningData={screeningData}
              supportData={supportData}
              isDeceased={isDeceased}
              isHeir={isHeir}
              onSelectTab={setSelectedTab}
            />
          )}
          {selectedTab === 'legacy' && (
            <LegacyTab patientId={patientId} patientName={patientData?.patient_name} isDeceased={isDeceased} isHeir={isHeir} />
          )}
          {selectedTab === 'my-journal' && (
            <MyJournalTab patientId={patientId} />
          )}
          {selectedTab === 'resources' && <ResourcesTab />}
          {selectedTab === 'support' && <SupportGroupsTab />}
          {selectedTab === 'counseling' && <CounselingTab />}
          {selectedTab === 'progress' && <ProgressTab screeningData={screeningData} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ screeningData, isDeceased, isHeir, onSelectTab }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <QuickCard
        icon={HeartHandshake}
        title={isHeir || isDeceased ? "Loved One's Memory Vault" : "Building Memories"}
        description={isDeceased ? 'Cherished memories they left for you' : 'Preserve precious moments together'}
        onClick={() => onSelectTab('legacy')}
        color="#6B4F7A"
        image="/resources/cards/card-memory-vault.jpg"
      />
      <QuickCard
        icon={BookOpen}
        title="My Grief Journal"
        description="Your private space for reflection"
        onClick={() => onSelectTab('my-journal')}
        color="#8B5A9B"
        image="/resources/cards/card-journal.jpg"
      />
      <QuickCard
        icon={MessageCircle}
        title="Join Support Group"
        description="Connect with others who understand"
        linkTo="/community"
        color="#0d9488"
        image="/resources/cards/card-community.jpg"
      />
      <QuickCard
        icon={Phone}
        title="Talk to a Counselor"
        description="Professional grief counseling"
        onClick={() => onSelectTab('counseling')}
        color="#7c3aed"
        image="/resources/cards/card-counseling.jpg"
      />
      {!screeningData?.completed_recently && (
        <div className="md:col-span-2 bg-purple-50 border-2 border-purple-300 rounded-xl p-5">
          <h3 className="font-bold text-purple-700 mb-2">Grief Check-In</h3>
          <p className="text-purple-600 text-sm mb-3">Complete a brief grief screening to help us provide better support.</p>
          <button
            onClick={() => onSelectTab('progress')}
            className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold"
            className="bg-purple-700"
          >
            <Calendar size={18} /> Take Grief Screening <ChevronRight size={18} />
          </button>
        </div>
      )}
      <div className="md:col-span-2 bg-red-50 border-2 border-red-300 rounded-xl p-5">
        <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2"><Phone size={20} /> Crisis Support (Ghana)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-red-200"><strong>Ghana Ambulance:</strong> 193</div>
          <div className="bg-white rounded-lg p-3 border border-red-200"><strong>Mental Health Authority:</strong> 0800-900-888</div>
          <div className="bg-white rounded-lg p-3 border border-red-200"><strong>Befrienders Ghana:</strong> 0244-846-701</div>
        </div>
      </div>
    </div>
  );
}

function LegacyTab({ patientId, patientName, isHeir }) {
  const { data: memoriesData, isLoading } = useQuery({
    queryKey: ['legacy-memories', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      const response = await apiClient.get(
        `/api/bereavement/entries/${patientId}?entry_type=memory&author_filter=patient`
      );
      return response.data;
    },
    enabled: !!patientId,
  });

  const { data: journalData } = useQuery({
    queryKey: ['legacy-journal', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      const response = await apiClient.get(
        `/api/bereavement/entries/${patientId}?entry_type=journal&author_filter=patient`
      );
      return response.data;
    },
    enabled: !!patientId,
  });

  const memories = memoriesData?.entries || [];
  const journalEntries = journalData?.entries || [];

  if (!patientId) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <Heart className="w-12 h-12 mx-auto mb-4 text-purple-400" />
        <p className="text-gray-700">No linked patient found. Contact your care team to access legacy content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" className="text-purple-700">
            {patientName}'s Memory Vault
          </h2>
          <Link to="/memory-vault" className="text-sm font-semibold text-purple-700 hover:underline flex items-center gap-1">
            View full vault <ChevronRight size={14} />
          </Link>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Memories created by {patientName} - preserved for {isHeir ? 'you as their designated heir' : 'the family'}.
        </p>
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        ) : memories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {memories.slice(0, 6).map((m) => (
              <div key={m.id} className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{new Date(m.created_at).toLocaleDateString()}</p>
                <p className="text-gray-800 line-clamp-4 text-sm">{m.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No memories from {patientName} yet.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
        <h2 className="text-lg font-semibold mb-4" className="text-purple-700">
          {patientName}'s Journal
        </h2>
        <p className="text-sm text-gray-600 mb-4">Reflections written by {patientName} during their journey.</p>
        {journalEntries.length > 0 ? (
          <div className="space-y-3">
            {journalEntries.slice(0, 4).map((e) => (
              <div key={e.id} className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-500 mb-1">{new Date(e.created_at).toLocaleDateString()}</p>
                <p className="text-gray-800 line-clamp-3 text-sm">{e.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No journal entries from {patientName} yet.</p>
        )}
      </div>
    </div>
  );
}

function MyJournalTab({ patientId }) {
  const [newEntry, setNewEntry] = useState('');
  const queryClient = useQueryClient();

  const { data: griefEntries } = useQuery({
    queryKey: ['my-grief-journal'],
    queryFn: async () => {
      const response = await bereavementAPI.getJournalEntries();
      return response.data;
    },
  });

  const { data: personalEntries } = useQuery({
    queryKey: ['my-personal-entries', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      const response = await apiClient.get(
        `/api/bereavement/entries/${patientId}?entry_type=journal&author_filter=me&include_private=true`
      );
      return response.data;
    },
    enabled: !!patientId,
  });

  const saveMutation = useMutation({
    mutationFn: (content) => bereavementAPI.saveJournalEntry(content),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-grief-journal']);
      setNewEntry('');
      toast.success('Journal entry saved');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save'),
  });

  const entries = griefEntries?.entries || personalEntries?.entries || [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-2" className="text-purple-700">My Grief Journal</h2>
        <p className="text-sm text-gray-600">
          This is <strong>your private journal</strong> - separate from your loved one's legacy. Only you can see these entries.
        </p>
      </div>

      <div className="flex gap-2">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What are you feeling today? Write freely..."
          className="flex-1 border-2 border-purple-200 rounded-xl p-3 text-sm min-h-[80px] focus:border-purple-400 outline-none"
        />
        <button
          onClick={() => newEntry.trim() && saveMutation.mutate(newEntry.trim())}
          disabled={!newEntry.trim() || saveMutation.isPending}
          className="px-4 py-2 text-white rounded-xl font-semibold self-end disabled:opacity-50 flex items-center gap-2"
          className="bg-purple-700"
        >
          <Plus size={16} /> Save
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">{new Date(e.created_at).toLocaleDateString()}</p>
              <p className="text-gray-800 text-sm">{e.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8 italic">"What do you want to remember about today?"</p>
      )}
    </div>
  );
}

function ResourcesTab() {
  const sections = [
    { category: 'Understanding Grief', items: ['The Five Stages of Grief', 'Grief vs Depression', 'Complicated Grief'] },
    { category: 'Coping Strategies', items: ['Self-Care During Grief', 'Mindfulness for Bereavement', 'Journaling Through Loss'] },
    { category: 'Cultural & Spiritual', items: ['Ghanaian Funeral Customs & Grief', 'Spiritual Perspectives on Loss', 'Honoring Memory'] },
  ];
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.category} className="bg-white rounded-xl p-5 shadow border-2 border-purple-100">
          <h3 className="font-bold text-lg mb-3" className="text-purple-700">{s.category}</h3>
          <div className="space-y-2">
            {s.items.map((item) => (
              <div key={item} className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg text-sm">
                <FileText size={16} className="text-purple-600" /> {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SupportGroupsTab() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-teal-200">
      <h3 className="font-bold text-xl mb-3 text-teal-900">Bereavement Support Groups</h3>
      <p className="text-gray-700 mb-4 text-sm">A safe space for bereaved families to connect and offer mutual support.</p>
      <Link
        to="/community"
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold"
      >
        <Users size={18} /> Join Community <ChevronRight size={18} />
      </Link>
    </div>
  );
}

function CounselingTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
        <h3 className="font-bold text-xl mb-4" className="text-purple-700">Professional Counseling Services</h3>
        <div className="space-y-3">
          {ghanaResources.filter((r) => r.type === 'counseling' || r.type === 'hotline').map((r, i) => (
            <div key={i} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <h4 className="font-bold text-purple-700">{r.name}</h4>
              {r.phone && <p className="text-purple-600 font-semibold text-lg my-1">{r.phone}</p>}
              <p className="text-purple-700 text-sm">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressTab({ screeningData }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
      <GriefProgressTracker screeningData={screeningData} />
    </div>
  );
}

function QuickCard({ icon: Icon, title, description, onClick, linkTo, color, image }) {
  const inner = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-xl overflow-hidden shadow-lg cursor-pointer h-full min-h-[160px] relative"
      style={{ '--img-card-color': color || '#0f766e' }}
      onClick={onClick}
    >
      {/* Fallback bg */}
      <div className="img-card-bg absolute inset-0" style={{ backgroundColor: color || '#0f766e', zIndex: 0 }} />
      {/* Real <img> tag  --  CSS-immune */}
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1 }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.62), rgba(0,0,0,0.42), rgba(0,0,0,0.22))',
          zIndex: 2, pointerEvents: 'none',
        }}
      />
      {/* Teal-green border */}
      <div className="absolute inset-0 rounded-xl border-2 border-teal-400/60 pointer-events-none" style={{ zIndex: 3 }} />
      {/* Content */}
      <div className="relative p-5 flex flex-col h-full justify-between" style={{ zIndex: 4 }}>
        <div>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/25">
            <Icon size={20} className="text-white" strokeWidth={2} />
          </div>
          <h3 className="img-heading font-bold text-lg mb-1 [text-shadow:0_2px_6px_rgba(0,0,0,1),0_0_12px_rgba(0,0,0,0.8)]">{title}</h3>
          <p className="text-white/90 text-sm drop-shadow leading-relaxed [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-white/90 text-sm font-semibold mt-3">
          Access Now <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
  return linkTo ? <Link to={linkTo} className="block h-full">{inner}</Link> : inner;
}


