/* eslint-disable react-hooks/static-components */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Star, ThumbsUp, ThumbsDown, X, Loader2,
  FileText, Video, Link as LinkIcon, Download, Heart, Brain,
  Pill, MessageCircle, MapPin, ExternalLink, Sparkles, TrendingUp,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { offlineResourcesAPI } from '../api/offlineClient';
import { resourcesAPI } from '../api/client';
import PageHeader from '../components/PageHeader';
import usePersonalisation from '../hooks/usePersonalisation';
import ModalShell from '../components/ui/ModalShell';

import { API_URL } from '../api/client';

function getFormatIcon(format) {
  switch (format) {
    case 'article': return FileText;
    case 'video':   return Video;
    case 'link':    return LinkIcon;
    case 'pdf':     return Download;
    default:        return FileText;
  }
}

const CATEGORIES = [
  { value: 'all',            label: 'All Resources',    icon: BookOpen      },
  { value: 'pain_management',label: 'Pain Management',  icon: Heart         },
  { value: 'nutrition',      label: 'Nutrition',        icon: Pill          },
  { value: 'mental_health',  label: 'Mental Health',    icon: Brain         },
  { value: 'spiritual_care', label: 'Spiritual Care',   icon: MessageCircle },
  { value: 'ghana_resources',label: 'Ghana Resources',  icon: MapPin        },
];

