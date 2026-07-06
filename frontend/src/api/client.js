import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // If we are not already on a public page, redirect to login
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      if (!publicPaths.some(path => window.location.pathname.startsWith(path))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const authAPI = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  getCurrentUser: () => apiClient.get('/api/auth/me'),
  register: (data) => apiClient.post('/api/auth/register', data),
  forgotPassword: (data) => apiClient.post('/api/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/api/auth/reset-password', data),
  changePassword: (data) => apiClient.put('/api/auth/change-password', data),
  logout: () => apiClient.post('/api/auth/logout'),
};

export const patientsAPI = {
  getAll: (status) => apiClient.get('/api/patients', { params: { status } }),
  getById: (id) => apiClient.get(`/api/patients/${id}`),
  create: (data) => apiClient.post('/api/patients', data),
  update: (id, data) => apiClient.put(`/api/patients/${id}`, data),
  updateStatus: (id, status) => apiClient.put(`/api/patients/${id}/status`, null, { params: { status_value: status } }),
};

export const vitalsAPI = {
  log: (data) => apiClient.post('/api/vitals', data),
  getPatientVitals: (patientId, limit = 50) => apiClient.get(`/api/vitals/${patientId}`, { params: { limit } }),
};

export const symptomsAPI = {
  log: (data) => apiClient.post('/api/symptoms', data),
  getPatientSymptoms: (patientId, limit = 50) => apiClient.get(`/api/symptoms/${patientId}`, { params: { limit } }),
};

export const medicationsAPI = {
  getPatientMedications: (patientId) => apiClient.get(`/api/medications/${patientId}`),
  create: (data) => apiClient.post('/api/medications', data),
  update: (id, data) => apiClient.put(`/api/medications/${id}`, data),
  delete: (id) => apiClient.delete(`/api/medications/${id}`),
};

export const appointmentsAPI = {
  getPatientAppointments: (patientId) => apiClient.get(`/api/appointments/${patientId}`),
  create: (data) => apiClient.post('/api/appointments', data),
  update: (id, data) => apiClient.put(`/api/appointments/${id}`, data),
  delete: (id) => apiClient.delete(`/api/appointments/${id}`),
};

export const dashboardAPI = {
  getSummary: () => apiClient.get('/api/dashboard/summary'),
};

export const chatbotAPI = {
  chat: (data) => apiClient.post('/api/chatbot/chat', data),  // AIAssistant - navigation & data
  getHistory: (sessionId) => apiClient.get(`/api/chatbot/session/${sessionId}/history`),
  endSession: () => apiClient.post('/api/chatbot/session/end'),
};

// NEW: Conversational ChatBot API - True LLM-powered AI companion
export const conversationalChatbotAPI = {
  chat: (data) => apiClient.post('/api/conversational-chatbot/chat', data),
  getConversations: () => apiClient.get('/api/conversational-chatbot/conversations'),
  deleteConversation: (id) => apiClient.delete(`/api/conversational-chatbot/conversations/${id}`),
  getStatus: () => apiClient.get('/api/conversational-chatbot/status'),
  analyze: (data) => apiClient.post('/api/conversational-chatbot/analyze', data),
};

