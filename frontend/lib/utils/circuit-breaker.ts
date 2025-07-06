/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring service health
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Service is failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successes needed to close from half-open
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private nextAttempt: number = 0;

  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}. Service unavailable.`);
      } else {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log(`🔄 Circuit breaker for ${this.serviceName} moved to HALF_OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.successCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log(`✅ Circuit breaker for ${this.serviceName} moved to CLOSED`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    this.totalFailures++;

    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttempt = Date.now() + this.config.recoveryTimeout;
        console.log(`❌ Circuit breaker for ${this.serviceName} moved to OPEN`);
      }
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = 0;
    console.log(`🔄 Circuit breaker for ${this.serviceName} reset`);
  }

  isAvailable(): boolean {
    return this.state !== CircuitState.OPEN || Date.now() >= this.nextAttempt;
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  getBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 300000, // 5 minutes
        successThreshold: 3
      };

      this.breakers.set(
        serviceName,
        new CircuitBreaker(serviceName, config || defaultConfig)
      );
    }

    return this.breakers.get(serviceName)!;
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    this.breakers.forEach((breaker, serviceName) => {
      stats[serviceName] = breaker.getStats();
    });

    return stats;
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
    console.log('🔄 All circuit breakers reset');
  }

  getHealthStatus(): { healthy: string[]; unhealthy: string[]; degraded: string[] } {
    const healthy: string[] = [];
    const unhealthy: string[] = [];
    const degraded: string[] = [];

    this.breakers.forEach((breaker, serviceName) => {
      const stats = breaker.getStats();
      
      if (stats.state === CircuitState.OPEN) {
        unhealthy.push(serviceName);
      } else if (stats.state === CircuitState.HALF_OPEN) {
        degraded.push(serviceName);
      } else {
        healthy.push(serviceName);
      }
    });

    return { healthy, unhealthy, degraded };
  }
}

// Pre-configured circuit breakers for hospital services
export const circuitBreakerManager = CircuitBreakerManager.getInstance();

// Gemini API circuit breaker
export const geminiCircuitBreaker = circuitBreakerManager.getBreaker('gemini-api', {
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 180000, // 3 minutes
  successThreshold: 2
});

// Enhanced Chatbot API circuit breaker
export const enhancedChatbotCircuitBreaker = circuitBreakerManager.getBreaker('enhanced-chatbot-api', {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
  successThreshold: 3
});

// Supabase circuit breaker
export const supabaseCircuitBreaker = circuitBreakerManager.getBreaker('supabase', {
  failureThreshold: 3,
  recoveryTimeout: 15000, // 15 seconds
  monitoringPeriod: 120000, // 2 minutes
  successThreshold: 2
});

// PayOS circuit breaker
export const payosCircuitBreaker = circuitBreakerManager.getBreaker('payos', {
  failureThreshold: 3,
  recoveryTimeout: 45000, // 45 seconds
  monitoringPeriod: 240000, // 4 minutes
  successThreshold: 2
});

/**
 * Utility function to wrap API calls with circuit breaker
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T> {
  const breaker = circuitBreakerManager.getBreaker(serviceName, config);
  return breaker.execute(operation);
}

/**
 * Health check function for monitoring
 */
export function getCircuitBreakerHealth() {
  const stats = circuitBreakerManager.getAllStats();
  const health = circuitBreakerManager.getHealthStatus();
  
  return {
    timestamp: new Date().toISOString(),
    overall_status: health.unhealthy.length === 0 ? 'healthy' : 'degraded',
    services: {
      healthy: health.healthy,
      unhealthy: health.unhealthy,
      degraded: health.degraded
    },
    detailed_stats: stats
  };
}
