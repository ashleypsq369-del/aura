/**
 * useAppStore.js - Zustand global store
 * ======================================
 * Lightweight global state that prevents unnecessary re-renders
 * across complex multi-step medical forms and clinical dashboards.
 *
 * Replaces scattered useState + prop-drilling for:
 *   - Alert/notification unread counts (polled every 30s)
 *   - Patient list filter state
 *   - Global loading/error states
 *   - Active patient context (for sidebar + breadcrumbs)
 */

import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // -- Alert counts ----------------------------------------------------------
  unreadAlerts: 0,
  unreadNotifications: 0,
  setUnreadAlerts: (count) => set({ unreadAlerts: count }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  incrementAlerts: () => set((s) => ({ unreadAlerts: s.unreadAlerts + 1 })),
  clearAlerts: () => set({ unreadAlerts: 0 }),

  // -- Active patient context ------------------------------------------------
  activePatient: null,          // { id, full_name, patient_code, risk_level }
  setActivePatient: (patient) => set({ activePatient: patient }),
  clearActivePatient: () => set({ activePatient: null }),

  // -- Patient list filters --------------------------------------------------
  patientFilters: {
    status: 'all',
    riskLevel: 'all',
    search: '',
    sortBy: 'name',
    sortDir: 'asc',
  },
  setPatientFilter: (key, value) =>
    set((s) => ({ patientFilters: { ...s.patientFilters, [key]: value } })),
  resetPatientFilters: () =>
    set({ patientFilters: { status: 'all', riskLevel: 'all', search: '', sortBy: 'name', sortDir: 'asc' } }),

  // -- Global overlay / loading ----------------------------------------------
  globalLoading: false,
  setGlobalLoading: (v) => set({ globalLoading: v }),

  // -- Crisis alert queue (for real-time alert banner) -----------------------
  crisisQueue: [],              // array of { id, patient_name, message, created_at }
  pushCrisis: (alert) =>
    set((s) => ({ crisisQueue: [alert, ...s.crisisQueue].slice(0, 5) })),
  dismissCrisis: (id) =>
    set((s) => ({ crisisQueue: s.crisisQueue.filter((a) => a.id !== id) })),
  clearCrisisQueue: () => set({ crisisQueue: [] }),

  // -- Sidebar state ---------------------------------------------------------
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));

export default useAppStore;
