import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Heart, Calendar, BookOpen, CheckCircle, Circle,
  TrendingUp, AlertCircle, Loader2, Save
} from 'lucide-react';
import toast from '../utils/toast';
import { bereavementAPI } from '../api/client';
import GriefScreeningForm from './GriefScreeningForm';

// Module-level constant - avoids Math.random() during render
const JOURNAL_PROMPTS = [
  'What memory of your loved one brought you comfort today?',
  'Describe a moment when you felt their presence.',
  'What would you want to say to them if you could?',
  'How has your grief changed since the beginning?',
  'What self-care practice helped you most this week?',
  'Who has been your greatest support during this time?',
  'What small step forward did you take today?',
  'How are you honoring their memory in your daily life?'
];

/**
 * Grief Progress Tracker
 * 
 * Priority 5: Bereavement Support
 * Features:
 * - Visual timeline of 5 grief stages (Kübler-Ross model)
 * - Journaling prompts
 * - Progress notes
 * - Check-in reminders
 * - Emotional state tracking
 */

export default function GriefProgressTracker({ screeningData }) {
  const [showScreeningForm, setShowScreeningForm] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const queryClient = useQueryClient();

  // Fetch grief journey data
  const { data: journeyData, isLoading } = useQuery({
    queryKey: ['grief-journey'],
    queryFn: async () => {
      const response = await bereavementAPI.getGriefJourney();
      return response.data;
    }
  });

  // Save journal entry mutation
  const saveJournalMutation = useMutation({
    mutationFn: async (content) => {
      const response = await bereavementAPI.saveJournalEntry(content);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grief-journey']);
      setJournalEntry('');
      toast.success('Journal entry saved');
    },
    onError: () => {
      toast.error('Failed to save journal entry');
    }
  });

  const handleSaveJournal = (e) => {
    e.preventDefault();
    if (!journalEntry.trim()) return;
    saveJournalMutation.mutate(journalEntry);
  };

  // Five stages of grief (Kübler-Ross model)
  const griefStages = [
    {
      stage: 'Denial',
      description: 'Shock and disbelief that the loss has occurred',
      color: 'slate',
      icon: Circle
    },
    {
      stage: 'Anger',
      description: 'Frustration and anger about the unfairness of loss',
      color: 'red',
      icon: AlertCircle
    },
    {
      stage: 'Bargaining',
      description: 'Attempting to negotiate or make deals to reverse the loss',
      color: 'amber',
      icon: TrendingUp
    },
    {
      stage: 'Depression',
      description: 'Deep sadness and withdrawal as reality sets in',
      color: 'blue',
      icon: Heart
    },
    {
      stage: 'Acceptance',
      description: 'Coming to terms with the loss and finding a new normal',
      color: 'green',
      icon: CheckCircle
    }
  ];

  // Journaling prompt - selected once using lazy useState initializer
  const [selectedPrompt] = useState(
    () => JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grief Stages Timeline */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-2">
          <Heart size={24} className="text-purple-600" />
          Understanding Your Grief Journey
        </h3>
        <p className="text-slate-700 text-sm mb-6">
          Grief is not linear. You may move through these stages in any order, revisit stages, or experience multiple stages at once. 
          There is no "right" way to grieve.
        </p>

        <div className="space-y-4">
          {griefStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrentStage = journeyData?.current_stage === stage.stage.toLowerCase();
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isCurrentStage
                    ? `bg-${stage.color}-50 border-${stage.color}-400`
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    isCurrentStage
                      ? `bg-${stage.color}-100 border-2 border-${stage.color}-400`
                      : 'bg-white border-2 border-slate-300'
                  }`}>
                    <Icon 
                      size={24} 
                      className={isCurrentStage ? `text-${stage.color}-600` : 'text-slate-400'} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-bold text-lg ${
                        isCurrentStage ? `text-${stage.color}-900` : 'text-slate-900'
                      }`}>
                        {idx + 1}. {stage.stage}
                      </h4>
                      {isCurrentStage && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${stage.color}-200 text-${stage.color}-800`}>
                          Current Stage
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isCurrentStage ? `text-${stage.color}-800` : 'text-slate-600'
                    }`}>
                      {stage.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
          <p className="text-purple-900 text-sm">
            <strong>Remember:</strong> Grief is a deeply personal experience. These stages are a framework, not a prescription. 
            Allow yourself to feel what you feel, when you feel it.
          </p>
        </div>
      </div>

      {/* Grief Screening */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-purple-600" />
          Grief Check-In
        </h3>

        {screeningData?.completed_recently ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <p className="text-green-900 font-semibold mb-2">
                ✓ Last screening completed: {new Date(screeningData.last_completed).toLocaleDateString()}
              </p>
              <p className="text-green-800 text-sm">
                Your grief screening helps us provide better support. We recommend completing this every 1-3 months.
              </p>
            </div>

            {screeningData.flagged && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-amber-900 font-semibold mb-2">
                  Recommendation: Professional Support
                </p>
                <p className="text-amber-800 text-sm mb-3">
                  Your screening indicates you may benefit from professional grief counseling. This is common and seeking help is a sign of strength.
                </p>
                <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                  View Counseling Resources
                </button>
              </div>
            )}

            <button
              onClick={() => setShowScreeningForm(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Retake Screening
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-700">
              A brief screening can help us understand your grief experience and provide appropriate support.
            </p>
            <button
              onClick={() => setShowScreeningForm(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Start Grief Screening
            </button>
          </div>
        )}

        {/* Grief Screening Form Modal */}
        {showScreeningForm && (
          <GriefScreeningForm
            onClose={() => setShowScreeningForm(false)}
            onComplete={() => {
              setShowScreeningForm(false);
              queryClient.invalidateQueries(['grief-screening-status']);
              queryClient.invalidateQueries(['grief-journey']);
            }}
          />
        )}
      </div>

      {/* Journaling Section */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-2">
          <BookOpen size={24} className="text-purple-600" />
          Grief Journal
        </h3>

        <div className="mb-6 p-4 bg-gradient-to-br bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-purple-900 font-semibold mb-2">Today's Prompt:</p>
          <p className="text-purple-800 italic">"{selectedPrompt}"</p>
        </div>

        <form onSubmit={handleSaveJournal} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Your Thoughts
            </label>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              rows={6}
              placeholder="Write freely... Your entries are private and confidential."
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-2">
              🔒 Your journal entries are private and only visible to you
            </p>
          </div>

          <button
            type="submit"
            disabled={saveJournalMutation.isPending || !journalEntry.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveJournalMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Entry</span>
              </>
            )}
          </button>
        </form>

        {/* Recent Journal Entries */}
        {journeyData?.recent_entries && journeyData.recent_entries.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4">Recent Entries</h4>
            <div className="space-y-3">
              {journeyData.recent_entries.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-slate-800 text-sm line-clamp-3">{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Self-Care Reminders */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 p-6">
        <h3 className="font-bold text-teal-900 text-lg mb-4">
          Self-Care Reminders
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelfCareCard
            title="Rest"
            description="Grief is exhausting. Allow yourself to rest."
          />
          <SelfCareCard
            title="Nourish"
            description="Eat regularly, even if you don't feel hungry."
          />
          <SelfCareCard
            title="Connect"
            description="Reach out to supportive friends or family."
          />
          <SelfCareCard
            title="Move"
            description="Gentle movement can help process emotions."
          />
        </div>
      </div>
    </div>
  );
}

function SelfCareCard({ title, description }) {
  return (
    <div className="p-4 bg-[#f0f6fa] rounded-lg border-2 border-teal-200">
      <p className="font-bold text-teal-900 mb-1">{title}</p>
      <p className="text-teal-700 text-sm">{description}</p>
    </div>
  );
}
