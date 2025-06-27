#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 Hospital Management System - Profile Component Build & Test');
console.log('='.repeat(60));

// Check if we're in the right directory
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the frontend directory.');
  process.exit(1);
}

// Build steps
const steps = [
  {
    name: 'Type Check',
    command: 'npx tsc --noEmit',
    description: 'Checking TypeScript types...'
  },
  {
    name: 'Lint Check', 
    command: 'npx eslint components/profile --ext .tsx,.ts',
    description: 'Linting profile components...'
  },
  {
    name: 'Build Check',
    command: 'npx next build --dry-run',
    description: 'Checking build configuration...'
  }
];

let allPassed = true;

for (const step of steps) {
  console.log(`\n🔍 ${step.description}`);
  
  try {
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: currentDir 
    });
    console.log(`✅ ${step.name} passed`);
  } catch (error) {
    console.error(`❌ ${step.name} failed`);
    allPassed = false;
  }
}

// Check component files
console.log('\n📁 Checking component files...');

const requiredFiles = [
  'components/profile/ProfessionalProfile.tsx',
  'components/profile/ProfileFeatures.tsx', 
  'components/profile/README.md',
  'app/profile-demo/page.tsx',
  'app/doctors/profile/page.tsx'
];

for (const file of requiredFiles) {
  const filePath = path.join(currentDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allPassed = false;
  }
}

// Check dependencies
console.log('\n📦 Checking dependencies...');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const requiredDeps = [
  '@radix-ui/react-avatar',
  '@radix-ui/react-separator', 
  '@radix-ui/react-tabs',
  'lucide-react',
  'tailwindcss'
];

for (const dep of requiredDeps) {
  const hasDepInDeps = packageJson.dependencies && packageJson.dependencies[dep];
  const hasDepInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
  
  if (hasDepInDeps || hasDepInDevDeps) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - Missing`);
    allPassed = false;
  }
}

// Summary
console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('🎉 All checks passed! Profile component is ready.');
  console.log('\n📋 Next steps:');
  console.log('1. Start development server: npm run dev');
  console.log('2. Visit demo page: http://localhost:3000/profile-demo');
  console.log('3. Test doctor profile: http://localhost:3000/doctors/profile');
  console.log('4. Login with: doctor@hospital.com / Doctor123.');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n🚀 Profile Component Features:');
console.log('• 📸 Avatar upload with validation');
console.log('• ✏️ Inline editing with form validation');
console.log('• 📱 Responsive design (mobile-first)');
console.log('• 🎭 Role-based UI (doctor/patient)');
console.log('• 🔒 Type-safe with TypeScript');
console.log('• 🎨 Modern design with Tailwind CSS');

console.log('\n💡 Tips:');
console.log('• Use ProfessionalProfile component in any page');
console.log('• Customize styling with Tailwind classes');
console.log('• Add custom validation rules as needed');
console.log('• Check README.md for detailed documentation');
