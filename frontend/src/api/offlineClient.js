/**
 * Offline-Aware API Client
 * Wraps the standard API client with offline caching
 * Automatically returns cached data when offline
 */

import apiClient from './client';
import offlineDataCache, { CACHE_STORES } from '../utils/offlineDataCache';
import offlineStorage from '../utils/offlineStorage';
import toast from '../utils/toast';

/**
 * Enhanced GET request with offline caching
 */
async function offlineGet(endpoint, options = {}) {
  const { cacheStore, cacheKey, skipCache = false } = options;
  
  // Try online first - always attempt if online, regardless of skipCache
  if (navigator.onLine) {
    try {
      const response = await apiClient.get(endpoint, options);
      
      // Cache the response unless skipCache is set
      if (!skipCache && cacheStore && response.data) {
        await offlineDataCache.cacheData(cacheStore, response.data, {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
        });
      }
      
      return response;
    } catch (error) {
      console.warn(`Online request failed, trying cache: ${endpoint}`, error);
      // Fall through to cache
    }
  }
  
  // Try cache if offline or online request failed
  if (cacheStore) {
    const cachedData = cacheKey 
      ? await offlineDataCache.getCachedData(cacheStore, cacheKey)
      : await offlineDataCache.getCachedData(cacheStore);
    
    if (cachedData) {
      console.log(`Serving ${endpoint} from cache`);
      // Silent - don't toast on every cached load, it's too noisy
      
      // Return in same format as axios response
      return {
        data: cachedData,
        status: 200,
        fromCache: true
      };
    }
  }
  
  // No cache available and offline
  if (!navigator.onLine) {
    toast.error("You're offline - no cached data available", { duration: 5000 });
    throw new Error('Offline: No cached data available');
  }
  
  // Online but no cache - make request
  return apiClient.get(endpoint, options);
}

/**
 * Enhanced POST request with offline queue
 */
async function offlinePost(endpoint, data, options = {}) {
  const { offlineType, cacheStore } = options;
  
  // If online, try normal request
  if (navigator.onLine) {
    try {
      const response = await apiClient.post(endpoint, data, options);
      
      // Cache response if cacheStore specified
      if (cacheStore && response.data) {
        await offlineDataCache.cacheData(cacheStore, response.data);
      }
      
      return response;
    } catch (error) {
      // If failed and not offline, throw
      if (navigator.onLine) {
        throw error;
      }
    }
  }
  
  // Offline - save to queue if offlineType specified
  if (offlineType) {
    await offlineStorage.saveOffline(offlineType, data);
    
    toast.success('Saved offline - will sync when connected', { duration: 5000 });
    
    return {
      data: data,
      status: 202, // Accepted
      offline: true
    };
  }
  
  // No offline support for this endpoint
  toast.error('This action requires an internet connection', { duration: 4000 });
  throw new Error('Offline: No offline support for this action');
}

/**
 * Enhanced PUT request
 */
async function offlinePut(endpoint, data, options = {}) {
  const { offlineType, cacheStore } = options;
  
  if (navigator.onLine) {
    try {
      const response = await apiClient.put(endpoint, data, options);
      
      if (cacheStore && response.data) {
        await offlineDataCache.cacheData(cacheStore, response.data);
      }
      
      return response;
    } catch (error) {
      if (navigator.onLine) {
        throw error;
      }
    }
  }
  
  if (offlineType) {
    await offlineStorage.saveOffline(offlineType, { ...data, _method: 'PUT', _endpoint: endpoint });
    
    toast.success('Update saved offline - will sync when connected', { duration: 5000 });
    
    return {
      data: data,
      status: 202,
      offline: true
    };
  }
  
  toast.error('This action requires an internet connection', { duration: 4000 });
  throw new Error('Offline: No offline support for this action');
}

/**
 * Offline-aware API wrappers
 */
export const offlinePatientsAPI = {
  getAll: (status) => offlineGet('/api/patients', { 
    params: { status },
    cacheStore: CACHE_STORES.patients
  }),
  
  getById: (id) => offlineGet(`/api/patients/${id}`, {
    cacheStore: CACHE_STORES.patients,
    cacheKey: id
  }),
  
  create: (data) => offlinePost('/api/patients', data, {
    offlineType: 'patient_create',
    cacheStore: CACHE_STORES.patients
  }),
  
  update: (id, data) => offlinePut(`/api/patients/${id}`, data, {
    offlineType: 'patient_update',
    cacheStore: CACHE_STORES.patients
  })
};

