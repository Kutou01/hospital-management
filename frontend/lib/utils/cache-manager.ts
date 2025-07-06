/**
 * Advanced Cache Manager with TTL, LRU eviction, and compression
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
}

export interface CacheConfig {
  maxSize: number;           // Maximum number of entries
  defaultTTL: number;        // Default TTL in milliseconds
  cleanupInterval: number;   // Cleanup interval in milliseconds
  compressionThreshold: number; // Compress entries larger than this (bytes)
  enableCompression: boolean;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  compressionSavings: number;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private stats: CacheStats = {
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    evictions: 0,
    compressionSavings: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private config: CacheConfig) {
    this.startCleanupTimer();
  }

  /**
   * Set cache entry with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Compress large entries if enabled
    let finalData = data;
    let compressed = false;
    
    if (this.config.enableCompression) {
      const dataSize = this.estimateSize(data);
      if (dataSize > this.config.compressionThreshold) {
        try {
          finalData = this.compress(data);
          compressed = true;
          this.stats.compressionSavings += dataSize - this.estimateSize(finalData);
        } catch (error) {
          console.warn('Cache compression failed:', error);
        }
      }
    }

    const entry: CacheEntry<T> = {
      data: finalData,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now,
      compressed
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hits++;
    this.updateHitRate();

    // Decompress if needed
    if (entry.compressed) {
      try {
        return this.decompress(entry.data);
      } catch (error) {
        console.warn('Cache decompression failed:', error);
        this.cache.delete(key);
        return null;
      }
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.evictions = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get or set pattern - fetch data if not in cache
   */
  async getOrSet<U extends T>(
    key: string,
    fetcher: () => Promise<U>,
    ttl?: number
  ): Promise<U> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached as U;
    }

    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Cache fetcher failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // Rough estimate
  }

  /**
   * Simple compression using JSON + base64
   */
  private compress(data: T): T {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = btoa(jsonString);
      return compressed as unknown as T;
    } catch (error) {
      throw new Error('Compression failed');
    }
  }

  /**
   * Simple decompression
   */
  private decompress(compressedData: T): T {
    try {
      const jsonString = atob(compressedData as unknown as string);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Decompression failed');
    }
  }
}

/**
 * Global cache instances for different use cases
 */

// API Response Cache
export const apiCache = new CacheManager({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  compressionThreshold: 10000, // 10KB
  enableCompression: true
});

// Chatbot Response Cache
export const chatbotCache = new CacheManager({
  maxSize: 500,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  compressionThreshold: 5000, // 5KB
  enableCompression: true
});

// User Session Cache
export const sessionCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  cleanupInterval: 10 * 60 * 1000, // 10 minutes
  compressionThreshold: 2000, // 2KB
  enableCompression: false
});

// Static Data Cache (doctors, specialties, etc.)
export const staticDataCache = new CacheManager({
  maxSize: 100,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  compressionThreshold: 15000, // 15KB
  enableCompression: true
});

/**
 * Cache key generators
 */
// Helper function to safely encode Unicode strings
const safeBase64Encode = (str: string): string => {
  try {
    // Convert Unicode string to base64 safely
    return Buffer.from(str, 'utf8').toString('base64');
  } catch (error) {
    // Fallback: use simple hash if base64 fails
    return str.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
  }
};

export const CacheKeys = {
  chatbotResponse: (message: string, userId?: string) =>
    `chatbot:${safeBase64Encode(message.toLowerCase().trim())}:${userId || 'anonymous'}`,

  apiResponse: (endpoint: string, params?: Record<string, any>) =>
    `api:${endpoint}:${params ? safeBase64Encode(JSON.stringify(params)) : 'no-params'}`,
  
  userSession: (userId: string) => `session:${userId}`,
  
  doctorsBySpecialty: (specialtyId: string) => `doctors:specialty:${specialtyId}`,
  
  availableSlots: (doctorId: string, date: string) => `slots:${doctorId}:${date}`,
  
  patientProfile: (patientId: string) => `patient:${patientId}`
};

/**
 * Utility functions
 */
export function getCacheHealth() {
  return {
    timestamp: new Date().toISOString(),
    caches: {
      api: apiCache.getStats(),
      chatbot: chatbotCache.getStats(),
      session: sessionCache.getStats(),
      staticData: staticDataCache.getStats()
    }
  };
}

export function clearAllCaches() {
  apiCache.clear();
  chatbotCache.clear();
  sessionCache.clear();
  staticDataCache.clear();
  console.log('🧹 All caches cleared');
}