// -- Main page -----------------------------------------------------------------
export default function Resources() {
  const { signals, prefs } = usePersonalisation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery,       setSearchQuery]      = useState('');
  const [viewingResource,   setViewingResource]  = useState(null);
  const queryClient = useQueryClient();

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'ghana_resources') params.is_ghana_specific = 'true';
        else params.category = selectedCategory;
      }
      const response = await offlineResourcesAPI.getAll(params);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const { data: bookmarks } = useQuery({
    queryKey: ['resource-bookmarks'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/resources/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // ML-powered resource recommendations
  const { data: mlRecommended } = useQuery({
    queryKey: ['resources-ml-recommended'],
    queryFn: () => resourcesAPI.getRecommended().then(r => r.data),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (resourceId) => {
      const token = localStorage.getItem('auth_token');
      return axios.post(
        `${API_URL}/api/resources/${resourceId}/bookmark`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resource-bookmarks']);
      queryClient.invalidateQueries(['resource-detail']);
      toast.success('Bookmark updated');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Failed to update bookmark'),
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ resourceId, helpful }) => {
      const token = localStorage.getItem('auth_token');
      return axios.post(
        `${API_URL}/api/resources/${resourceId}/helpful`,
        { helpful },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resource-detail']);
      toast.success('Thank you for your feedback');
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Failed to submit feedback'),
  });

  const handleViewResource = async (resourceId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/resources/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewingResource(response.data);
    } catch {
      toast.error('Failed to load resource');
    }
  };

  const isBookmarked = (resourceId) =>
    bookmarks?.some(b => b.id === resourceId) || false;

  return (
    <div className="min-h-full">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-0">
        <PageHeader
          image="/resources/african/african-medical-reading.jpg"
          title="Educational Resources"
          subtitle="Guides for patients, families and caregivers"
          icon={BookOpen}
        />

        <div className="flex flex-col lg:flex-row gap-5 items-start py-6">
          {/* ── Left sidebar: search + category filter ── */}
          <div className="w-full lg:w-52 lg:flex-shrink-0 lg:sticky lg:top-4 space-y-3">
            {/* Search */}
            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm p-3">
              <div className="relative">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-400)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-[11px] font-bold text-[var(--text-400)] ">Categories</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                {CATEGORIES.map(({ value, label, icon: Icon }, i) => {
                  const colors = ['#0d9488','#e11d48','#d97706','#7c3aed','#db2777','#059669'];
                  const c = colors[i % colors.length];
                  const active = selectedCategory === value;
                  return (
                    <button key={value} onClick={() => setSelectedCategory(value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                        active ? 'text-white' : 'text-[var(--text-600)] hover:bg-slate-50'
                      }`}
                      style={active ? { backgroundColor: c } : {}}>
                      <Icon size={13} style={{ color: active ? '#fff' : c }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bookmarks count */}
            {bookmarks?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{bookmarks.length} Saved</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: resource grid ── */}
          <div className="flex-1 min-w-0">

            {/* ML-powered personalised recommendations */}
            {mlRecommended?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 bg-[var(--card-bg)] border border-teal-200 dark:border-teal-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-[var(--card-border)]/50 flex items-center gap-2" style={{borderLeft:'4px solid #0d9488'}}>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 flex items-center justify-center flex-shrink-0">
                    <Brain size={14} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-800)] flex-1">AI-Recommended for You</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                    {mlRecommended.length} match{mlRecommended.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mlRecommended.slice(0, 4).map(rec => {
                    const r = rec?.resource ?? rec;
                    return (
                      <button key={r.id}
                        onClick={() => handleViewResource(r.id)}
                        className="text-left flex items-start gap-3 p-3 bg-[var(--card-bg)] hover:bg-teal-50 rounded-xl border border-[var(--card-border)] hover:border-teal-300 transition-all group shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <TrendingUp size={13} className="text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-900)] group-hover:text-teal-700 truncate">{r.title}</p>
                          <p className="text-[11px] text-[var(--text-500)] truncate mt-0.5">{r.summary}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--card-bg)] border border-teal-400 text-teal-700 uppercase tracking-wide">
                              {r.category?.replace(/_/g, ' ')}
                            </span>
                            {r.is_ghana_specific && <span className="text-[11px]">🇬🇭</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Personalisation context banner (fallback when no ML recs) */}
            {!mlRecommended?.length && signals?.resourceTags?.length > 0 && (
              <div className="mb-4 px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl">
                <h3 className="text-sm font-bold text-teal-800 mb-1 flex items-center gap-2">
                  <Star size={14} className="text-teal-600" />
                  Recommended for You
                </h3>
                <p className="text-xs text-teal-700">
                  Based on your profile: {signals.condition && <span className="font-semibold">{signals.condition}</span>}
                  {signals.religiousBackground && signals.religiousBackground !== 'none' && (
                    <>, spiritual resources for {signals.religiousBackground}</>
                  )}
                </p>
              </div>
            )}
            
            {resourcesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : !resources || resources.length === 0 ? (
              <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[var(--text-700)] mb-1">No resources found</h3>
                <p className="text-sm text-slate-500">{searchQuery ? 'Try adjusting your search terms' : 'Resources will appear here'}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[var(--text-400)] mb-3 font-semibold">{resources.length} resource{resources.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {resources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource}
                      isBookmarked={isBookmarked(resource.id)}
                      onView={() => handleViewResource(resource.id)}
                      onBookmark={() => bookmarkMutation.mutate(resource.id)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {viewingResource && (
          <ResourceModal
            resource={viewingResource}
            onClose={() => setViewingResource(null)}
            onBookmark={() => {
              const rid = viewingResource?.resource?.id ?? viewingResource?.id;
              bookmarkMutation.mutate(rid);
            }}
            onFeedback={helpful => {
              const rid = viewingResource?.resource?.id ?? viewingResource?.id;
              feedbackMutation.mutate({ resourceId: rid, helpful });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// -- Resource card --------------------------------------------------------------
function ResourceCard({ resource, isBookmarked, onView, onBookmark }) {
  const FormatIcon = getFormatIcon(resource.format);

  const difficultyColor = {
    simple:   'badge-low',
    standard: 'badge-stable',
    detailed: 'badge-info',
  }[resource.difficulty_level] || 'badge-info';

  const categoryChip = {
    pain_management: 'chip-rose',
    nutrition:       'chip-orange',
    mental_health:   'chip-violet',
    spiritual_care:  'chip-indigo',
    family_support:  'chip-pink',
    medical_info:    'chip-teal',
    ghana_resources: 'chip-emerald',
  }[resource.category] || 'chip-teal';

  const formatColor = {
    article: { bg: '#eff6ff', color: '#1d4ed8' },
    video:   { bg: '#faf5ff', color: '#7c3aed' },
    link:    { bg: '#f0fdfa', color: '#0d9488' },
    pdf:     { bg: '#fff1f2', color: '#e11d48' },
  }[resource.format] || { bg: '#f1f5f9', color: '#64748b' };

  return (
    <div
      onClick={onView}
      className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer flex flex-col overflow-hidden"
    >
      <div
        className="h-1 flex-shrink-0"
        style={{
          background: {
            article: 'linear-gradient(to right,#1d4ed8,#0891b2)',
            video:   'linear-gradient(to right,#7c3aed,#db2777)',
            link:    'linear-gradient(to right,#0d9488,#059669)',
            pdf:     'linear-gradient(to right,#e11d48,#dc2626)',
          }[resource.format] || 'linear-gradient(to right,#0d9488,#0891b2)',
        }}
      />

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: formatColor.bg }}
            >
              <FormatIcon size={14} style={{ color: formatColor.color }} />
            </div>
            <span className={difficultyColor}>
              {resource.difficulty_level}
            </span>
            {resource.is_ghana_specific && (
              <span title="Ghana-specific resource" className="chip-emerald">GH</span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onBookmark(); }}
            data-tip={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
            className="p-1 hover:bg-amber-50 rounded transition-colors"
          >
            <Star size={15} className={isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'} />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-[var(--text-900)] mb-1 line-clamp-2 leading-snug">{resource.title}</h3>
        <p className="text-xs text-[var(--text-500)] mb-3 line-clamp-2 leading-relaxed flex-1">{resource.summary}</p>

        <div className="flex items-center justify-between mb-3">
          <span className={categoryChip}>
            {resource.category?.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <ThumbsUp size={10} className="text-green-500" /> {resource.helpful_count || 0}
            </span>
            <span>{resource.view_count || 0} views</span>
          </div>
        </div>

        <button
          onClick={onView}
          data-tip="Open this resource"
          className="w-full py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-xs"
        >
          {resource.pdf_path ? 'Read PDF' : 'View Resource'}
        </button>

        {/* Download / external links */}
        {(resource.pdf_path || resource.external_url) && (
          <div className="mt-2 flex gap-2">
            {resource.pdf_path && (
              <a
                href={`${API_URL}${resource.pdf_path}`}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={e => e.stopPropagation()}
                data-tip="Download PDF"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Download size={11} /> Download
              </a>
            )}
            {resource.external_url && (
              <a
                href={resource.external_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                data-tip="View source"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-[var(--text-600)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ExternalLink size={11} /> Source
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -- PDF viewer sub-component -------------------------------------------------
function PdfViewer({ pdfState, blobUrl, pdfFilename, title, externalUrl }) {
  if (pdfState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 size={24} className="animate-spin text-teal-500" />
        <span className="text-sm font-medium">Loading PDF...</span>
      </div>
    );
  }

  if (pdfState === 'ready' && blobUrl) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <object
          data={blobUrl}
          type="application/pdf"
          className="w-full flex-1 min-h-0"
          aria-label={title}
        >
          {/* Browser fallback - shown when <object> can't render PDF */}
          <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-400)] p-8 text-center">
            <FileText size={44} strokeWidth={1.5} className="opacity-25" />
            <p className="text-sm font-medium text-slate-600">Your browser cannot display this PDF inline.</p>
            <a
              href={blobUrl}
              download={pdfFilename}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Download size={15} /> Download PDF to read
            </a>
          </div>
        </object>
      </div>
    );
  }

  // error state
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[var(--text-400)] p-8 text-center">
      <FileText size={44} strokeWidth={1.5} className="opacity-25" />
      <p className="text-sm font-medium text-slate-600">Could not load this PDF.</p>
      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          <ExternalLink size={15} /> Open on source website
        </a>
      )}
    </div>
  );
}


// -- Resource modal with inline PDF viewer -------------------------------------
function ResourceModal({ resource, onClose, onBookmark, onFeedback }) {
  // Handle both response shapes: wrapped { resource, is_bookmarked, user_feedback }
  // and flat resource objects
  const res           = resource?.resource ?? resource;
  const is_bookmarked = resource?.is_bookmarked ?? false;
  const user_feedback = resource?.user_feedback ?? null;

  const [blobUrl,   setBlobUrl]   = useState(null);
  const [pdfState,  setPdfState]  = useState('idle');
  const FormatIcon = getFormatIcon(res?.format);

  const pdfFilename = res?.pdf_path ? res.pdf_path.replace('/static/pdfs/', '') : null;

  useEffect(() => {
    if (!pdfFilename) return;
    let objectUrl = null;
    setPdfState('loading');

    const token = localStorage.getItem('auth_token');
    fetch(`${API_URL}/api/resources/pdf/${pdfFilename}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setPdfState('ready');
      })
      .catch(() => setPdfState('error'));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfFilename]);

  const hasPdf = !!pdfFilename;

  return (
    <ModalShell
      open={true}
      onClose={onClose}
      title={res?.title}
      description={res?.summary}
      icon={FormatIcon}
      accent="teal"
      size={hasPdf ? 'xl' : 'lg'}
      footer={
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={onBookmark}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-white text-xs font-semibold text-[var(--text-600)] transition-colors">
              <Star size={12} className={is_bookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
              {is_bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            {blobUrl && (
              <a href={blobUrl} download={pdfFilename}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors">
                <Download size={12} /> Download PDF
              </a>
            )}
            {res?.external_url && (
              <a href={res.external_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-600)] text-xs font-semibold hover:bg-[var(--card-bg)] transition-colors">
                <ExternalLink size={12} /> Source
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Helpful?</span>
            <button onClick={() => onFeedback(true)} disabled={user_feedback === 'helpful'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                user_feedback === 'helpful' ? 'bg-green-100 text-green-700' : 'border border-[var(--card-border)] text-[var(--text-500)] hover:bg-green-50'
              }`}>
              <ThumbsUp size={11} /> Yes
            </button>
            <button onClick={() => onFeedback(false)} disabled={user_feedback === 'not_helpful'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                user_feedback === 'not_helpful' ? 'bg-red-100 text-red-700' : 'border border-[var(--card-border)] text-[var(--text-500)] hover:bg-red-50'
              }`}>
              <ThumbsDown size={11} /> No
            </button>
          </div>
        </div>
      }
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-3">
        {res?.is_ghana_specific && <span>🇬🇭</span>}
        {res?.source && (
          <span className="text-[11px] font-semibold text-[var(--text-400)] ">{res.source}</span>
        )}
      </div>

      {/* Body */}
      {hasPdf ? (
        <div className="min-h-[400px] flex flex-col">
          <PdfViewer
            pdfState={pdfState}
            blobUrl={blobUrl}
            pdfFilename={pdfFilename}
            title={res?.title}
            externalUrl={res?.external_url}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-3 border-b border-slate-100">
            {res?.is_ghana_specific && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                🇬🇭 Ghana-specific resource
              </span>
            )}
            {res?.source && (
              <span className="text-[11px] font-semibold text-[var(--text-400)] ">{res.source}</span>
            )}
            {res?.category && (
              <span className="text-[11px] italic text-slate-400">{res.category.replace(/_/g, ' ')}</span>
            )}
          </div>

          {res?.content ? (
            /* ── Book-page text layout ──────────────────────────────── */
            <div>
              {/* Reading guide line */}
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={12} className="text-teal-500 flex-shrink-0" />
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[11px] text-slate-300 font-medium select-none">READING</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Content body with good reading typography */}
              <div className="pl-4 border-l-2 border-slate-200">
                <p className="text-sm text-[var(--text-700)] leading-7 whitespace-pre-wrap">
                  {res.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--text-400)] gap-3">
              <FileText size={40} strokeWidth={1.5} className="opacity-30" />
              <p className="text-sm font-medium">No preview available.</p>
            </div>
          )}
          {res?.external_url && (
            <div className="mt-4 p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-center gap-3">
              <ExternalLink size={16} className="text-teal-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-teal-800 mb-0.5">Read the full document</p>
                <a href={res.external_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-teal-600 hover:underline truncate block">{res.external_url}</a>
              </div>
              <a href={res.external_url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0">
                Open
              </a>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
