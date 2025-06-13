# PantryCRM Project Structure

## Overview
PantryCRM follows a **hybrid feature-based and Next.js App Router architecture** optimized for enterprise-level CRM functionality with specialized Excel migration capabilities for the food service industry.

## Project Folder Structure

```
PantryCRM/
├── 📁 app/                           # Next.js 13+ App Router
│   ├── 📁 (auth)/                    # Authentication group
│   │   ├── 📁 sign-in/
│   │   │   ├── 📁 components/
│   │   │   │   └── LoginComponent.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx                # Auth layout wrapper
│   ├── 📁 (routes)/                  # Protected routes group
│   │   ├── 📁 components/            # Route-specific components
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── SideBar.tsx
│   │   ├── 📁 organizations/
│   │   │   ├── 📁 new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── 📁 settings/
│   │   │   └── page.tsx
│   │   ├── layout.tsx                # Protected routes layout
│   │   └── page.tsx                  # Main dashboard
│   ├── 📁 api/                       # API Routes (REST endpoints)
│   │   ├── 📁 auth/
│   │   │   └── 📁 [...nextauth]/
│   │   │       └── route.ts          # NextAuth configuration
│   │   ├── 📁 contacts/
│   │   │   ├── 📁 by-organization/
│   │   │   │   └── 📁 [orgId]/
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   ├── 📁 crm/                   # CRM-specific endpoints
│   │   │   ├── 📁 account/
│   │   │   │   ├── 📁 [accountId]/
│   │   │   │   │   ├── 📁 task/
│   │   │   │   │   │   └── 📁 create/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── 📁 watch/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── 📁 unwatch/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── 📁 contacts/
│   │   │   ├── 📁 leads/
│   │   │   ├── 📁 opportunity/
│   │   │   ├── 📁 tasks/
│   │   │   └── 📁 industries/
│   │   ├── 📁 dashboard/
│   │   │   └── 📁 analytics/
│   │   │       └── route.ts
│   │   ├── 📁 health/                # System monitoring
│   │   │   ├── 📁 b1-performance/
│   │   │   ├── 📁 database/
│   │   │   └── route.ts
│   │   ├── 📁 organizations/
│   │   │   ├── 📁 search/
│   │   │   └── route.ts
│   │   ├── 📁 security/
│   │   │   └── 📁 dashboard/
│   │   │       └── route.ts
│   │   └── 📁 _utils/
│   │       └── legacyRouteHandler.ts
│   ├── favicon.ico
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   ├── layout-bypass.tsx             # Development bypass layout
│   ├── page.tsx                      # Root page (redirects to sign-in)
│   └── 📁 providers/                 # Context providers
│       ├── DeviceProvider.tsx
│       ├── ThemeProvider.tsx
│       └── ToastProvider.tsx
│
├── 📁 actions/                       # Server Actions (RSC)
│   ├── 📁 contacts/
│   │   └── create-contact.ts
│   ├── 📁 crm/                       # CRM business logic
│   │   ├── 📁 account/
│   │   │   ├── get-task.ts
│   │   │   └── get-tasks.ts
│   │   ├── 📁 contracts/
│   │   │   ├── 📁 create-new-contract/
│   │   │   ├── 📁 delete-contract/
│   │   │   └── 📁 update-contract/
│   │   ├── 📁 opportunity/
│   │   │   ├── 📁 dashboard/
│   │   │   └── get-expected-revenue.ts
│   │   ├── 📁 tasks/
│   │   │   └── get-user-tasks.ts
│   │   ├── get-accounts.ts
│   │   ├── get-campaigns.ts
│   │   ├── get-contacts.ts
│   │   ├── get-leads.ts
│   │   ├── get-opportunities.ts
│   │   └── get-crm-data.ts           # Main CRM data aggregator
│   ├── 📁 dashboard/                 # Dashboard metrics
│   │   ├── get-accounts-count.ts
│   │   ├── get-active-users-count.ts
│   │   ├── get-contacts-count.ts
│   │   ├── get-opportunities-count.ts
│   │   └── get-tasks-count.ts
│   ├── 📁 fulltext/
│   │   └── get-search-results.ts
│   ├── 📁 organizations/
│   │   └── create-organization.ts
│   ├── 📁 system/
│   │   └── get-next-version.ts
│   ├── get-user.ts
│   └── get-users.ts
│
├── 📁 components/                    # Shared UI Components
│   ├── 📁 contacts/                  # Contact management
│   │   ├── 📁 __tests__/
│   │   │   └── ContactForm.test.tsx
│   │   ├── ContactForm.tsx
│   │   ├── ContactList.tsx
│   │   └── OrganizationSelect.tsx
│   ├── 📁 food-service/              # Industry-specific components
│   │   ├── DistributorField.tsx
│   │   ├── PriorityBadge.tsx
│   │   └── SegmentSelector.tsx
│   ├── 📁 form/                      # Form utilities
│   │   ├── ResponsiveForm.tsx
│   │   ├── form-datepicker.tsx
│   │   ├── form-input.tsx
│   │   ├── form-submit.tsx
│   │   ├── form-textarea.tsx
│   │   └── from-select.tsx
│   ├── 📁 interactions/              # CRM interactions
│   │   └── QuickInteractionEntry.tsx
│   ├── 📁 layout/                    # Layout components
│   │   ├── FoodServiceNavigation.tsx
│   │   └── ResponsiveLayout.tsx
│   ├── 📁 modals/                    # Modal dialogs
│   │   ├── alert-modal.tsx
│   │   ├── document-view-modal.tsx
│   │   ├── loading-modal.tsx
│   │   ├── password-reset.tsx
│   │   └── upload-file-modal.tsx
│   ├── 📁 nextcrm/                   # NextCRM integration
│   │   ├── AvatarDropdown.tsx
│   │   ├── Feedback.tsx
│   │   ├── FulltextSearch.tsx
│   │   ├── ModuleMenu.tsx
│   │   └── index.ts
│   ├── 📁 organizations/             # Organization management
│   │   ├── 📁 __tests__/
│   │   │   └── OrganizationForm.test.tsx
│   │   ├── OrganizationForm.tsx
│   │   ├── OrganizationList.tsx
│   │   └── OrganizationSearch.tsx
│   ├── 📁 sheets/                    # Sheet/drawer components
│   │   ├── form-sheet.tsx
│   │   └── form-sheet-no-trigger.tsx
│   ├── 📁 tremor/                    # Analytics charts
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── OptimizedAreaChart.tsx
│   │   ├── OptimizedBarChart.tsx
│   │   ├── OptimizedDonutChart.tsx
│   │   └── index.ts
│   ├── 📁 ui/                        # Base UI components (shadcn/ui)
│   │   ├── 📁 __tests__/
│   │   │   └── Button.test.tsx
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── [25+ more UI components]
│   ├── ClientThemeToggle.tsx
│   ├── ErrorBoundary.tsx
│   ├── LoadingComponent.tsx
│   ├── ThemeToggle.tsx
│   └── UserAuthForm.tsx
│
├── 📁 lib/                           # Utility Libraries & Configuration
│   ├── 📁 server/                    # Server-side utilities
│   │   └── uploadthings.ts
│   ├── 📁 validations/               # Schema validations
│   │   ├── lead.ts
│   │   └── organization.ts
│   ├── account-lockout.ts            # Security features
│   ├── api-client.ts                 # API client configuration
│   ├── api-error-handler.ts          # Error handling utilities
│   ├── application-insights.ts       # Azure monitoring
│   ├── auth.ts                       # NextAuth configuration
│   ├── authorization.ts              # Role-based access control
│   ├── azure-*.ts                    # Azure service integrations (8 files)
│   ├── cache*.ts                     # Caching strategies (4 files)
│   ├── create-safe-action.ts         # Server action wrapper
│   ├── csrf-protection.ts            # CSRF security
│   ├── db-optimization.ts            # Database optimizations
│   ├── enhanced-rate-limiter.ts      # Rate limiting
│   ├── env-validation.ts             # Environment validation
│   ├── featureFlags.ts               # Feature flag system
│   ├── food-service-security.ts      # Industry-specific security
│   ├── memory-management.ts          # Memory optimization
│   ├── mobile-optimization.ts        # Mobile performance
│   ├── monitoring.ts                 # System monitoring
│   ├── organizations.ts              # Organization utilities
│   ├── performance-*.ts              # Performance monitoring (3 files)
│   ├── prisma.ts                     # Database connection
│   ├── query-timeout.ts              # Query optimization
│   ├── redis-*.ts                    # Redis integrations (2 files)
│   ├── result-cache.ts               # Result caching
│   ├── security*.ts                  # Security utilities (6 files)
│   ├── sendmail.ts                   # Email service
│   ├── uploadthing.ts                # File upload service
│   ├── utils.ts                      # General utilities
│   └── xml-generator.ts              # XML utilities
│
├── 📁 src/                           # Source code (Alternative structure)
│   ├── 📁 app/                       # Mirror of app/ for some routes
│   │   ├── 📁 (dashboard)/
│   │   │   └── 📁 migration/
│   │   │       └── page.tsx
│   │   ├── 📁 api/                   # Additional API routes
│   │   │   ├── 📁 migration/
│   │   │   │   ├── 📁 progress/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── 📁 contacts/
│   │   │   ├── 📁 interactions/
│   │   │   └── 📁 organizations/
│   │   ├── 📁 contacts/
│   │   │   └── page.tsx
│   │   ├── 📁 dashboard/
│   │   │   └── page.tsx
│   │   ├── 📁 organizations/
│   │   │   └── page.tsx
│   │   ├── 📁 settings/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── 📁 components/                # Additional components
│   │   ├── 📁 auth/
│   │   │   ├── 📁 __tests__/
│   │   │   │   └── LoginComponent.test.tsx
│   │   │   └── LoginComponent.tsx
│   │   ├── 📁 contacts/
│   │   │   ├── ContactForm.tsx
│   │   │   └── ContactList.tsx
│   │   ├── 📁 dashboard/
│   │   │   ├── 📁 __tests__/
│   │   │   │   └── Dashboard.test.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── 📁 excel-migration/       # Excel migration UI
│   │   │   ├── MappingReview.tsx
│   │   │   └── MigrationDashboard.tsx
│   │   ├── 📁 food-service/          # Food service components
│   │   │   ├── 📁 __tests__/
│   │   │   │   ├── DistributorField.test.tsx
│   │   │   │   ├── PriorityBadge.test.tsx
│   │   │   │   └── SegmentSelector.test.tsx
│   │   │   ├── DistributorField.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── SegmentSelector.tsx
│   │   ├── 📁 interactions/
│   │   │   └── QuickInteractionEntry.tsx
│   │   ├── 📁 ui/
│   │   │   ├── PullToRefresh.tsx
│   │   │   ├── SettingsDropdown.tsx
│   │   │   └── SwipeableCard.tsx
│   │   ├── NetworkStatus.tsx
│   │   └── PWAInstaller.tsx
│   ├── 📁 contexts/                  # React contexts
│   │   └── SettingsContext.tsx
│   ├── 📁 hooks/                     # Custom React hooks
│   │   ├── useAutoComplete.ts
│   │   ├── useDragAndDrop.ts
│   │   ├── useNetworkStatus.ts
│   │   ├── useSettings.ts
│   │   └── useSwipeable.ts
│   ├── 📁 lib/                       # Source-specific utilities
│   │   ├── 📁 excel-migration/       # 🎯 EXCEL MIGRATION SYSTEM
│   │   │   ├── 📁 utils/
│   │   │   │   └── string-similarity.ts
│   │   │   ├── 📁 validation/
│   │   │   │   ├── 📁 __tests__/
│   │   │   │   │   └── validation.test.ts
│   │   │   │   ├── data-quality-monitor.ts
│   │   │   │   ├── data-validation-rules.ts
│   │   │   │   └── validation-service.ts
│   │   │   ├── analyze-crm-workbook.ts
│   │   │   ├── analyze-main-sheets.ts
│   │   │   ├── analyze-workbook.ts
│   │   │   ├── confidence-engine.ts
│   │   │   ├── data-transformer.ts
│   │   │   ├── excel-analyzer.ts
│   │   │   ├── field-mapper.ts
│   │   │   ├── field-mapping-config.ts
│   │   │   ├── index.ts              # Main export hub
│   │   │   ├── migration-coordinator.ts    # 5-phase orchestration
│   │   │   ├── migration-executor.ts       # Batch processing engine
│   │   │   ├── migration-executor-v2.ts
│   │   │   ├── migration-orchestrator.ts
│   │   │   ├── rollback-manager.ts         # Rollback capabilities
│   │   │   ├── run-comprehensive-analysis.ts
│   │   │   ├── simple-analyzer.ts
│   │   │   ├── test-analyzer.ts
│   │   │   ├── test-migration.ts
│   │   │   ├── validation-engine.ts
│   │   │   └── migration-example.ts
│   │   ├── offline-storage.ts
│   │   ├── settings.ts
│   │   └── 📁 validations/
│   │       └── contact.ts
│   ├── 📁 types/                     # TypeScript type definitions
│   │   ├── contact.ts
│   │   └── interaction.ts
│   ├── 📁 utils/                     # Source utilities
│   │   ├── debounce.ts
│   │   ├── performanceMonitor.ts
│   │   └── touchTargetValidator.ts
│   └── 📁 __tests__/                 # Source tests
│       ├── NextCRMIntegration.test.tsx
│       └── TouchTargetCompliance.test.tsx
│
├── 📁 prisma/                        # Database Management
│   ├── 📁 initial-data/              # Seed data
│   │   ├── crm_Industry_Type.json
│   │   ├── crm_Opportunities_Sales_Stages.json
│   │   ├── crm_Opportunities_Type.json
│   │   ├── crm_campaigns.json
│   │   ├── gpt_Models.json
│   │   └── system_Modules_Enabled.json
│   ├── 📁 migrations/                # Database migrations
│   │   ├── 📁 20250604015002_init_migration/
│   │   │   └── migration.sql
│   │   ├── 📁 20250605111128_add_password_to_user_model/
│   │   │   └── migration.sql
│   │   ├── 📁 20250607020144_update_contact_add_position_relation/
│   │   │   └── migration.sql
│   │   ├── add_data_integrity_constraints.sql
│   │   └── migration_lock.toml
│   ├── 📁 seed/                      # Additional seed data
│   │   └── food-service-settings.ts
│   ├── 📁 seeds/                     # Seed scripts
│   │   └── seed.ts
│   ├── schema.prisma                 # Database schema definition
│   ├── seed.js                       # Main seed script
│   ├── seed.ts                       # TypeScript seed script
│   └── seed-positions.ts             # Position seeding
│
├── 📁 excel/                         # 🎯 EXCEL DATA SOURCE
│   ├── CRM-WORKBOOK.xlsx             # Source Excel file for migration
│   ├── crm-workbook-analysis.json    # Analysis results
│   └── simple-analysis.json          # Simplified analysis
│
├── 📁 scripts/                       # Automation Scripts
│   ├── add-auth-to-api.js            # API security enhancement
│   ├── analyze-bundle.js             # Bundle analysis
│   ├── automated-backup.sh           # Backup automation
│   ├── azure-monitor-setup.sh        # Azure monitoring setup
│   ├── migrate-excel.ts              # 🎯 EXCEL MIGRATION CLI
│   ├── optimize-database-indexes.sql # Database optimization
│   ├── security-maintenance.ts       # Security maintenance
│   ├── setup-azure-integrations.ts   # Azure setup
│   ├── simple-bundle-analyzer.js     # Simple bundle analysis
│   ├── test-performance.ps1          # Performance testing
│   └── README.md                     # Scripts documentation
│
├── 📁 tests/                         # Testing Framework
│   ├── 📁 e2e/                       # End-to-end tests
│   │   ├── 📁 fixtures/
│   │   │   └── food-service-data.ts
│   │   ├── critical-user-journeys.spec.ts
│   │   ├── cross-browser-compatibility.spec.ts
│   │   ├── food-service-workflows.spec.ts
│   │   ├── mobile-responsiveness.spec.ts
│   │   └── test-helper.ts
│   └── 📁 performance/               # Performance tests
│       ├── load-testing-4-users.yml
│       ├── memory-usage-test.js
│       ├── report-generation-test.yml
│       ├── run-all-performance-tests.js
│       └── search-performance-test.yml
│
├── 📁 __tests__/                     # Unit Tests
│   ├── 📁 api/
│   │   ├── auth.test.ts
│   │   ├── interactions.test.ts
│   │   └── organizations.test.ts
│   ├── 📁 components/
│   │   └── ErrorBoundary.test.tsx
│   └── 📁 lib/
│       └── security.test.ts
│
├── 📁 hooks/                         # Custom React Hooks
│   ├── use-action.ts
│   ├── useChartOptimization.ts
│   ├── useDebounce.ts
│   ├── useDebounce.tsx
│   └── useDeviceDetection.ts
│
├── 📁 store/                         # State Management (Zustand)
│   ├── 📁 slices/
│   │   └── createIsOpenSlice.ts
│   ├── store.ts
│   ├── use-alert-modal.ts
│   └── useAvatarStore.ts
│
├── 📁 types/                         # Global Type Definitions
│   ├── api.ts
│   ├── next-auth.d.ts
│   └── types.d.ts
│
├── 📁 utils/                         # Global Utilities
│   └── chartDataProcessor.ts
│
├── 📁 styles/                        # Styling
│   ├── ipad-optimization.css
│   └── responsive.css
│
├── 📁 emails/                        # Email Templates
│   ├── InviteUser.tsx
│   └── PasswordReset.tsx
│
├── 📁 public/                        # Static Assets
│   ├── 📁 images/
│   │   ├── nouser.png
│   │   └── opengraph-image.png
│   ├── 📁 tmp/                       # Temporary files
│   ├── favicon.ico
│   ├── manifest.json                 # PWA manifest
│   ├── offline.html                  # PWA offline page
│   ├── sw.js                         # Service worker
│   └── vercel.svg
│
├── 📁 infrastructure/                # Infrastructure as Code
│   ├── deploy.sh
│   └── main.bicep                    # Azure Bicep templates
│
├── 📁 deploy/                        # Deployment Scripts
│   └── startup.sh
│
├── 📁 docs/                          # Documentation
│   ├── ci-cd-documentation.md
│   ├── database-optimization-summary.md
│   └── migration-plan.md
│
├── 📁 Docs/                          # Additional Documentation
│   ├── 📁 Diagrams/
│   │   ├── architecture.md
│   │   ├── erd.md
│   │   ├── implementation_guide.md
│   │   ├── roadmap.md
│   │   └── user_flows.md
│   ├── AZURE_SQL_CONFIGURATION.md
│   ├── BUNDLE_OPTIMIZATION.md
│   ├── DEBUGGING_CHECKLIST.md
│   ├── Implementation-Plan.md
│   ├── NEXTCRM_COMPONENTS.md
│   ├── UPDATES.md
│   └── crm_architecture_diagram.svg
│
├── 📁 __mocks__/                     # Jest mocks
│   ├── fileMock.js
│   └── recharts.js
│
├── 📁 node_modules/                  # Dependencies (auto-generated)
├── 📁 .next/                         # Next.js build output (auto-generated)
│
└── 📋 Configuration Files
    ├── .gitignore                    # Git ignore rules
    ├── components.json               # shadcn/ui config
    ├── cypress.config.ts             # E2E testing config
    ├── jest.config.js                # Unit testing config
    ├── jest.setup.js                 # Jest setup
    ├── jest.setup.tsx                # Jest React setup
    ├── lighthouserc.js               # Performance testing
    ├── middleware.ts                 # 🔒 Next.js middleware (Security layer)
    ├── next.config.azure.js          # Azure-specific config
    ├── next.config.ts                # Next.js configuration
    ├── next.intl.config.js           # Internationalization
    ├── package.json                  # Dependencies & scripts
    ├── package-lock.json             # Dependency lock file
    ├── playwright.config.ts          # Playwright E2E config
    ├── postcss.config.js             # PostCSS configuration
    ├── tailwind.config.js            # TailwindCSS configuration
    ├── tsconfig.json                 # TypeScript configuration
    ├── tsconfig.tsbuildinfo           # TypeScript build cache
    ├── web.config                    # IIS configuration
    ├── server.js                     # Custom server
    ├── setup-demo.sh                 # Demo setup script
    ├── deploy.cmd                    # Windows deployment
    ├── Dockerfile                    # Container configuration
    ├── LICENSE                       # License file
    ├── README.md                     # Project documentation
    └── [Multiple README files]       # Feature-specific documentation
```

