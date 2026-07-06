/**
 * Enhanced Offline Data Cache Manager
 * Caches ALL API responses for offline access
 * Works alongside offlineStorage for write operations
 */

const DB_NAME = 'ProjectAuraCache';
const DB_VERSION = 2;
const CACHE_STORES = {
  patients: 'patients',
  vitals: 'vitals',
  medications: 'medications',
  symptoms: 'symptoms',
  appointments: 'appointments',
  alerts: 'alerts',
  assessments: 'assessments',
  caregivers: 'caregivers',
  resources: 'resources',
  community: 'community',
  notifications: 'notifications',
  predictions: 'predictions',
  dashboard: 'dashboard'
};

class OfflineDataCache {
  constructor() {
    this.db = null;
    this.initDB();
  }

  /**
   * Initialize IndexedDB with multiple stores
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open cache database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Offline cache database initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create all object stores
        Object.entries(CACHE_STORES).forEach(([, storeName]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: 'id',
              autoIncrement: false
            });
            
            store.createIndex('cachedAt', 'cachedAt', { unique: false });
            store.createIndex('patientId', 'patientId', { unique: false });
            
            console.log(`✅ Created cache store: ${storeName}`);
          }
        });
      };
    });
  }

  /**
   * Cache API response data
   */
  async cacheData(storeName, data, options = {}) {
    if (!this.db) {
      await this.initDB();
    }

    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Handle array of items or single item
      const items = Array.isArray(data) ? data : [data];
      
      let cachedCount = 0;
      
      for (const item of items) {
        // Skip items without an id (like dashboard summary data)
        if (!item.id) {
          continue;
        }
        
        const cacheRecord = {
          ...item,
          cachedAt: new Date().toISOString(),
          expiresAt: options.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h default
        };
        
        await new Promise((resolve, reject) => {
          const request = store.put(cacheRecord);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        cachedCount++;
      }

      console.log(`✅ Cached ${cachedCount} item(s) in ${storeName}`);
      return true;
    } catch (error) {
      console.error(`Failed to cache data in ${storeName}:`, error);
      return false;
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(storeName, id = null) {
    if (!this.db) {
      await this.initDB();
    }

    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      if (id) {
        // Get single item by ID
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => {
            const data = request.result;
            // Check expiration
            if (data && new Date(data.expiresAt) > new Date()) {
              resolve(data);
            } else {
              resolve(null); // Expired or not found
            }
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        // Get all items
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const allData = request.result || [];
            // Filter out expired items
            const validData = allData.filter(item => 
              new Date(item.expiresAt) > new Date()
            );
            resolve(validData);
          };
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error(`Failed to get cached data from ${storeName}:`, error);
      return null;
    }
  }

  /**
   * Get cached data by patient ID
   */
  async getCachedDataByPatient(storeName, patientId) {
    if (!this.db) {
      await this.initDB();
    }

    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('patientId');

      return new Promise((resolve, reject) => {
        const request = index.getAll(patientId);
        request.onsuccess = () => {
          const allData = request.result || [];
          // Filter out expired items
          const validData = allData.filter(item => 
            new Date(item.expiresAt) > new Date()
          );
          resolve(validData);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to get cached data by patient from ${storeName}:`, error);
      return [];
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    if (!this.db) {
      await this.initDB();
    }

    let totalCleared = 0;

    for (const storeName of Object.values(CACHE_STORES)) {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const now = new Date();

        await new Promise((resolve, reject) => {
          const request = store.openCursor();
          
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              const data = cursor.value;
              if (new Date(data.expiresAt) <= now) {
                cursor.delete();
                totalCleared++;
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Failed to clear expired cache from ${storeName}:`, error);
      }
    }

    console.log(`✅ Cleared ${totalCleared} expired cache entries`);
    return totalCleared;
  }

  /**
   * Clear all cache
   */
  async clearAllCache() {
    if (!this.db) {
      await this.initDB();
    }

    for (const storeName of Object.values(CACHE_STORES)) {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Failed to clear cache store ${storeName}:`, error);
      }
    }

    console.log('✅ Cleared all cache data');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.db) {
      await this.initDB();
    }

    const stats = {};

    for (const [key, storeName] of Object.entries(CACHE_STORES)) {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const count = await new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        stats[key] = count;
      } catch {
        stats[key] = 0;
      }
    }

    return stats;
  }
}

// Create singleton instance
const offlineDataCache = new OfflineDataCache();

// Auto-clear expired cache every hour
setInterval(() => {
  offlineDataCache.clearExpiredCache();
}, 60 * 60 * 1000);

export default offlineDataCache;
export { CACHE_STORES };
