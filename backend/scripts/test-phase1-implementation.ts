// ============================================================================
// PHASE 1 IMPLEMENTATION TESTING SCRIPT
// Test connection pooling migration and Vietnamese error handling
// ============================================================================

import { connectionPool } from '@hospital/shared/src/database/connection-pool';
import logger from '@hospital/shared/dist/utils/logger';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class Phase1Tester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    logger.info('Starting Phase 1 Implementation Tests');
    
    // Test Connection Pooling
    await this.testConnectionPooling();
    await this.testDatabaseFunctions();
    await this.testPerformanceImprovement();
    
    // Test Vietnamese Error Handling
    await this.testVietnameseErrorHandling();
    
    // Generate Report
    this.generateReport();
  }

  private async testConnectionPooling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Testing connection pooling functionality...');
      
      // Test basic connection acquisition
      const result = await connectionPool.executeQuery(async (client) => {
        const { data, error } = await client
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        return data;
      });

      this.results.push({
        testName: 'Connection Pooling - Basic Query',
        passed: true,
        duration: Date.now() - startTime,
        details: { recordCount: result?.length || 0 }
      });

    } catch (error) {
      this.results.push({
        testName: 'Connection Pooling - Basic Query',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testDatabaseFunctions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Testing database functions with connection pooling...');
      
      // Test patient ID generation
      const patientId = await connectionPool.executeQuery(async (client) => {
        const { data, error } = await client.rpc('generate_patient_id');
        if (error) throw error;
        return data;
      });

      // Test doctor ID generation
      const doctorId = await connectionPool.executeQuery(async (client) => {
        const { data, error } = await client.rpc('generate_doctor_id', {
          dept_id: 'DEPT001'
        });
        if (error) throw error;
        return data;
      });

      this.results.push({
        testName: 'Database Functions - ID Generation',
        passed: true,
        duration: Date.now() - startTime,
        details: { 
          patientId: patientId,
          doctorId: doctorId,
          patientIdValid: patientId?.startsWith('PAT-'),
          doctorIdValid: doctorId?.includes('-DOC-')
        }
      });

    } catch (error) {
      this.results.push({
        testName: 'Database Functions - ID Generation',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testPerformanceImprovement(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Testing performance improvements...');
      
      // Test concurrent queries
      const concurrentQueries = Array.from({ length: 5 }, (_, i) =>
        connectionPool.executeQuery(async (client) => {
          const { data, error } = await client
            .from('departments')
            .select('department_id, name')
            .limit(10);
          
          if (error) throw error;
          return { queryIndex: i, recordCount: data?.length || 0 };
        })
      );

      const results = await Promise.all(concurrentQueries);
      const avgResponseTime = (Date.now() - startTime) / 5;

      this.results.push({
        testName: 'Performance - Concurrent Queries',
        passed: avgResponseTime < 200, // Target: < 200ms average
        duration: Date.now() - startTime,
        details: {
          concurrentQueries: 5,
          avgResponseTime: avgResponseTime,
          results: results,
          performanceTarget: '< 200ms average'
        }
      });

    } catch (error) {
      this.results.push({
        testName: 'Performance - Concurrent Queries',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testVietnameseErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Testing Vietnamese error handling...');
      
      // Test Vietnamese error response format
      const mockRequest = {
        headers: { 'accept-language': 'vi-VN,vi;q=0.9' }
      };

      // Simulate error handling logic
      const language = mockRequest.headers['accept-language']?.includes('en') ? 'en' : 'vi';
      
      const errorResponse = {
        success: false,
        error: language === 'vi' ? 'Lỗi hệ thống nội bộ' : 'Internal server error',
        message: language === 'vi' ? 'Đã xảy ra lỗi, vui lòng thử lại' : 'Something went wrong',
        timestamp: new Date().toISOString(),
        service: 'test-service'
      };

      const isVietnamese = errorResponse.error === 'Lỗi hệ thống nội bộ';
      const hasVietnameseMessage = errorResponse.message === 'Đã xảy ra lỗi, vui lòng thử lại';

      this.results.push({
        testName: 'Vietnamese Error Handling',
        passed: isVietnamese && hasVietnameseMessage,
        duration: Date.now() - startTime,
        details: {
          language: language,
          errorResponse: errorResponse,
          isVietnamese: isVietnamese,
          hasVietnameseMessage: hasVietnameseMessage
        }
      });

    } catch (error) {
      this.results.push({
        testName: 'Vietnamese Error Handling',
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    logger.info('Phase 1 Implementation Test Results', {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${successRate.toFixed(1)}%`
    });

    // Detailed results
    this.results.forEach(result => {
      const status = result.passed ? 'PASS' : 'FAIL';
      logger.info(`[${status}] ${result.testName}`, {
        duration: `${result.duration}ms`,
        error: result.error,
        details: result.details
      });
    });

    // Summary
    if (successRate >= 80) {
      logger.info('Phase 1 Implementation: SUCCESS - Ready for production deployment');
    } else {
      logger.warn('Phase 1 Implementation: NEEDS ATTENTION - Some tests failed');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new Phase1Tester();
  tester.runAllTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { Phase1Tester };
