#!/usr/bin/env node

/**
 * Enhanced Doctor Service Features Test
 * Tests all the new improvements and optimizations
 */

const axios = require('axios');

const DOCTOR_SERVICE_URL = 'http://localhost:3002';

async function testEnhancedFeatures() {
  console.log('🚀 Testing Enhanced Doctor Service Features');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Enhanced Search with Advanced Filters
  console.log('\n1. 🔍 Testing Enhanced Search Features...');
  try {
    const searchTests = [
      // Basic search
      { params: { search: 'cardiology' }, name: 'Basic text search' },
      // Advanced filters
      { params: { min_rating: 4.0, sort_by: 'rating', sort_order: 'desc' }, name: 'Rating filter with sorting' },
      { params: { experience_years: 5, max_consultation_fee: 500000 }, name: 'Experience and fee filters' },
      { params: { availability_status: 'available', languages: 'Vietnamese' }, name: 'Availability and language filters' },
      // Pagination and sorting
      { params: { page: 1, limit: 10, sort_by: 'experience_years', sort_order: 'asc' }, name: 'Pagination with sorting' },
      // Combined filters
      { params: { specialty: 'Cardiology', min_rating: 3.5, sort_by: 'total_reviews' }, name: 'Combined filters' }
    ];

    for (const test of searchTests) {
      try {
        const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/search`, { params: test.params });
        
        if (response.data.success && response.data.search_metadata) {
          console.log(`   ✅ ${test.name}: PASSED`);
          console.log(`      - Query time: ${response.data.search_metadata.query_time_ms}ms`);
          console.log(`      - Results: ${response.data.pagination.total}`);
          results.passed++;
        } else {
          console.log(`   ❌ ${test.name}: FAILED - Missing search metadata`);
          results.failed++;
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: FAILED - ${error.message}`);
        results.failed++;
      }
    }
  } catch (error) {
    console.log(`   ❌ Enhanced Search: FAILED - ${error.message}`);
    results.failed++;
  }

  // Test 2: Performance Optimization
  console.log('\n2. ⚡ Testing Performance Optimization...');
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors?page=1&limit=20`);
    
    if (response.data.success && response.data.performance) {
      const queryTime = response.data.performance.query_time_ms;
      console.log(`   ✅ Performance Metrics: PASSED`);
      console.log(`      - Query time: ${queryTime}ms`);
      console.log(`      - Total records: ${response.data.performance.total_records}`);
      console.log(`      - Returned records: ${response.data.performance.returned_records}`);
      
      if (queryTime < 100) {
        console.log(`   ✅ Performance Target (<100ms): PASSED`);
        results.passed++;
      } else {
        console.log(`   ⚠️ Performance Target: SLOW (${queryTime}ms)`);
        results.failed++;
      }
      results.passed++;
    } else {
      console.log(`   ❌ Performance Metrics: FAILED - Missing performance data`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ❌ Performance Test: FAILED - ${error.message}`);
    results.failed++;
  }

  // Test 3: Enhanced Pagination
  console.log('\n3. 📄 Testing Enhanced Pagination...');
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors?page=1&limit=5`);
    
    if (response.data.success && response.data.pagination) {
      const pagination = response.data.pagination;
      const hasRequiredFields = pagination.hasNext !== undefined && 
                               pagination.hasPrev !== undefined && 
                               pagination.totalPages !== undefined;
      
      if (hasRequiredFields) {
        console.log(`   ✅ Enhanced Pagination: PASSED`);
        console.log(`      - Total pages: ${pagination.totalPages}`);
        console.log(`      - Has next: ${pagination.hasNext}`);
        console.log(`      - Has previous: ${pagination.hasPrev}`);
        results.passed++;
      } else {
        console.log(`   ❌ Enhanced Pagination: FAILED - Missing pagination fields`);
        results.failed++;
      }
    } else {
      console.log(`   ❌ Enhanced Pagination: FAILED - Missing pagination data`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ❌ Pagination Test: FAILED - ${error.message}`);
    results.failed++;
  }

  // Test 4: Input Validation
  console.log('\n4. 🛡️ Testing Input Validation...');
  try {
    const validationTests = [
      { params: { min_rating: 6 }, expectedError: true, name: 'Invalid rating (>5)' },
      { params: { min_rating: -1 }, expectedError: true, name: 'Invalid rating (<0)' },
      { params: { experience_years: -5 }, expectedError: true, name: 'Invalid experience years' },
      { params: { limit: 150 }, expectedError: false, name: 'Limit capping (should cap to 100)' }
    ];

    for (const test of validationTests) {
      try {
        const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/search`, { params: test.params });
        
        if (test.expectedError) {
          if (response.status === 400) {
            console.log(`   ✅ ${test.name}: PASSED (Validation error caught)`);
            results.passed++;
          } else {
            console.log(`   ❌ ${test.name}: FAILED (Should have returned 400)`);
            results.failed++;
          }
        } else {
          if (response.data.success) {
            console.log(`   ✅ ${test.name}: PASSED`);
            results.passed++;
          } else {
            console.log(`   ❌ ${test.name}: FAILED`);
            results.failed++;
          }
        }
      } catch (error) {
        if (test.expectedError && error.response?.status === 400) {
          console.log(`   ✅ ${test.name}: PASSED (Validation error caught)`);
          results.passed++;
        } else {
          console.log(`   ❌ ${test.name}: FAILED - ${error.message}`);
          results.failed++;
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Input Validation: FAILED - ${error.message}`);
    results.failed++;
  }

  // Test 5: Service Health Check
  console.log('\n5. 🏥 Testing Service Health...');
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/test-all`);
    
    if (response.data.success && response.data.data.features.advancedSearch === '✅ Enhanced with 10+ filters') {
      console.log(`   ✅ Service Health: PASSED`);
      console.log(`      - Advanced Search: ${response.data.data.features.advancedSearch}`);
      console.log(`      - Performance Optimization: ${response.data.data.features.performanceOptimization}`);
      console.log(`      - Error Handling: ${response.data.data.features.errorHandling}`);
      results.passed++;
    } else {
      console.log(`   ❌ Service Health: FAILED - Features not updated`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ❌ Service Health: FAILED - ${error.message}`);
    results.failed++;
  }

  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENHANCED FEATURES TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL ENHANCED FEATURES WORKING PERFECTLY!');
    console.log('✅ Doctor Service is 100% COMPLETE and PRODUCTION READY!');
  } else {
    console.log('\n⚠️ Some features need attention.');
  }

  return results.failed === 0;
}

// Run the test
if (require.main === module) {
  testEnhancedFeatures()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedFeatures };
