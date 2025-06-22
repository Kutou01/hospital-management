#!/usr/bin/env node

/**
 * Simple Dashboard Test Script (No external dependencies)
 * Tests dashboard components and basic functionality
 */

const fs = require('fs');
const path = require('path');

// Test colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🧪 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'reset');
  }
}

// Test functions
function testFileStructure() {
  logSection('FILE STRUCTURE TESTING');
  
  const requiredFiles = [
    'app/admin/dashboard/page.tsx',
    'components/dashboard/RealTimeStats.tsx',
    'components/dashboard/EnhancedStatCard.tsx',
    'lib/supabase.ts',
    'docs/DASHBOARD_IMPLEMENTATION_GUIDE.md'
  ];

  const results = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      logTest(file, 'PASS', `Size: ${(stats.size / 1024).toFixed(1)}KB`);
      results.push({ name: file, status: 'PASS', size: stats.size });
    } else {
      logTest(file, 'FAIL', 'File not found');
      results.push({ name: file, status: 'FAIL' });
    }
  }
  
  return results;
}

function testComponentSyntax() {
  logSection('COMPONENT SYNTAX TESTING');
  
  const componentFiles = [
    'components/dashboard/RealTimeStats.tsx',
    'components/dashboard/EnhancedStatCard.tsx'
  ];

  const results = [];
  
  for (const file of componentFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        const hasExport = content.includes('export');
        const hasImport = content.includes('import');
        const hasReact = content.includes('React') || content.includes('"use client"');
        const hasTypeScript = content.includes('interface') || content.includes('type');
        
        if (hasExport && hasImport && hasReact) {
          logTest(`${file} - Syntax`, 'PASS', 
            `Export: ✓, Import: ✓, React: ✓, TypeScript: ${hasTypeScript ? '✓' : '✗'}`);
          results.push({ name: file, status: 'PASS', typescript: hasTypeScript });
        } else {
          logTest(`${file} - Syntax`, 'FAIL', 
            `Export: ${hasExport ? '✓' : '✗'}, Import: ${hasImport ? '✓' : '✗'}, React: ${hasReact ? '✓' : '✗'}`);
          results.push({ name: file, status: 'FAIL' });
        }
      } catch (error) {
        logTest(`${file} - Syntax`, 'FAIL', `Error reading file: ${error.message}`);
        results.push({ name: file, status: 'FAIL', error: error.message });
      }
    } else {
      logTest(`${file} - Syntax`, 'FAIL', 'File not found');
      results.push({ name: file, status: 'FAIL' });
    }
  }
  
  return results;
}

function testDashboardContent() {
  logSection('DASHBOARD CONTENT TESTING');
  
  const dashboardFile = 'app/admin/dashboard/page.tsx';
  const filePath = path.join(process.cwd(), dashboardFile);
  
  const results = [];
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for new components
      const hasRealTimeStats = content.includes('RealTimeStats');
      const hasEnhancedStatCard = content.includes('EnhancedStatCard');
      const hasSystemHealthBadge = content.includes('SystemHealthBadge');
      const hasDashboardApi = content.includes('dashboardApi');
      
      // Check for enhanced features
      const hasRealTimeFeatures = content.includes('real-time') || content.includes('Real-time');
      const hasAnimations = content.includes('animate') || content.includes('transition');
      const hasGradients = content.includes('gradient');
      
      logTest('RealTimeStats Integration', hasRealTimeStats ? 'PASS' : 'FAIL');
      logTest('EnhancedStatCard Integration', hasEnhancedStatCard ? 'PASS' : 'FAIL');
      logTest('SystemHealthBadge Integration', hasSystemHealthBadge ? 'PASS' : 'FAIL');
      logTest('Dashboard API Integration', hasDashboardApi ? 'PASS' : 'FAIL');
      logTest('Real-time Features', hasRealTimeFeatures ? 'PASS' : 'WARN', 'Check for real-time functionality');
      logTest('UI Animations', hasAnimations ? 'PASS' : 'WARN', 'Check for animation classes');
      logTest('Gradient Styling', hasGradients ? 'PASS' : 'WARN', 'Check for gradient backgrounds');
      
      results.push({
        name: 'Dashboard Content',
        status: (hasRealTimeStats && hasEnhancedStatCard && hasDashboardApi) ? 'PASS' : 'PARTIAL',
        features: {
          realTimeStats: hasRealTimeStats,
          enhancedStatCard: hasEnhancedStatCard,
          systemHealthBadge: hasSystemHealthBadge,
          dashboardApi: hasDashboardApi,
          realTimeFeatures: hasRealTimeFeatures,
          animations: hasAnimations,
          gradients: hasGradients
        }
      });
      
    } catch (error) {
      logTest('Dashboard Content', 'FAIL', `Error reading file: ${error.message}`);
      results.push({ name: 'Dashboard Content', status: 'FAIL', error: error.message });
    }
  } else {
    logTest('Dashboard Content', 'FAIL', 'Dashboard file not found');
    results.push({ name: 'Dashboard Content', status: 'FAIL' });
  }
  
  return results;
}

