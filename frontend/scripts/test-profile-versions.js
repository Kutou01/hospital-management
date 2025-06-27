/**
 * Test script for both Profile versions
 * Tests functionality and API integration
 */

const API_BASE = 'http://localhost:3100'; // API Gateway
const FRONTEND_BASE = 'http://localhost:3000';

// Test doctor credentials
const TEST_DOCTOR = {
  email: 'doctor@hospital.com',
  password: 'Doctor123.',
  doctor_id: 'DOC-CARD-0001'
};

/**
 * Test Profile Tabs version
 */
async function testProfileTabs() {
  console.log('\n🗂️ Testing Profile Tabs Version...');
  
  try {
    // Test page accessibility
    const response = await fetch(`${FRONTEND_BASE}/doctors/profile`);
    console.log(`✅ Profile Tabs page: ${response.status === 200 ? 'Accessible' : 'Failed'}`);
    
    // Test individual API endpoints that tabs use
    const endpoints = [
      '/api/doctors/DOC-CARD-0001/profile',
      '/api/doctors/DOC-CARD-0001/experience',
      '/api/doctors/DOC-CARD-0001/schedule',
      '/api/doctors/DOC-CARD-0001/schedule/today',
      '/api/doctors/DOC-CARD-0001/reviews/summary',
      '/api/doctors/DOC-CARD-0001/appointments/stats',
      '/api/doctors/DOC-CARD-0001/settings',
      '/api/doctors/DOC-CARD-0001/emergency-contacts'
    ];
    
    console.log('\n📡 Testing API endpoints for Tabs:');
    for (const endpoint of endpoints) {
      try {
        const apiResponse = await fetch(`${API_BASE}${endpoint}`);
        const status = apiResponse.status;
        const statusText = status === 200 ? '✅' : status === 404 ? '❌' : '⚠️';
        console.log(`${statusText} ${endpoint}: ${status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Profile Tabs test failed:', error.message);
  }
}

/**
 * Test Profile Integrated version
 */
async function testProfileIntegrated() {
  console.log('\n🎨 Testing Profile Integrated Version...');
  
  try {
    // Test page accessibility
    const response = await fetch(`${FRONTEND_BASE}/doctors/profile-integrated`);
    console.log(`✅ Profile Integrated page: ${response.status === 200 ? 'Accessible' : 'Failed'}`);
    
    // Test bulk data loading (what integrated version does)
    console.log('\n📊 Testing bulk data loading:');
    
    const bulkEndpoints = [
      { name: 'Doctor Profile', url: '/api/doctors/DOC-CARD-0001/profile' },
      { name: 'Experiences', url: '/api/doctors/DOC-CARD-0001/experience' },
      { name: 'Reviews', url: '/api/doctors/DOC-CARD-0001/reviews?page=1&limit=5' },
      { name: 'Schedule', url: '/api/doctors/DOC-CARD-0001/schedule' },
      { name: 'Statistics', url: '/api/doctors/DOC-CARD-0001/stats' }
    ];
    
    // Test parallel loading (like integrated version does)
    const startTime = Date.now();
    const promises = bulkEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(`${API_BASE}${endpoint.url}`);
        return {
          name: endpoint.name,
          status: response.status,
          success: response.status === 200
        };
      } catch (error) {
        return {
          name: endpoint.name,
          status: 'Error',
          success: false,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(promises);
    const loadTime = Date.now() - startTime;
    
    console.log(`⚡ Parallel loading completed in ${loadTime}ms`);
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.status}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📈 Success rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
    
  } catch (error) {
    console.error('❌ Profile Integrated test failed:', error.message);
  }
}

/**
 * Test Profile Comparison page
 */
async function testProfileComparison() {
  console.log('\n🔍 Testing Profile Comparison Page...');
  
  try {
    const response = await fetch(`${FRONTEND_BASE}/doctors/profile-comparison`);
    console.log(`✅ Profile Comparison page: ${response.status === 200 ? 'Accessible' : 'Failed'}`);
    
    // Test navigation links
    const pages = [
      { name: 'Profile Tabs', url: '/doctors/profile' },
      { name: 'Profile Integrated', url: '/doctors/profile-integrated' },
      { name: 'Dashboard', url: '/doctors/dashboard' }
    ];
    
    console.log('\n🔗 Testing navigation links:');
    for (const page of pages) {
      try {
        const pageResponse = await fetch(`${FRONTEND_BASE}${page.url}`);
        const icon = pageResponse.status === 200 ? '✅' : '❌';
        console.log(`${icon} ${page.name}: ${pageResponse.status}`);
      } catch (error) {
        console.log(`❌ ${page.name}: Error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Profile Comparison test failed:', error.message);
  }
}

/**
 * Performance comparison
 */
async function performanceComparison() {
  console.log('\n⚡ Performance Comparison...');
  
  try {
    // Test Tabs version (sequential loading simulation)
    console.log('\n📊 Simulating Tabs loading pattern (sequential):');
    const tabsStartTime = Date.now();
    
    const tabEndpoints = [
      '/api/doctors/DOC-CARD-0001/profile',
      '/api/doctors/DOC-CARD-0001/experience',
      '/api/doctors/DOC-CARD-0001/schedule'
    ];
    
    for (const endpoint of tabEndpoints) {
      await fetch(`${API_BASE}${endpoint}`);
    }
    const tabsTime = Date.now() - tabsStartTime;
    
    // Test Integrated version (parallel loading)
    console.log('\n📊 Simulating Integrated loading pattern (parallel):');
    const integratedStartTime = Date.now();
    
    const integratedPromises = tabEndpoints.map(endpoint => 
      fetch(`${API_BASE}${endpoint}`)
    );
    await Promise.all(integratedPromises);
    const integratedTime = Date.now() - integratedStartTime;
    
    console.log(`\n⏱️ Performance Results:`);
    console.log(`   Tabs (sequential): ${tabsTime}ms`);
    console.log(`   Integrated (parallel): ${integratedTime}ms`);
    console.log(`   Performance gain: ${Math.round((tabsTime - integratedTime) / tabsTime * 100)}%`);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Profile Versions Test Suite...');
  console.log('=' .repeat(50));
  
  await testProfileTabs();
  await testProfileIntegrated();
  await testProfileComparison();
  await performanceComparison();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Profile Versions Test Suite Completed!');
  console.log('\n📋 Summary:');
  console.log('   • Profile Tabs: Traditional tab-based interface');
  console.log('   • Profile Integrated: Modern dashboard-style interface');
  console.log('   • Profile Comparison: Feature comparison page');
  console.log('\n🌐 Access URLs:');
  console.log(`   • Tabs: ${FRONTEND_BASE}/doctors/profile`);
  console.log(`   • Integrated: ${FRONTEND_BASE}/doctors/profile-integrated`);
  console.log(`   • Comparison: ${FRONTEND_BASE}/doctors/profile-comparison`);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testProfileTabs,
  testProfileIntegrated,
  testProfileComparison,
  performanceComparison,
  runAllTests
};
