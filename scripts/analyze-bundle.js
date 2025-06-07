#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * 
 * This script analyzes the Next.js bundle size and identifies large dependencies
 * that could be optimized or replaced with smaller alternatives.
 */

const fs = require('fs');
const path = require('path');
let chalk;

try {
  chalk = require('chalk');
} catch (e) {
  // Fallback if chalk is not available
  chalk = {
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: { bold: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m` },
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`
  };
}

// Check if stats file exists
const statsFilePath = path.join(process.cwd(), '.next/analyze/stats.json');

if (!fs.existsSync(statsFilePath)) {
  console.error(chalk.red('Stats file not found. Please run "npm run analyze" first.'));
  process.exit(1);
}

// Read and parse stats file
const stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));

// Extract module sizes
const modules = stats.modules || [];
const nodeModules = modules.filter(m => 
  m.name && m.name.includes('node_modules') && !m.name.includes('webpack')
);

// Group by package
const packages = {};
nodeModules.forEach(module => {
  const match = module.name.match(/node_modules[/\\]((?:@[^/\\]+[/\\])?[^/\\]+)/);
  if (match) {
    const packageName = match[1];
    if (!packages[packageName]) {
      packages[packageName] = {
        size: 0,
        count: 0
      };
    }
    packages[packageName].size += module.size || 0;
    packages[packageName].count += 1;
  }
});

// Sort packages by size
const sortedPackages = Object.entries(packages)
  .sort((a, b) => b[1].size - a[1].size)
  .map(([name, data]) => ({
    name,
    size: data.size,
    count: data.count,
    sizeFormatted: (data.size / 1024).toFixed(2) + ' KB'
  }));

// Print results
console.log(chalk.blue.bold('\n📦 Bundle Size Analysis\n'));
console.log(chalk.yellow('Top 20 largest dependencies:'));
console.log(chalk.gray('----------------------------'));

sortedPackages.slice(0, 20).forEach((pkg, i) => {
  console.log(
    chalk.white(`${i + 1}. ${pkg.name.padEnd(30)} ${pkg.sizeFormatted.padStart(10)} (${pkg.count} modules)`)
  );
});

// Identify potential optimizations
console.log(chalk.blue.bold('\n🔍 Optimization Opportunities\n'));

// Check for specific large packages that could be replaced
const optimizationTargets = [
  { name: 'moment', alternative: 'date-fns', reason: 'Smaller footprint and tree-shakable' },
  { name: 'lodash', alternative: 'lodash-es', reason: 'ES modules for better tree shaking' },
  { name: 'aws-sdk', alternative: '@aws-sdk/* specific modules', reason: 'Only import needed services' },
  { name: 'chart.js', alternative: 'lightweight-charts', reason: 'Smaller alternative for basic charts' },
  { name: 'react-icons', alternative: 'lucide-react or specific icon imports', reason: 'Import only needed icons' },
];

optimizationTargets.forEach(target => {
  const found = sortedPackages.find(p => p.name === target.name || p.name.startsWith(target.name + '/'));
  if (found) {
    console.log(chalk.red(`⚠️  ${found.name} (${found.sizeFormatted})`));
    console.log(chalk.green(`   Consider: ${target.alternative}`));
    console.log(chalk.gray(`   Reason: ${target.reason}\n`));
  }
});

// Check for duplicate React versions
const reactVersions = sortedPackages.filter(p => 
  p.name === 'react' || p.name === 'react-dom' || p.name.startsWith('@types/react')
);

if (reactVersions.length > 3) {
  console.log(chalk.red('⚠️  Multiple React packages detected - possible duplicate versions'));
  reactVersions.forEach(p => {
    console.log(chalk.yellow(`   ${p.name} (${p.sizeFormatted})`));
  });
  console.log(chalk.gray('   Consider deduplicating with npm dedupe or checking for conflicting peer dependencies\n'));
}

// Total bundle size
const totalSize = sortedPackages.reduce((sum, pkg) => sum + pkg.size, 0);
console.log(chalk.blue.bold('\n📊 Summary\n'));
console.log(chalk.white(`Total dependencies size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`));
console.log(chalk.white(`Number of packages: ${sortedPackages.length}`));

// Recommendations
console.log(chalk.blue.bold('\n💡 Recommendations\n'));
console.log(chalk.green('1. Run "npm dedupe" to remove duplicate packages'));
console.log(chalk.green('2. Consider code splitting with dynamic imports for large components'));
console.log(chalk.green('3. Use tree-shakable libraries where possible'));
console.log(chalk.green('4. Implement proper lazy loading for routes and components'));
console.log(chalk.green('5. Review and remove unused dependencies'));