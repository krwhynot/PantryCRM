# 🚀 PantryCRM Deployment Checklist

This checklist ensures successful deployments and helps troubleshoot common issues.

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests passing (`npm run test:ci`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Security audit clean (`npm run security:audit`)
- [ ] No high-severity vulnerabilities in dependencies

### ✅ Build Verification
- [ ] Local build successful (`npm run build:azure`)
- [ ] Bundle size within acceptable limits
- [ ] No build warnings or errors
- [ ] Environment variables properly configured
- [ ] Database migrations applied (if any)

### ✅ Dependencies
- [ ] All dependencies up to date (critical packages)
- [ ] `rimraf` available in dependencies (not just devDependencies)
- [ ] `is-ci` package installed for CI detection
- [ ] No deprecated packages causing issues
- [ ] Package-lock.json up to date

### ✅ Configuration
- [ ] GitHub Secrets configured (`AZURE_CREDENTIALS`, `AZURE_WEBAPP_PUBLISH_PROFILE`)
- [ ] Azure App Service settings updated
- [ ] Environment-specific variables set
- [ ] Application Insights configured
- [ ] Database connection strings secure

## 🔄 Deployment Process

### 1. Automated Deployment (Recommended)
```bash
# Push to main branch triggers automatic deployment
git push origin main
```

### 2. Manual Deployment (Emergency)
```bash
# Use workflow dispatch
gh workflow run azure-deploy-optimized.yml
```

### 3. Health Check Verification
```bash
# Test endpoints after deployment
curl https://kitchen-pantry-crm.azurewebsites.net/
curl https://kitchen-pantry-crm.azurewebsites.net/api/health
```

## 🚨 Common Issues & Solutions

### Issue: `rimraf: not found` 
**Solution**: Ensure `rimraf` is in dependencies, not just devDependencies
```json
{
  "dependencies": {
    "rimraf": "^6.0.1"
  }
}
```

### Issue: `husky install` fails in CI
**Solution**: Use CI detection to skip husky in automated builds
```json
{
  "scripts": {
    "prepare": "is-ci || husky install || true"
  }
}
```

### Issue: Build fails with memory errors
**Solution**: Increase Node.js memory limit
```json
{
  "scripts": {
    "build:azure": "NODE_OPTIONS=\"--max-old-space-size=2048\" next build"
  }
}
```

### Issue: Database connection fails during build
**Solution**: Use dummy DATABASE_URL for build-time
```bash
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build
```

### Issue: Dependencies take too long to install
**Solution**: Use npm ci with caching
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
- run: npm ci
```

## 📊 Monitoring & Validation

### Health Check Endpoints
- **Main Application**: https://kitchen-pantry-crm.azurewebsites.net/
- **API Health**: https://kitchen-pantry-crm.azurewebsites.net/api/health
- **Azure Portal**: [App Service Dashboard](https://portal.azure.com/#@1018280e-f485-43e4-911a-b1140fcd1f1f/resource/subscriptions/df8fefaa-16a0-47da-ace7-6eab8b1919cf/resourceGroups/kitchen-pantry-crm-rg/providers/Microsoft.Web/sites/kitchen-pantry-crm/appServices)

### Performance Metrics
- **Response Time**: < 3 seconds for main pages
- **Memory Usage**: < 500MB for B1 tier
- **CPU Time**: Monitor for spikes
- **DTU Usage**: < 80% for Basic SQL tier

### Automated Monitoring
- Performance monitoring runs every 6 hours
- Health checks run every 4 hours  
- Cost analysis available on-demand
- Alert notifications for threshold breaches

## 🛠️ Emergency Procedures

### Rollback Deployment
```bash
# Via Azure Portal
1. Go to App Service → Deployment Center
2. Select previous successful deployment
3. Click "Redeploy"

# Via Azure CLI
az webapp deployment source config-zip \
  --resource-group kitchen-pantry-crm-rg \
  --name kitchen-pantry-crm \
  --src previous-version.zip
```

### Scale Up Resources (if needed)
```bash
# Upgrade App Service plan temporarily
az appservice plan update \
  --name kitchen-pantry-crm-plan \
  --resource-group kitchen-pantry-crm-rg \
  --sku B2

# Scale back down after issue resolved
az appservice plan update \
  --name kitchen-pantry-crm-plan \
  --resource-group kitchen-pantry-crm-rg \
  --sku B1
```

### Database Emergency Access
```bash
# Connect to Azure SQL Database
az sql db show-connection-string \
  --server kitchen-pantry-crm-sql \
  --name kitchen-pantry-crm-db \
  --client sqlcmd
```

## 📈 Post-Deployment Tasks

### Immediate (< 5 minutes)
- [ ] Verify main application loads
- [ ] Test critical user journeys
- [ ] Check health endpoint status
- [ ] Verify database connectivity
- [ ] Monitor error rates

### Short-term (< 30 minutes)  
- [ ] Run performance baseline capture
- [ ] Check Application Insights for errors
- [ ] Verify all API endpoints working
- [ ] Test user authentication flows
- [ ] Monitor resource utilization

### Long-term (< 24 hours)
- [ ] Review deployment metrics
- [ ] Check cost impact
- [ ] Monitor user feedback
- [ ] Plan any necessary optimizations
- [ ] Update documentation if needed

## 📞 Support Resources

### Azure Resources
- **Resource Group**: kitchen-pantry-crm-rg
- **Subscription**: KR-Azure (df8fefaa-16a0-47da-ace7-6eab8b1919cf)
- **Service Principal**: 2669d57d-dacd-41f6-a897-50edb2ca6c04

### Monitoring Tools
- GitHub Actions workflows
- Azure Monitor & Application Insights
- Custom performance baseline scripts
- Automated health checks

### Documentation
- [Azure App Service Docs](https://docs.microsoft.com/en-us/azure/app-service/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

---

**Remember**: Always test deployments in a staging environment when possible, and have a rollback plan ready for production deployments.