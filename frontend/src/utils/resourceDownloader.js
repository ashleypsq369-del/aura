/**
 * Resource Downloader & Offline Storage
 * Downloads and caches educational resources for offline access
 */

import { openDB } from 'idb';

const DB_NAME = 'projectaura_resources';
const DB_VERSION = 1;
const STORE_NAME = 'downloadedResources';

// ============================================================================
// IndexedDB Setup
// ============================================================================

const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('downloadedAt', 'downloadedAt');
        store.createIndex('size', 'size');
      }
    }
  });
};

// ============================================================================
// Resource Download Manager
// ============================================================================

class ResourceDownloadManager {
  constructor() {
    this.db = null;
    this.downloadQueue = [];
    this.downloading = new Set();
    this.maxConcurrent = 3;
    this.init();
  }

  async init() {
    try {
      this.db = await initDB();
    } catch (error) {
      console.error('Failed to initialize resource DB:', error);
    }
  }

  // Download a single resource
  async downloadResource(resource) {
    if (!this.db) await this.init();

    const { id, title, url, category, format } = resource;

    try {
      // Check if already downloaded
      const existing = await this.db.get(STORE_NAME, id);
      if (existing) {
        console.log(`Resource already downloaded: ${title}`);
        return existing;
      }

      // Mark as downloading
      this.downloading.add(id);

      // Fetch the resource
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob
      const blob = await response.blob();

      // Create object URL
      const blobUrl = URL.createObjectURL(blob);

      // Store in IndexedDB
      const downloadedResource = {
        id,
        title,
        url,
        category,
        format,
        size: blob.size,
        blob,
        blobUrl,
        downloadedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };

      await this.db.put(STORE_NAME, downloadedResource);

      // Remove from downloading set
      this.downloading.delete(id);

      console.log(`✅ Downloaded: ${title} (${this.formatBytes(blob.size)})`);

      return downloadedResource;
    } catch (error) {
      this.downloading.delete(id);
      console.error(`Failed to download resource: ${title}`, error);
      throw error;
    }
  }

  // Download multiple resources
  async downloadMultiple(resources, onProgress) {
    if (!this.db) await this.init();

    const total = resources.length;
    let completed = 0;
    let failed = 0;

    const results = [];

    for (const resource of resources) {
      try {
        const result = await this.downloadResource(resource);
        results.push({ success: true, resource: result });
        completed++;
      } catch (error) {
        results.push({ success: false, error, resource });
        failed++;
      }

      if (onProgress) {
        onProgress({
          total,
          completed,
          failed,
          percentage: Math.round((completed + failed) / total * 100),
          current: resource.title
        });
      }
    }

    return {
      total,
      completed,
      failed,
      results
    };
  }

  // Get downloaded resource
  async getResource(id) {
    if (!this.db) await this.init();

    const resource = await this.db.get(STORE_NAME, id);
    
    if (resource) {
      // Update last accessed time
      resource.lastAccessedAt = new Date().toISOString();
      await this.db.put(STORE_NAME, resource);
    }

    return resource;
  }

  // Get all downloaded resources
  async getAllResources() {
    if (!this.db) await this.init();
    return await this.db.getAll(STORE_NAME);
  }

  // Get resources by category
  async getResourcesByCategory(category) {
    if (!this.db) await this.init();
    return await this.db.getAllFromIndex(STORE_NAME, 'category', category);
  }

  // Delete resource
  async deleteResource(id) {
    if (!this.db) await this.init();

    const resource = await this.db.get(STORE_NAME, id);
    if (resource && resource.blobUrl) {
      URL.revokeObjectURL(resource.blobUrl);
    }

    await this.db.delete(STORE_NAME, id);
    console.log(`🗑️ Deleted resource: ${id}`);
  }

  // Clear all downloaded resources
  async clearAll() {
    if (!this.db) await this.init();

    const resources = await this.getAllResources();
    
    // Revoke all blob URLs
    resources.forEach(resource => {
      if (resource.blobUrl) {
        URL.revokeObjectURL(resource.blobUrl);
      }
    });

    await this.db.clear(STORE_NAME);
    console.log('🗑️ Cleared all downloaded resources');
  }

  // Get total storage size
  async getStorageSize() {
    if (!this.db) await this.init();

    const resources = await this.getAllResources();
    const totalBytes = resources.reduce((sum, r) => sum + (r.size || 0), 0);

    return {
      bytes: totalBytes,
      formatted: this.formatBytes(totalBytes),
      count: resources.length
    };
  }

  // Check if resource is downloaded
  async isDownloaded(id) {
    if (!this.db) await this.init();
    const resource = await this.db.get(STORE_NAME, id);
    return !!resource;
  }

  // Format bytes to human-readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Estimate download time
  estimateDownloadTime(sizeInBytes, speedInMbps = 1) {
    const sizeInMb = sizeInBytes / (1024 * 1024);
    const timeInSeconds = (sizeInMb * 8) / speedInMbps;

    if (timeInSeconds < 60) {
      return `${Math.ceil(timeInSeconds)} seconds`;
    } else {
      return `${Math.ceil(timeInSeconds / 60)} minutes`;
    }
  }
}

// ============================================================================
// Predefined Educational Resources for Ghana
// ============================================================================

export const ghanaEducationalResources = [
  // Palliative Care Basics
  {
    id: 'pc-basics-1',
    title: 'Introduction to Palliative Care',
    category: 'palliative_care_basics',
    format: 'pdf',
    url: '/resources/docs/palliative-care-intro.pdf',
    size: 2500000, // 2.5MB
    description: 'Comprehensive guide to palliative care principles',
    language: 'en',
    priority: 'high'
  },
  {
    id: 'pc-basics-2',
    title: 'Pain Management Guide',
    category: 'pain_management',
    format: 'pdf',
    url: '/resources/docs/pain-management.pdf',
    size: 1800000,
    description: 'WHO pain ladder and medication guidelines',
    language: 'en',
    priority: 'high'
  },

  // Symptom Management
  {
    id: 'symptoms-1',
    title: 'Managing Breathlessness',
    category: 'symptom_management',
    format: 'pdf',
    url: '/resources/docs/breathlessness.pdf',
    size: 1200000,
    description: 'Practical strategies for dyspnea management',
    language: 'en',
    priority: 'medium'
  },
  {
    id: 'symptoms-2',
    title: 'Nausea and Vomiting Control',
    category: 'symptom_management',
    format: 'pdf',
    url: '/resources/docs/nausea-vomiting.pdf',
    size: 1000000,
    description: 'Evidence-based approaches to nausea control',
    language: 'en',
    priority: 'medium'
  },

  // Family & Caregiver Support
  {
    id: 'family-1',
    title: 'Family Caregiver Handbook',
    category: 'family_support',
    format: 'pdf',
    url: '/resources/docs/caregiver-handbook.pdf',
    size: 3000000,
    description: 'Complete guide for family caregivers',
    language: 'en',
    priority: 'high'
  },
  {
    id: 'family-2',
    title: 'Communication with Loved Ones',
    category: 'family_support',
    format: 'pdf',
    url: '/resources/docs/communication-guide.pdf',
    size: 1500000,
    description: 'How to have difficult conversations',
    language: 'en',
    priority: 'medium'
  },

  // Cultural & Spiritual
  {
    id: 'spiritual-1',
    title: 'Spiritual Care in Ghana',
    category: 'spiritual_care',
    format: 'pdf',
    url: '/resources/docs/spiritual-care-ghana.pdf',
    size: 2000000,
    description: 'Culturally appropriate spiritual support',
    language: 'en',
    priority: 'high'
  },

  // Videos (smaller educational clips)
  {
    id: 'video-1',
    title: 'Basic Pain Assessment',
    category: 'training_videos',
    format: 'mp4',
    url: '/resources/videos/pain-assessment.mp4',
    size: 15000000, // 15MB
    description: 'Video demonstration of pain assessment',
    language: 'en',
    priority: 'low' // Videos are lower priority due to size
  },

  // Audio Resources
  {
    id: 'audio-1',
    title: 'Relaxation Exercises',
    category: 'patient_resources',
    format: 'mp3',
    url: '/resources/audio/relaxation.mp3',
    size: 5000000, // 5MB
    description: 'Guided relaxation and breathing exercises',
    language: 'en',
    priority: 'medium'
  },

  // Quick Reference Cards
  {
    id: 'ref-1',
    title: 'Emergency Symptom Guide',
    category: 'quick_reference',
    format: 'pdf',
    url: '/resources/docs/emergency-symptoms.pdf',
    size: 500000, // 500KB
    description: 'Quick reference for emergency symptoms',
    language: 'en',
    priority: 'high'
  }
];

// ============================================================================
// Download Presets
// ============================================================================

export const downloadPresets = {
  essential: ghanaEducationalResources.filter(r => r.priority === 'high'),
  complete: ghanaEducationalResources,
  clinician: ghanaEducationalResources.filter(r => 
    ['palliative_care_basics', 'pain_management', 'symptom_management'].includes(r.category)
  ),
  family: ghanaEducationalResources.filter(r => 
    ['family_support', 'patient_resources', 'quick_reference'].includes(r.category)
  ),
  patient: ghanaEducationalResources.filter(r => 
    ['patient_resources', 'quick_reference'].includes(r.category)
  )
};

// ============================================================================
// Auto-download on Login
// ============================================================================

export const autoDownloadEssential = async (userRole, onProgress) => {
  const downloader = new ResourceDownloadManager();
  
  // Select resources based on user role
  let resourcesToDownload;
  
  switch(userRole) {
    case 'clinician':
    case 'admin':
      resourcesToDownload = downloadPresets.clinician;
      break;
    case 'caregiver':
      resourcesToDownload = downloadPresets.family;
      break;
    case 'patient':
    case 'family':
      resourcesToDownload = downloadPresets.patient;
      break;
    default:
      resourcesToDownload = downloadPresets.essential;
  }

  console.log(`📥 Auto-downloading ${resourcesToDownload.length} resources for ${userRole}...`);

  return await downloader.downloadMultiple(resourcesToDownload, onProgress);
};

// ============================================================================
// Export
// ============================================================================

export default ResourceDownloadManager;