## 🎯 Key Architecture Highlights

### **Excel Migration System** (`/src/lib/excel-migration/`)
The heart of PantryCRM's specialized functionality:
- **5-phase migration process** with rollback capabilities
- **Batch processing engine** optimized for Azure B1
- **Real-time progress tracking** via Server-Sent Events
- **Enterprise-level validation** and error handling

### **Security-First Design** (`/lib/security*.ts`, `/middleware.ts`)
- **Multi-layer security** with CVE protection
- **Rate limiting** and CSRF protection
- **Azure KeyVault integration**
- **Comprehensive audit logging**

### **Azure-Optimized Performance** (`/lib/azure-*.ts`)
- **DTU-aware database connections**
- **Memory management** for 4GB limits
- **Application Insights integration**
- **Auto-scaling management**

### **Food Service Industry Focus**
- **Specialized components** (`/components/food-service/`)
- **Industry-specific validations** (`/lib/food-service-security.ts`)
- **Priority-based account management**
- **Distributor and segment tracking**

## 📚 Architecture Patterns

### **1. Feature-Based Organization**
- **CRM functionality**: Grouped in `/actions/crm/` and `/app/api/crm/`
- **Excel migration**: Centralized in `/src/lib/excel-migration/`
- **Organizations**: Distributed across actions, components, and API routes

