---
trigger: manual
---

# Food Service CRM - Azure Deployment Workflow

## Description
Automated Azure App Service deployment for Food Service CRM with Next.js standalone output and $18/month budget constraint.

## Steps

### 1. Pre-deployment Validation
- **NextCRM Check:** Verify components preserved and adapted
- **Database:** Ensure Azure SQL schema changes applied
- **Settings:** Confirm 9 setting categories operational
- **iPad:** Verify 44px touch targets and Safari compatibility
- **Build:** Run `npm run type-check` and `npm run test:ci`
- **Security:** Run `npm audit --audit-level high`
- **Cost:** Confirm Azure resources within $18/month budget

### 2. Azure Environment Preparation
- **Resource Group:** Confirm `food-service-crm-rg` exists
- **SQL Database:** Verify connection and backup completion
- **App Service:** Check Node.js 20+ runtime and environment variables
- **Monitoring:** Confirm Application Insights operational
- **SSL:** Ensure HTTPS enforcement active

### 3. Database Migration and Settings
- **Schema:** Confirm Prisma migrations applied to Azure SQL
- **Settings Seed:** Verify 9 categories with default options:
  - PRIORITY (A-Green, B-Yellow, C-Orange, D-Red)
  - SEGMENT (Fine Dining, Fast Food, Healthcare, Catering, Institutional)
  - DISTRIBUTOR (Sysco, USF, PFG, Direct, Other)
  - ACCT_MANAGER, STAGE, POSITION, REASON, SOURCE, INTERACTION, STATUS
- **Integrity:** Verify foreign key relationships and constraints
- **Performance:** Confirm search indexes operational

### 4. Build and Deploy
```bash
# Build process
npm run build  # Next.js standalone output

# Environment variables
AZURE_SQL_DATABASE_URL=<connection_string>
NEXTAUTH_URL=<production_domain>
NEXTAUTH_SECRET=<secure_random_string>
NODE_ENV=production
```
- **GitHub Actions:** Execute CI/CD pipeline to Azure App Service
- **ZIP Deploy:** Direct file upload (no containers)
- **Startup:** Verify Next.js server starts successfully
- **Health Check:** Test `/api/health` endpoint

### 5. Post-deployment Verification
- **Load Test:** Homepage loads <3 seconds on iPad Safari
- **Authentication:** Test email/password login
- **Core Functions:**
  - Organization search <1 second
  - Contact CRUD operations functional
  - Interaction logging <30 seconds
  - Settings management operational
- **Database:** Confirm Azure SQL queries executing
- **Responsive:** Test iPad landscape/portrait orientations

### 6. Critical User Journey Testing
- **Organizations:** Search, create, edit with all required fields
- **Contacts:** Add multiple, designate primary, prevent duplicates
- **Interactions:** Quick entry <30 seconds, auto-complete, auto-save
- **Settings:** Add/modify options, verify real-time updates

### 7. Performance and Cost Monitoring
- **Resources:** Azure SQL <80% DTU, App Service <70% CPU/memory
- **Cost:** Total monthly tracking <$18
- **Performance:** Page loads <3s, API responses <1s
- **Errors:** <1% error rate across endpoints

### 8. Rollback Plan
```bash
# Application rollback
az webapp deployment source show --resource-group food-service-crm-rg --name food-service-crm
az webapp deployment slot swap --resource-group food-service-crm-rg --name food-service-crm --slot staging --target-slot production
```
- **Database:** Restore from 7-day automated backup
- **DNS:** Revert custom domain if applicable
- **Notification:** Alert stakeholders of rollback

### 9. Go-Live Support
- **Week 1:** Daily check-ins for user adoption and issues
- **Baseline:** Establish performance metrics
- **Feedback:** Gather iPad usage experience from sales team
- **Migration:** Assist with Excel data migration and validation
- **Training:** Distribute user guides and documentation
- **Support:** Establish issue reporting process

### 10. Success Validation
- **Adoption:** 4/4 sales team members using daily
- **Performance:** 50% faster data entry, 80% faster reports
- **Uptime:** 99%+ system availability
- **Migration:** Excel system discontinued, no data integrity issues
- **Reports:** Twice-weekly automated generation

## GitHub Actions Configuration

### .github/workflows/azure-deploy.yml
```yaml
name: Deploy Food Service CRM

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js 20
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install and test
      run: |
        npm ci
        npm run type-check
        npm run test:ci
      env:
        AZURE_SQL_DATABASE_URL: ${{ secrets.AZURE_SQL_DATABASE_URL_TEST }}
    
    - name: Build application
      run: npm run build
      env:
        AZURE_SQL_DATABASE_URL: ${{ secrets.AZURE_SQL_DATABASE_URL }}
        NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
        NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v3
      with:
        app-name: 'food-service-crm'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
    
    - name: Health check
      run: |
        sleep 30
        curl -f https://food-service-crm.azurewebsites.net/api/health || exit 1
```

## Safety Checks

### Pre-deployment Checklist
- [ ] Never deploy Fridays/holidays
- [ ] Manual approval for schema changes
- [ ] Azure SQL backup <24 hours old
- [ ] Environment variables verified
- [ ] Cost monitoring alerts active
- [ ] NextCRM components validated

### Emergency Contacts
- **Technical Lead:** Kyle Ramsy (Product Manager/Developer)
- **Azure Support:** Basic plan active
- **User Support:** 4-person sales team direct contact