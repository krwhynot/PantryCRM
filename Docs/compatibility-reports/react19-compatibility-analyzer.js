/**
 * React 19 Compatibility Analyzer for Windows
 * This script analyzes the codebase for React 19 compatibility issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting React 19 Compatibility Analysis...');

// Define patterns that could indicate React 19 compatibility issues
const patterns = {
  // Critical patterns (high risk)
  REACTDOM_RENDER: { 
    pattern: /ReactDOM\.render\(/g, 
    description: "Uses legacy ReactDOM.render() API", 
    risk: "HIGH",
    score: 30
  },
  REACTDOM_HYDRATE: { 
    pattern: /ReactDOM\.hydrate\(/g, 
    description: "Uses legacy ReactDOM.hydrate() API", 
    risk: "HIGH",
    score: 30
  },
  STRING_REFS: { 
    pattern: /ref=["']\w+["']/g, 
    description: "Uses string refs (deprecated)", 
    risk: "HIGH",
    score: 30
  },
  
  // Medium risk patterns
  UNSAFE_LIFECYCLE: { 
    pattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/g, 
    description: "Uses unsafe lifecycle methods", 
    risk: "MEDIUM",
    score: 60
  },
  FIND_DOM_NODE: { 
    pattern: /findDOMNode\(/g, 
    description: "Uses findDOMNode (deprecated)", 
    risk: "MEDIUM",
    score: 60
  },
  LEGACY_CONTEXT: { 
    pattern: /getChildContext\(|childContextTypes|contextTypes/g, 
    description: "Uses legacy context API", 
    risk: "MEDIUM", 
    score: 60
  },
  
  // Low risk patterns (need verification)
  CLASS_COMPONENTS: { 
    pattern: /class\s+\w+\s+extends\s+(React\.)?Component/g, 
    description: "Uses class components (verify with React 19)", 
    risk: "LOW",
    score: 80
  },
  ERROR_BOUNDARY: { 
    pattern: /componentDidCatch|getDerivedStateFromError/g, 
    description: "Contains error boundaries (verify implementation)", 
    risk: "LOW",
    score: 80
  },
  
  // Positive signals (good compatibility)
  HOOKS_USAGE: { 
    pattern: /use[A-Z]\w+\s*\(/g, 
    description: "Uses React hooks (good compatibility)", 
    risk: "GOOD",
    score: 100
  },
  CREATEROOT_API: { 
    pattern: /createRoot\(/g, 
    description: "Uses modern createRoot API (excellent)", 
    risk: "GOOD",
    score: 100
  },
  STRICT_MODE: { 
    pattern: /<(React\.)?StrictMode/g, 
    description: "Uses StrictMode (good practice)", 
    risk: "GOOD",
    score: 100
  }
};

// Define directories to scan
const directories = [
  'src\\app',
  'src\\components',
  'src\\contexts',
  'src\\hooks',
  'src\\lib',
  'src\\pages',
  'src\\utils'
];

// Extensions to look for
const extensions = ['.tsx', '.jsx', '.ts', '.js'];

// Set of files to exclude
const excludePatterns = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'test',
  'tests',
  '__tests__',
  '__mocks__',
  '*.test.*',
  '*.spec.*'
];

// Windows-compatible function to find all files in directory recursively
function findFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}, skipping...`);
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip excluded patterns
    if (excludePatterns.some(pattern => filePath.includes(pattern))) {
      return;
    }
    
    if (stat.isDirectory()) {
      fileList = findFilesRecursively(filePath, fileList);
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Function to analyze a file for React 19 compatibility
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    let score = 95; // Start with a high compatibility score
    
    // Check if this is likely a React file
    const isReactFile = content.includes('import React') || 
                        content.includes('from "react"') || 
                        content.includes("from 'react'") ||
                        content.includes('React.') ||
                        content.includes('<Component') ||
                        content.includes('useState') ||
                        content.includes('useEffect');
    
    if (!isReactFile) {
      // Not a React file, so it's fully compatible
      return { 
        file: filePath, 
        issues: [], 
        score: 100, 
        isReactFile: false 
      };
    }
    
    // Check patterns
    for (const [patternName, patternInfo] of Object.entries(patterns)) {
      const matches = content.match(patternInfo.pattern) || [];
      if (matches.length > 0) {
        results.push({
          pattern: patternName,
          description: patternInfo.description,
          risk: patternInfo.risk,
          count: matches.length
        });
        
        // Adjust score based on pattern risk
        if (patternInfo.risk === 'HIGH') {
          score = Math.min(score, patternInfo.score);
        } else if (patternInfo.risk === 'MEDIUM') {
          score = Math.min(score, Math.max(score - 10, patternInfo.score));
        } else if (patternInfo.risk === 'LOW') {
          score = Math.min(score, Math.max(score - 5, patternInfo.score));
        } else if (patternInfo.risk === 'GOOD' && matches.length > 2) {
          // Bonus for good patterns
          score = Math.min(100, score + 3);
        }
      }
    }
    
    // Enhance score based on additional factors
    if (content.includes('react 19') || content.includes('React 19')) {
      score = Math.min(100, score + 5); // Explicitly mentions React 19
    }
    
    if (content.includes('import { createRoot }')) {
      score = Math.min(100, score + 5); // Modern React 18+ root API import
    }
    
    return {
      file: filePath,
      issues: results,
      score: Math.round(score),
      isReactFile: true
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return { 
      file: filePath, 
      issues: [{ pattern: 'ERROR', description: error.message, risk: 'ERROR', count: 1 }], 
      score: 0, 
      isReactFile: false 
    };
  }
}

// Main analysis function
function analyzeProject() {
  let allFiles = [];
  
  // Find all files in the directories
  for (const dir of directories) {
    console.log(`Scanning directory: ${dir}...`);
    const files = findFilesRecursively(dir);
    console.log(`Found ${files.length} files in ${dir}`);
    allFiles = allFiles.concat(files);
  }
  
  console.log(`Found ${allFiles.length} total files to analyze`);
  
  const results = [];
  let processedCount = 0;
  
  for (const file of allFiles) {
    const result = analyzeFile(file);
    if (result.isReactFile) {
      results.push(result);
      process.stdout.write('.');
    }
    
    // Progress indicator
    processedCount++;
    if (processedCount % 10 === 0) {
      process.stdout.write(processedCount.toString());
    }
  }
  
  console.log('\nAnalysis complete!');
  console.log(`Found ${results.length} React files`);
  
  // Sort and categorize results
  results.sort((a, b) => a.score - b.score);
  
  const highRisk = results.filter(r => r.score < 70);
  const mediumRisk = results.filter(r => r.score >= 70 && r.score < 90);
  const lowRisk = results.filter(r => r.score >= 90 && r.score < 98);
  const compatible = results.filter(r => r.score >= 98);
  
  // Calculate average score
  const averageScore = results.length > 0 ? 
    Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 
    0;
  
  // Print detailed report
  console.log('\n🔍 React 19 Compatibility Report');
  console.log('==============================\n');
  
  console.log(`Total React files analyzed: ${results.length}`);
  console.log(`Average compatibility score: ${averageScore}%`);
  console.log(`\n`);
  
  console.log('🔴 High Risk Components (Require Changes):', highRisk.length);
  highRisk.forEach(r => {
    console.log(`  - ${r.file} (${r.score}%)`);
    r.issues.filter(i => i.risk === 'HIGH').forEach(i => {
      console.log(`    ✖ ${i.description} (${i.count}×)`);
    });
  });
  
  console.log('\n🟠 Medium Risk Components (Need Review):', mediumRisk.length);
  mediumRisk.forEach(r => {
    console.log(`  - ${r.file} (${r.score}%)`);
    r.issues.filter(i => i.risk === 'MEDIUM' || i.risk === 'HIGH').slice(0, 2).forEach(i => {
      console.log(`    ⚠️ ${i.description} (${i.count}×)`);
    });
  });
  
  console.log('\n🟡 Low Risk Components (Verify):', lowRisk.length);
  if (lowRisk.length > 10) {
    lowRisk.slice(0, 10).forEach(r => {
      console.log(`  - ${r.file} (${r.score}%)`);
    });
    console.log(`  - ... and ${lowRisk.length - 10} more`);
  } else {
    lowRisk.forEach(r => {
      console.log(`  - ${r.file} (${r.score}%)`);
    });
  }
  
  console.log('\n🟢 React 19 Compatible Components:', compatible.length);
  if (compatible.length > 10) {
    console.log(`  ${compatible.length} components (98%+ score)`);
  } else {
    compatible.forEach(r => {
      console.log(`  - ${r.file} (${r.score}%)`);
    });
  }
  
  // Save detailed component report
  const componentReport = results.map(r => ({
    component: r.file.replace(/^.*[\\\/]/, '').replace(/\.\w+$/, ''),
    path: r.file,
    score: r.score,
    compatibility: getCompatibilityLevel(r.score),
    issues: r.issues.map(i => `${i.description} (${i.count}×)`).join('; ')
  }));
  
  // Sort by component name for the report
  componentReport.sort((a, b) => a.component.localeCompare(b.component));
  
  // Save JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      averageScore: averageScore,
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      lowRiskCount: lowRisk.length,
      compatibleCount: compatible.length
    },
    componentScores: componentReport
  };
  
  fs.writeFileSync('react19-compatibility-report.json', JSON.stringify(jsonReport, null, 2));
  console.log('\nDetailed report saved to react19-compatibility-report.json');
  
  // Generate overall assessment
  console.log('\n📊 Overall Assessment');
  console.log('==================');
  
  const percentageReady = results.length > 0 ? 
    Math.round((compatible.length + lowRisk.length) * 100 / results.length) : 
    0;
  
  if (highRisk.length === 0 && mediumRisk.length < results.length * 0.1) {
    console.log(`✅ Project is READY for React 19 (${percentageReady}% compatible)`);
  } else if (highRisk.length < results.length * 0.05) {
    console.log(`🟡 Project is MOSTLY READY for React 19 with minor updates (${percentageReady}% compatible)`);
  } else if (highRisk.length < results.length * 0.2) {
    console.log(`🟠 Project requires MODERATE WORK for React 19 (${percentageReady}% compatible)`);
  } else {
    console.log(`🔴 Project requires SIGNIFICANT WORK for React 19 (${percentageReady}% compatible)`);
  }
  
  // Generate CSV report
  const csvRows = ['Component,Path,Compatibility Score,Compatibility Level,Issues'];
  componentReport.forEach(r => {
    csvRows.push(`"${r.component}","${r.path}","${r.score}%","${r.compatibility}","${r.issues}"`);
  });
  fs.writeFileSync('react19-compatibility-report.csv', csvRows.join('\n'));
  console.log('Detailed CSV report saved to react19-compatibility-report.csv');
  
  // Return for programmatic use
  return {
    summary: jsonReport.summary,
    components: componentReport
  };
}

function getCompatibilityLevel(score) {
  if (score >= 98) return 'Full Compatibility';
  if (score >= 90) return 'High Compatibility';
  if (score >= 70) return 'Medium Compatibility';
  return 'Low Compatibility';
}

// Run the analysis
analyzeProject();
