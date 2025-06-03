---
description: Set up NextCRM foundation with Azure infrastructure for Food Service CRM project. Establishes development environment, database schema, and iPad-optimized UI framework within $18/month budget.
---

# Food Service CRM - Foundation Setup

## Description
Set up NextCRM foundation with Azure infrastructure for Food Service CRM project. Establishes development environment, database schema, and iPad-optimized UI framework within $18/month budget.

---

## Steps

### 1. Clone NextCRM Repository
```bash
git clone https://github.com/pdovhomilja/nextcrm-app.git food-service-crm
cd food-service-crm
npm install
```

### 2. Configure Azure SQL Database
```bash
# Create Azure Resource Group
az group create --name crm-resources --location eastus

# Create Azure SQL Database Basic ($5/month)
az sql server create --name [server-name] --resource-group crm-resources --location eastus --admin-user [username] --admin-password [password]
az sql db create --resource-group crm-resources --server [server-name] --name food-service-crm --service-objective Basic
```

### 3. Update Prisma Schema for Food Service
Replace `prisma/schema.prisma` provider:
```prisma
datasource db {
  provider = "sqlserver"
  url      = env("AZURE_SQL_DATABASE_URL")
}
```

### 4. Create Food Service Database Schema
```bash
# Generate and run migrations
npx prisma migrate dev --name init-food-service-schema
npx prisma generate
```

### 5. Configure Azure App Service
```bash
# Create App Service Basic B1 ($13/month)
az appservice plan create --name crm-plan --resource-group crm-resources --sku B1
az webapp create --resource-group crm-resources --plan crm-plan --name [app-name] --runtime "NODE:20-lts"
```

### 6. Setup Environment Variables
Create `.env.local`:
```env
AZURE_SQL_DATABASE_URL="sqlserver://[server].database.windows.net:1433;database=food-service-crm;user=[username];password=[password];encrypt=true"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generate-secret]"
```

### 7. Configure iPad-Optimized UI
Update `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      minHeight: {
        '44': '44px' // iPad touch targets
      },
      colors: {
        priority: {
          a: '#10B981', // Green
          b: '#F59E0B', // Yellow
          c: '#F97316', // Orange
          d: '#EF4444'  // Red
        }
      }
    }
  }
}
```

### 8. Seed Initial Settings Data
```bash
# Run database seeder
npx prisma db seed
```

### 9. Test Development Environment
```bash
# Start development server
npm run dev

# Verify iPad Safari compatibility
# Test on actual iPad device at localhost:3000
```

### 10. Verify Azure Cost Compliance
```bash
# Check current Azure costs
az consumption usage list --billing-period [current-period]
# Confirm total: Azure SQL Basic ($5) + App Service B1 ($13) = $18/month
```

### 11. Setup GitHub Actions for Azure Deployment
Create `.github/workflows/azure-deploy.yml`:
```yaml
name: Deploy to Azure
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm ci && npm run build
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: [app-name]
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

### 12. Document Foundation Completion
Create foundation checklist:
- [ ] NextCRM repository cloned and configured
- [ ] Azure SQL Database operational with food service schema
- [ ] Azure App Service configured for Next.js deployment
- [ ] iPad-optimized UI framework implemented (44px touch targets)
- [ ] Development environment supports TypeScript strict mode
- [ ] Total monthly cost confirmed at $18 ($5 SQL + $13 App Service)

---

## Success Criteria
- Working NextCRM development environment
- Azure infrastructure operational within budget
- Food service database schema deployed
- iPad Safari compatibility verified
- Ready for Phase 2: Core CRM development