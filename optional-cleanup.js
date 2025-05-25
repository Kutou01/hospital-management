#!/usr/bin/env node

/**
 * Optional cleanup script for additional files that might be removed
 * These files are less critical and should be reviewed before removal
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Hospital Management System - Optional Cleanup Analysis\n');

// Files that might be candidates for removal (review first)
const optionalFiles = [
  // Development/Testing files
  {
    path: 'frontend/create-admin.js',
    category: 'Development Script',
    description: 'Admin creation script - may be needed for setup',
    risk: 'LOW'
  },
  {
    path: 'frontend/create-test-admin.js', 
    category: 'Development Script',
    description: 'Test admin creation - likely only needed for development',
    risk: 'LOW'
  },
  {
    path: 'frontend/scripts/create-admin.js',
    category: 'Development Script', 
    description: 'Duplicate admin creation script',
    risk: 'LOW'
  },
  {
    path: 'frontend/scripts/create-test-users.js',
    category: 'Development Script',
    description: 'Test user creation - development only',
    risk: 'LOW'
  },
  {
    path: 'frontend/scripts/quick-test.js',
    category: 'Development Script',
    description: 'Quick testing script - development only',
    risk: 'LOW'
  },
  {
    path: 'backend/test-connection.js',
    category: 'Development Script',
    description: 'Database connection test - useful for debugging',
    risk: 'MEDIUM'
  },
  {
    path: 'backend/scripts/test-supabase-integration.js',
    category: 'Development Script',
    description: 'Supabase integration test - useful for debugging',
    risk: 'MEDIUM'
  },
  
  // Documentation files (consider archiving)
  {
    path: 'TESTING_GUIDE.md',
    category: 'Documentation',
    description: 'Testing guide - may be outdated',
    risk: 'MEDIUM'
  },
  {
    path: 'PROJECT_SETUP_GUIDE.md',
    category: 'Documentation', 
    description: 'Setup guide - check if current',
    risk: 'MEDIUM'
  },
  {
    path: 'DEPLOYMENT_GUIDE.md',
    category: 'Documentation',
    description: 'Deployment guide - verify accuracy',
    risk: 'MEDIUM'
  },
  {
    path: 'DOCKER_SETUP_GUIDE.md',
    category: 'Documentation',
    description: 'Docker setup guide - check relevance',
    risk: 'MEDIUM'
  },
  {
    path: 'frontend/REDIRECT_FIX_GUIDE.md',
    category: 'Documentation',
    description: 'Redirect fix guide - may be temporary',
    risk: 'LOW'
  },
  
  // Test/Debug pages (production consideration)
  {
    path: 'frontend/app/test-auth',
    category: 'Test Page',
    description: 'Auth testing page - remove in production',
    risk: 'LOW'
  },
  {
    path: 'frontend/app/debug',
    category: 'Debug Page',
    description: 'Debug pages - remove in production',
    risk: 'LOW'
  },
  {
    path: 'frontend/app/demo-roles',
    category: 'Demo Page',
    description: 'Role demo page - remove in production',
    risk: 'LOW'
  },
  {
    path: 'frontend/app/role-detection',
    category: 'Test Page',
    description: 'Role detection test - remove in production',
    risk: 'LOW'
  },
  {
    path: 'frontend/components/test',
    category: 'Test Components',
    description: 'Test components directory - remove in production',
    risk: 'LOW'
  },
  {
    path: 'frontend/components/debug',
    category: 'Debug Components',
    description: 'Debug components - remove in production',
    risk: 'LOW'
  },
  {
    path: 'frontend/components/examples',
    category: 'Example Components',
    description: 'Example components - may not be needed',
    risk: 'LOW'
  },
  
  // Root level files
  {
    path: 'package.json',
    category: 'Configuration',
    description: 'Root package.json - may not be needed',
    risk: 'HIGH'
  },
  {
    path: 'package-lock.json',
    category: 'Configuration',
    description: 'Root package-lock.json - may not be needed',
    risk: 'HIGH'
  },
  
  // Unused hooks
  {
    path: 'frontend/hooks/useAuthProvider.tsx',
    category: 'Code',
    description: 'Auth provider hook - check if used',
    risk: 'HIGH'
  }
];

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function analyzeFiles() {
  console.log('📊 Optional File Analysis:\n');
  
  const categories = {};
  let totalFiles = 0;
  let existingFiles = 0;
  
  optionalFiles.forEach(file => {
    const exists = fileExists(file.path);
    if (exists) existingFiles++;
    totalFiles++;
    
    if (!categories[file.category]) {
      categories[file.category] = [];
    }
    
    categories[file.category].push({
      ...file,
      exists
    });
  });
  
  // Display by category
  Object.keys(categories).forEach(category => {
    console.log(`\n📁 ${category}:`);
    categories[category].forEach(file => {
      const status = file.exists ? '✅' : '❌';
      const riskColor = file.risk === 'HIGH' ? '🔴' : file.risk === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`   ${status} ${riskColor} ${file.path}`);
      console.log(`      ${file.description}`);
    });
  });
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total files analyzed: ${totalFiles}`);
  console.log(`   Files found: ${existingFiles}`);
  console.log(`   Files not found: ${totalFiles - existingFiles}`);
  
  return { categories, totalFiles, existingFiles };
}

function generateRecommendations() {
  console.log('\n💡 Recommendations:\n');
  
  console.log('🟢 LOW RISK - Safe to remove:');
  console.log('   • Development scripts (create-admin.js, etc.)');
  console.log('   • Test/Debug pages (for production)');
  console.log('   • Temporary documentation files');
  
  console.log('\n🟡 MEDIUM RISK - Review before removing:');
  console.log('   • Documentation files (check if current)');
  console.log('   • Database test scripts (useful for debugging)');
  
  console.log('\n🔴 HIGH RISK - Careful review required:');
  console.log('   • Root package.json files');
  console.log('   • Code files (hooks, components)');
  console.log('   • Check dependencies before removing');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Review each file individually');
  console.log('2. Check if files are referenced elsewhere');
  console.log('3. Create backups before removing');
  console.log('4. Test application after removal');
}

function createSelectiveCleanupScript() {
  const scriptContent = `#!/usr/bin/env node

// Selective cleanup script - remove only LOW RISK files
const fs = require('fs');

const lowRiskFiles = [
  'frontend/create-test-admin.js',
  'frontend/scripts/create-test-users.js', 
  'frontend/scripts/quick-test.js',
  'frontend/REDIRECT_FIX_GUIDE.md'
];

console.log('🧹 Removing LOW RISK files only...');

lowRiskFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(\`✅ Removed: \${file}\`);
  } else {
    console.log(\`⚠️  Not found: \${file}\`);
  }
});

console.log('✨ Low risk cleanup completed!');
`;

  fs.writeFileSync('selective-cleanup.js', scriptContent);
  console.log('\n📝 Created selective-cleanup.js for low-risk files only');
}

// Main execution
function main() {
  analyzeFiles();
  generateRecommendations();
  createSelectiveCleanupScript();
  
  console.log('\n🔧 Usage:');
  console.log('   node selective-cleanup.js    # Remove only low-risk files');
  console.log('   # Review other files manually before removing');
}

main();
