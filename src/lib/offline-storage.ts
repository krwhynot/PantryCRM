// Offline storage implementation using IndexedDB for PantryCRM
// Provides robust offline data management for food service CRM

export interface OfflineRecord {
  id: string;
  type: 'organization' | 'contact' | 'interaction' | 'opportunity' | 'lead';
  data: any;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  synced: boolean;
  lastSyncAttempt?: number;
  syncAttempts: number;
}

export interface CachedRecord {
  id: string;
  data: any;
  timestamp: number;
  expires?: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'PantryCRM';
  private readonly dbVersion = 1;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for pending sync operations
        if (!db.objectStoreNames.contains('pendingSync')) {
          const pendingStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('synced', 'synced', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('expires', 'expires', { unique: false });
        }

        // Store for user drafts/forms
        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftsStore.createIndex('type', 'type', { unique: false });
          draftsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for app settings and preferences
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private ensureConnection(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }
    return this.initDatabase().then(() => this.db!);
  }

  // Pending sync operations
  async addPendingSync(record: Omit<OfflineRecord, 'id' | 'timestamp' | 'synced' | 'syncAttempts'>): Promise<string> {
    const db = await this.ensureConnection();
    const id = `${record.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineRecord: OfflineRecord = {
      id,
      ...record,
      timestamp: Date.now(),
      synced: false,
      syncAttempts: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const request = store.add(offlineRecord);

      request.onsuccess = () => {
        console.log('Added pending sync record:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to add pending sync record:', request.error);
        reject(request.error);
      };
    });
  }

  async getPendingSync(type?: OfflineRecord['type']): Promise<OfflineRecord[]> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');
      
      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const records = request.result.filter((r: OfflineRecord) => !r.synced);
        resolve(records);
      };

      request.onerror = () => {
        console.error('Failed to get pending sync records:', request.error);
        reject(request.error);
      };
    });
  }

  async markSynced(id: string): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          record.lastSyncAttempt = Date.now();
          
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => {
            console.log('Marked record as synced:', id);
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Record doesn't exist, consider it resolved
        }
      };

      getRequest.onerror = () => {
        console.error('Failed to mark record as synced:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async incrementSyncAttempts(id: string): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.syncAttempts += 1;
          record.lastSyncAttempt = Date.now();
          
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Cache management
  async setCache(key: string, data: any, ttl?: number): Promise<void> {
    const db = await this.ensureConnection();
    
    const cacheRecord: CachedRecord = {
      id: key,
      data,
      timestamp: Date.now(),
      expires: ttl ? Date.now() + ttl : undefined
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cacheRecord);

      request.onsuccess = () => {
        console.log('Cached data for key:', key);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache data:', request.error);
        reject(request.error);
      };
    });
  }

  async getCache(key: string): Promise<any | null> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const record: CachedRecord = request.result;
        
        if (!record) {
          resolve(null);
          return;
        }

        // Check if expired
        if (record.expires && Date.now() > record.expires) {
          // Remove expired record
          this.removeCache(key);
          resolve(null);
          return;
        }

        resolve(record.data);
      };

      request.onerror = () => {
        console.error('Failed to get cached data:', request.error);
        reject(request.error);
      };
    });
  }

  async removeCache(key: string): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureConnection();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expires');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const record: CachedRecord = cursor.value;
          if (record.expires && now > record.expires) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          console.log('Cleared expired cache entries');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to clear expired cache:', request.error);
        reject(request.error);
      };
    });
  }

  // Draft management for forms
  async saveDraft(type: string, formId: string, data: any): Promise<void> {
    const db = await this.ensureConnection();
    const id = `${type}_${formId}`;

    const draft = {
      id,
      type,
      formId,
      data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(draft);

      request.onsuccess = () => {
        console.log('Saved draft:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save draft:', request.error);
        reject(request.error);
      };
    });
  }

  async getDraft(type: string, formId: string): Promise<any | null> {
    const db = await this.ensureConnection();
    const id = `${type}_${formId}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.get(id);

      request.onsuccess = () => {
        const draft = request.result;
        resolve(draft ? draft.data : null);
      };

      request.onerror = () => {
        console.error('Failed to get draft:', request.error);
        reject(request.error);
      };
    });
  }

  async removeDraft(type: string, formId: string): Promise<void> {
    const db = await this.ensureConnection();
    const id = `${type}_${formId}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings management
  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any | null> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    await this.clearExpiredCache();
    
    // Remove old synced records (older than 7 days)
    const db = await this.ensureConnection();
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const record: OfflineRecord = cursor.value;
          if (record.synced) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          console.log('Cleanup completed');
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    pendingSync: number;
    cached: number;
    drafts: number;
    totalSize: number;
  }> {
    const db = await this.ensureConnection();

    const getCount = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const [pendingSync, cached, drafts] = await Promise.all([
      getCount('pendingSync'),
      getCount('cache'),
      getCount('drafts')
    ]);

    // Estimate total size (rough calculation)
    const totalSize = (pendingSync + cached + drafts) * 1024; // Rough estimate in bytes

    return { pendingSync, cached, drafts, totalSize };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Utility functions for common operations
export async function cacheApiResponse(endpoint: string, data: any, ttl = 5 * 60 * 1000): Promise<void> {
  await offlineStorage.setCache(`api_${endpoint}`, data, ttl);
}

export async function getCachedApiResponse(endpoint: string): Promise<any | null> {
  return await offlineStorage.getCache(`api_${endpoint}`);
}

export async function addOfflineAction(
  type: OfflineRecord['type'],
  action: OfflineRecord['action'],
  data: any
): Promise<string> {
  return await offlineStorage.addPendingSync({ type, action, data });
}

// Auto-cleanup on startup
if (typeof window !== 'undefined') {
  offlineStorage.cleanup().catch(console.error);
}