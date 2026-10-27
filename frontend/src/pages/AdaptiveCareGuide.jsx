import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronDown, ChevronRight, Phone, Target, Clock,
  AlertTriangle, FileText, Sparkles, Shield, Activity
} from 'lucide-react';
import axios from 'axios';
import { PageSkeleton } from '../components/LoadingSkeleton';

import { API_URL } from '../api/client';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const PRIORITY_STYLE = {
  critical: { bg:'bg-red-50',    border:'border-red-400',    text:'text-red-900',   icon:'s¨', badge:'bg-red-100 text-red-700' },
  high:     { bg:'bg-orange-50', border:'border-orange-400', text:'text-orange-900',icon:'⚠ï¸', badge:'bg-orange-100 text-orange-700' },
  medium:   { bg:'bg-yellow-50', border:'border-yellow-400', text:'text-yellow-900',icon:'', badge:'bg-yellow-100 text-yellow-700' },
  low:      { bg:'bg-blue-50',   border:'border-teal-400',   text:'text-blue-900',  icon:'„ï¸', badge:'bg-blue-100 text-teal-700' },
};

export default function AdaptiveCareGuide() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [expandedProtocol, setExpandedProtocol] = useState(0);

  const { data: guideData, isLoading } = useQuery({
    queryKey: ['care-guide', patientId],
    queryFn: async () => {
      // Try the new care-plans guide endpoint first
      try {
        const r = await axios.get(`${API_URL}/api/care-plans/${patientId}/guide`, { headers: authHeader() });
        return r.data;
      } catch {
        // Fallback to old intelligent-care endpoint
        const r = await axios.get(`${API_URL}/api/intelligent-care/care-guide/${patientId}`, { headers: authHeader() });
        return r.data;
      }
    },
    enabled: !!patientId,
  });

  if (isLoading) return <PageSkeleton />;

  if (!guideData) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10 sm:py-16 text-center">
        <BookOpen size={48} className="mx-auto mb-4 text-slate-300"/>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Care Guide Not Available</h2>
        <p className="text-slate-600 mb-4">Unable to load care guidance for this patient.</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700">
          † Back
        </button>
      </div>
    );
  }

  const protocols = guideData.guide_sections || guideData.protocols || [];
  const sortedProtocols = [...protocols].sort((a, b) => {
    const order = { critical:0, high:1, medium:2, low:3 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 transition group">
        <span className="group-hover:-translate-x-1 transition-transform">†</span> Back
      </button>

      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
        className="rounded-2xl p-5 border-l-4 border-slate-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BookOpen size={32} className="text-white"/>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">Personalised Care Guide</h1>
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                  §  AI-Powered
                </span>
              </div>
              <p className="text-purple-100 font-semibold">{guideData.patient_name}</p>
              <p className="text-purple-200 text-sm">{guideData.diagnosis || 'Diagnosis not recorded'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full capitalize">
                  Profile: {(guideData.disease_profile || '').replace(/_/g,' ')}
                </span>
                {guideData.care_phase && (
                  <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full capitalize">
                    Phase: {guideData.care_phase}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/patients/${patientId}/care-plan`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-50 transition shadow-md"
          >
            <FileText size={16}/> View Full Care Plan
          </button>
        </div>
      </motion.div>

      {/* Critical Flags */}
      {guideData.critical_flags && guideData.critical_flags.length > 0 && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          className="bg-red-50 border-2 border-red-400 rounded-xl p-5">
          <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={18}/> Critical Issues Identified
          </h3>
          <ul className="space-y-2">
            {guideData.critical_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                <span className="text-red-500 mt-0.5">⚠ï¸</span> {flag}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* High Priority Concerns */}
      {guideData.high_priority_concerns && guideData.high_priority_concerns.length > 0 && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
          <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
            <Activity size={18}/> High Priority Concerns
          </h3>
          <ul className="space-y-2">
            {guideData.high_priority_concerns.map((concern, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-orange-800">
                <span className="text-orange-500 mt-0.5">-</span> {concern}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Care Priorities */}
      {guideData.care_priorities && guideData.care_priorities.length > 0 && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
          className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Target size={18} className="text-teal-600"/> Priority Focus Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {guideData.care_priorities.map((priority, i) => (
              <span key={i} className="px-4 py-2 bg-teal-50 text-teal-800 border-2 border-teal-300 rounded-lg text-xs font-bold">
                {priority.replace(/_/g,' ')}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Monitoring schedule */}
      {guideData.monitoring_schedule && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <Clock size={18} className="text-amber-700 flex-shrink-0"/>
          <p className="text-sm text-amber-900">
            <span className="font-bold">Recommended Monitoring: </span>{guideData.monitoring_schedule}
          </p>
        </motion.div>
      )}

      {/* Red Flags */}
      {guideData.red_flags && guideData.red_flags.length > 0 && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><Shield size={16}/>Red Flags - Seek Immediate Help</h3>
          <div className="flex flex-wrap gap-2">
            {guideData.red_flags.map((flag, i) => (
              <span key={i} className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full text-xs font-bold">{flag}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Guide Sections */}
      {sortedProtocols.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600"/> Disease-Specific Protocols
          </h2>
          {sortedProtocols.map((protocol, idx) => {
            const pstyle = PRIORITY_STYLE[protocol.priority] || PRIORITY_STYLE.medium;
            const isExpanded = expandedProtocol === idx;
            return (
              <motion.div key={idx} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay: idx * 0.06}}
                className={`border-2 ${pstyle.border} rounded-2xl overflow-hidden shadow-sm`}>
                <button onClick={() => setExpandedProtocol(isExpanded ? null : idx)}
                  className={`w-full px-6 py-4 flex items-center justify-between ${pstyle.bg} hover:opacity-90 transition`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pstyle.icon}</span>
                    <div className="text-left">
                      <h3 className={`font-bold ${pstyle.text}`}>{protocol.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pstyle.badge} capitalize`}>
                        {protocol.priority || 'medium'} priority
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={20} className={pstyle.text}/> : <ChevronRight size={20} className="text-slate-400"/>}
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                      <div className="px-6 py-5 bg-slate-50">
                        <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {(protocol.content || '').split('\n').map((line, li) => {
                            const boldFormatted = line.split(/(\*\*[^*]+\*\*)/).map((part, pi) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={pi}>{part.slice(2,-2)}</strong>
                                : <span key={pi}>{part}</span>
                            );
                            return <div key={li} className={line.trim()===''?'h-2':''}>{boldFormatted}</div>;
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-300"/>
          <p className="text-slate-600 font-semibold">No specific protocols found for this diagnosis.</p>
          <p className="text-sm text-slate-400 mt-2">Use the general Care Guide or generate a full care plan.</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => navigate('/care-guide')}
              className="px-4 py-2 bg-slate-600 text-white rounded-xl font-bold text-sm hover:bg-slate-700">
              General Care Guide
            </button>
            <button onClick={() => navigate(`/patients/${patientId}/care-plan`)}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700">
              Generate Care Plan
            </button>
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      {guideData.emergency_contacts && guideData.emergency_contacts.length > 0 && (
        <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
          className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2"><Phone size={18}/>Emergency Contacts</h3>
          <div className="space-y-2">
            {guideData.emergency_contacts.map((contact, i) => (
              <div key={i} className="bg-slate-50 px-4 py-2.5 rounded-xl border-2 border-red-200 text-sm font-semibold text-slate-900">
                {contact}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
        This guide is AI-personalised for <strong>{guideData.patient_name}</strong> based on their diagnosis
        (<strong>{(guideData.disease_profile || '').replace(/_/g,' ')}</strong>) and assessment data.
      </div>
    </div>
  );
}

