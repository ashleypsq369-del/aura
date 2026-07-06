/**
 * Offline Storage Manager
 * Uses IndexedDB to store assessments when offline
 * Syncs to server when connection is restored
 */

const DB_NAME = 'ProjectAuraOffline';
const DB_VERSION = 1;
const STORE_NAME = 'pendingAssessments';

class OfflineStorageManager {
  constructor() {
    this.db = null;
    this.initDB();
    this.setupOnlineListener();
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        // Purge any stale unroutable records from previous sessions
        this.purgeUnroutablePending().catch(() => {});
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
          objectStore.createIndex('patientId', 'patientId', { unique: false });
          objectStore.createIndex('synced', 'synced', { unique: false });
          
          console.log('✅ Object store created');
        }
      };
    });
  }

  /**
   * Check if online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Save assessment offline
   */
  async saveOffline(assessmentType, data) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      type: assessmentType,
      data: data,
      timestamp: new Date().toISOString(),
      patientId: data.patient_id,
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.add(record);
      
      request.onsuccess = () => {
        console.log(`✅ Saved ${assessmentType} offline with ID: ${request.result}`);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to save offline:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending (unsynced) assessments
   */
  async getPendingAssessments() {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      // Get all records and filter for unsynced ones
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allRecords = request.result || [];
        // Filter for unsynced records (where synced is false or undefined)
        const pendingRecords = allRecords.filter(record => !record.synced);
        resolve(pendingRecords);
      };
      
      request.onerror = () => {
        console.error('IndexedDB getAll error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark assessment as synced
   */
  async markAsSynced(id) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          record.syncedAt = new Date().toISOString();
          
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(false);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete synced assessment
   */
  async deleteAssessment(id) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get count of pending assessments
   */
  async getPendingCount() {
    const pending = await this.getPendingAssessments();
    return pending.length;
  }

  /**
   * Clear all synced assessments
   */
  async clearSynced() {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(true); // Get synced items
      const deleted = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deleted.push(cursor.value.id);
          cursor.continue();
        } else {
          console.log(`✅ Cleared ${deleted.length} synced assessments`);
          resolve(deleted.length);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Purge any pending records whose type has no valid sync endpoint.
   * Prevents infinite error loops on startup.
   */
  async purgeUnroutablePending() {
    const VALID_TYPES = new Set([
      'vitals','symptoms','medications','patient_create','medication_create',
      'community_post','esas','pps','barthel','mental_health','pain',
      'qol','motor_skills','caregiver_burden','cognitive',
    ]);
    const pending = await this.getPendingAssessments();
    let purged = 0;
    for (const record of pending) {
      if (!VALID_TYPES.has(record.type)) {
        await this.deleteAssessment(record.id);
        purged++;
        console.log(`🧹 Purged unroutable pending record: ${record.type}`);
      }
    }
    return purged;
  }

  /**
   * Setup online/offline event listeners
   */
  setupOnlineListener() {
    window.addEventListener('online', async () => {
      console.log('🌐 Connection restored - syncing pending assessments...');
      await this.purgeUnroutablePending();
      await this.syncPendingAssessments();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connection lost - offline mode activated');
    });
  }

  /**
   * Sync all pending assessments to server
   */
  async syncPendingAssessments() {
    if (!this.isOnline()) {
      console.log('⚠️ Still offline, cannot sync');
      return { success: false, reason: 'offline' };
    }

    // Remove any records with no valid endpoint before attempting sync
    await this.purgeUnroutablePending();
    const cleanPending = await this.getPendingAssessments();
    
    if (cleanPending.length === 0) {
      console.log('✅ No pending assessments to sync');
      return { success: true, synced: 0 };
    }

    console.log(`📤 Syncing ${cleanPending.length} pending assessments...`);
    
    let synced = 0;
    let failed = 0;
    const errors = [];

    for (const assessment of cleanPending) {
      try {
        // Import apiClient dynamically to avoid circular dependency
        const { default: apiClient } = await import('../api/client');
        
        // Map offline type names to correct API endpoints
        const ENDPOINT_MAP = {
          // Clinical assessments
          vitals:           '/api/vitals',
          symptoms:         '/api/symptoms',
          medications:      '/api/medications',
          patient_create:   '/api/patients',
          patient_update:   null,  // PUT - handled below
          medication_create:'/api/medications',
          // Community
          community_post:   '/api/community/posts',
          // Assessments
          esas:             '/api/clinical-assessments/esas',
          pps:              '/api/clinical-assessments/pps',
          barthel:          '/api/clinical-assessments/barthel',
          mental_health:    '/api/clinical-assessments/mental-health',
          pain:             '/api/clinical-assessments/pain',
          qol:              '/api/clinical-assessments/qol',
          motor_skills:     '/api/clinical-assessments/motor-skills',
          caregiver_burden: '/api/clinical-assessments/caregiver-burden',
          cognitive:        '/api/clinical-assessments/cognitive',
        };

        const endpoint = ENDPOINT_MAP[assessment.type]
          ?? `/api/assessments/${assessment.type}`;

        if (!endpoint) {
          // PUT types need special handling - skip silently
          console.warn(`No sync endpoint for type: ${assessment.type} - skipping`);
          await this.deleteAssessment(assessment.id);
          synced++;
          continue;
        }
        
        // Send to server
        await apiClient.post(endpoint, assessment.data);
        
        // Mark as synced
        await this.markAsSynced(assessment.id);
        
        // Delete from offline storage
        await this.deleteAssessment(assessment.id);
        
        synced++;
        console.log(`✅ Synced ${assessment.type} assessment`);
        
      } catch (error) {
        console.error(`❌ Failed to sync ${assessment.type}:`, error);
        failed++;
        errors.push({ 
          id: assessment.id, 
          type: assessment.type, 
          error: error.message 
        });
      }
    }

    console.log(`📊 Sync complete: ${synced} synced, ${failed} failed`);
    
    return { 
      success: failed === 0, 
      synced, 
      failed, 
      errors,
      total: cleanPending.length 
    };
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const pending = await this.getPendingAssessments();
    const online = this.isOnline();
    
    return {
      online,
      pendingCount: pending.length,
      pendingAssessments: pending.map(p => ({
        id: p.id,
        type: p.type,
        patientId: p.patientId,
        timestamp: p.timestamp
      }))
    };
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageManager();

export default offlineStorage;