function testSupabaseApi() {
  logSection('SUPABASE API TESTING');
  
  const supabaseFile = 'lib/supabase.ts';
  const filePath = path.join(process.cwd(), supabaseFile);
  
  const results = [];
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for enhanced API functions
      const hasDashboardApi = content.includes('dashboardApi');
      const hasGetDashboardStats = content.includes('getDashboardStats');
      const hasGetSystemHealth = content.includes('getSystemHealth');
      const hasGetRealtimeMetrics = content.includes('getRealtimeMetrics');
      const hasMicroservicesSupport = content.includes('API_BASE_URL') || content.includes('microservices');
      const hasFallbackMechanism = content.includes('fallback') || content.includes('Promise.allSettled');
      
      logTest('Dashboard API Export', hasDashboardApi ? 'PASS' : 'FAIL');
      logTest('getDashboardStats Function', hasGetDashboardStats ? 'PASS' : 'FAIL');
      logTest('getSystemHealth Function', hasGetSystemHealth ? 'PASS' : 'FAIL');
      logTest('getRealtimeMetrics Function', hasGetRealtimeMetrics ? 'PASS' : 'FAIL');
      logTest('Microservices Support', hasMicroservicesSupport ? 'PASS' : 'WARN');
      logTest('Fallback Mechanism', hasFallbackMechanism ? 'PASS' : 'WARN');
      
      results.push({
        name: 'Supabase API',
        status: (hasDashboardApi && hasGetDashboardStats && hasGetSystemHealth) ? 'PASS' : 'PARTIAL',
        features: {
          dashboardApi: hasDashboardApi,
          getDashboardStats: hasGetDashboardStats,
          getSystemHealth: hasGetSystemHealth,
          getRealtimeMetrics: hasGetRealtimeMetrics,
          microservicesSupport: hasMicroservicesSupport,
          fallbackMechanism: hasFallbackMechanism
        }
      });
      
    } catch (error) {
      logTest('Supabase API', 'FAIL', `Error reading file: ${error.message}`);
      results.push({ name: 'Supabase API', status: 'FAIL', error: error.message });
    }
  } else {
    logTest('Supabase API', 'FAIL', 'Supabase file not found');
    results.push({ name: 'Supabase API', status: 'FAIL' });
  }
  
  return results;
}

function generateTestReport(allResults) {
  logSection('TEST REPORT SUMMARY');
  
  const totalTests = allResults.reduce((sum, category) => sum + category.results.length, 0);
  const passedTests = allResults.reduce((sum, category) => 
    sum + category.results.filter(r => r.status === 'PASS').length, 0);
  const failedTests = allResults.reduce((sum, category) => 
    sum + category.results.filter(r => r.status === 'FAIL').length, 0);
  const partialTests = allResults.reduce((sum, category) => 
    sum + category.results.filter(r => r.status === 'PARTIAL' || r.status === 'WARN').length, 0);

  log(`📊 Total Tests: ${totalTests}`, 'bright');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`⚠️  Partial/Warnings: ${partialTests}`, 'yellow');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`📈 Success Rate: ${successRate}%`, successRate > 80 ? 'green' : successRate > 60 ? 'yellow' : 'red');

  // Detailed breakdown
  log('\n📋 DETAILED BREAKDOWN:', 'bright');
  allResults.forEach(category => {
    log(`\n${category.name}:`, 'cyan');
    category.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '⚠️';
      log(`  ${icon} ${result.name}`);
    });
  });

  // Next steps
  log('\n🚀 NEXT STEPS:', 'bright');
  if (successRate > 90) {
    log('• Excellent! Ready to test in browser', 'green');
    log('• Start development server: npm run dev', 'green');
    log('• Navigate to /admin/dashboard', 'green');
  } else if (successRate > 70) {
    log('• Good progress, minor issues to address', 'yellow');
    log('• Check failed tests above', 'yellow');
    log('• Test in browser for visual verification', 'yellow');
  } else {
    log('• Significant issues need attention', 'red');
    log('• Fix failed components before browser testing', 'red');
  }
}

// Main test runner
function runAllTests() {
  log('🚀 STARTING SIMPLE DASHBOARD TESTS', 'bright');
  log(`📅 ${new Date().toISOString()}`, 'reset');
  log(`📁 Working Directory: ${process.cwd()}`, 'reset');
  
  try {
    const fileResults = testFileStructure();
    const syntaxResults = testComponentSyntax();
    const contentResults = testDashboardContent();
    const apiResults = testSupabaseApi();

    const allResults = [
      { name: 'File Structure', results: fileResults },
      { name: 'Component Syntax', results: syntaxResults },
      { name: 'Dashboard Content', results: contentResults },
      { name: 'Supabase API', results: apiResults }
    ];

    generateTestReport(allResults);
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testFileStructure,
  testComponentSyntax,
  testDashboardContent,
  testSupabaseApi
};
