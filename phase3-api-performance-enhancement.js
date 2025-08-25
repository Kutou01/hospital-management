// ============================================================================
// PHASE 3.2: API PERFORMANCE ENHANCEMENT
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements comprehensive API performance optimizations
// Execute AFTER Phase 3.1 (Database Performance) completion

const Redis = require('redis');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ============================================================================
// 1. REDIS CACHING SYSTEM SETUP
// ============================================================================

class HospitalCacheManager {
    constructor() {
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: 0, // Use database 0 for hospital cache
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    return new Error('Redis server connection refused');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return new Error('Redis retry time exhausted');
                }
                if (options.attempt > 10) {
                    return undefined;
                }
                return Math.min(options.attempt * 100, 3000);
            }
        });

        this.redis.on('connect', () => {
            console.log('✅ Redis cache connected successfully');
        });

        this.redis.on('error', (err) => {
            console.error('❌ Redis cache error:', err);
        });
    }

    // Cache keys for different data types
    getCacheKey(type, id, params = {}) {
        const paramString = Object.keys(params).length > 0 
            ? ':' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
            : '';
        return `hospital:${type}:${id}${paramString}`;
    }

    // Get cached data
    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    // Set cached data with TTL
    async set(key, data, ttlSeconds = 300) {
        try {
            await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // Delete cached data
    async del(key) {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Clear cache by pattern
    async clearPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(keys);
            }
            return keys.length;
        } catch (error) {
            console.error('Cache clear pattern error:', error);
            return 0;
        }
    }
}

// ============================================================================
// 2. API RESPONSE CACHING MIDDLEWARE
// ============================================================================

const cacheManager = new HospitalCacheManager();

// Smart caching middleware for healthcare APIs
const apiCache = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        keyGenerator = null,
        skipCache = () => false,
        onHit = () => {},
        onMiss = () => {}
    } = options;

    return async (req, res, next) => {
        // Skip caching for non-GET requests or when skipCache returns true
        if (req.method !== 'GET' || skipCache(req)) {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator 
            ? keyGenerator(req)
            : `api:${req.originalUrl}:${JSON.stringify(req.query)}`;

        try {
            // Try to get from cache
            const cachedData = await cacheManager.get(cacheKey);
            
            if (cachedData) {
                onHit(cacheKey);
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', cacheKey);
                return res.json(cachedData);
            }

            // Cache miss - continue to route handler
            onMiss(cacheKey);
            res.set('X-Cache', 'MISS');

            // Override res.json to cache the response
            const originalJson = res.json;
            res.json = function(data) {
                // Cache successful responses only
                if (res.statusCode === 200 && data) {
                    cacheManager.set(cacheKey, data, ttl);
                }
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('API cache middleware error:', error);
            next();
        }
    };
};

// ============================================================================
// 3. HEALTHCARE-SPECIFIC CACHE STRATEGIES
// ============================================================================

// Doctor availability cache (short TTL - 2 minutes)
const doctorAvailabilityCache = apiCache({
    ttl: 120,
    keyGenerator: (req) => {
        const { department, specialization, date } = req.query;
        return cacheManager.getCacheKey('doctors:availability', 'list', {
            department: department || 'all',
            specialization: specialization || 'all',
            date: date || 'today'
        });
    },
    skipCache: (req) => {
        // Skip cache for real-time booking requests
        return req.headers['x-realtime'] === 'true';
    }
});

// Patient profile cache (medium TTL - 10 minutes)
const patientProfileCache = apiCache({
    ttl: 600,
    keyGenerator: (req) => {
        return cacheManager.getCacheKey('patient:profile', req.params.id);
    },
    skipCache: (req) => {
        // Skip cache for patient's own profile requests (always fresh)
        return req.user && req.user.id === req.params.id;
    }
});

// Department statistics cache (long TTL - 30 minutes)
const departmentStatsCache = apiCache({
    ttl: 1800,
    keyGenerator: (req) => {
        return cacheManager.getCacheKey('department:stats', req.params.id || 'all');
    }
});

// Medical records cache (very short TTL - 1 minute, high security)
const medicalRecordsCache = apiCache({
    ttl: 60,
    keyGenerator: (req) => {
        return cacheManager.getCacheKey('medical:records', req.params.patientId, {
            user: req.user.id,
            role: req.user.role
        });
    },
    skipCache: (req) => {
        // Skip cache for write operations or sensitive data
        return req.method !== 'GET' || req.headers['x-no-cache'] === 'true';
    }
});

// ============================================================================
// 4. RATE LIMITING FOR API PROTECTION
// ============================================================================

// General API rate limiting
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: {
        error: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60
    },
    skipSuccessfulRequests: true
});

// Medical data access rate limiting (more restrictive)
const medicalDataRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Limit medical data access
    message: {
        error: 'Quá nhiều yêu cầu truy cập dữ liệu y tế, vui lòng thử lại sau',
        code: 'MEDICAL_DATA_RATE_LIMIT_EXCEEDED',
        retryAfter: 5 * 60
    },
    keyGenerator: (req) => {
        // Rate limit by user ID for authenticated requests
        return req.user ? `medical:${req.user.id}` : req.ip;
    }
});

// ============================================================================
// 5. RESPONSE COMPRESSION AND OPTIMIZATION
// ============================================================================

// Compression middleware with healthcare-specific settings
const compressionMiddleware = compression({
    filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Compress all other responses
        return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    chunkSize: 16 * 1024, // 16KB chunks
});

// Security headers middleware
const securityMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// ============================================================================
// 6. PERFORMANCE MONITORING MIDDLEWARE
// ============================================================================

const performanceMonitoring = (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to measure response time
    const originalEnd = res.end;
    res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        
        // Add performance headers
        res.set('X-Response-Time', `${responseTime}ms`);
        res.set('X-Timestamp', new Date().toISOString());
        
        // Log slow requests (> 1 second)
        if (responseTime > 1000) {
            console.warn(`🐌 Slow API request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
        }
        
        // Log to performance metrics (if needed)
        if (process.env.NODE_ENV === 'production') {
            // Could send to monitoring service like DataDog, New Relic, etc.
            console.log(`API Performance: ${req.method} ${req.originalUrl} - ${responseTime}ms - ${res.statusCode}`);
        }
        
        return originalEnd.apply(this, args);
    };
    
    next();
};

// ============================================================================
// 7. EXPORT MIDDLEWARE AND UTILITIES
// ============================================================================

module.exports = {
    // Cache management
    cacheManager,
    apiCache,
    
    // Healthcare-specific caches
    doctorAvailabilityCache,
    patientProfileCache,
    departmentStatsCache,
    medicalRecordsCache,
    
    // Rate limiting
    generalRateLimit,
    authRateLimit,
    medicalDataRateLimit,
    
    // Performance middleware
    compressionMiddleware,
    securityMiddleware,
    performanceMonitoring,
    
    // Cache utilities
    clearCache: async (pattern) => {
        return await cacheManager.clearPattern(pattern);
    },
    
    // Performance utilities
    measureApiPerformance: (name, startTime) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`⚡ ${name}: ${duration}ms`);
        return duration;
    }
};
