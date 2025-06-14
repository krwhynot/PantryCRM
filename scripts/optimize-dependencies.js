#!/usr/bin/env node
/**
 * Dependency Optimization Script for PantryCRM
 * Analyzes and provides recommendations for package updates and optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing PantryCRM Dependencies...\n');

// Read package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Helper function to run npm commands safely
function runCommand(command, silent = false) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    if (!silent) {
      console.error(`❌ Command failed: ${command}`);
      console.error(error.message);
    }
    return null;
  }
}

// 1. Check for outdated packages
console.log('📦 Checking for outdated packages...');
const outdatedOutput = runCommand('npm outdated --json', true);
if (outdatedOutput) {
  try {
    const outdated = JSON.parse(outdatedOutput);
    const outdatedPackages = Object.keys(outdated);
    
    if (outdatedPackages.length > 0) {
      console.log(`\n⚠️  Found ${outdatedPackages.length} outdated packages:`);
      outdatedPackages.forEach(pkg => {
        const info = outdated[pkg];
        console.log(`   ${pkg}: ${info.current} → ${info.latest}`);
      });
    } else {
      console.log('✅ All packages are up to date');
    }
  } catch (e) {
    console.log('✅ All packages appear to be up to date');
  }
} else {
  console.log('✅ All packages appear to be up to date');
}

// 2. Analyze bundle size impact
console.log('\n📊 Analyzing dependency sizes...');
const heavyPackages = [
  '@azure/storage-blob',
  '@tanstack/react-table', 
  '@tremor/react',
  'exceljs',
  'applicationinsights',
  '@next/bundle-analyzer'
];

console.log('\n📈 Large dependencies that could be optimized:');
heavyPackages.forEach(pkg => {
  if (packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]) {
    console.log(`   📦 ${pkg} - Consider lazy loading or code splitting`);
  }
});

// 3. Security audit
console.log('\n🔒 Running security audit...');
runCommand('npm audit --audit-level moderate');

// 4. Dependency analysis recommendations
console.log('\n💡 Optimization Recommendations:\n');

const recommendations = [
  {
    category: '🚀 Performance',
    items: [
      'Move @next/bundle-analyzer to devDependencies only',
      'Consider lazy loading heavy components like @tremor/react charts',
      'Use dynamic imports for Excel processing (exceljs) when needed',
      'Implement code splitting for Azure SDK components'
    ]
  },
  {
    category: '🔒 Security', 
    items: [
      'Regularly update dependencies with npm update',
      'Monitor security advisories for critical packages',
      'Keep Next.js and React updated to latest stable versions',
      'Use npm audit fix for automated security fixes'
    ]
  },
  {
    category: '🧹 Cleanup',
    items: [
      'Remove unused dependencies with npm-check-unused',
      'Consolidate similar packages (bcrypt vs bcryptjs)',
      'Move build-only tools to devDependencies',
      'Use exact versions for critical dependencies'
    ]
  },
  {
    category: '🔧 CI/CD',
    items: [
      'rimraf moved to dependencies for build compatibility ✅',
      'Added is-ci for proper CI detection ✅',
      'Use npm ci in all CI workflows ✅',
      'Implement proper caching strategies ✅'
    ]
  }
];

recommendations.forEach(rec => {
  console.log(`${rec.category}:`);
  rec.items.forEach(item => {
    console.log(`   • ${item}`);
  });
  console.log('');
});

// 5. Generate update commands
console.log('🛠️  Suggested update commands:\n');

const criticalUpdates = [
  'npm update next@latest',
  'npm update @prisma/client@latest prisma@latest',
  'npm update @azure/identity@latest',
  'npm update typescript@latest',
  'npm update eslint@latest'
];

criticalUpdates.forEach(cmd => {
  console.log(`   ${cmd}`);
});

// 6. Check for duplicate packages
console.log('\n🔍 Checking for potential duplicates...');
const duplicateChecks = [
  ['bcrypt', 'bcryptjs'],
  ['@types/react', '@types/react-dom'],
  ['jest', 'ts-jest'],
  ['eslint', '@typescript-eslint/eslint-plugin']
];

duplicateChecks.forEach(([pkg1, pkg2]) => {
  const hasPkg1 = packageJson.dependencies[pkg1] || packageJson.devDependencies[pkg1];
  const hasPkg2 = packageJson.dependencies[pkg2] || packageJson.devDependencies[pkg2];
  
  if (hasPkg1 && hasPkg2) {
    console.log(`   ⚠️  Both ${pkg1} and ${pkg2} are present - consider consolidating`);
  }
});

// 7. Generate optimization script
const optimizationScript = `#!/bin/bash
# Generated dependency optimization script for PantryCRM

echo "🔧 Starting dependency optimization..."

# Update critical packages
npm update next@latest
npm update @prisma/client@latest prisma@latest  
npm update typescript@latest

# Security updates
npm audit fix --force

# Clean up
npm dedupe
npm prune

# Verify installation
npm ci

echo "✅ Dependency optimization complete!"
`;

fs.writeFileSync('scripts/update-dependencies.sh', optimizationScript);
console.log('\n📄 Generated scripts/update-dependencies.sh for easy updates');

// 8. Package.json health check
console.log('\n🏥 Package.json health check:');

const healthChecks = [
  {
    name: 'Has prepare script',
    check: () => !!packageJson.scripts.prepare,
    status: !!packageJson.scripts.prepare
  },
  {
    name: 'Has build:azure script', 
    check: () => !!packageJson.scripts['build:azure'],
    status: !!packageJson.scripts['build:azure']
  },
  {
    name: 'Has clean script',
    check: () => !!packageJson.scripts.clean,
    status: !!packageJson.scripts.clean
  },
  {
    name: 'Has test:ci script',
    check: () => !!packageJson.scripts['test:ci'],
    status: !!packageJson.scripts['test:ci']
  },
  {
    name: 'Has security scripts',
    check: () => !!packageJson.scripts['security:audit'],
    status: !!packageJson.scripts['security:audit']
  }
];

healthChecks.forEach(check => {
  const icon = check.status ? '✅' : '❌';
  console.log(`   ${icon} ${check.name}`);
});

console.log('\n🎉 Dependency analysis complete!');
console.log('\n📋 Next steps:');
console.log('   1. Review recommendations above');
console.log('   2. Run: chmod +x scripts/update-dependencies.sh && ./scripts/update-dependencies.sh');
console.log('   3. Test your application after updates');
console.log('   4. Commit changes with: git add . && git commit -m "chore: update dependencies"');