#!/usr/bin/env node

/**
 * Simple Bundle Size Analysis Script
 * 
 * This script analyzes the Next.js bundle size and identifies large dependencies
 * without requiring external dependencies like chalk.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Helper function to colorize text
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log(colorize('\n📦 Kitchen Pantry CRM Bundle Analysis\n', 'bold'));

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.log(colorize('❌ .next directory not found. Please run "npm run build" first.', 'red'));
  process.exit(1);
}

// Check for build manifest
const buildManifestPath = path.join(nextDir, 'build-manifest.json');
if (!fs.existsSync(buildManifestPath)) {
  console.log(colorize('❌ Build manifest not found. Please run "npm run build" first.', 'red'));
  process.exit(1);
}

// Read package.json to analyze dependencies
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log(colorize('❌ package.json not found.', 'red'));
  process.exit(1);
}

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Get all dependencies
  const dependencies = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };
  
  console.log(colorize('📊 Dependency Analysis\n', 'bold'));
  console.log(colorize(`Total dependencies: ${Object.keys(dependencies).length}`, 'blue'));
  
  // Identify potentially large dependencies
  const knownLargeDeps = [
    { name: 'moment', size: '~232KB', alternative: 'date-fns (~13KB)' },
    { name: 'aws-sdk', size: '~400KB+', alternative: '@azure/storage-blob (smaller footprint)' },
    { name: 'chart.js', size: '~170KB', alternative: 'lightweight-charts or @tremor/react' },
    { name: 'lodash', size: '~70KB', alternative: 'lodash-es (tree-shakable) or individual functions' },
    { name: 'react-icons', size: 'varies by usage', alternative: 'lucide-react (tree-shakable)' },
    { name: '@mui/material', size: '~300KB+', alternative: 'shadcn/ui (zero runtime, only imports what you use)' },
    { name: 'bootstrap', size: '~160KB', alternative: 'tailwindcss (tree-shakable)' },
    { name: 'jquery', size: '~90KB', alternative: 'Native DOM APIs' },
    { name: 'axios', size: '~40KB', alternative: 'fetch API with a small wrapper' },
  ];
  
  console.log(colorize('\n🔍 Checking for known large dependencies:', 'yellow'));
  
  let foundLargeDeps = false;
  knownLargeDeps.forEach(dep => {
    if (dependencies[dep.name]) {
      foundLargeDeps = true;
      console.log(colorize(`⚠️  ${dep.name} (${dep.size})`, 'red'));
      console.log(colorize(`   Consider: ${dep.alternative}`, 'green'));
    }
  });
  
  if (!foundLargeDeps) {
    console.log(colorize('✅ No known large dependencies found!', 'green'));
  }
  
  // Check for React version
  const reactVersion = dependencies['react'];
  const reactDomVersion = dependencies['react-dom'];
  
  console.log(colorize('\n⚛️ React Version Check:', 'blue'));
  if (reactVersion) {
    console.log(colorize(`React: ${reactVersion}`, 'cyan'));
  }
  if (reactDomVersion) {
    console.log(colorize(`React DOM: ${reactDomVersion}`, 'cyan'));
  }
  
  // Check for duplicate React types
  const reactTypes = Object.keys(dependencies).filter(dep => 
    dep.includes('@types/react')
  );
  
  if (reactTypes.length > 1) {
    console.log(colorize('\n⚠️ Multiple React type packages detected:', 'red'));
    reactTypes.forEach(type => {
      console.log(colorize(`   ${type}: ${dependencies[type]}`, 'yellow'));
    });
  }
  
  // Optimization recommendations
  console.log(colorize('\n💡 Optimization Recommendations:', 'bold'));
  console.log(colorize('1. Run "npm dedupe" to remove duplicate packages', 'green'));
  console.log(colorize('2. Use dynamic imports for large components: import dynamic from "next/dynamic"', 'green'));
  console.log(colorize('3. Implement proper code splitting with Next.js route segments', 'green'));
  console.log(colorize('4. Use tree-shakable libraries where possible', 'green'));
  console.log(colorize('5. Consider using next/image for optimized images', 'green'));
  
  console.log(colorize('\n✅ Analysis complete!', 'bold'));
  console.log(colorize('To get more detailed bundle analysis, run: npm run analyze', 'gray'));
  
} catch (error) {
  console.error(colorize(`❌ Error analyzing dependencies: ${error.message}`, 'red'));
  process.exit(1);
}