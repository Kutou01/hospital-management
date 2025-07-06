/**
 * Comprehensive Monitoring and Logging System
 * Tracks performance, errors, and system health
 */

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  timestamp: number;
  service: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: number;
  details?: Record<string, any>;
  error?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: MetricData[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // milliseconds
  lastTriggered?: number;
}

export class MonitoringSystem {
  private static instance: MonitoringSystem;
  private metrics: MetricData[] = [];
  private logs: LogEntry[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alertRules: AlertRule[] = [];
  private maxMetrics = 10000;
  private maxLogs = 5000;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.startCleanup();
    this.setupDefaultAlerts();
  }

  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
    this.checkAlerts();
    this.trimMetrics();
  }

  /**
   * Log an event
   */
  log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      service: 'hospital-frontend',
      metadata
    };

    // Add stack trace for errors
    if (level === 'error' || level === 'critical') {
      logEntry.stack = new Error().stack;
    }

    this.logs.push(logEntry);
    this.trimLogs();

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'error':
        case 'critical':
          console.error(prefix, message, metadata);
          break;
        case 'warn':
          console.warn(prefix, message, metadata);
          break;
        case 'debug':
          console.debug(prefix, message, metadata);
          break;
        default:
          console.log(prefix, message, metadata);
      }
    }
  }

  /**
   * Record health check
   */
  recordHealthCheck(service: string, status: HealthCheck['status'], responseTime: number, details?: Record<string, any>, error?: string): void {
    const healthCheck: HealthCheck = {
      service,
      status,
      responseTime,
      timestamp: Date.now(),
      details,
      error
    };

    this.healthChecks.set(service, healthCheck);
    
    // Record as metric
    this.recordMetric(`health.${service}.response_time`, responseTime, 'ms', { service, status });
    this.recordMetric(`health.${service}.status`, status === 'healthy' ? 1 : 0, 'boolean', { service });
  }

  /**
   * Get metrics by name and time range
   */
  getMetrics(name?: string, since?: number): MetricData[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get logs by level and time range
   */
  getLogs(level?: LogEntry['level'], since?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }

    if (since) {
      filtered = filtered.filter(l => l.timestamp >= since);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): Record<string, HealthCheck> {
    const status: Record<string, HealthCheck> = {};
    
    for (const [service, check] of this.healthChecks.entries()) {
      // Consider health check stale after 5 minutes
      if (Date.now() - check.timestamp < 5 * 60 * 1000) {
        status[service] = check;
      }
    }

    return status;
  }

  /**
   * Get system overview
   */
  getSystemOverview(): {
    metrics: { total: number; recent: number };
    logs: { total: number; errors: number; warnings: number };
    health: { healthy: number; degraded: number; unhealthy: number };
    alerts: { active: number; total: number };
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    const recentLogs = this.logs.filter(l => l.timestamp >= oneHourAgo);
    const errors = recentLogs.filter(l => l.level === 'error' || l.level === 'critical');
    const warnings = recentLogs.filter(l => l.level === 'warn');

    const healthStatus = this.getHealthStatus();
    const healthCounts = Object.values(healthStatus).reduce(
      (acc, check) => {
        acc[check.status]++;
        return acc;
      },
      { healthy: 0, degraded: 0, unhealthy: 0 }
    );

    return {
      metrics: {
        total: this.metrics.length,
        recent: recentMetrics.length
      },
      logs: {
        total: this.logs.length,
        errors: errors.length,
        warnings: warnings.length
      },
      health: healthCounts,
      alerts: {
        active: 0, // TODO: Implement active alerts tracking
        total: this.alertRules.length
      }
    };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Check alert conditions
   */
  private checkAlerts(): void {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 5 * 60 * 1000); // Last 5 minutes

    for (const rule of this.alertRules) {
      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        continue;
      }

      try {
        if (rule.condition(recentMetrics)) {
          this.triggerAlert(rule);
          rule.lastTriggered = now;
        }
      } catch (error) {
        this.log('error', `Alert rule evaluation failed: ${rule.name}`, { error: error.message });
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule): void {
    this.log('warn', `Alert triggered: ${rule.name}`, {
      alertId: rule.id,
      severity: rule.severity,
      condition: rule.condition.toString()
    });

    // TODO: Implement alert notifications (email, Slack, etc.)
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlerts(): void {
    // High error rate
    this.addAlertRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (metrics) => {
        const errors = metrics.filter(m => m.name.includes('error') && m.value > 0);
        return errors.length > 10; // More than 10 errors in 5 minutes
      },
      severity: 'high',
      cooldown: 10 * 60 * 1000 // 10 minutes
    });

    // Slow response times
    this.addAlertRule({
      id: 'slow-response',
      name: 'Slow Response Times',
      condition: (metrics) => {
        const responseTimes = metrics.filter(m => m.name.includes('response_time') && m.value > 5000);
        return responseTimes.length > 5; // More than 5 slow responses
      },
      severity: 'medium',
      cooldown: 5 * 60 * 1000 // 5 minutes
    });

    // Service unhealthy
    this.addAlertRule({
      id: 'service-unhealthy',
      name: 'Service Unhealthy',
      condition: (metrics) => {
        const unhealthyServices = metrics.filter(m => 
          m.name.includes('health') && 
          m.name.includes('status') && 
          m.value === 0
        );
        return unhealthyServices.length > 0;
      },
      severity: 'critical',
      cooldown: 2 * 60 * 1000 // 2 minutes
    });
  }

  /**
   * Trim old metrics
   */
  private trimMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Trim old logs
   */
  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      
      // Remove old metrics
      this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
      
      // Remove old logs (keep errors longer)
      this.logs = this.logs.filter(l => 
        l.timestamp >= cutoff || 
        (l.level === 'error' || l.level === 'critical') && l.timestamp >= cutoff - 7 * 24 * 60 * 60 * 1000
      );
      
      this.log('debug', 'Monitoring cleanup completed');
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Destroy monitoring system
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global monitoring instance
export const monitoring = MonitoringSystem.getInstance();

// Convenience functions
export const recordMetric = (name: string, value: number, unit?: string, tags?: Record<string, string>) => 
  monitoring.recordMetric(name, value, unit, tags);

export const logInfo = (message: string, metadata?: Record<string, any>) => 
  monitoring.log('info', message, metadata);

export const logWarn = (message: string, metadata?: Record<string, any>) => 
  monitoring.log('warn', message, metadata);

export const logError = (message: string, metadata?: Record<string, any>) => 
  monitoring.log('error', message, metadata);

export const logDebug = (message: string, metadata?: Record<string, any>) => 
  monitoring.log('debug', message, metadata);

export const recordHealthCheck = (service: string, status: HealthCheck['status'], responseTime: number, details?: Record<string, any>, error?: string) =>
  monitoring.recordHealthCheck(service, status, responseTime, details, error);

/**
 * Performance Tracker
 * Tracks API response times and performance metrics
 */
export class PerformanceTracker {
  private startTimes: Map<string, number> = new Map();

  /**
   * Start tracking an operation
   */
  start(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  /**
   * End tracking and record metric
   */
  end(operationId: string, metricName?: string, tags?: Record<string, string>): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      logWarn('Performance tracking end called without start', { operationId });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operationId);

    // Record metric
    const name = metricName || `performance.${operationId}`;
    recordMetric(name, duration, 'ms', tags);

    return duration;
  }

  /**
   * Track a function execution
   */
  async track<T>(
    operationId: string,
    operation: () => Promise<T>,
    metricName?: string,
    tags?: Record<string, string>
  ): Promise<T> {
    this.start(operationId);

    try {
      const result = await operation();
      this.end(operationId, metricName, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      this.end(operationId, metricName, { ...tags, status: 'error' });
      throw error;
    }
  }

  /**
   * Get active operations
   */
  getActiveOperations(): string[] {
    return Array.from(this.startTimes.keys());
  }

  /**
   * Clear all tracking
   */
  clear(): void {
    this.startTimes.clear();
  }
}

// Global performance tracker
export const performanceTracker = new PerformanceTracker();

/**
 * API Performance Middleware
 * Automatically tracks API response times
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return performanceTracker.track(
      operationId,
      () => apiFunction(...args),
      `api.${operationName}`,
      { operation: operationName }
    );
  }) as T;
}

/**
 * Error Tracker
 * Tracks and categorizes errors
 */
export class ErrorTracker {
  private errorCounts: Map<string, number> = new Map();

  /**
   * Track an error
   */
  trackError(error: Error | string, context?: Record<string, any>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = typeof error === 'string' ? 'generic' : error.constructor.name;

    // Count errors by type
    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);

    // Log error
    logError(errorMessage, {
      errorType,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      count: currentCount + 1
    });

    // Record metric
    recordMetric('errors.total', 1, 'count', { type: errorType });
    recordMetric(`errors.${errorType}`, 1, 'count');
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Reset error counts
   */
  reset(): void {
    this.errorCounts.clear();
  }
}

// Global error tracker
export const errorTracker = new ErrorTracker();

/**
 * System Health Monitor
 * Monitors overall system health
 */
export class SystemHealthMonitor {
  private checkInterval?: NodeJS.Timeout;
  private isRunning = false;

  /**
   * Start health monitoring
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);

    logInfo('System health monitoring started', { intervalMs });
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.isRunning = false;
    logInfo('System health monitoring stopped');
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    // Check browser performance
    this.checkBrowserPerformance();

    // Check local storage
    this.checkLocalStorage();

    // Check network connectivity
    await this.checkNetworkConnectivity();
  }

  /**
   * Check browser performance
   */
  private checkBrowserPerformance(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const memory = (window.performance as any).memory;

      if (memory) {
        recordMetric('browser.memory.used', memory.usedJSHeapSize, 'bytes');
        recordMetric('browser.memory.total', memory.totalJSHeapSize, 'bytes');
        recordMetric('browser.memory.limit', memory.jsHeapSizeLimit, 'bytes');

        const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        const status = memoryUsagePercent > 80 ? 'unhealthy' : memoryUsagePercent > 60 ? 'degraded' : 'healthy';

        recordHealthCheck('browser-memory', status, 0, {
          usagePercent: memoryUsagePercent.toFixed(2)
        });
      }
    }
  }

  /**
   * Check local storage
   */
  private checkLocalStorage(): void {
    try {
      const testKey = '__health_check__';
      const testValue = Date.now().toString();

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      const status = retrieved === testValue ? 'healthy' : 'unhealthy';
      recordHealthCheck('local-storage', status, 0);

    } catch (error) {
      recordHealthCheck('local-storage', 'unhealthy', 0, undefined, error.message);
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      const isOnline = navigator.onLine;
      recordHealthCheck('network-connectivity', isOnline ? 'healthy' : 'unhealthy', 0, {
        online: isOnline
      });
    }
  }
}

// Global health monitor
export const healthMonitor = new SystemHealthMonitor();

/**
 * Initialize monitoring system
 */
export function initializeMonitoring(): void {
  logInfo('Monitoring system initialized');

  // Start health monitoring
  healthMonitor.start();

  // Track page load performance
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      recordMetric('page.load.total', navigation.loadEventEnd - navigation.fetchStart, 'ms');
      recordMetric('page.load.dom', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
      recordMetric('page.load.network', navigation.responseEnd - navigation.fetchStart, 'ms');
    }
  }

  // Track unhandled errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      errorTracker.trackError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorTracker.trackError(event.reason, {
        type: 'unhandled-promise-rejection'
      });
    });
  }
}