### **2. Separation of Concerns**
- **Business Logic**: `/actions/` (Server Actions)
- **API Layer**: `/app/api/` (REST endpoints)
- **UI Components**: `/components/` (React components)
- **Data Layer**: `/lib/prisma.ts` and `/prisma/`

### **3. Security Layers**
- **Middleware**: Request-level security (`middleware.ts`)
- **Authentication**: Route-level protection (`/lib/auth.ts`)
- **Authorization**: Action-level controls (`/lib/authorization.ts`)
- **Input Validation**: Data-level sanitization (`/lib/validations/`)

### **4. Performance Optimization**
- **Caching**: Multiple strategies (`/lib/cache*.ts`)
- **Database**: Query optimization (`/lib/db-optimization.ts`)
- **Monitoring**: Real-time metrics (`/lib/monitoring.ts`)
- **Memory**: Resource management (`/lib/memory-management.ts`)

## 🔧 Development Workflow

### **Primary Development Paths**
1. **CRM Features**: `/actions/crm/` → `/app/api/crm/` → `/components/`
2. **Excel Migration**: `/src/lib/excel-migration/` → `/scripts/migrate-excel.ts`
3. **Organizations**: `/actions/organizations/` → `/app/api/organizations/` → `/components/organizations/`
4. **Authentication**: `/lib/auth.ts` → `/app/(auth)/` → `/components/`

