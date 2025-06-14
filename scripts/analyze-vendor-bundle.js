const fs = require('fs');
const path = require('path');

/**
 * Analyze vendor bundle to identify packages causing SSR issues
 */
function analyzeVendorBundle() {
  console.log('🔍 Analyzing vendor bundle for SSR incompatible packages...\n');
  
  // Check if build exists
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.error('❌ No build found. Run npm run build:ci first.');
    process.exit(1);
  }
  
  // Find vendor chunk files
  const serverDir = path.join(buildDir, 'server');
  const staticDir = path.join(buildDir, 'static', 'chunks');
  
  let vendorFiles = [];
  
  if (fs.existsSync(serverDir)) {
    const serverFiles = fs.readdirSync(serverDir)
      .filter(f => f.includes('vendors') && f.endsWith('.js'));
    vendorFiles.push(...serverFiles.map(f => ({ path: path.join(serverDir, f), type: 'server' })));
  }
  
  if (fs.existsSync(staticDir)) {
    const staticFiles = fs.readdirSync(staticDir)
      .filter(f => f.includes('vendors') && f.endsWith('.js'));
    vendorFiles.push(...staticFiles.map(f => ({ path: path.join(staticDir, f), type: 'static' })));
  }
  
  console.log(`📦 Found ${vendorFiles.length} vendor bundle(s):\n`);
  
  // Analyze each vendor file
  vendorFiles.forEach(({ path: filePath, type }) => {
    console.log(`\n🔍 Analyzing ${type} bundle: ${path.basename(filePath)}`);
    console.log(`📍 Location: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Search for problematic patterns
      const patterns = {
        'self references': /(?<!\/\/.*|\/\*[\s\S]*?\*\/)(?<!\.)self(?!\w)/g,
        'window references': /(?<!\/\/.*|\/\*[\s\S]*?\*\/)(?<!\.)window(?!\w)/g,
        'document references': /(?<!\/\/.*|\/\*[\s\S]*?\*\/)(?<!\.)document(?!\w)/g,
        'navigator references': /(?<!\/\/.*|\/\*[\s\S]*?\*\/)(?<!\.)navigator(?!\w)/g,
        'localStorage references': /localStorage/g,
        'sessionStorage references': /sessionStorage/g
      };
      
      console.log(`📊 Bundle size: ${(content.length / 1024).toFixed(2)} KB`);
      
      Object.entries(patterns).forEach(([name, pattern]) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`⚠️  ${name}: ${matches.length} occurrences`);
          
          // Show first few context lines for self references
          if (name === 'self references') {
            const lines = content.split('\n');
            const contextLines = [];
            lines.forEach((line, index) => {
              if (line.includes('self') && contextLines.length < 3) {
                contextLines.push(`    Line ${index + 1}: ${line.trim().substring(0, 100)}...`);
              }
            });
            if (contextLines.length > 0) {
              console.log(`    📝 Context:`);
              contextLines.forEach(line => console.log(line));
            }
          }
        }
      });
      
      // Try to identify specific packages
      const packagePatterns = [
        { name: 'react-hot-toast', pattern: /react-hot-toast/g },
        { name: '@hello-pangea/dnd', pattern: /@hello-pangea\/dnd/g },
        { name: 'framer-motion', pattern: /framer-motion/g },
        { name: 'recharts', pattern: /recharts/g },
        { name: 'chart.js', pattern: /chart\.js/g },
        { name: 'd3', pattern: /\bd3[-\.]|d3\/|"d3"/g },
        { name: 'lodash', pattern: /lodash/g },
        { name: 'moment', pattern: /moment/g },
        { name: 'date-fns', pattern: /date-fns/g },
        { name: 'axios', pattern: /axios/g },
        { name: 'swr', pattern: /swr/g }
      ];
      
      console.log(`\n📋 Detected packages in bundle:`);
      packagePatterns.forEach(({ name, pattern }) => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`    ✓ ${name} (${matches.length} references)`);
        }
      });
      
    } catch (error) {
      console.error(`❌ Error reading bundle: ${error.message}`);
    }
  });
  
  // Check package.json for known problematic packages
  console.log(`\n\n🔍 Checking package.json for known SSR problematic packages...\n`);
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const problematicPackages = [
    'react-hot-toast',
    '@hello-pangea/dnd', 
    'framer-motion',
    'lottie-react',
    'react-spring',
    'use-gesture',
    'react-use-gesture',
    'react-intersection-observer',
    'react-visibility-sensor',
    'react-waypoint',
    '@tremor/react',
    'victory',
    'nivo',
    'react-chartjs-2',
    'chart.js'
  ];
  
  const foundProblematic = [];
  
  [...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {})].forEach(pkg => {
    if (problematicPackages.some(problematic => pkg.includes(problematic))) {
      foundProblematic.push(pkg);
    }
  });
  
  if (foundProblematic.length > 0) {
    console.log(`⚠️  Found potentially problematic packages:`);
    foundProblematic.forEach(pkg => {
      console.log(`    - ${pkg}`);
    });
  } else {
    console.log(`✅ No obviously problematic packages found in package.json`);
  }
  
  console.log(`\n📝 Next steps:`);
  console.log(`1. Focus on packages with 'self references' in the vendor bundle`);
  console.log(`2. Test removing/externalizing packages one by one`);
  console.log(`3. Use webpack-bundle-analyzer for visual analysis:`);
  console.log(`   npm run analyze`);
  console.log(`4. Check individual package imports in your components`);
}

if (require.main === module) {
  analyzeVendorBundle();
}

module.exports = { analyzeVendorBundle };