// ----------------------------------------------------------------------------
// TRUE LLM CHATBOT API  - Gemini 1.5 Flash / Groq Llama 3.1 (ChatGPT-grade)
// ----------------------------------------------------------------------------
export const llmChatbotAPI = {
  // Standard (non-streaming) chat
  chat: (data) => apiClient.post('/api/llm-chatbot/chat', data),

  // Conversations
  getConversations: () => apiClient.get('/api/llm-chatbot/conversations'),
  deleteConversation: (id) => apiClient.delete(`/api/llm-chatbot/conversations/${id}`),

  // Provider status
  getStatus: () => apiClient.get('/api/llm-chatbot/status'),

  /**
   * Streaming chat - returns an async generator yielding parsed SSE events.
   * Usage:
   *   for await (const event of llmChatbotAPI.stream({ message, conversationId })) {
   *     if (event.type === 'chunk') appendText(event.text);
   *     if (event.type === 'done')  setLoading(false);
   *   }
   */
  stream: async function* ({ message, conversationId }) {
    const token = localStorage.getItem('auth_token');
    const params = new URLSearchParams({ message });
    if (conversationId) params.append('conversation_id', conversationId);

    const res = await fetch(
      `${API_BASE_URL}/api/llm-chatbot/stream?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Parse complete SSE events (separated by \n\n)
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';   // last element may be incomplete

      for (const raw of events) {
        const line = raw.trim();
        if (!line.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          yield payload;
        } catch {
          // malformed chunk - skip
        }
      }
    }
  },
};

export const profileAPI = {
  get: () => apiClient.get('/api/profile'),
  update: (data) => apiClient.put('/api/profile', data),
};

export const preferencesAPI = {
  getMine: () => apiClient.get('/api/preferences/mine'),
  save: (data) => apiClient.post('/api/preferences', data),
  getByUserId: (userId) => apiClient.get(`/api/preferences/${userId}`),
  updateByUserId: (userId, data) => apiClient.put(`/api/preferences/${userId}`, data),
};

export const resourcesAPI = {
  getAll: (params) => apiClient.get('/api/resources', { params }),
  getRecommended: () => apiClient.get('/api/resources/recommended'),
  getRecommendedByUserId: (userId) => apiClient.get(`/api/resources/recommended/${userId}`),
  getBookmarks: () => apiClient.get('/api/resources/bookmarks'),
  getById: (id) => apiClient.get(`/api/resources/${id}`),
  toggleHelpful: (id, helpful) => apiClient.post(`/api/resources/${id}/helpful`, { helpful }),
  toggleBookmark: (id) => apiClient.post(`/api/resources/${id}/bookmark`),
};

export const communityAPI = {
  getGroups: () => apiClient.get('/api/community/groups'),
  toggleJoin: (groupId) => apiClient.post(`/api/community/groups/${groupId}/join`),
  getGroupPosts: (groupId, page = 1) => apiClient.get(`/api/community/groups/${groupId}/posts`, { params: { page } }),
  createPost: (data) => apiClient.post('/api/community/posts', data),
  reactToPost: (postId, reaction_type) => apiClient.post(`/api/community/posts/${postId}/react`, { reaction_type }),
  flagPost: (postId) => apiClient.post(`/api/community/posts/${postId}/flag`),
  moderatePost: (postId, hidden) => apiClient.put(`/api/community/posts/${postId}/moderate`, null, { params: { hidden } }),
};

export const portalAPI = {
  getDashboard: (patientId) => apiClient.get(`/api/patient-portal/${patientId}`),
  getCareTemplate: (condition) => apiClient.get(`/api/care-templates/${condition}`),
  getJourney: (patientId) => apiClient.get(`/api/journey/${patientId}`),
  logJourneyEvent: (patientId, data) => apiClient.post(`/api/journey/${patientId}/event`, data),
};

export const carePlanAPI = {
  get:              (patientId)       => apiClient.get(`/api/care-plans/${patientId}`),
  generate:         (patientId)       => apiClient.post(`/api/care-plans/${patientId}/generate`),
  update:           (patientId, data) => apiClient.put(`/api/care-plans/${patientId}`, data),
  getGuide:         (patientId)       => apiClient.get(`/api/care-plans/${patientId}/guide`),
  // Goals
  addGoal:          (patientId, data) => apiClient.post(`/api/care-plans/${patientId}/goals`, data),
  updateGoal:       (patientId, goalId, data) => apiClient.put(`/api/care-plans/${patientId}/goals/${goalId}`, data),
  deleteGoal:       (patientId, goalId) => apiClient.delete(`/api/care-plans/${patientId}/goals/${goalId}`),
  // Checklist
  addChecklistItem: (patientId, goalId, data) => apiClient.post(`/api/care-plans/${patientId}/goals/${goalId}/checklist`, data),
  updateChecklistItem: (patientId, goalId, itemId, data) => apiClient.put(`/api/care-plans/${patientId}/goals/${goalId}/checklist/${itemId}`, data),
  deleteChecklistItem: (patientId, goalId, itemId) => apiClient.delete(`/api/care-plans/${patientId}/goals/${goalId}/checklist/${itemId}`),
  // Interventions
  addIntervention:    (patientId, data) => apiClient.post(`/api/care-plans/${patientId}/interventions`, data),
  updateIntervention: (patientId, ivId, data) => apiClient.put(`/api/care-plans/${patientId}/interventions/${ivId}`, data),
  deleteIntervention: (patientId, ivId) => apiClient.delete(`/api/care-plans/${patientId}/interventions/${ivId}`),
};

export const medicalKnowledgeAPI = {
  listConditions:  ()            => apiClient.get('/api/medical/conditions'),
  searchConditions:(q)           => apiClient.get('/api/medical/conditions/search', { params: { q } }),
  matchCondition:  (diagnosis)   => apiClient.get('/api/medical/conditions/match', { params: { diagnosis } }),
  getCondition:    (name)        => apiClient.get(`/api/medical/conditions/${encodeURIComponent(name)}`),
  getQuestionnaireConditions: () => apiClient.get('/api/medical/questionnaire-conditions'),
  getChatbotContext: (name)      => apiClient.get(`/api/medical/chatbot-context/${encodeURIComponent(name)}`),
  getRedFlags:     (name)        => apiClient.get(`/api/medical/red-flags/${encodeURIComponent(name)}`),
  getPatientContext: (patientId) => apiClient.get(`/api/medical/patient-context/${patientId}`),
};

export const adminAPI = {
  listUsers: (params) => apiClient.get('/api/admin/users', { params }),
  createUser: (data) => apiClient.post('/api/admin/users', data),
  updateUser: (id, data) => apiClient.put(`/api/admin/users/${id}`, data),
  deactivateUser: (id) => apiClient.put(`/api/admin/users/${id}/deactivate`),
  resetUserPassword: (id) => apiClient.put(`/api/admin/users/${id}/reset-password`),
  getAuditLog: (params) => apiClient.get('/api/admin/audit-log', { params }),
};

export const caregiversAPI = {
  getAll: () => apiClient.get('/api/caregivers'),
  getMyPatients: () => apiClient.get('/api/caregivers/my-patients'),
  getAssignments: () => apiClient.get('/api/caregivers/assignments'),
  assign: (data) => apiClient.post('/api/caregivers/assign', data),
  removeAssignment: (id) => apiClient.delete(`/api/caregivers/assignments/${id}`),
};

export const alertsAPI = {
  getAll: (patientId) => apiClient.get('/api/alerts', { params: { patient_id: patientId } }),
  getUnreadCount: () => apiClient.get('/api/alerts/unread-count'),
  acknowledge: (alertId) => apiClient.put(`/api/alerts/${alertId}/acknowledge`),
  dismiss: (alertId) => apiClient.delete(`/api/alerts/${alertId}`),
};

export const caregiverIntelligenceAPI = {
  getTeamOverview: () => apiClient.get('/api/caregiver-intelligence/team-overview'),
  getCaregiverWorkload: (caregiverId) => apiClient.get(`/api/caregiver-intelligence/caregiver-workload/${caregiverId}`),
  assignCaregiver: (patientId, caregiverId, notes) =>
    apiClient.post(`/api/caregiver-intelligence/assign/${patientId}`, { caregiver_id: caregiverId, notes }),
  unassignCaregiver: (patientId, caregiverId) =>
    apiClient.delete(`/api/caregiver-intelligence/assign/${patientId}/${caregiverId}`),
  assignOptimal: (patientId) => apiClient.post(`/api/caregiver-intelligence/assign-optimal-caregiver/${patientId}`),
  getMyPatients: () => apiClient.get('/api/caregiver-intelligence/my-patients'),
};

export const aiAPI = {
  predict: (patientId) => apiClient.post('/api/ai/predict', { patient_id: patientId }),
  getSHAP: (patientId) => apiClient.get(`/api/ai/shap/${patientId}`),
  whatIf: (data) => apiClient.post('/api/ai/whatif', data),
  getSystemInsights: () => apiClient.get('/api/ai-analysis/system-insights'),
  getPatientRecommendations: (patientId) => apiClient.get(`/api/ai-analysis/patient-recommendations/${patientId}`),
};

// Priority 3: HCI & ChatBot Safety - Usability Feedback
export const usabilityAPI = {
  submitFeedback: (data) => apiClient.post('/api/hci/usability-feedback', data),
  getFeedbackStats: (pageName) => apiClient.get('/api/hci/usability-feedback/stats', { params: { page_name: pageName } }),
  getAllFeedback: (params) => apiClient.get('/api/hci/usability-feedback', { params }),
};

// Priority 3: HCI & ChatBot Safety - ChatBot Consent
export const chatbotConsentAPI = {
  saveConsent: (data) => apiClient.post('/api/hci/chatbot-consent', data),
  getConsent: (userId) => apiClient.get(`/api/hci/chatbot-consent/${userId}`),
  revokeConsent: (userId) => apiClient.delete(`/api/hci/chatbot-consent/${userId}`),
};

// Priority 3: HCI & ChatBot Safety - Crisis Management
export const crisisAPI = {
  reportCrisis: (data) => apiClient.post('/api/hci/crisis-alert', data),
  notifyCareteam: (patientId) => apiClient.post(`/api/hci/crisis-alert/${patientId}/notify-careteam`),
  getCrisisHistory: (patientId) => apiClient.get(`/api/hci/crisis-alert/${patientId}/history`),
};

// Priority 4: Biomedical Ethics - Model Bias & Clinical Overrides
export const ethicsAPI = {
  getBiasReport: () => apiClient.get('/api/ethics/bias-report'),
  createClinicalOverride: (data) => apiClient.post('/api/ethics/clinical-override', data),
  getPatientOverrides: (patientId) => apiClient.get(`/api/ethics/clinical-overrides/${patientId}`),
  getOverrideStatistics: (days = 30) => apiClient.get('/api/ethics/override-statistics', { params: { days } }),
  getAIImpactReport: () => apiClient.get('/api/ethics/ai-impact-report'),
  getMyPredictions: (limit = 10) => apiClient.get('/api/ethics/my-ai-predictions', { params: { limit } }),
};

// Priority 5: Bereavement Support
export const careSettingsAPI = {
  getTemplates: () => apiClient.get('/api/care-settings/templates'),
  getTemplate: (key) => apiClient.get(`/api/care-settings/templates/${key}`),
  getInteractions: () => apiClient.get('/api/care-settings/interactions'),
  getDashboard: () => apiClient.get('/api/care-settings/dashboard'),
  getMySetting: () => apiClient.get('/api/care-settings/my-setting'),
  getPatientSettings: (patientId) => apiClient.get(`/api/care-settings/patients/${patientId}`),
  assignPatient: (patientId, data) => apiClient.post(`/api/care-settings/patients/${patientId}`, data),
  updateAssignment: (patientId, id, data) => apiClient.put(`/api/care-settings/patients/${patientId}/${id}`, data),
  // User requests a care setting change (pending admin approval)
  requestChange: (data) => apiClient.post('/api/care-settings/request-change', data),
};

export const bereavementAPI = {  // Grief Screening (PG-13)
  submitGriefScreening: (data) => apiClient.post('/api/bereavement/grief-screening', data),
  getScreeningStatus: () => apiClient.get('/api/bereavement/grief-screening/status'),
  getScreeningHistory: (limit = 10) => apiClient.get('/api/bereavement/grief-screening/history', { params: { limit } }),
  
  // Grief Journey & Progress
  getGriefJourney: () => apiClient.get('/api/bereavement/grief-journey'),
  
  // Journal Entries
  saveJournalEntry: (content) => apiClient.post('/api/bereavement/journal', { content }),
  getJournalEntries: (limit = 20, offset = 0) => apiClient.get('/api/bereavement/journal/entries', { params: { limit, offset } }),
  
  // Support Data & Resources
  getSupportData: () => apiClient.get('/api/bereavement/support-data'),
  
  // Post-Death Support Schedule (Admin/Clinician only)
  schedulePostDeathSupport: (patientId, familyUserIds) => apiClient.post('/api/bereavement/schedule-post-death-support', { patient_id: patientId, family_user_ids: familyUserIds }),
  getPostDeathSchedule: (patientId) => apiClient.get(`/api/bereavement/post-death-schedule/${patientId}`),
};

// ── ML Predictions API (trained XGBoost + real SHAP) ────────────────────
export const mlAPI = {
  // Full risk profile with all 8 tasks + SHAP for one patient
  getPatientRisk: (patientId) =>
    apiClient.get(`/api/ml/patient/${patientId}/risk`),

  // Single task prediction + SHAP
  getTaskPrediction: (patientId, task) =>
    apiClient.get(`/api/ml/patient/${patientId}/task/${task}`),

  // Model service status
  getStatus: () =>
    apiClient.get('/api/ml/status'),

  // Batch risk for all patients (dashboard / AI Insights)
  getAllPatientsRisk: () =>
    apiClient.get('/api/ml/patients/batch-risk'),

  // Manually trigger proactive scan
  triggerScan: () =>
    apiClient.post('/api/ml/scheduler/trigger'),
};

// ── Advanced ML API (P6-P11) ──────────────────────────────────────────────
export const advancedMlAPI = {
  // P6+P7+P8+P9: Full analysis (trends, deterioration, prognosis, drug interactions)
  getFullAnalysis:     (patientId) => apiClient.get(`/api/advanced-ml/patient/${patientId}/full-analysis`),
  // P7: Deterioration only
  getDeterioration:    (patientId, days=30) => apiClient.get(`/api/advanced-ml/patient/${patientId}/deterioration?days=${days}`),
  // P8: Prognosis only
  getPrognosis:        (patientId) => apiClient.get(`/api/advanced-ml/patient/${patientId}/prognosis`),
  // P9: Drug interactions for one patient
  getDrugInteractions: (patientId) => apiClient.get(`/api/advanced-ml/patient/${patientId}/drug-interactions`),
  // P9: Batch drug interactions across all patients
  getAllDrugInteractions: () => apiClient.get('/api/advanced-ml/patients/drug-interactions'),
  // P10: Caregiver burnout for one user
  getCaregiverBurnout: (userId) => apiClient.get(`/api/advanced-ml/caregiver/${userId}/burnout`),
  // P10: All caregivers burnout overview
  getAllCaregiverBurnout: () => apiClient.get('/api/advanced-ml/caregivers/burnout-overview'),
  // P11: Submit feedback
  submitFeedback: (data) => apiClient.post('/api/advanced-ml/feedback', data),
  // P11: Retrain status
  getRetrainStatus: () => apiClient.get('/api/advanced-ml/feedback/retrain-status'),
};

// ── Clinical Assessments API ──────────────────────────────────────────────
export const clinicalAssessmentsAPI = {
  // ESAS
  createESAS:    (data)        => apiClient.post('/api/assessments/esas', data),
  getESAS:       (patientId)   => apiClient.get(`/api/assessments/esas/${patientId}`),
  getLatestESAS: (patientId)   => apiClient.get(`/api/assessments/esas/${patientId}/latest`),
  getESASTrends: (patientId, days = 30) => apiClient.get(`/api/assessments/esas/${patientId}/trends?days=${days}`),
  // PPS
  createPPS:     (data)        => apiClient.post('/api/assessments/pps', data),
  getPPS:        (patientId)   => apiClient.get(`/api/assessments/pps/${patientId}`),
  // Assessments list
  getAssessments: (patientId)  => apiClient.get(`/api/assessments/patient/${patientId}/overview`),
};
