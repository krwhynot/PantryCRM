/**
 * Cleanup script for React Beautiful DnD migration
 * 
 * This script verifies that:
 * 1. react-beautiful-dnd is not installed
 * 2. @hello-pangea/dnd is properly installed
 * 3. No direct imports of the old package exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}🔍 Starting DnD migration cleanup check...${colors.reset}`);

// Check package.json for old and new packages
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for removed packages
  const hasOldDnd = packageJson.dependencies && 
                  ('react-beautiful-dnd' in packageJson.dependencies || 
                   '@types/react-beautiful-dnd' in (packageJson.devDependencies || {}));
  
  // Check for new package
  const hasNewDnd = packageJson.dependencies && 
                  '@hello-pangea/dnd' in packageJson.dependencies;
  
  console.log(`\n${colors.blue}📦 Package Status:${colors.reset}`);
  console.log(`- react-beautiful-dnd: ${hasOldDnd ? colors.red + 'Found (should be removed)' : colors.green + 'Not found (good)'}${colors.reset}`);
  console.log(`- @hello-pangea/dnd: ${hasNewDnd ? colors.green + 'Found (good)' : colors.red + 'Not found (needs installation)'}${colors.reset}`);
  
  if (hasOldDnd) {
    console.log(`\n${colors.yellow}⚠️  Warning: Old DnD packages found. Run 'npm uninstall react-beautiful-dnd @types/react-beautiful-dnd'${colors.reset}`);
  }
  
  if (!hasNewDnd) {
    console.log(`\n${colors.yellow}⚠️  Warning: New DnD package not found. Run 'npm install @hello-pangea/dnd'${colors.reset}`);
  }
  
} catch (error) {
  console.error(`${colors.red}❌ Error reading package.json: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Search for any remaining imports of the old package
console.log(`\n${colors.blue}🔍 Scanning for old DnD imports...${colors.reset}`);

try {
  const searchPattern = 'from [\'"].*react-beautiful-dnd[\'"]|require\([\'"].*react-beautiful-dnd[\'"]\)';
  const grepCommand = process.platform === 'win32' 
    ? `findstr /s /i /c:"from \"*react-beautiful-dnd\"" /c:"from '*react-beautiful-dnd*'" /c:"require(\"*react-beautiful-dnd*\")" /c:"require('*react-beautiful-dnd*')" *.ts *.tsx *.js *.jsx`
    : `grep -rE "${searchPattern}" --include="*.{ts,tsx,js,jsx}" . || true`;
  
  const result = execSync(grepCommand, { cwd: process.cwd(), encoding: 'utf8' });
  
  if (result.trim()) {
    console.log(`${colors.yellow}⚠️  Found potential old DnD imports:${colors.reset}\n${result}`);
  } else {
    console.log(`${colors.green}✅ No old DnD imports found.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}❌ Error scanning for imports: ${error.message}${colors.reset}`);
}

// Verify node_modules
console.log(`\n${colors.blue}🔍 Verifying node_modules...${colors.reset}`);

try {
  const checkDir = (dir) => {
    try {
      return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    } catch {
      return false;
    }
  };
  
  const oldDndPath = path.join('node_modules', 'react-beautiful-dnd');
  const newDndPath = path.join('node_modules', '@hello-pangea', 'dnd');
  
  const oldDndExists = checkDir(oldDndPath);
  const newDndExists = checkDir(newDndPath);
  
  console.log(`- react-beautiful-dnd in node_modules: ${oldDndExists ? colors.red + 'Found (should be removed)' : colors.green + 'Not found (good)'}${colors.reset}`);
  console.log(`- @hello-pangea/dnd in node_modules: ${newDndExists ? colors.green + 'Found (good)' : colors.red + 'Not found (run npm install)'}${colors.reset}`);
  
  if (oldDndExists) {
    console.log(`\n${colors.yellow}⚠️  Old DnD package found in node_modules. Delete it and run 'npm install' to clean up.${colors.reset}`);
  }
  
} catch (error) {
  console.error(`${colors.red}❌ Error checking node_modules: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.blue}✅ Cleanup check complete.${colors.reset}`);
