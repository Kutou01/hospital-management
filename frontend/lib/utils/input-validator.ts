/**
 * Comprehensive Input Validation and Sanitization
 * Protects against XSS, injection attacks, and malformed data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'email' | 'phone' | 'date' | 'uuid';
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
}

export class InputValidator {
  private static readonly DANGEROUS_PATTERNS = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /('|\"|;|--|\*|\/\*|\*\/)/g,
    
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*\s(on\w+|href|src)\s*=\s*["'][^"']*["'][^>]*>/gi,
    
    // Command injection
    /(\||&|;|\$\(|\`)/g,
    /(rm\s|del\s|format\s|shutdown\s)/gi,
    
    // Path traversal
    /(\.\.|\/\.\.|\\\.\.)/g,
    
    // NoSQL injection
    /(\$where|\$ne|\$gt|\$lt|\$regex)/gi
  ];

  private static readonly VIETNAMESE_MEDICAL_PATTERNS = [
    // Allow Vietnamese medical terms
    /^[a-zA-ZÀ-ỹ\s\d\.,!?\-()]+$/,
    // Common medical abbreviations
    /\b(BS|ThS|TS|PGS|GS|BV|BVĐK|TTYT)\b/gi
  ];

  /**
   * Validate and sanitize chat message input
   */
  static validateChatMessage(message: string): ValidationResult {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Basic validation
    if (!message || typeof message !== 'string') {
      return {
        isValid: false,
        errors: ['Message is required and must be a string'],
        riskLevel: 'medium'
      };
    }

    // Length validation
    if (message.length === 0) {
      errors.push('Message cannot be empty');
    }

    if (message.length > 2000) {
      errors.push('Message is too long (max 2000 characters)');
      riskLevel = 'medium';
    }

    // Security validation
    const securityCheck = this.checkForMaliciousContent(message);
    if (!securityCheck.isValid) {
      errors.push(...securityCheck.errors);
      riskLevel = 'high';
    }

    // Sanitize the message
    const sanitized = this.sanitizeText(message);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
      riskLevel
    };
  }

  /**
   * Validate user identification data
   */
  static validateUserData(data: {
    user_id?: string;
    session_id?: string;
    email?: string;
    phone?: string;
  }): ValidationResult {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Validate user_id
    if (data.user_id && !this.isValidId(data.user_id)) {
      errors.push('Invalid user ID format');
      riskLevel = 'medium';
    }

    // Validate session_id
    if (data.session_id && !this.isValidId(data.session_id)) {
      errors.push('Invalid session ID format');
      riskLevel = 'medium';
    }

    // Validate email
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone
    if (data.phone && !this.isValidVietnamesePhone(data.phone)) {
      errors.push('Invalid Vietnamese phone number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        user_id: data.user_id ? this.sanitizeId(data.user_id) : undefined,
        session_id: data.session_id ? this.sanitizeId(data.session_id) : undefined,
        email: data.email ? this.sanitizeEmail(data.email) : undefined,
        phone: data.phone ? this.sanitizePhone(data.phone) : undefined
      },
      riskLevel
    };
  }

  /**
   * Validate API request parameters
   */
  static validateApiRequest(req: any): ValidationResult {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check request method
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
      errors.push('Invalid HTTP method');
      riskLevel = 'high';
    }

    // Check content type for POST/PUT
    if (['POST', 'PUT'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        errors.push('Invalid content type');
        riskLevel = 'medium';
      }
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        const value = req.headers[header];
        if (this.containsMaliciousContent(value)) {
          errors.push(`Suspicious header: ${header}`);
          riskLevel = 'high';
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      riskLevel
    };
  }

  /**
   * Check for malicious content
   */
  private static checkForMaliciousContent(input: string): ValidationResult {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check against dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        errors.push('Potentially malicious content detected');
        riskLevel = 'high';
        break;
      }
    }

    // Check for excessive special characters
    const specialCharCount = (input.match(/[<>{}[\]\\\/\$\*\+\?]/g) || []).length;
    if (specialCharCount > input.length * 0.1) {
      errors.push('Excessive special characters detected');
      riskLevel = 'medium';
    }

    // Check for very long words (potential buffer overflow)
    const words = input.split(/\s+/);
    const longWords = words.filter(word => word.length > 100);
    if (longWords.length > 0) {
      errors.push('Unusually long words detected');
      riskLevel = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      riskLevel
    };
  }

  /**
   * Check if string contains malicious content
   */
  private static containsMaliciousContent(input: string): boolean {
    return this.DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize text input
   */
  private static sanitizeText(text: string): string {
    return text
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Limit consecutive special characters
      .replace(/([<>{}[\]\\\/\$\*\+\?])\1{2,}/g, '$1$1');
  }

  /**
   * Validate ID format (UUID or custom format)
   */
  private static isValidId(id: string): boolean {
    // UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Custom ID format (alphanumeric with hyphens/underscores)
    const customIdPattern = /^[a-zA-Z0-9_-]{3,50}$/;
    
    return uuidPattern.test(id) || customIdPattern.test(id);
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email) && email.length <= 254;
  }

  /**
   * Validate Vietnamese phone number
   */
  private static isValidVietnamesePhone(phone: string): boolean {
    // Vietnamese phone patterns
    const patterns = [
      /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, // Mobile
      /^(\+84|84|0)(2)[0-9]{9}$/,         // Landline
    ];
    
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return patterns.some(pattern => pattern.test(cleanPhone));
  }

  /**
   * Sanitize ID
   */
  private static sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  }

  /**
   * Sanitize email
   */
  private static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().substring(0, 254);
  }

  /**
   * Sanitize phone number
   */
  private static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d\+]/g, '').substring(0, 15);
  }

  /**
   * Validate against custom rules
   */
  static validateWithRules(value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Required check
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push('Field is required');
    }

    if (value !== null && value !== undefined && value !== '') {
      // Type validation
      if (rules.type) {
        const typeCheck = this.validateType(value, rules.type);
        if (!typeCheck.isValid) {
          errors.push(...typeCheck.errors);
          riskLevel = 'medium';
        }
      }

      // Length validation
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Minimum length is ${rules.minLength}`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Maximum length is ${rules.maxLength}`);
          riskLevel = 'medium';
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push('Invalid format');
      }

      // Allowed values
      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push('Value not allowed');
        riskLevel = 'medium';
      }

      // Custom validator
      if (rules.customValidator && !rules.customValidator(value)) {
        errors.push('Custom validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      riskLevel
    };
  }

  /**
   * Validate data type
   */
  private static validateType(value: any, type: string): ValidationResult {
    const errors: string[] = [];

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push('Must be a string');
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push('Must be a valid number');
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push('Must be a valid email');
        }
        break;
      case 'phone':
        if (!this.isValidVietnamesePhone(value)) {
          errors.push('Must be a valid Vietnamese phone number');
        }
        break;
      case 'uuid':
        if (!this.isValidId(value)) {
          errors.push('Must be a valid UUID');
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push('Must be a valid date');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      riskLevel: errors.length > 0 ? 'medium' : 'low'
    };
  }
}

