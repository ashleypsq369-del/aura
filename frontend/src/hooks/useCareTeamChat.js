/**
 * useCareTeamChat
 * ===============
 * Navigate to the Messages page and automatically open a conversation
 * with a specific user (or the first care team member if no userId given),
 * optionally pre-filling the message input.
 *
 * Usage:
 *   const { chatWith, chatWithCareTeam } = useCareTeamChat();
 *
 *   // Open chat with a specific user
 *   chatWith(userId, 'I have a question about my medication');
 *
 *   // Open chat with first care team member (no userId needed)
 *   chatWithCareTeam('My pain score is 8/10 today.');
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../api/client';

export function useCareTeamChat() {
  const navigate = useNavigate();

  // Pre-fetch care team so we know who to chat with
  const { data } = useQuery({
    queryKey: ['my-care-team'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return { care_team: [] };
      const r = await axios.get(`${API_URL}/api/messaging/my-care-team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const careTeam = data?.care_team || [];

  /**
   * Open a chat with a specific user ID.
   * @param {number} userId
   * @param {string} [prefilledMessage]
   */
  const chatWith = (userId, prefilledMessage = '') => {
    const params = new URLSearchParams({ userId: String(userId) });
    if (prefilledMessage) params.set('msg', encodeURIComponent(prefilledMessage));
    navigate(`/messages?${params.toString()}`);
  };

  /**
   * Open a chat with the first care team member (primary clinician preferably).
   * @param {string} [prefilledMessage]
   */
  const chatWithCareTeam = (prefilledMessage = '') => {
    if (careTeam.length === 0) {
      navigate('/messages');
      return;
    }
    // Prefer primary clinician, fall back to first member
    const primary = careTeam.find(m =>
      m.relation?.toLowerCase().includes('clinician') ||
      m.relation?.toLowerCase().includes('doctor')
    ) || careTeam[0];
    chatWith(primary.user_id, prefilledMessage);
  };

  return { chatWith, chatWithCareTeam, careTeam };
}
