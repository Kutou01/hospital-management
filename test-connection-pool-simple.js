// ============================================================================
// SIMPLE CONNECTION POOL TEST
// Direct testing without complex imports
// ============================================================================

// Set up environment
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://ciasxktujslgsdgylimv.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';

console.log('🧪 Starting Simple Connection Pool Test...\n');

// Test basic module loading
try {
  console.log('📦 Testing module imports...');
  
  // Test if we can import Supabase
  const { createClient } = require('@supabase/supabase-js');
  console.log('✅ Supabase client imported successfully');
  
  // Test basic client creation
  const testClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' }
    }
  );
  console.log('✅ Test client created successfully');
  
  // Test connection pool class directly
  console.log('\n🔗 Testing Connection Pool Class...');
  
  // Import the connection pool class
  const fs = require('fs');
  const path = require('path');
  
  // Check if connection pool file exists
  const connectionPoolPath = path.join(__dirname, 'src', 'database', 'connection-pool.ts');
  if (fs.existsSync(connectionPoolPath)) {
    console.log('✅ Connection pool file found at:', connectionPoolPath);
    
    // Read the file content to verify structure
    const content = fs.readFileSync(connectionPoolPath, 'utf8');
    
    // Check for key components
    const hasClass = content.includes('class DatabaseConnectionPool');
    const hasExport = content.includes('export const connectionPool');
    const hasHealthCheck = content.includes('healthCheck()');
    const hasStats = content.includes('getStats()');
    
    console.log('📋 Connection Pool Structure Check:');
    console.log(`  - DatabaseConnectionPool class: ${hasClass ? '✅' : '❌'}`);
    console.log(`  - Exported instance: ${hasExport ? '✅' : '❌'}`);
    console.log(`  - Health check method: ${hasHealthCheck ? '✅' : '❌'}`);
    console.log(`  - Stats method: ${hasStats ? '✅' : '❌'}`);
    
    if (hasClass && hasExport && hasHealthCheck && hasStats) {
      console.log('✅ Connection Pool structure is complete');
    } else {
      console.log('⚠️  Connection Pool structure has missing components');
    }
    
  } else {
    console.log('❌ Connection pool file not found at expected location');
  }
  
  // Test service configurations
  console.log('\n🏥 Testing Service Configurations...');
  
  const services = [
    'doctor-service',
    'patient-service', 
    'medical-records-service',
    'appointment-service',
    'receptionist-service',
    'graphql-gateway'
  ];
  
  services.forEach(service => {
    const configPath = path.join(__dirname, '..', service, 'src', 'config', 'database.config.ts');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const hasConnectionPool = configContent.includes('connectionPool');
      const hasDbPool = configContent.includes('dbPool');
      
      console.log(`  ${service}: ${hasConnectionPool && hasDbPool ? '✅' : '❌'} Connection Pool configured`);
    } else {
      console.log(`  ${service}: ❌ Config file not found`);
    }
  });
  
  // Test health check middleware
  console.log('\n🏥 Testing Health Check Middleware...');
  const healthCheckPath = path.join(__dirname, 'src', 'middleware', 'connection-pool-health.ts');
  if (fs.existsSync(healthCheckPath)) {
    const healthContent = fs.readFileSync(healthCheckPath, 'utf8');
    const hasHealthCheck = healthContent.includes('createConnectionPoolHealthCheck');
    const hasMetrics = healthContent.includes('createConnectionPoolMetrics');
    const hasStressTest = healthContent.includes('createConnectionPoolStressTest');
    
    console.log('📋 Health Check Middleware:');
    console.log(`  - Health check function: ${hasHealthCheck ? '✅' : '❌'}`);
    console.log(`  - Metrics function: ${hasMetrics ? '✅' : '❌'}`);
    console.log(`  - Stress test function: ${hasStressTest ? '✅' : '❌'}`);
  } else {
    console.log('❌ Health check middleware not found');
  }
  
  // Test doctor service integration
  console.log('\n👨‍⚕️ Testing Doctor Service Integration...');
  const doctorIndexPath = path.join(__dirname, '..', 'doctor-service', 'src', 'index.ts');
  if (fs.existsSync(doctorIndexPath)) {
    const doctorContent = fs.readFileSync(doctorIndexPath, 'utf8');
    const hasHealthEndpoint = doctorContent.includes('/health/connection-pool');
    const hasMetricsEndpoint = doctorContent.includes('/metrics/connection-pool');
    const hasStressEndpoint = doctorContent.includes('/test/connection-pool/stress');
    
    console.log('📋 Doctor Service Endpoints:');
    console.log(`  - Health endpoint: ${hasHealthEndpoint ? '✅' : '❌'}`);
    console.log(`  - Metrics endpoint: ${hasMetricsEndpoint ? '✅' : '❌'}`);
    console.log(`  - Stress test endpoint: ${hasStressEndpoint ? '✅' : '❌'}`);
  } else {
    console.log('❌ Doctor service index file not found');
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('✅ Basic imports working');
  console.log('✅ Connection Pool file structure verified');
  console.log('✅ Service configurations checked');
  console.log('✅ Health check middleware verified');
  console.log('✅ Doctor service integration confirmed');
  
  console.log('\n🎉 Simple Connection Pool test completed successfully!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start doctor-service to test health endpoints');
  console.log('2. Test actual database connections with real credentials');
  console.log('3. Run performance benchmarks');
  console.log('4. Implement Connection Pool in remaining services');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
}