/**
 * Rate Limiting System
 * Prevents abuse and DoS attacks
 */
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // Cleanup expired entries every minute
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request is allowed
   */
  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requestData = this.requests.get(identifier);

    // Reset if window has expired
    if (!requestData || requestData.resetTime <= now) {
      requestData = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    // Check if limit exceeded
    if (requestData.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: requestData.resetTime,
        retryAfter: requestData.resetTime - now
      };
    }

    // Increment counter
    requestData.count++;
    this.requests.set(identifier, requestData);

    return {
      allowed: true,
      remaining: this.config.maxRequests - requestData.count,
      resetTime: requestData.resetTime
    };
  }

  /**
   * Record a request (for tracking purposes)
   */
  recordRequest(identifier: string, success: boolean = true): void {
    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    // This will increment the counter
    this.checkLimit(identifier);
  }

  /**
   * Reset limits for an identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    const requestData = this.requests.get(identifier);

    if (!requestData || requestData.resetTime <= now) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }

    return {
      allowed: requestData.count < this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - requestData.count),
      resetTime: requestData.resetTime
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.requests.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.requests.clear();
  }
}

/**
 * Rate Limiter Manager
 */
export class RateLimiterManager {
  private static instance: RateLimiterManager;
  private limiters: Map<string, RateLimiter> = new Map();

  private constructor() {}

  static getInstance(): RateLimiterManager {
    if (!RateLimiterManager.instance) {
      RateLimiterManager.instance = new RateLimiterManager();
    }
    return RateLimiterManager.instance;
  }

  getLimiter(name: string, config: RateLimitConfig): RateLimiter {
    if (!this.limiters.has(name)) {
      this.limiters.set(name, new RateLimiter(config));
    }
    return this.limiters.get(name)!;
  }

  destroyAll(): void {
    this.limiters.forEach(limiter => limiter.destroy());
    this.limiters.clear();
  }
}

// Pre-configured rate limiters
export const rateLimiterManager = RateLimiterManager.getInstance();

// Chatbot API rate limiter (per IP)
export const chatbotRateLimiter = rateLimiterManager.getLimiter('chatbot-api', {
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 30,        // 30 requests per minute
  skipSuccessfulRequests: false
});

// Authentication rate limiter (per IP)
export const authRateLimiter = rateLimiterManager.getLimiter('auth-api', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,           // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
});

// General API rate limiter (per user)
export const apiRateLimiter = rateLimiterManager.getLimiter('general-api', {
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 100,       // 100 requests per minute
  skipSuccessfulRequests: false
});

/**
 * Utility function to get client identifier
 */
export function getClientIdentifier(req: any): string {
  // Try to get real IP from various headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;

  let ip = forwarded || realIp || remoteAddr || 'unknown';

  // Handle comma-separated IPs (take the first one)
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Add user agent for additional uniqueness
  const userAgent = req.headers['user-agent'] || '';
  const userAgentHash = userAgent.substring(0, 10);

  return `${ip}:${userAgentHash}`;
}
