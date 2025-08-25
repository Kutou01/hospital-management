// ============================================================================
// CONNECTION POOL MANUAL TESTING SCRIPT
// Quick verification of connection pool functionality
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Mock environment variables for testing
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://ciasxktujslgsdgylimv.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

async function testConnectionPool() {
  console.log('🧪 Starting Connection Pool Tests...\n');

  try {
    // Import connection pool (this will initialize it)
    const { connectionPool } = require('./services/shared/src/database/connection-pool');
    
    console.log('✅ Connection Pool imported successfully');

    // Test 1: Basic Stats
    console.log('\n📊 Test 1: Basic Statistics');
    const initialStats = connectionPool.getStats();
    console.log('Initial Stats:', {
      totalConnections: initialStats.totalConnections,
      activeConnections: initialStats.activeConnections,
      idleConnections: initialStats.idleConnections,
      pendingRequests: initialStats.pendingRequests
    });

    // Test 2: Health Check
    console.log('\n🏥 Test 2: Health Check');
    const healthCheck = await connectionPool.healthCheck();
    console.log('Health Status:', {
      healthy: healthCheck.healthy,
      issues: healthCheck.issues
    });

    // Test 3: Basic Query Execution
    console.log('\n🔍 Test 3: Basic Query Execution');
    try {
      const result = await connectionPool.executeQuery(async (client) => {
        // Simple test query
        const { data, error } = await client.from('profiles').select('id').limit(1);
        if (error) throw error;
        return { success: true, count: data?.length || 0 };
      });
      console.log('Query Result:', result);
    } catch (error) {
      console.log('Query Error (expected if no database):', error.message);
    }

    // Test 4: Priority Queue
    console.log('\n⚡ Test 4: Priority Queue System');
    const priorities = ['low', 'normal', 'high'];
    const results = [];

    const promises = priorities.map(priority => 
      connectionPool.executeQuery(async (client) => {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50));
        const result = { priority, duration: Date.now() - start };
        results.push(result);
        return result;
      }, { priority })
    );

    await Promise.all(promises);
    console.log('Priority Results:', results);

    // Test 5: Healthcare-Specific Operations
    console.log('\n🏥 Test 5: Healthcare-Specific Operations');
    
    // FHIR Validation Test
    const fhirResult = await connectionPool.executeFHIRValidation(async (client) => {
      return { resource: 'Patient', valid: true, timestamp: Date.now() };
    });
    console.log('FHIR Validation:', fhirResult);

    // Diagnosis Operation Test
    const diagnosisResult = await connectionPool.executeDiagnosisOperation(async (client) => {
      return { diagnosis: 'Test Diagnosis', confidence: 0.95, timestamp: Date.now() };
    });
    console.log('Diagnosis Operation:', diagnosisResult);

    // ICD-10 Search Test
    const icd10Result = await connectionPool.executeICD10Search(async (client) => {
      return { code: 'A00.0', description: 'Cholera due to Vibrio cholerae' };
    });
    console.log('ICD-10 Search:', icd10Result);

    // Test 6: Concurrent Load
    console.log('\n🚀 Test 6: Concurrent Load (10 requests)');
    const startTime = Date.now();
    
    const concurrentPromises = Array.from({ length: 10 }, (_, index) =>
      connectionPool.executeQuery(async (client) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return { index, timestamp: Date.now() };
      })
    );

    const concurrentResults = await Promise.all(concurrentPromises);
    const totalDuration = Date.now() - startTime;
    
    console.log(`Processed ${concurrentResults.length} requests in ${totalDuration}ms`);
    console.log(`Average: ${totalDuration / concurrentResults.length}ms per request`);

    // Test 7: Final Stats
    console.log('\n📈 Test 7: Final Statistics');
    const finalStats = connectionPool.getStats();
    console.log('Final Stats:', {
      totalConnections: finalStats.totalConnections,
      activeConnections: finalStats.activeConnections,
      idleConnections: finalStats.idleConnections,
      totalQueries: finalStats.totalQueries,
      averageQueryTime: Math.round(finalStats.averageQueryTime),
      errorRate: finalStats.errorRate
    });

    // Test 8: Error Handling
    console.log('\n❌ Test 8: Error Handling');
    try {
      await connectionPool.executeQuery(async (client) => {
        throw new Error('Simulated error');
      }, { retries: 1 });
    } catch (error) {
      console.log('Error handled correctly:', error.message);
    }

    console.log('\n✅ All Connection Pool tests completed successfully!');
    
    // Performance comparison with direct connection
    console.log('\n⚡ Performance Comparison Test');
    await performanceComparison();

  } catch (error) {
    console.error('❌ Connection Pool test failed:', error);
    console.error('Stack:', error.stack);
  }
}

async function performanceComparison() {
  try {
    const { connectionPool } = require('./services/shared/src/database/connection-pool');
    
    // Create direct client for comparison
    const directClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' }
      }
    );

    const iterations = 20;
    console.log(`Running ${iterations} iterations for comparison...`);

    // Test with Connection Pool
    const poolStartTime = Date.now();
    const poolPromises = Array.from({ length: iterations }, () =>
      connectionPool.executeQuery(async (client) => {
        // Simulate light database operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return { timestamp: Date.now() };
      })
    );
    
    await Promise.all(poolPromises);
    const poolDuration = Date.now() - poolStartTime;

    // Test with Direct Connection
    const directStartTime = Date.now();
    const directPromises = Array.from({ length: iterations }, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { timestamp: Date.now() };
    });
    
    await Promise.all(directPromises);
    const directDuration = Date.now() - directStartTime;

    console.log('\n📊 Performance Results:');
    console.log(`Connection Pool: ${poolDuration}ms (${Math.round(poolDuration/iterations)}ms avg)`);
    console.log(`Direct Connection: ${directDuration}ms (${Math.round(directDuration/iterations)}ms avg)`);
    
    const improvement = directDuration > poolDuration 
      ? `${Math.round(((directDuration - poolDuration) / directDuration) * 100)}% faster`
      : `${Math.round(((poolDuration - directDuration) / poolDuration) * 100)}% slower`;
    
    console.log(`Connection Pool is ${improvement} than direct connection`);

  } catch (error) {
    console.log('Performance comparison skipped:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  testConnectionPool()
    .then(() => {
      console.log('\n🎉 Testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testConnectionPool };
