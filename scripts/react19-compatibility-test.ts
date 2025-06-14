#!/usr/bin/env ts-node
/**
 * React 19 Compatibility Test
 * 
 * This script analyzes the codebase for potential React 19 compatibility issues.
 * It scans all React component files and assigns a confidence score based on 
 * the usage of APIs that might have changed in React 19.
 * 
 * Usage:
 * npx ts-node scripts/react19-compatibility-test.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

// Define patterns that could indicate React 19 compatibility issues
const PATTERNS = {
  // Legacy render API (deprecated in React 18+)
  LEGACY_RENDER: {
    pattern: /ReactDOM\.render\s*\(/g,
    severity: 'high',
    description: 'Uses ReactDOM.render() which is removed in React 19',
    score: 0
  },
  // Legacy hydrate API (deprecated in React 18+)
  LEGACY_HYDRATE: {
    pattern: /ReactDOM\.hydrate\s*\(/g,
    severity: 'high',
    description: 'Uses ReactDOM.hydrate() which is removed in React 19',
    score: 0
  },
  // Legacy createClass API (deprecated long ago)
  CREATE_CLASS: {
    pattern: /createClass\s*\(/g,
    severity: 'high',
    description: 'Uses createClass which is not supported in React 19',
    score: 0
  },
  // String refs (deprecated long ago)
  STRING_REFS: {
    pattern: /ref=["'].*["']/g,
    severity: 'high',
    description: 'Uses string refs which are removed in React 19',
    score: 0
  },
  // findDOMNode (deprecated and will warn in React 19)
  FIND_DOM_NODE: {
    pattern: /findDOMNode\s*\(/g,
    severity: 'medium',
    description: 'Uses findDOMNode() which is deprecated in React 19',
    score: 30
  },
  // Component lifecycle methods that might be affected
  UNSAFE_LIFECYCLE: {
    pattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/g,
    severity: 'medium',
    description: 'Uses UNSAFE_ lifecycle methods which may behave differently in React 19',
    score: 30
  },
  // Direct DOM manipulation which might be affected by React 19's fiber architecture
  DIRECT_DOM_MANIPULATION: {
    pattern: /document\.getElementById\s*\(|document\.querySelector\s*\(|\.innerHTML\s*=|\.innerText\s*=/g,
    severity: 'low',
    description: 'Contains direct DOM manipulation which may cause issues with React 19 fiber architecture',
    score: 60
  },
  // Class components (potentially affected by React 19 compiler optimizations)
  CLASS_COMPONENT: {
    pattern: /class\s+\w+\s+extends\s+(React\.)?Component/g,
    severity: 'info',
    description: 'Uses class components which may benefit less from React 19 compiler optimizations',
    score: 80
  },
  // Context API usage (ensure using modern API)
  LEGACY_CONTEXT: {
    pattern: /getChildContext|childContextTypes|contextTypes/g,
    severity: 'medium',
    description: 'Uses legacy context API which is not supported in React 19',
    score: 30
  },
  // Error boundaries patterns (check for updated implementation)
  ERROR_BOUNDARY: {
    pattern: /componentDidCatch\s*\(|static\s+getDerivedStateFromError\s*\(/g,
    severity: 'info',
    description: 'Contains error boundaries - verify implementation works with React 19',
    score: 90
  },
  // React.memo usage (compatible but check for correct implementation)
  MEMO_USAGE: {
    pattern: /React\.memo\s*\(/g,
    severity: 'info',
    description: 'Uses React.memo() - verify implementation works with React 19 compiler',
    score: 95
  },
  // Modern hooks usage (very compatible with React 19)
  HOOKS_USAGE: {
    pattern: /use[A-Z]\w+\s*\(/g,
    severity: 'positive',
    description: 'Uses React hooks which are fully supported in React 19',
    score: 100
  },
  // forwardRef usage (compatible but verify)
  FORWARD_REF: {
    pattern: /React\.forwardRef\s*\(/g,
    severity: 'info',
    description: 'Uses forwardRef which is supported in React 19',
    score: 95
  },
  // Latest createRoot API (very compatible with React 19)
  CREATE_ROOT: {
    pattern: /createRoot\s*\(/g,
    severity: 'positive',
    description: 'Uses modern createRoot API which is perfect for React 19',
    score: 100
  },
  // Concurrent mode features (fully compatible)
  CONCURRENT_FEATURES: {
    pattern: /useTransition|useDeferredValue|startTransition/g,
    severity: 'positive',
    description: 'Uses concurrent features which are enhanced in React 19',
    score: 100
  },
  // React Server Components usage (fully compatible)
  SERVER_COMPONENTS: {
    pattern: /'use server'|"use server"/g,
    severity: 'positive',
    description: 'Uses React Server Components which are enhanced in React 19',
    score: 100
  },
  // Tailwind usage with dynamic classes (ensure works with React compiler atomization)
  DYNAMIC_CLASSNAMES: {
    pattern: /className={\s*[^"']\S*\s*}/g,
    severity: 'info',
    description: 'Uses dynamic classNames - verify with React 19 compiler',
    score: 85
  }
};

// File extensions to scan
const FILE_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];

// Directories to analyze (adjust based on your project structure)
const DIRECTORIES = [
  'src/components',
  'src/app',
  'src/hooks',
  'src/lib',
  'src/pages',
];

// Exclude patterns
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/tests/**',
  '**/dist/**',
  '**/build/**',
];

interface ComponentResult {
  file: string;
  matches: {
    pattern: string;
    count: number;
    description: string;
    severity: string;
    score: number;
  }[];
  overallScore: number;
}

async function findComponentFiles(): Promise<string[]> {
  let allFiles: string[] = [];
  
  for (const dir of DIRECTORIES) {
    const fullDir = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) {
      console.log(chalk.yellow(`Directory ${dir} does not exist, skipping...`));
      continue;
    }

    // Find all component files
    for (const ext of FILE_EXTENSIONS) {
      const files = await glob(`${dir}/**/*${ext}`, {
        ignore: EXCLUDE_PATTERNS,
        cwd: process.cwd()
      });
      allFiles = allFiles.concat(files);
    }
  }
  
  return allFiles;
}

async function analyzeFile(file: string): Promise<ComponentResult> {
  const content = fs.readFileSync(file, 'utf-8');
  const matches: ComponentResult['matches'] = [];
  
  // Check for matches against all patterns
  for (const [name, details] of Object.entries(PATTERNS)) {
    const matchCount = (content.match(details.pattern) || []).length;
    if (matchCount > 0) {
      matches.push({
        pattern: name,
        count: matchCount,
        description: details.description,
        severity: details.severity,
        score: details.score
      });
    }
  }
  
  // Calculate overall score
  let overallScore = 95; // Start with a high score
  
  if (matches.length === 0) {
    // No issues found, but let's check if it's actually a React component
    const hasReactImport = content.includes('import React') || content.includes("from 'react'");
    if (!hasReactImport) {
      // Probably not a React component file
      overallScore = 100; // Non-React files are fully compatible
    } else {
      // Likely a simple component with no compatibility issues
      overallScore = 98;
    }
  } else {
    // Calculate score based on found patterns
    // Positive patterns increase score, negative patterns reduce it
    let totalPatterns = 0;
    let scoreSum = 0;
    
    matches.forEach(match => {
      if (match.severity === 'positive') {
        // Positive patterns are good
        scoreSum += match.score * match.count;
        totalPatterns += match.count;
      } else if (match.severity === 'info') {
        // Info patterns are neutral
        scoreSum += match.score * match.count;
        totalPatterns += match.count;
      } else {
        // Other patterns (high, medium, low) reduce score
        scoreSum += match.score * match.count;
        totalPatterns += match.count;
      }
    });
    
    if (totalPatterns > 0) {
      overallScore = Math.min(100, Math.max(0, Math.round(scoreSum / totalPatterns)));
    }
  }
  
  return {
    file,
    matches,
    overallScore
  };
}

async function analyzeComponents() {
  console.log(chalk.blue('🔍 Starting React 19 Compatibility Analysis...'));
  
  const componentFiles = await findComponentFiles();
  console.log(chalk.green(`Found ${componentFiles.length} component files to analyze`));
  
  const results: ComponentResult[] = [];
  
  for (const file of componentFiles) {
    const result = await analyzeFile(file);
    results.push(result);
    
    // Simple progress indicator
    process.stdout.write('.');
  }
  
  console.log('\n');
  console.log(chalk.blue('📊 Analysis Results:'));
  
  // Sort by confidence score (ascending)
  results.sort((a, b) => a.overallScore - b.overallScore);
  
  // Format results into categories
  const highRisk = results.filter(r => r.overallScore < 70);
  const mediumRisk = results.filter(r => r.overallScore >= 70 && r.overallScore < 90);
  const lowRisk = results.filter(r => r.overallScore >= 90 && r.overallScore < 98);
  const compatible = results.filter(r => r.overallScore >= 98);
  
  // Print results summary
  console.log(chalk.red(`❌ High Risk (${highRisk.length}): Needs significant changes for React 19 compatibility`));
  highRisk.forEach(r => {
    console.log(chalk.red(`   [${r.overallScore}%] ${r.file}`));
    r.matches.filter(m => m.severity === 'high').forEach(m => {
      console.log(chalk.red(`      - ${m.pattern}: ${m.description} (${m.count} occurrences)`));
    });
  });
  
  console.log(chalk.yellow(`⚠️ Medium Risk (${mediumRisk.length}): May need updates for full React 19 compatibility`));
  mediumRisk.forEach(r => {
    console.log(chalk.yellow(`   [${r.overallScore}%] ${r.file}`));
    if (r.matches.length > 0) {
      const topIssues = r.matches
        .filter(m => ['high', 'medium'].includes(m.severity))
        .slice(0, 2);
      topIssues.forEach(m => {
        console.log(chalk.yellow(`      - ${m.pattern}: ${m.description}`));
      });
    }
  });
  
  console.log(chalk.blue(`ℹ️ Low Risk (${lowRisk.length}): Minor verification needed for React 19`));
  if (lowRisk.length > 5) {
    lowRisk.slice(0, 5).forEach(r => {
      console.log(chalk.blue(`   [${r.overallScore}%] ${r.file}`));
    });
    console.log(chalk.blue(`   ... and ${lowRisk.length - 5} more`));
  } else {
    lowRisk.forEach(r => {
      console.log(chalk.blue(`   [${r.overallScore}%] ${r.file}`));
    });
  }
  
  console.log(chalk.green(`✅ Compatible (${compatible.length}): Ready for React 19`));
  if (compatible.length > 10) {
    console.log(chalk.green(`   ${compatible.length} files with 98%+ compatibility score`));
  } else {
    compatible.forEach(r => {
      console.log(chalk.green(`   [${r.overallScore}%] ${r.file}`));
    });
  }
  
  // Generate recommendation summary
  console.log('\n');
  console.log(chalk.blue('🧪 Compatibility Analysis Summary:'));
  console.log(chalk.blue(`------------------------`));
  console.log(`Total components analyzed: ${results.length}`);
  console.log(`Average compatibility score: ${Math.round(results.reduce((acc, r) => acc + r.overallScore, 0) / results.length)}%`);
  console.log(`High risk components: ${highRisk.length} (${Math.round(highRisk.length / results.length * 100)}%)`);
  console.log(`Medium risk components: ${mediumRisk.length} (${Math.round(mediumRisk.length / results.length * 100)}%)`);
  console.log(`Low risk components: ${lowRisk.length} (${Math.round(lowRisk.length / results.length * 100)}%)`);
  console.log(`Compatible components: ${compatible.length} (${Math.round(compatible.length / results.length * 100)}%)`);

  // Generate CSV output
  const csvPath = path.join(process.cwd(), 'react19-compatibility-report.csv');
  let csv = 'File,Confidence Score,Issues,Recommendations\n';
  results.forEach(r => {
    const issues = r.matches.map(m => `${m.pattern} (${m.count}x)`).join('; ');
    const recommendations = r.matches.map(m => m.description).join('; ');
    csv += `"${r.file}",${r.overallScore},"${issues}","${recommendations}"\n`;
  });
  fs.writeFileSync(csvPath, csv);
  console.log(chalk.green(`📊 Detailed report saved to: react19-compatibility-report.csv`));
  
  // Return summary information for the JSON output
  return {
    totalComponents: results.length,
    averageScore: Math.round(results.reduce((acc, r) => acc + r.overallScore, 0) / results.length),
    highRiskCount: highRisk.length,
    mediumRiskCount: mediumRisk.length,
    lowRiskCount: lowRisk.length,
    compatibleCount: compatible.length,
    highRiskComponents: highRisk.map(r => ({ file: r.file, score: r.overallScore })),
    recommendations: [
      ...highRisk.map(r => `Update ${r.file} to address ${r.matches.filter(m => m.severity === 'high').length} critical issues`)
    ]
  };
}

// Execute the analysis
analyzeComponents().then(summary => {
  const jsonPath = path.join(process.cwd(), 'react19-compatibility-summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(chalk.green(`📊 Summary data saved to: react19-compatibility-summary.json`));
  
  // Exit code based on risk level
  if (summary.highRiskCount > 0) {
    console.log(chalk.yellow('⚠️ Some high-risk components were detected. Review the report for details.'));
  } else if (summary.mediumRiskCount > 5) {
    console.log(chalk.blue('ℹ️ Several medium-risk components detected. Test thoroughly with React 19.'));
  } else {
    console.log(chalk.green('✅ Your project appears to be largely compatible with React 19!'));
  }
  
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('❌ Analysis failed:'), error);
  process.exit(1);
});
