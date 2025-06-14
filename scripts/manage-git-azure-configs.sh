#!/bin/bash
# Git Management Script for Azure CI/CD Configurations
# Handles Windows line endings and commits Azure pipeline files

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Managing Git repository for Azure configurations${NC}"

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# 1. Configure Git for Windows line endings
echo "📝 Configuring Git for Windows development..."
git config --global core.autocrlf true
git config --global core.safecrlf warn
check_command "Git line ending configuration"

# 2. Check current Git status
echo "📊 Current Git status:"
git status --porcelain

# 3. Add performance baselines to gitignore if not already there
if ! grep -q "performance_baselines/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Performance baseline files" >> .gitignore
    echo "performance_baselines/" >> .gitignore
    echo "perf-metrics.json" >> .gitignore
    echo -e "${GREEN}📁 Added performance files to .gitignore${NC}"
else
    echo -e "${YELLOW}📁 Performance files already in .gitignore${NC}"
fi

# 4. Stage Azure configuration files
echo "📦 Staging Azure configuration files..."

# Security and workflow files
if [ -f ".github/workflows/security-scan.yml" ]; then
    git add .github/workflows/security-scan.yml
    echo "   ✅ Added security scan workflow"
fi

if [ -f "SECURITY.md" ]; then
    git add SECURITY.md
    echo "   ✅ Added security documentation"
fi

# Azure Functions (if exists)
if [ -d "azure-functions" ]; then
    git add azure-functions/
    echo "   ✅ Added Azure Functions"
fi

# Scripts
if [ -f "scripts/capture-performance-baseline-production.sh" ]; then
    git add scripts/capture-performance-baseline-production.sh
    echo "   ✅ Added production baseline script"
fi

if [ -f "scripts/capture-performance-baseline-fixed.sh" ]; then
    git add scripts/capture-performance-baseline-fixed.sh
    echo "   ✅ Added fixed baseline script"
fi

if [ -f "scripts/manage-git-azure-configs.sh" ]; then
    git add scripts/manage-git-azure-configs.sh
    echo "   ✅ Added Git management script"
fi

# Documentation
if [ -f "Docs/azure_info.md" ]; then
    git add Docs/azure_info.md
    echo "   ✅ Added Azure documentation"
fi

# Middleware
if [ -f "src/app/api/middleware.ts" ]; then
    git add src/app/api/middleware.ts
    echo "   ✅ Added API middleware"
fi

# Always add .gitignore changes
git add .gitignore
echo "   ✅ Added .gitignore updates"

# 5. Check what's staged
echo -e "\n${YELLOW}📋 Files staged for commit:${NC}"
git diff --cached --name-only | while read file; do
    echo "   📄 $file"
done

# 6. Create comprehensive commit
echo -e "\n${GREEN}💾 Creating commit...${NC}"
git commit -m "feat: Add comprehensive Azure monitoring and CI/CD infrastructure

## Azure Monitoring & Performance
- Add production-ready performance baseline script with exact resource names
- Add fixed baseline script with proper error handling and resource discovery
- Configure performance metrics collection for App Service, SQL DB, and Application Insights

## Security & Compliance  
- Add GitHub Actions security scanning workflow
- Add comprehensive SECURITY.md documentation
- Configure proper security headers and middleware

## Development Infrastructure
- Add Git management script for Windows development environment
- Configure proper line ending handling for cross-platform development
- Add performance baseline files to .gitignore

## Resource Configuration
- Document exact Azure resource names and IDs
- Add Azure Functions infrastructure (if applicable)
- Add API middleware for enhanced security and monitoring

## Technical Details
- Resource Group: kitchen-pantry-crm-rg
- Subscription: KR-Azure (df8fefaa-16a0-47da-ace7-6eab8b1919cf)
- Application Insights: kitchen-pantry-crm-insights
- App Service: kitchen-pantry-crm.azurewebsites.net

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

check_command "Git commit created"

# 7. Show final status
echo -e "\n${GREEN}🎉 Git repository updated successfully!${NC}"
echo -e "${YELLOW}📊 Final repository status:${NC}"
git status --short

echo -e "\n${GREEN}📈 Recent commits:${NC}"
git log --oneline -3

echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo "   1. Test Azure CLI authentication: az login --tenant 1018280e-f485-43e4-911a-b1140fcd1f1f"
echo "   2. Use Cloud Shell for Azure operations until local auth is resolved"
echo "   3. Run performance baseline script in Cloud Shell to validate metrics"
echo "   4. Consider pushing changes to remote repository"