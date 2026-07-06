import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Star, Send, Check } from 'lucide-react';
import { usabilityAPI } from '../api/client';

/**
 * Usability Feedback Widget
 * 
 * Priority 3: HCI & ChatBot Safety
 * Floating widget for page-level user feedback
 * Addresses gap in usability testing framework
 * 
 * Features:
 * - Floating widget on all pages
 * - 5-star rating system
 * - Comment field
 * - Page-level tracking
 * - User role tracking
 * - Success confirmation
 */

export default function UsabilityFeedback({ pageName, userId, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      await usabilityAPI.submitFeedback({
        page_name: pageName,
        rating: rating,
        comment: comment.trim() || null,
        user_id: userId,
        user_role: userRole
      });

      setIsSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setRating(0);
        setComment('');
        setIsSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setComment('');
    setIsSubmitted(false);
  };

  return (
    <>
      {/* Floating Button - Bottom Left */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, x: -100 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: -100 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-3xl transition-all border-4 border-white group"
            title="Give Feedback"
          >
            <MessageSquare className="text-white" size={24} strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              !
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feedback Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-45"
            />

            {/* Feedback Form */}
            <motion.div
              initial={{ opacity: 0, x: -100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              className="fixed bottom-6 left-6 w-96 bg-white rounded-2xl shadow-2xl z-50 border-3 border-purple-500"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={22} strokeWidth={2.5} />
                  <div>
                    <h3 className="font-bold text-base leading-none">Quick Feedback</h3>
                    <p className="text-xs text-purple-100 mt-0.5">Help us improve this page</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-all"
                  aria-label="Close feedback"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Content */}
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Page Context */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-purple-700 font-semibold">
                      📄 Page: <span className="font-bold">{pageName}</span>
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      How useful is this page?
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star
                            size={32}
                            strokeWidth={2}
                            className={`transition-colors ${
                              star <= (hoveredRating || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-xs text-slate-600 mt-2">
                        {rating === 5 && '⭐ Excellent!'}
                        {rating === 4 && '😊 Good'}
                        {rating === 3 && '😐 Okay'}
                        {rating === 2 && '😕 Needs Improvement'}
                        {rating === 1 && '😞 Poor'}
                      </p>
                    )}
                  </div>

                  {/* Comment (Optional) */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Any suggestions? <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us what we can improve..."
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-slate-500 mt-1">{comment.length}/500</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className={`w-full py-3 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                      rating > 0 && !isSubmitting
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg border-2 border-purple-500'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed border-2 border-slate-400'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Send size={16} />
                        </motion.div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} strokeWidth={2.5} />
                        Submit Feedback
                      </>
                    )}
                  </button>

                  {/* Privacy Note */}
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    🔒 Your feedback is anonymous and helps us improve the platform
                  </p>
                </form>
              ) : (
                // Success Message
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-green-400"
                  >
                    <Check className="text-green-600" size={32} strokeWidth={2.5} />
                  </motion.div>
                  <h4 className="font-bold text-lg text-slate-900 mb-2">Thank You!</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Your feedback helps us make ProjectAura better for everyone.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
