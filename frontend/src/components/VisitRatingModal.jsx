/**
 * VisitRatingModal
 * 5-star post-visit rating modal — triggered after a completed appointment.
 * Feature 8: Service Quality Indicators
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { caregiverRatingsAPI } from '../api/client';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'punctuality',    label: 'Punctuality'    },
  { key: 'communication', label: 'Communication'  },
  { key: 'care_quality',  label: 'Care Quality'   },
  { key: 'cleanliness',   label: 'Cleanliness'    },
];

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none"
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        >
          <Star
            size={28}
            strokeWidth={1.5}
            className={
              n <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 dark:text-slate-600'
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function VisitRatingModal({
  isOpen,
  onClose,
  appointmentId,
  caregiverId,
  patientId,
  caregiverName,
}) {
  const [overall, setOverall] = useState(0);
  const [catScores, setCatScores] = useState({});
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => caregiverRatingsAPI.submit(data),
    onSuccess: () => {
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['trust-profile', caregiverId] });
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setOverall(0);
        setCatScores({});
        setComment('');
      }, 1800);
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || 'Could not submit rating';
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (overall === 0) { toast.warning('Please select an overall rating'); return; }
    mutate({
      appointment_id: appointmentId,
      caregiver_id: caregiverId,
      patient_id: patientId,
      rating: overall,
      comment,
      category_scores: catScores,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between"
                style={{ background: 'linear-gradient(to right, #0d948810, transparent)' }}>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">Rate Your Visit</p>
                  {caregiverName && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">with {caregiverName}</p>
                  )}
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                  <X size={16} />
                </button>
              </div>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <CheckCircle size={40} className="text-teal-500" />
                  <p className="font-semibold text-slate-700 dark:text-white">Thank you for your feedback!</p>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Overall */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Overall rating</p>
                    <StarPicker value={overall} onChange={setOverall} />
                  </div>

                  {/* Category scores */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rate by category</p>
                    {CATEGORIES.map(cat => (
                      <div key={cat.key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-28">{cat.label}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCatScores(s => ({ ...s, [cat.key]: n }))}
                              className="focus:outline-none"
                            >
                              <Star
                                size={18}
                                strokeWidth={1.5}
                                className={
                                  n <= (catScores[cat.key] || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200 dark:text-slate-600'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Comment (optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={3}
                      placeholder="How was your experience?"
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isPending || overall === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                    style={{ background: overall > 0 ? '#0d9488' : '#94a3b8' }}
                  >
                    <Send size={14} />
                    {isPending ? 'Submitting…' : 'Submit Rating'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
