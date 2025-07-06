/**
 * Enhanced Error Handling Service for Chatbot System
 * Provides comprehensive error handling, retry logic, and fallback mechanisms
 */

// Error types and interfaces
export interface ChatbotError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'database' | 'api' | 'payment' | 'nlp' | 'system' | 'user';
  retryable: boolean;
  fallbackAvailable: boolean;
  userMessage: string;
  technicalDetails?: any;
  timestamp: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  error?: ChatbotError;
  fallbackUsed: boolean;
  source: string;
}

// Predefined error configurations
const ERROR_CONFIGS: Record<string, Partial<ChatbotError>> = {
  // Database errors
  'DB_CONNECTION_FAILED': {
    severity: 'high',
    category: 'database',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Hệ thống đang bận, vui lòng thử lại sau ít phút.'
  },
  'DB_CONSTRAINT_VIOLATION': {
    severity: 'medium',
    category: 'database',
    retryable: false,
    fallbackAvailable: true,
    userMessage: 'Có lỗi trong dữ liệu, hệ thống sẽ tự động xử lý.'
  },
  'DB_TIMEOUT': {
    severity: 'medium',
    category: 'database',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Hệ thống phản hồi chậm, đang thử lại...'
  },

  // API errors
  'API_RATE_LIMIT': {
    severity: 'medium',
    category: 'api',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Hệ thống đang quá tải, vui lòng đợi một chút.'
  },
  'API_TIMEOUT': {
    severity: 'medium',
    category: 'api',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Kết nối mạng chậm, đang thử lại...'
  },
  'API_UNAUTHORIZED': {
    severity: 'high',
    category: 'api',
    retryable: false,
    fallbackAvailable: false,
    userMessage: 'Có lỗi xác thực, vui lòng liên hệ hỗ trợ.'
  },

  // Payment errors
  'PAYMENT_GATEWAY_ERROR': {
    severity: 'high',
    category: 'payment',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Cổng thanh toán gặp sự cố, đang chuyển sang phương thức khác.'
  },
  'PAYMENT_INSUFFICIENT_FUNDS': {
    severity: 'low',
    category: 'payment',
    retryable: false,
    fallbackAvailable: false,
    userMessage: 'Tài khoản không đủ số dư để thực hiện giao dịch.'
  },

  // NLP errors
  'NLP_PROCESSING_FAILED': {
    severity: 'medium',
    category: 'nlp',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Đang xử lý yêu cầu của bạn, vui lòng đợi...'
  },
  'NLP_ENCODING_ERROR': {
    severity: 'medium',
    category: 'nlp',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Có lỗi trong việc xử lý văn bản, hệ thống sẽ thử cách khác.'
  },

  // System errors
  'SYSTEM_OVERLOAD': {
    severity: 'high',
    category: 'system',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Hệ thống đang quá tải, vui lòng thử lại sau.'
  },
  'SERVICE_UNAVAILABLE': {
    severity: 'high',
    category: 'system',
    retryable: true,
    fallbackAvailable: true,
    userMessage: 'Dịch vụ tạm thời không khả dụng, đang khôi phục...'
  }
};

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: ChatbotError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Create a standardized error object
   */
  public createError(
    code: string,
    message: string,
    technicalDetails?: any
  ): ChatbotError {
    const config = ERROR_CONFIGS[code] || {
      severity: 'medium',
      category: 'system',
      retryable: false,
      fallbackAvailable: false,
      userMessage: 'Đã xảy ra lỗi không xác định.'
    };

    const error: ChatbotError = {
      code,
      message,
      severity: config.severity!,
      category: config.category!,
      retryable: config.retryable!,
      fallbackAvailable: config.fallbackAvailable!,
      userMessage: config.userMessage!,
      technicalDetails,
      timestamp: new Date().toISOString()
    };

    // Log the error
    this.logError(error);

    return error;
  }

  /**
   * Log error for monitoring
   */
  private logError(error: ChatbotError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging based on severity
    const logMessage = `[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        console.error('🚨', logMessage, error.technicalDetails);
        break;
      case 'high':
        console.error('❌', logMessage, error.technicalDetails);
        break;
      case 'medium':
        console.warn('⚠️', logMessage);
        break;
      case 'low':
        console.log('ℹ️', logMessage);
        break;
    }
  }

  /**
   * Execute function with retry logic
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    errorCode: string = 'OPERATION_FAILED'
  ): Promise<T> {
    const retryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      ...config
    };

    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${retryConfig.maxAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );

        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    throw this.createError(errorCode, `Operation failed after ${retryConfig.maxAttempts} attempts`, lastError);
  }

  /**
   * Execute operation with fallback
   */
  public async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    errorCode: string = 'PRIMARY_OPERATION_FAILED'
  ): Promise<FallbackResult<T>> {
    try {
      console.log('🎯 Executing primary operation...');
      const result = await primaryOperation();
      return {
        success: true,
        data: result,
        fallbackUsed: false,
        source: 'primary'
      };
    } catch (primaryError) {
      console.warn('⚠️ Primary operation failed, trying fallback...');
      
      try {
        const fallbackResult = await fallbackOperation();
        return {
          success: true,
          data: fallbackResult,
          fallbackUsed: true,
          source: 'fallback'
        };
      } catch (fallbackError) {
        const error = this.createError(
          errorCode,
          'Both primary and fallback operations failed',
          { primaryError, fallbackError }
        );

        return {
          success: false,
          error,
          fallbackUsed: true,
          source: 'none'
        };
      }
    }
  }

  /**
   * Handle database errors specifically
   */
  public handleDatabaseError(error: any): ChatbotError {
    if (error.code === '23505') {
      return this.createError('DB_CONSTRAINT_VIOLATION', 'Duplicate key violation', error);
    } else if (error.code === '23502') {
      return this.createError('DB_CONSTRAINT_VIOLATION', 'Not null violation', error);
    } else if (error.message?.includes('timeout')) {
      return this.createError('DB_TIMEOUT', 'Database operation timeout', error);
    } else if (error.message?.includes('connection')) {
      return this.createError('DB_CONNECTION_FAILED', 'Database connection failed', error);
    } else {
      return this.createError('DB_UNKNOWN_ERROR', 'Unknown database error', error);
    }
  }

  /**
   * Handle API errors specifically
   */
  public handleAPIError(error: any, statusCode?: number): ChatbotError {
    if (statusCode === 429) {
      return this.createError('API_RATE_LIMIT', 'API rate limit exceeded', error);
    } else if (statusCode === 401 || statusCode === 403) {
      return this.createError('API_UNAUTHORIZED', 'API authentication failed', error);
    } else if (statusCode === 408 || error.code === 'ECONNABORTED') {
      return this.createError('API_TIMEOUT', 'API request timeout', error);
    } else if (statusCode && statusCode >= 500) {
      return this.createError('API_SERVER_ERROR', 'API server error', error);
    } else {
      return this.createError('API_UNKNOWN_ERROR', 'Unknown API error', error);
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    recent: ChatbotError[];
  } {
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.errorLog.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      bySeverity,
      byCategory,
      recent: this.errorLog.slice(-10) // Last 10 errors
    };
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
    console.log('🧹 Error log cleared');
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();
