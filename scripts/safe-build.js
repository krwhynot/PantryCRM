// safe-build.js - Custom build script to work around Windows EPERM issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting safe build process...');

// Step 1: Try to remove .next directory if it exists
try {
  console.log('🗑️ Attempting to clean .next directory...');
  if (fs.existsSync(path.join(process.cwd(), '.next'))) {
    // On Windows, some files might be locked, so we'll try our best but continue on failure
    try {
      fs.rmSync(path.join(process.cwd(), '.next'), { recursive: true, force: true });
      console.log('✅ Successfully removed .next directory');
    } catch (e) {
      console.log('⚠️ Could not fully remove .next directory, continuing anyway:', e.message);
    }
  }
} catch (e) {
  console.log('⚠️ Error during cleanup:', e.message);
}

// Step 2: Set environment variables to disable telemetry and tracing
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096 --no-warnings';

// Step 3: Run Prisma commands first
try {
  console.log('🔄 Running Prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🔄 Running Prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('🔄 Running Prisma db seed...');
  execSync('npx prisma db seed', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Error during Prisma operations:', e.message);
  process.exit(1);
}

// Step 4: Run Next.js build with tracing disabled
try {
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_OPTIONS: '--max-old-space-size=4096 --no-warnings'
    }
  });
  console.log('✅ Build completed successfully!');
} catch (e) {
  console.error('❌ Build failed:', e.message);
  process.exit(1);
}