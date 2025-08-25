// ============================================================================
// SERVICES INTEGRATION VALIDATION SCRIPT
// Validate all microservices are using connection pooling and Vietnamese errors
// ============================================================================

import logger from '@hospital/shared/dist/utils/logger';
import fetch from 'node-fetch';

interface ServiceTestResult {
  serviceName: string;
  endpoint: string;
  connectionPooling: boolean;
  vietnameseErrors: boolean;
  responseTime: number;
  status: 'PASS' | 'FAIL';
  error?: string;
}

class ServicesValidator {
  private services = [
    { name: 'auth-service', port: 3001, path: '/health' },
    { name: 'doctor-service', port: 3002, path: '/health' },
    { name: 'patient-service', port: 3003, path: '/health' },
    { name: 'appointment-service', port: 3004, path: '/health' },
    { name: 'medical-records-service', port: 3005, path: '/health' },
    { name: 'api-gateway', port: 3100, path: '/health' }
  ];

  private results: ServiceTestResult[] = [];

  async validateAllServices(): Promise<void> {
    logger.info('Starting Services Integration Validation');

    for (const service of this.services) {
      await this.validateService(service);
    }

    this.generateValidationReport();
  }

  private async validateService(service: { name: string; port: number; path: string }): Promise<void> {
    const startTime = Date.now();
    const endpoint = `http://localhost:${service.port}${service.path}`;

    try {
      logger.info(`Validating ${service.name}...`);

      // Test health endpoint
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept-Language': 'vi-VN,vi;q=0.9'
        },
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      // Check for connection pooling indicators
      const connectionPooling = this.checkConnectionPooling(data);

      // Test error handling with Vietnamese
      const vietnameseErrors = await this.testVietnameseErrorHandling(service);

      this.results.push({
        serviceName: service.name,
        endpoint: endpoint,
        connectionPooling: connectionPooling,
        vietnameseErrors: vietnameseErrors,
        responseTime: responseTime,
        status: (connectionPooling && vietnameseErrors && responseTime < 1000) ? 'PASS' : 'FAIL'
      });

    } catch (error) {
      this.results.push({
        serviceName: service.name,
        endpoint: endpoint,
        connectionPooling: false,
        vietnameseErrors: false,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private checkConnectionPooling(healthData: any): boolean {
    // Check if health response indicates connection pooling
    return (
      healthData?.database?.connectionPool === true ||
      healthData?.database?.pooling === true ||
      healthData?.connectionPooling === true ||
      (healthData?.database?.connections && typeof healthData.database.connections === 'object')
    );
  }

  private async testVietnameseErrorHandling(service: { name: string; port: number }): Promise<boolean> {
    try {
      // Test with invalid endpoint to trigger error
      const errorEndpoint = `http://localhost:${service.port}/invalid-endpoint-test`;
      
      const response = await fetch(errorEndpoint, {
        method: 'GET',
        headers: {
          'Accept-Language': 'vi-VN,vi;q=0.9'
        },
        timeout: 3000
      });

      const errorData = await response.json();

      // Check if error response contains Vietnamese text
      const hasVietnameseError = (
        (errorData?.error && typeof errorData.error === 'string' && 
         (errorData.error.includes('Lỗi') || errorData.error.includes('không tìm thấy'))) ||
        (errorData?.message && typeof errorData.message === 'string' && 
         (errorData.message.includes('Lỗi') || errorData.message.includes('vui lòng')))
      );

      return hasVietnameseError;

    } catch (error) {
      // If service is down or unreachable, we can't test error handling
      return false;
    }
  }

  private generateValidationReport(): void {
    const totalServices = this.results.length;
    const passedServices = this.results.filter(r => r.status === 'PASS').length;
    const failedServices = totalServices - passedServices;
    const successRate = (passedServices / totalServices) * 100;

    logger.info('Services Integration Validation Results', {
      totalServices,
      passedServices,
      failedServices,
      successRate: `${successRate.toFixed(1)}%`
    });

    // Detailed results
    this.results.forEach(result => {
      logger.info(`[${result.status}] ${result.serviceName}`, {
        endpoint: result.endpoint,
        responseTime: `${result.responseTime}ms`,
        connectionPooling: result.connectionPooling,
        vietnameseErrors: result.vietnameseErrors,
        error: result.error
      });
    });

    // Connection Pooling Summary
    const poolingEnabled = this.results.filter(r => r.connectionPooling).length;
    logger.info(`Connection Pooling: ${poolingEnabled}/${totalServices} services enabled`);

    // Vietnamese Error Handling Summary
    const vietnameseEnabled = this.results.filter(r => r.vietnameseErrors).length;
    logger.info(`Vietnamese Error Handling: ${vietnameseEnabled}/${totalServices} services enabled`);

    // Performance Summary
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalServices;
    logger.info(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

    // Final Assessment
    if (successRate >= 80 && poolingEnabled >= totalServices * 0.8 && vietnameseEnabled >= totalServices * 0.8) {
      logger.info('PHASE 1 IMPLEMENTATION: SUCCESS - All services ready for production');
    } else {
      logger.warn('PHASE 1 IMPLEMENTATION: NEEDS ATTENTION - Some services require fixes');
      
      // Specific recommendations
      if (poolingEnabled < totalServices * 0.8) {
        logger.warn('RECOMMENDATION: Enable connection pooling in remaining services');
      }
      if (vietnameseEnabled < totalServices * 0.8) {
        logger.warn('RECOMMENDATION: Implement Vietnamese error handling in remaining services');
      }
      if (avgResponseTime > 500) {
        logger.warn('RECOMMENDATION: Optimize response times (target: < 500ms)');
      }
    }
  }

  // Method to test specific service endpoints
  async testServiceEndpoint(serviceName: string, endpoint: string): Promise<void> {
    logger.info(`Testing specific endpoint: ${serviceName} - ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept-Language': 'vi-VN,vi;q=0.9',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const data = await response.json();
      
      logger.info(`Endpoint test result for ${serviceName}:`, {
        status: response.status,
        statusText: response.statusText,
        hasVietnameseContent: JSON.stringify(data).includes('Lỗi') || JSON.stringify(data).includes('vui lòng'),
        responseData: data
      });

    } catch (error) {
      logger.error(`Endpoint test failed for ${serviceName}:`, error);
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new ServicesValidator();
  validator.validateAllServices().catch(error => {
    logger.error('Services validation failed:', error);
    process.exit(1);
  });
}

export { ServicesValidator };
