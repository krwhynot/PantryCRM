#!/bin/bash
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
