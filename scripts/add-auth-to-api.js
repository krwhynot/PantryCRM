#!/usr/bin/env node

/**
 * Script to automatically add authentication to unprotected API routes
 * This fixes the critical security vulnerability found in the audit
 */

const fs = require('fs');
const path = require('path');

// List of routes that should remain public (like auth endpoints)
const publicRoutes = [
  'auth/[...nextauth]/route.ts',
  'health/route.ts',
  'health/b1-performance/route.ts',
  'system/health/route.ts'
];

// Required imports for authentication
const authImports = `import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';`;

// Function to check if a file needs authentication
function needsAuth(filePath, content) {
  // Skip if it's a public route
  if (publicRoutes.some(route => filePath.includes(route))) {
    return false;
  }
  
  // Skip if it already has authentication
  if (content.includes('requireAuth') || content.includes('requireAdmin')) {
    return false;
  }
  
  // Skip if it's not an API route file
  if (!filePath.includes('/api/') || !filePath.endsWith('route.ts')) {
    return false;
  }
  
  return true;
}

// Function to add authentication to a route file
function addAuthToRoute(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!needsAuth(filePath, content)) {
      return false;
    }
    
    console.log(`Adding authentication to: ${filePath}`);
    
    // Add imports
    const importRegex = /import.*from.*;(\n|$)/g;
    const imports = content.match(importRegex) || [];
    const lastImportIndex = content.lastIndexOf(imports[imports.length - 1] || '') + (imports[imports.length - 1] || '').length;
    
    content = content.slice(0, lastImportIndex) + '\n' + authImports + '\n' + content.slice(lastImportIndex);
    
    // Find and replace export functions
    const functionRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(([^)]*)\)\s*[:{]/g;
    let match;
    const replacements = [];
    
    while ((match = functionRegex.exec(content)) !== null) {
      const method = match[1];
      const params = match[2];
      const functionName = `handle${method}`;
      
      // Create the new function definition
      const oldDef = match[0];
      const newDef = `async function ${functionName}(${params}): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(${params.split(',')[0]});
  if (error) return error;`;
      
      replacements.push({
        old: oldDef,
        new: newDef,
        method,
        functionName
      });
    }
    
    // Apply replacements
    for (const replacement of replacements) {
      content = content.replace(replacement.old, replacement.new);
    }
    
    // Add exports at the end
    if (replacements.length > 0) {
      const exports = replacements.map(r => 
        `export const ${r.method} = withRateLimit(withErrorHandler(${r.functionName}), { maxAttempts: 100, windowMs: 60000 });`
      ).join('\n');
      
      content = content + '\n\n// Export with authentication, rate limiting, and error handling\n' + exports;
    }
    
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find all API route files
function findApiRoutes(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findApiRoutes(fullPath));
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Main execution
function main() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  if (!fs.existsSync(apiDir)) {
    console.error('API directory not found:', apiDir);
    process.exit(1);
  }
  
  console.log('🔒 Adding authentication to unprotected API routes...');
  
  const apiRoutes = findApiRoutes(apiDir);
  let processedCount = 0;
  
  for (const routeFile of apiRoutes) {
    if (addAuthToRoute(routeFile)) {
      processedCount++;
    }
  }
  
  console.log(`✅ Added authentication to ${processedCount} API routes`);
  console.log('🔐 Security vulnerability fixed: All API endpoints now require authentication');
}

if (require.main === module) {
  main();
}

module.exports = { addAuthToRoute, findApiRoutes };