### **Testing Strategy**
- **Unit Tests**: `/__tests__/`, `/src/components/**/__tests__/`
- **Integration Tests**: `/tests/e2e/`
- **Performance Tests**: `/tests/performance/`
- **Security Tests**: Via npm audit and custom scripts

### **Build & Deployment**
- **Development**: `npm run dev`
- **Production Build**: `npm run build:azure`
- **Testing**: `npm run test:e2e`
- **Migration**: `npm run migrate:excel`

## 📖 Navigation Guide

### **New Feature Development**
1. **Start with**: `/actions/` for business logic
2. **Add API route**: `/app/api/` for external access
3. **Create components**: `/components/` for UI
4. **Add validation**: `/lib/validations/` for data integrity
5. **Write tests**: `/__tests__/` for quality assurance

### **Excel Migration Development**
1. **Core logic**: `/src/lib/excel-migration/`
2. **CLI interface**: `/scripts/migrate-excel.ts`
3. **API endpoints**: `/src/app/api/migration/`
4. **UI components**: `/src/components/excel-migration/`
5. **Test data**: `/excel/CRM-WORKBOOK.xlsx`

### **Security Enhancement**
1. **Middleware**: `/middleware.ts` for request filtering
2. **Authentication**: `/lib/auth.ts` for user verification
3. **Authorization**: `/lib/authorization.ts` for permission checks
4. **Input validation**: `/lib/validations/` for data sanitization
5. **Monitoring**: `/lib/security-monitoring.ts` for threat detection

This structure reflects a **mature, enterprise-ready application** with specialized focus on **food service industry CRM** and **Excel data migration capabilities**.