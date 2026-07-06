/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Heart, Book, Users, Phone, Calendar, FileText,
  HeartHandshake, MessageCircle, ChevronRight, Loader2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import GriefProgressTracker from '../components/GriefProgressTracker';
import { bereavementAPI } from '../api/client';

/**
 * Bereaved Family Dashboard
 * 
 * Priority 5: Bereavement Support
 * Addresses Finucane et al. (2024) - Bereavement support evidence-based components
 * 
 * Features:
 * - Grief resources library
 * - Peer support groups access
 * - Professional counseling referrals
 * - Legacy content access (Memory Vault)
 * - Post-death support timeline
 * - Grief progress tracking
 */

const VALID_TABS = ['overview', 'resources', 'support', 'counseling', 'progress'];

export default function BereavedFamilyDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [selectedTab, setSelectedTab] = useState(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setSelectedTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId) => {
    setSelectedTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Fetch bereavement support data
  const { data: supportData, isLoading } = useQuery({
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

  // Fetch grief screening status
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

  // Ghana-specific bereavement resources
  const ghanaResources = [
    {
      name: 'Ghana Bereavement Counselling Services',
      phone: '0302-681109',
      description: 'Professional grief counseling',
      type: 'counseling'
    },
    {
      name: 'Mental Health Authority Ghana',
      phone: '0800-900-888',
      description: 'Toll-free mental health support',
      type: 'hotline'
    },
    {
      name: 'Befrienders Ghana',
      phone: '0244-846-701',
      description: 'Emotional support helpline',
      type: 'hotline'
    },
    {
      name: 'KASA Initiative Ghana',
      description: 'Grief support groups and workshops',
      type: 'support_group'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'resources', label: 'Resources', icon: Book },
    { id: 'support', label: 'Support Groups', icon: Users },
    { id: 'counseling', label: 'Counseling', icon: Phone },
    { id: 'progress', label: 'My Journey', icon: Calendar }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading support resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
{/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg border-2 border-purple-400"
        >
          <div className="flex items-center gap-3 mb-2">
            <HeartHandshake size={36} strokeWidth={2.5} />
            <div>
              <h1 className="text-3xl font-bold">Bereavement Support</h1>
              <p className="text-purple-100 text-sm">You're not alone on this journey</p>
            </div>
          </div>
        </motion.div>

        {/* Compassionate Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 bg-purple-50 rounded-xl p-6 border-2 border-purple-200"
        >
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            <strong>We understand this is a difficult time.</strong> Grief is a natural response to loss, and there is no "right" way to grieve. 
            This space provides resources, support, and tools to help you navigate your journey at your own pace.
          </p>
          <p className="text-slate-600 text-sm">
            Take your time. Seek support when you need it. Honor your loved one's memory in your own way.
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border-2 border-slate-200 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {selectedTab === 'overview' && (
            <OverviewTab 
              supportData={supportData}
              screeningData={screeningData}
              ghanaResources={ghanaResources}
            />
          )}

          {selectedTab === 'resources' && (
            <ResourcesTab />
          )}

          {selectedTab === 'support' && (
            <SupportGroupsTab />
          )}

          {selectedTab === 'counseling' && (
            <CounselingTab ghanaResources={ghanaResources} />
          )}

          {selectedTab === 'progress' && (
            <ProgressTab screeningData={screeningData} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ screeningData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quick Access Cards */}
      <QuickAccessCard
        icon={MessageCircle}
        title="Join Support Group"
        description="Connect with others who understand"
        linkTo="/community"
        bgColor="from-teal-500 to-cyan-600"
      />

      <QuickAccessCard
        icon={Phone}
        title="Talk to a Counselor"
        description="Professional grief counseling"
        linkTo="/bereavement-support?tab=counseling"
        bgColor="from-purple-500 to-pink-600"
      />

      <QuickAccessCard
        icon={Book}
        title="Grief Resources"
        description="Articles, videos, and guides"
        linkTo="/bereavement-support?tab=resources"
        bgColor="from-amber-500 to-orange-600"
      />

      <QuickAccessCard
        icon={Heart}
        title="Memory Vault"
        description="Access cherished memories"
        linkTo="/memory-vault"
        bgColor="from-rose-500 to-red-600"
      />

      {/* Emergency Resources */}
      <div className="md:col-span-2 bg-red-50 border-2 border-red-300 rounded-xl p-6">
        <h3 className="font-bold text-red-700 text-lg mb-3 flex items-center gap-2">
          <Phone size={22} />
          Crisis Support (Ghana)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmergencyContact
            name="Ghana Ambulance"
            number="193"
            available="24/7"
          />
          <EmergencyContact
            name="Mental Health Authority"
            number="0800-900-888"
            available="24/7 Toll-free"
          />
          <EmergencyContact
            name="Befrienders Ghana"
            number="0244-846-701"
            available="24/7"
          />
        </div>
      </div>

      {/* Grief Screening Reminder */}
      {screeningData && !screeningData.completed_recently && (
        <div className="md:col-span-2 bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
          <h3 className="font-bold text-purple-700 text-lg mb-2">
            Grief Check-In
          </h3>
          <p className="text-purple-700 text-sm mb-4">
            We recommend completing a brief grief screening to help us provide better support.
          </p>
          <Link
            to="/bereavement-support?tab=progress"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Calendar size={18} />
            Take Grief Screening
            <ChevronRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}

// Resources Tab
function ResourcesTab() {
  const resources = [
    {
      category: 'Understanding Grief',
      items: [
        { title: 'The Five Stages of Grief', type: 'article', url: 'https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm' },
        { title: 'Grief vs Depression: Knowing the Difference', type: 'article', url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/grief-and-bereavement/grief-and-loss/' },
        { title: 'Complicated Grief: What You Need to Know', type: 'article', url: 'https://www.mayoclinic.org/diseases-conditions/complicated-grief/symptoms-causes/syc-20360374' },
      ]
    },
    {
      category: 'Coping Strategies',
      items: [
        { title: 'Self-Care During Grief', type: 'guide', url: 'https://www.cruse.org.uk/understanding-grief/effects-of-grief/self-care-during-grief/' },
        { title: 'Mindfulness for Bereavement', type: 'video', url: 'https://www.youtube.com/watch?v=ZToicYcHIOU' },
        { title: 'Journaling Through Loss', type: 'worksheet', nav: '/journal' },
      ]
    },
    {
      category: 'Cultural & Spiritual',
      items: [
        { title: 'Ghanaian Funeral Customs & Grief', type: 'article', url: 'https://www.ghanaweb.com/GhanaHomePage/features/Funeral-rites-in-Ghana-476231' },
        { title: 'Spiritual Perspectives on Loss', type: 'article', url: 'https://www.helpguide.org/articles/grief/bereavement-grieving-the-loss.htm' },
        { title: "Honoring Your Loved One's Memory", type: 'guide', nav: '/memory-vault' },
      ]
    }
  ];

  const handleItemClick = (item) => {
    if (item.nav) {
      window.location.href = item.nav;
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {resources.map((section, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 text-xl mb-4">{section.category}</h3>
          <div className="space-y-3">
            {section.items.map((item, itemIdx) => (
              <button
                key={itemIdx}
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-purple-50 transition-all cursor-pointer border-2 border-slate-200 hover:border-purple-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-purple-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 uppercase">{item.type}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400 flex-shrink-0" size={20} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Support Groups Tab
function SupportGroupsTab() {
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 text-xl mb-4">Bereavement Support Groups</h3>
      <p className="text-slate-700 mb-6">
        Join a dedicated support group for those who have lost a loved one. Share your story, find understanding, and support others on similar journeys.
      </p>

      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200 mb-6">
        <h4 className="font-bold text-teal-900 text-lg mb-2">Bereavement Community</h4>
        <p className="text-teal-800 text-sm mb-4">
          A safe, anonymous space for bereaved families to connect, share experiences, and offer mutual support.
        </p>
        <Link
          to="/community"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          <Users size={18} />
          Join Community
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="space-y-4">
        <InfoCard title="Moderated & Safe" description="All groups are moderated by trained facilitators" />
        <InfoCard title="Anonymous" description="Your identity is protected - use a display name" />
        <InfoCard title="24/7 Access" description="Post and read messages anytime you need support" />
      </div>
    </div>
  );
}

// Counseling Tab
function CounselingTab({ ghanaResources }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-xl mb-4">Professional Counseling Services</h3>
        <p className="text-slate-700 mb-6">
          Speaking with a grief counselor can provide valuable support during bereavement. Below are trusted resources in Ghana.
        </p>

        <div className="space-y-4">
          {ghanaResources
            .filter(r => r.type === 'counseling' || r.type === 'hotline')
            .map((resource, idx) => (
              <div
                key={idx}
                className="p-5 bg-purple-50 rounded-xl border-2 border-purple-200"
              >
                <h4 className="font-bold text-purple-700 text-lg">{resource.name}</h4>
                {resource.phone && (
                  <p className="text-purple-800 font-semibold text-xl my-2">
                    {resource.phone}
                  </p>
                )}
                <p className="text-purple-700 text-sm">{resource.description}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
        <h4 className="font-bold text-amber-700 text-lg mb-2">
          When to Seek Professional Help
        </h4>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start gap-2">
            <span>-</span>
            <span>Intense grief that doesn't lessen over time (6+ months)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            <span>Difficulty functioning in daily life</span>
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            <span>Thoughts of self-harm or suicide</span>
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            <span>Severe depression or anxiety</span>
          </li>
          <li className="flex items-start gap-2">
            <span>-</span>
            <span>Substance abuse as a coping mechanism</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Progress Tab
function ProgressTab({ screeningData }) {
  return (
    <div className="space-y-6">
      <GriefProgressTracker screeningData={screeningData} />
    </div>
  );
}

// Helper Components
function QuickAccessCard({ icon: Icon, title, description, linkTo, bgColor }) {
  return (
    <Link to={linkTo}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`bg-gradient-to-r ${bgColor} rounded-xl p-6 text-white shadow-lg border-2 border-white/30 hover:shadow-xl transition-all cursor-pointer`}
      >
        <Icon size={32} className="mb-3" strokeWidth={2.5} />
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-white/90 text-sm mb-4">{description}</p>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Access Now</span>
          <ChevronRight size={16} />
        </div>
      </motion.div>
    </Link>
  );
}

function EmergencyContact({ name, number, available }) {
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-red-200">
      <p className="font-bold text-red-700 text-sm mb-1">{name}</p>
      <p className="font-bold text-red-600 text-xl mb-1">{number}</p>
      <p className="text-red-700 text-xs">{available}</p>
    </div>
  );
}

function InfoCard({ title, description }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
      <div className="w-2 h-2 bg-teal-600 rounded-full mt-2"></div>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-slate-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

