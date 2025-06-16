#!/usr/bin/env node

/**
 * Chart Library Installation Verification Script
 * Verifies that Tremor React is properly installed and working
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Chart Library Installation...\n');

// 1. Check package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (packageJson.dependencies['@tremor/react']) {
  console.log('✅ @tremor/react found in package.json:', packageJson.dependencies['@tremor/react']);
} else {
  console.log('❌ @tremor/react not found in package.json');
  process.exit(1);
}

// 2. Check node_modules
const tremorPath = path.join(__dirname, '..', 'node_modules', '@tremor', 'react');
if (fs.existsSync(tremorPath)) {
  console.log('✅ @tremor/react installed in node_modules');
} else {
  console.log('❌ @tremor/react not found in node_modules');
  process.exit(1);
}

// 3. Test import
try {
  const tremor = require('@tremor/react');
  const components = Object.keys(tremor);
  console.log('✅ Tremor React imports successfully');
  console.log(`📊 ${components.length} components available:`, components.slice(0, 5).join(', '), '...');
} catch (error) {
  console.log('❌ Import failed:', error.message);
  process.exit(1);
}

// 4. Check chart component files
const chartComponents = [
  'components/tremor/OptimizedBarChart.tsx',
  'components/tremor/OptimizedAreaChart.tsx',
  'components/tremor/OptimizedDonutChart.tsx',
  'components/charts/optimized/TremorBarChart.tsx',
  'components/charts/SSRChartWrapper.tsx'
];

let componentCount = 0;
chartComponents.forEach(componentPath => {
  const fullPath = path.join(__dirname, '..', componentPath);
  if (fs.existsSync(fullPath)) {
    componentCount++;
    console.log(`✅ ${componentPath} exists`);
  } else {
    console.log(`⚠️  ${componentPath} not found`);
  }
});

console.log(`\n📈 Chart Components Status: ${componentCount}/${chartComponents.length} components found`);

// 5. Summary
console.log('\n🎉 Chart Library Installation Verification Complete!');
console.log('\n📋 Next Steps:');
console.log('   1. Charts should now render without import errors');
console.log('   2. Test chart components in development mode');
console.log('   3. Verify performance optimizations are working');
console.log('   4. Proceed with remaining migration tasks');

console.log('\n✅ Task Completed: Install missing chart dependencies');