export const offlineVitalsAPI = {
  getPatientVitals: (patientId, limit = 50) => offlineGet(`/api/vitals/${patientId}`, {
    params: { limit },
    cacheStore: CACHE_STORES.vitals
  }),
  
  log: (data) => offlinePost('/api/vitals', data, {
    offlineType: 'vitals',
    cacheStore: CACHE_STORES.vitals
  })
};

export const offlineSymptomsAPI = {
  getPatientSymptoms: (patientId, limit = 50) => offlineGet(`/api/symptoms/${patientId}`, {
    params: { limit },
    cacheStore: CACHE_STORES.symptoms
  }),
  
  log: (data) => offlinePost('/api/symptoms', data, {
    offlineType: 'symptoms',
    cacheStore: CACHE_STORES.symptoms
  })
};

export const offlineMedicationsAPI = {
  getPatientMedications: (patientId) => offlineGet(`/api/medications/${patientId}`, {
    cacheStore: CACHE_STORES.medications
  }),
  
  create: (data) => offlinePost('/api/medications', data, {
    offlineType: 'medication_create',
    cacheStore: CACHE_STORES.medications
  })
};

export const offlineAlertsAPI = {
  getAll: (patientId) => offlineGet('/api/alerts', {
    params: { patient_id: patientId },
    cacheStore: CACHE_STORES.alerts
  }),
  
  getUnreadCount: () => offlineGet('/api/alerts/unread-count', {
    cacheStore: CACHE_STORES.alerts
  })
};

export const offlineResourcesAPI = {
  getAll: (params) => offlineGet('/api/resources', {
    params,
    cacheStore: CACHE_STORES.resources
  }),
  
  getById: (id) => offlineGet(`/api/resources/${id}`, {
    cacheStore: CACHE_STORES.resources,
    cacheKey: id
  })
};

export const offlineCommunityAPI = {
  // Groups always fetched live - they contain user-specific "joined" state
  getGroups: () => offlineGet('/api/community/groups', {
    cacheStore: CACHE_STORES.community,
  }),
  
  getGroupPosts: (groupId, page = 1) => offlineGet(`/api/community/groups/${groupId}/posts`, {
    params: { page },
    cacheStore: CACHE_STORES.community
  }),
  
  createPost: (data) => offlinePost('/api/community/posts', data, {
    offlineType: 'community_post',
    cacheStore: CACHE_STORES.community
  })
};

export const offlineDashboardAPI = {
  getSummary: () => offlineGet('/api/dashboard/summary', {
    cacheStore: 'dashboard'
  })
};

/**
 * Utility: Prefetch data for offline use
 * Call this when user is online to cache important data
 */
export async function prefetchForOffline(patientId = null) {
  if (!navigator.onLine) {
    console.warn('Cannot prefetch while offline');
    return;
  }
  
  try {
    console.log('🔄 Prefetching data for offline use...');
    
    // Prefetch patients
    await offlinePatientsAPI.getAll();
    
    // Prefetch resources
    await offlineResourcesAPI.getAll({});
    
    // Prefetch community groups
    await offlineCommunityAPI.getGroups();
    
    // If specific patient, prefetch their data
    if (patientId) {
      await Promise.all([
        offlinePatientsAPI.getById(patientId),
        offlineVitalsAPI.getPatientVitals(patientId),
        offlineSymptomsAPI.getPatientSymptoms(patientId),
        offlineMedicationsAPI.getPatientMedications(patientId)
      ]);
    }
    
    toast.success('Offline data ready', { duration: 2500 });
    
    console.log('✅ Prefetch complete');
  } catch (error) {
    console.error('Prefetch failed:', error);
  }
}

/**
 * Utility: Clear offline cache
 */
export async function clearOfflineCache() {
  await offlineDataCache.clearAllCache();
  toast.success('Offline cache cleared', { duration: 2000 });
}

/**
 * Utility: Get cache statistics
 */
export async function getCacheInfo() {
  const stats = await offlineDataCache.getCacheStats();
  return stats;
}

export default {
  patients: offlinePatientsAPI,
  vitals: offlineVitalsAPI,
  symptoms: offlineSymptomsAPI,
  medications: offlineMedicationsAPI,
  alerts: offlineAlertsAPI,
  resources: offlineResourcesAPI,
  community: offlineCommunityAPI,
  dashboard: offlineDashboardAPI,
  prefetchForOffline,
  clearOfflineCache,
  getCacheInfo
};
