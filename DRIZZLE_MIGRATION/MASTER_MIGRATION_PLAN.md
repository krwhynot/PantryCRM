# Kitchen Pantry CRM: Complete PostgreSQL + Drizzle ORM Migration
## Master Migration Plan with Component-Level TODOs

> **Migration Overview**: Complete migration from Azure SQL Database + Prisma ORM to PostgreSQL + Drizzle ORM  
> **Budget Constraint**: Must maintain $18/month Azure hosting budget  
> **Current Status**: ✅ React 19 + PostgreSQL + Drizzle ORM OPERATIONAL  
> **Previous Blockers**: ✅ RESOLVED - Tremor React 19 incompatibility, chart library migration complete
> **Component Coverage**: ✅ Core infrastructure migrated, API routes converted, data migration complete

## 🎉 **MIGRATION STATUS: INFRASTRUCTURE COMPLETE** ✅

**Date**: June 16, 2025  
**Phase Completed**: Phases 1-5 (Infrastructure, Schema, Data Migration, API Routes)  
**Status**: Production-ready with PostgreSQL + Drizzle ORM operational

### ✅ **COMPLETED INFRASTRUCTURE**
- **PostgreSQL**: Azure Flexible Server B1 deployed and optimized
- **Drizzle ORM**: Complete schema with 11 tables, 80+ indexes
- **Data Migration**: SQLite → PostgreSQL successful (2 orgs, 2 contacts, 28 settings)
- **API Routes**: Core endpoints converted (organizations, contacts, interactions, leads)
- **Chart Library**: @tremor/react@^3.18.7 installed and operational
- **Type Safety**: Full TypeScript integration with schema validation

---

## PHASE 1: COMPREHENSIVE COMPONENT INVENTORY & ASSESSMENT
**Duration**: 2-3 days  
**Priority**: CRITICAL - Foundation for entire migration

### 1.1 Database Components Assessment
- [ ] **Review current Prisma schema.prisma**
  - [ ] Document all 8+ models: Account, Session, User, VerificationToken, Organization, Contact, Interaction, Opportunity, Lead, Contract, Campaign, Task
  - [ ] Export current schema: `npx prisma db pull && npx prisma generate`
  - [ ] Backup schema: `cp prisma/schema.prisma prisma/schema.prisma.backup.$(date +%Y%m%d)`
  - [ ] Analyze 47 indexes and performance characteristics
  - [ ] Document foreign key relationships and cascade behaviors

- [ ] **Review lib/prisma.ts database connection**
  - [ ] Document current connection pooling configuration
  - [ ] Review SSL and security settings
  - [ ] Note performance optimizations for Azure SQL Basic tier

### 1.2 API Routes Component Review
- [ ] **app/api/ - Main API directory**
  - [ ] **app/api/organizations/route.ts** - Organization CRUD operations
  - [ ] **app/api/organizations/search/route.ts** - Organization search functionality
  - [ ] **app/api/contacts/route.ts** - Contact management
  - [ ] **app/api/contacts/by-organization/[orgId]/route.ts** - Organization-specific contacts
  - [ ] **app/api/interactions/route.ts** - Interaction tracking (30-second entry target)
  - [ ] **app/api/settings/route.ts** - Dynamic configuration management

- [ ] **app/api/crm/ - CRM-specific APIs**
  - [ ] **app/api/crm/account/[accountId]/route.ts** - Account management
  - [ ] **app/api/crm/account/route.ts** - Account operations
  - [ ] **app/api/crm/contacts/[contactId]/route.ts** - Contact details
  - [ ] **app/api/crm/contacts/route.ts** - Contact operations
  - [ ] **app/api/crm/leads/[leadId]/route.ts** - Lead management
  - [ ] **app/api/crm/leads/route.ts** - Lead operations
  - [ ] **app/api/crm/opportunity/[opportunityId]/route.ts** - Opportunity details
  - [ ] **app/api/crm/opportunity/route.ts** - Opportunity management
  - [ ] **app/api/crm/tasks/route.ts** - Task management system
  - [ ] **app/api/crm/organizations-optimized/route.ts** - Optimized organization queries

### 1.3 shadcn/ui Component Library Assessment (50+ Components)

#### 1.3.1 Core shadcn/ui Foundation Components
- [ ] **components/ui/ - Complete shadcn/ui component library (50+ components)**
  
  **Form and Input Components (React 19 compatible)**
  - [ ] **components/ui/input.tsx** - Text input fields with validation support
  - [ ] **components/ui/textarea.tsx** - Multi-line text input areas
  - [ ] **components/ui/select.tsx** - Dropdown selection menus with search
  - [ ] **components/ui/checkbox.tsx** - Boolean selection controls
  - [ ] **components/ui/radio-group.tsx** - Single selection from multiple options
  - [ ] **components/ui/switch.tsx** - Toggle controls for binary states
  - [ ] **components/ui/button.tsx** - Interactive action triggers with multiple variants
  - [ ] **components/ui/label.tsx** - Accessible form field labels
  - [ ] **components/ui/form.tsx** - Comprehensive form wrapper components
  
  **Layout and Navigation Components**
  - [ ] **components/ui/card.tsx** - Content containers with consistent styling
  - [ ] **components/ui/sheet.tsx** - Slide-out panels for additional content
  - [ ] **components/ui/dialog.tsx** - Modal windows for focused interactions
  - [ ] **components/ui/drawer.tsx** - Mobile-optimized slide-up panels
  - [ ] **components/ui/tabs.tsx** - Organized content sections
  - [ ] **components/ui/accordion.tsx** - Collapsible content sections
  - [ ] **components/ui/breadcrumb.tsx** - Navigation hierarchy indicators
  - [ ] **components/ui/navigation-menu.tsx** - Primary navigation structure
  - [ ] **components/ui/sidebar.tsx** - Persistent navigation panel with drag-to-resize
  
  **Data Display Components**
  - [ ] **components/ui/table.tsx** - Structured data presentation with sorting/filtering
  - [ ] **components/ui/badge.tsx** - Status and category indicators
  - [ ] **components/ui/avatar.tsx** - User profile images and placeholders
  - [ ] **components/ui/progress.tsx** - Task completion and loading indicators
  - [ ] **components/ui/skeleton.tsx** - Loading state placeholders
  - [ ] **components/ui/alert.tsx** - Important message notifications
  - [ ] **components/ui/toast.tsx** - Temporary notification messages
  
  **Interactive Components**
  - [ ] **components/ui/dropdown-menu.tsx** - Contextual action menus
  - [ ] **components/ui/popover.tsx** - Floating content containers
  - [ ] **components/ui/tooltip.tsx** - Hover information displays
  - [ ] **components/ui/command.tsx** - Keyboard-driven command palette
  - [ ] **components/ui/combobox.tsx** - Searchable selection inputs
  - [ ] **components/ui/calendar.tsx** - Calendar-based date selection
  - [ ] **components/ui/date-picker.tsx** - Date selection with calendar integration
  - [ ] **components/ui/pagination.tsx** - Content navigation controls
  
  **Utility Components**
  - [ ] **components/ui/separator.tsx** - Visual separator component
  - [ ] **components/ui/scroll-area.tsx** - Scrollable area component
  - [ ] **components/ui/hover-card.tsx** - Hover card component
  - [ ] **components/ui/resizable.tsx** - Resizable panels component
  - [ ] **components/ui/context-menu.tsx** - Right-click context menus
  - [ ] **components/ui/menubar.tsx** - Application menu bar
  - [ ] **components/ui/collapsible.tsx** - Expandable content sections
  
#### 1.3.2 Extended shadcn/ui Components (awesome-shadcn-ui)
- [ ] **Enhanced Data Components**
  - [ ] **components/ui/data-table.tsx** - Advanced sorting, filtering, and pagination
  - [ ] **components/ui/auto-form.tsx** - Automatic form generation from Zod schemas
  - [ ] **components/ui/date-range-picker.tsx** - Multi-month date selection with presets
  - [ ] **components/ui/multi-select.tsx** - Enhanced selection with search and validation
  - [ ] **components/ui/file-uploader.tsx** - Comprehensive file handling with cloud storage
  
- [ ] **Business Intelligence Components**
  - [ ] **components/ui/calendar-heatmap.tsx** - Activity visualization for customer engagement
  - [ ] **components/ui/timeline.tsx** - Event sequence display for customer interaction history
  - [ ] **components/ui/kanban-board.tsx** - Task management with drag-and-drop functionality
  - [ ] **components/ui/chat-interface.tsx** - Customer communication integration
  - [ ] **components/ui/notification-center.tsx** - Centralized alert management

### 1.4 Food Service Industry Specialized Components
- [ ] **components/food-service/ - Industry-specific CRM components**
  - [ ] **components/food-service/DistributorField.tsx** - Supplier relationship management inputs
  - [ ] **components/food-service/PriorityBadge.tsx** - Customer priority level indicators (A-D)
  - [ ] **components/food-service/SegmentSelector.tsx** - Market segment classification controls
  - [ ] **components/food-service/DeliveryScheduleInput.tsx** - Recurring delivery time management
  - [ ] **components/food-service/DietaryPreferenceSelector.tsx** - Customer dietary requirement tracking
  - [ ] **components/food-service/core/FoodServiceLayout.tsx** - Layout wrapper
  - [ ] **components/food-service/core/OrganizationCard.tsx** - Organization display card
  - [ ] **components/food-service/core/ResponsiveDataTable.tsx** - Data table component
  - [ ] **components/food-service/dashboard/FoodServiceDashboard.tsx** - Main dashboard
  - [ ] **components/food-service/forms/QuickInteractionForm.tsx** - Quick interaction entry (30-second target)

### 1.5 Data Visualization Components (CRITICAL - React 19 Migration Required)

#### 1.5.1 Tremor Charts - REMOVE (React 19 Incompatible)
- [ ] **components/tremor/ - DEPRECATED: Remove all Tremor chart components**
  - [ ] **DELETE components/tremor/AreaChart.tsx** - Trend visualization for revenue patterns
  - [ ] **DELETE components/tremor/BarChart.tsx** - Comparative analysis for sales performance
  - [ ] **DELETE components/tremor/LineChart.tsx** - Time-series data for lead conversion rates
  - [ ] **DELETE components/tremor/DonutChart.tsx** - Proportional data for market segments
  - [ ] **DELETE components/tremor/ScatterChart.tsx** - Correlation analysis for customer behavior
  - [ ] **DELETE components/tremor/OptimizedAreaChart.tsx** - Optimized area chart
  - [ ] **DELETE components/tremor/OptimizedBarChart.tsx** - Optimized bar chart
  - [ ] **DELETE components/tremor/OptimizedDonutChart.tsx** - Optimized donut chart
  - [ ] **DELETE components/tremor/index.ts** - Tremor exports
  - [ ] **DELETE components/charts/optimized/TremorBarChart.tsx** - Bar chart wrapper
  - [ ] **DELETE components/charts/optimized/TremorDonutChart.tsx** - Donut chart wrapper
  - [ ] **DELETE components/charts/optimized/TremorLineChart.tsx** - Line chart wrapper

#### 1.5.2 TanStack React Charts - CREATE (React 19 Compatible)
- [ ] **components/charts/ - NEW: TanStack React Charts implementation**
  - [ ] **components/charts/base-chart-config.ts** - Base configuration for all charts
  - [ ] **components/charts/TanStackAreaChart.tsx** - Revenue trend visualization
  - [ ] **components/charts/TanStackBarChart.tsx** - Sales performance comparison
  - [ ] **components/charts/TanStackLineChart.tsx** - Lead conversion time-series
  - [ ] **components/charts/TanStackDonutChart.tsx** - Market segment proportions
  - [ ] **components/charts/TanStackScatterChart.tsx** - Customer behavior correlation
  - [ ] **components/charts/DashboardRevenueChart.tsx** - Revenue dashboard component
  - [ ] **components/charts/InteractionDistributionChart.tsx** - Interaction analytics
  - [ ] **components/charts/OrganizationGrowthChart.tsx** - Growth metrics visualization
  - [ ] **components/charts/KPICard.tsx** - Key performance indicators with trends
  - [ ] **components/charts/SSRChartWrapper.tsx** - Server-side rendering wrapper
  - [ ] **components/charts/fallback/FallbackChart.tsx** - Error fallback component

#### 1.5.3 Dashboard Elements
- [ ] **components/dashboard/ - Business intelligence dashboard components**
  - [ ] **components/dashboard/MetricCard.tsx** - KPI metrics with trend comparisons
  - [ ] **components/dashboard/ProgressBar.tsx** - Goal achievement visualization
  - [ ] **components/dashboard/DeltaIndicator.tsx** - Change metrics with directional arrows
  - [ ] **components/dashboard/GridLayout.tsx** - Responsive chart arrangements
  - [ ] **components/dashboard/RealTimeUpdater.tsx** - WebSocket integration for live data

### 1.6 CRM Application Components
- [ ] **components/organizations/ - Organization management**
  - [ ] **components/organizations/EnhancedOrganizationCard.tsx** - Enhanced org card
  - [ ] **components/organizations/FavoriteOrganizations.tsx** - Favorites system
  - [ ] **components/organizations/OrganizationForm.tsx** - Organization form
  - [ ] **components/organizations/OrganizationList.tsx** - Organization listing
  - [ ] **components/organizations/OrganizationSearch.tsx** - Organization search

- [ ] **components/contacts/ - Contact management**
  - [ ] **components/contacts/ContactForm.tsx** - Contact creation/editing form
  - [ ] **components/contacts/ContactList.tsx** - Contact listing component
  - [ ] **components/contacts/OrganizationSelect.tsx** - Organization picker

- [ ] **components/interactions/ - Interaction tracking**
  - [ ] **components/interactions/QuickInteractionEntry.tsx** - 30-second entry form

### 1.7 NextCRM Integration Components (React 19 Server Components)
- [ ] **components/nextcrm/ - NextCRM foundation with React 19 Server Components**
  - [ ] **components/nextcrm/AvatarDropdown.tsx** - User avatar dropdown (CLIENT)
  - [ ] **components/nextcrm/Feedback.tsx** - Feedback system (CLIENT)
  - [ ] **components/nextcrm/FulltextSearch.tsx** - Global search component (SERVER/CLIENT hybrid)
  - [ ] **components/nextcrm/ModuleMenu.tsx** - Module navigation (SERVER)
  - [ ] **components/nextcrm/index.ts** - NextCRM exports
  - [ ] **components/nextcrm/test-imports.tsx** - Test component imports
  
#### 1.7.1 Authentication Components (NextAuth.js Integration)
- [ ] **components/auth/ - Multi-provider authentication system**
  - [ ] **components/auth/SignInForm.tsx** - Multi-provider authentication interface
  - [ ] **components/auth/UserProfile.tsx** - Account management and settings
  - [ ] **components/auth/RoleIndicator.tsx** - Permission level display
  - [ ] **components/auth/SessionStatus.tsx** - Authentication state management
  - [ ] **components/auth/SecuritySettings.tsx** - Password and two-factor authentication controls

#### 1.7.2 Mobile PWA Components
- [ ] **components/pwa/ - Progressive Web App features**
  - [ ] **components/pwa/InstallPrompt.tsx** - PWA installation guidance
  - [ ] **components/pwa/OfflineIndicator.tsx** - Network status display
  - [ ] **components/pwa/SyncStatus.tsx** - Data synchronization progress
  - [ ] **components/pwa/TouchGestures.tsx** - Swipe actions for task management
  - [ ] **components/pwa/PushNotifications.tsx** - Real-time alert system

### 1.8 Excel Migration System Components (5-Phase Engine)
- [ ] **src/components/excel-migration/ - Comprehensive Excel import system**
  - [ ] **src/components/excel-migration/FileUploadZone.tsx** - Drag-and-drop Excel file interface with progress tracking
  - [ ] **src/components/excel-migration/MappingConfiguration.tsx** - Field relationship setup with confidence scoring
  - [ ] **src/components/excel-migration/MigrationProgress.tsx** - Real-time status display for all five phases
  - [ ] **src/components/excel-migration/ValidationResults.tsx** - Error reporting and data quality metrics
  - [ ] **src/components/excel-migration/RollbackControls.tsx** - Migration reversal and recovery options
  - [ ] **src/components/excel-migration/MappingReview.tsx** - Field mapping review and validation
  - [ ] **src/components/excel-migration/MigrationDashboard.tsx** - Migration progress dashboard with phase tracking

### 1.9 Layout and Navigation Components
- [ ] **components/layout/ - Layout components**
  - [ ] **components/layout/FoodServiceNavigation.tsx** - Industry navigation
  - [ ] **components/layout/ResponsiveLayout.tsx** - Responsive layout wrapper

- [ ] **app/(routes)/components/ - Route-level components**
  - [ ] **app/(routes)/components/Footer.tsx** - Application footer
  - [ ] **app/(routes)/components/Header.tsx** - Application header
  - [ ] **app/(routes)/components/SideBar.tsx** - Main sidebar navigation

### 1.10 React 19 Server Components & Actions Integration

#### 1.10.1 Server Actions (Drizzle ORM Integration)
- [ ] **actions/ - Server actions requiring Drizzle migration**
  - [ ] **actions/organizations/create-organization.ts** - Organization creation with type safety
  - [ ] **actions/contacts/create-contact.ts** - Contact creation with validation
  - [ ] **actions/crm/ - CRM-specific actions (20+ files)**
    - [ ] **actions/crm/get-accounts.ts** - Account retrieval with Drizzle queries
    - [ ] **actions/crm/get-contacts.ts** - Contact retrieval with joins
    - [ ] **actions/crm/get-leads.ts** - Lead management with analytics
    - [ ] **actions/crm/get-opportunities.ts** - Opportunity management with pipeline data
    - [ ] **actions/crm/tasks/ - Task management actions with real-time updates**

#### 1.10.2 React 19 Server Components Architecture
- [ ] **Server Components (async data fetching)**
  - [ ] **app/(dashboard)/page.tsx** - Dashboard with server-side data loading
  - [ ] **app/organizations/page.tsx** - Organization list with server-side filtering
  - [ ] **app/contacts/page.tsx** - Contact management with async data
  - [ ] **components/server/DataTable.tsx** - Server-rendered data tables
  - [ ] **components/server/ChartData.tsx** - Server-side chart data preparation
  
- [ ] **Client Components (interactivity)**
  - [ ] **"use client" directive implementation for interactive components**
  - [ ] **Form submissions through Server Actions**
  - [ ] **Real-time dashboard updates via streaming UI**
  - [ ] **Progressive enhancement with Suspense boundaries**
  - [ ] **Touch-optimized mobile interactions**

#### 1.10.3 Type Safety Integration
- [ ] **TypeScript integration with Drizzle ORM**
  - [ ] **TypeScript interfaces generated from Drizzle schema definitions**
  - [ ] **Runtime validation using Zod schemas**
  - [ ] **Automated form generation with react-hook-form integration**
  - [ ] **Server Action compatibility for data mutations**
  - [ ] **Compile-time SQL validation with Drizzle**

---

## PHASE 2: POSTGRESQL SETUP & AZURE CONFIGURATION
**Duration**: 1-2 days  
**Priority**: HIGH - Infrastructure foundation

### 2.1 Azure Database for PostgreSQL Flexible Server Setup
- [ ] **Create PostgreSQL Flexible Server instance**
  ```bash
  # Set environment variables
  export RESOURCE_GROUP="kitchen-pantry-crm-rg"
  export PG_SERVER_NAME="kitchenpantrycrm-pg-server"
  export LOCATION="centralus"
  export PG_ADMIN_USER="pgadmin"
  export PG_ADMIN_PASSWORD="$(openssl rand -base64 32)"
  
  # Create PostgreSQL Flexible Server
  az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $PG_SERVER_NAME \
    --location $LOCATION \
    --admin-user $PG_ADMIN_USER \
    --admin-password $PG_ADMIN_PASSWORD \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --storage-auto-grow Enabled \
    --version 15 \
    --public-access 0.0.0.0 \
    --tags project=kitchen-pantry-crm environment=production
  ```

- [ ] **Configure security and networking**
  ```bash
  # Configure firewall for App Service
  az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $PG_SERVER_NAME \
    --rule-name "AppServiceAccess" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 255.255.255.255
  
  # Enable SSL enforcement
  az postgres flexible-server parameter set \
    --resource-group $RESOURCE_GROUP \
    --server-name $PG_SERVER_NAME \
    --name require_secure_transport \
    --value on
  ```

- [ ] **Budget Analysis & Cost Optimization**
  ```bash
  # Check current pricing for Central US region
  az postgres flexible-server list-skus --location "Central US"
  # Target: Burstable, B1ms (1 vCore, 2GB RAM) ≈ $12-15/month
  # Storage: 32GB base (can auto-grow) ≈ $3-4/month
  # Total PostgreSQL: ~$15-19/month (need to fit in $18 total budget)
  ```

### 2.2 Database Creation & Initial Configuration
- [ ] **Create kitchen_pantry_crm database**
  ```bash
  # Connect to PostgreSQL and create database
  psql "host=${PG_SERVER_NAME}.postgres.database.azure.com port=5432 dbname=postgres user=${PG_ADMIN_USER} password=${PG_ADMIN_PASSWORD} sslmode=require"
  
  # In psql:
  CREATE DATABASE kitchen_pantry_crm;
  CREATE USER crm_app_user WITH PASSWORD 'secure_app_password_here';
  GRANT ALL PRIVILEGES ON DATABASE kitchen_pantry_crm TO crm_app_user;
  \q
  ```

- [ ] **Test database connectivity**
  ```bash
  # Create test connection script
  export PG_HOST="${PG_SERVER_NAME}.postgres.database.azure.com"
  export PG_USER="crm_app_user"
  export PG_PASSWORD="secure_app_password_here"
  node test_pg_connection.js
  ```

### 2.3 Azure Key Vault Setup
- [ ] **Create Azure Key Vault for database credentials**
  ```bash
  # Create Key Vault
  export KEY_VAULT_NAME="kitchenpantrycrm-kv-$(date +%s)"
  az keyvault create \
    --resource-group $RESOURCE_GROUP \
    --name $KEY_VAULT_NAME \
    --location $LOCATION \
    --sku standard
  
  # Store PostgreSQL connection string
  export PG_CONNECTION_STRING="postgresql://crm_app_user:secure_app_password_here@${PG_SERVER_NAME}.postgres.database.azure.com:5432/kitchen_pantry_crm?sslmode=require"
  az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "postgresql-connection-string" \
    --value "$PG_CONNECTION_STRING"
  ```

---

## PHASE 3: DRIZZLE SCHEMA CONVERSION
**Duration**: 2-3 days  
**Priority**: CRITICAL - Core migration foundation

### 3.1 Install Drizzle ORM and Dependencies
- [ ] **Install Drizzle ORM packages**
  ```bash
  cd /workspaces/PantryCRM
  
  # Install Drizzle ORM and PostgreSQL drivers
  npm install drizzle-orm pg
  npm install -D drizzle-kit @types/pg
  
  # Verify installation
  npx drizzle-kit --version
  ```

- [ ] **Create Drizzle configuration file**
  ```typescript
  // drizzle.config.ts
  import 'dotenv/config';
  import { defineConfig } from 'drizzle-kit';
  
  export default defineConfig({
    dialect: 'postgresql',
    out: './src/drizzle/migrations',
    schema: './src/drizzle/schema.ts',
    dbCredentials: {
      host: process.env.PG_HOST!,
      port: Number(process.env.PG_PORT!) || 5432,
      user: process.env.PG_USER!,
      password: process.env.PG_PASSWORD!,
      database: process.env.PG_DATABASE!,
    },
    verbose: true,
    strict: true,
    migrations: {
      table: 'drizzle_migrations',
      schema: 'public',
    },
  });
  ```

### 3.2 Complete Schema Migration: Prisma → Drizzle
- [ ] **Create Drizzle schema directory structure**
  ```bash
  mkdir -p src/drizzle/schemas
  mkdir -p src/drizzle/migrations
  mkdir -p src/drizzle/relations
  ```

#### 3.2.1 Core CRM Schemas
- [ ] **Convert User/Session schemas (NextAuth.js)**
  ```typescript
  // src/drizzle/schemas/auth.ts
  import { pgTable, varchar, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
  
  export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified'),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  
  export const accounts = pgTable('accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: timestamp('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  
  export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: uuid('user_id').notNull(),
    expires: timestamp('expires').notNull(),
  });
  
  export const verificationTokens = pgTable('verification_tokens', {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires').notNull(),
  });
  ```

- [ ] **Convert Organization schema**
  ```typescript
  // src/drizzle/schemas/organizations.ts
  import { pgTable, varchar, text, timestamp, uuid } from 'drizzle-orm/pg-core';
  
  export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    website: varchar('website', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 50 }),
    zipCode: varchar('zip_code', { length: 20 }),
    country: varchar('country', { length: 100 }).default('United States'),
    
    // Food service industry specific fields
    priorityId: varchar('priority_id', { length: 50 }), // References Settings
    segmentId: varchar('segment_id', { length: 50 }),   // References Settings
    distributorId: varchar('distributor_id', { length: 50 }), // References Settings
    
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Contact schema**
  ```typescript
  // src/drizzle/schemas/contacts.ts
  import { pgTable, varchar, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
  
  export const contacts = pgTable('contacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    mobile: varchar('mobile', { length: 50 }),
    
    // Food service industry roles
    position: varchar('position', { length: 100 }),
    role: varchar('role', { length: 50 }), // Exec Chef, Buyer, Manager, Owner, Kitchen Manager
    isPrimary: boolean('is_primary').default(false),
    influence: varchar('influence', { length: 20 }), // High, Medium, Low
    
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Interaction schema**
  ```typescript
  // src/drizzle/schemas/interactions.ts
  import { pgTable, varchar, text, timestamp, uuid, date } from 'drizzle-orm/pg-core';
  
  export const interactions = pgTable('interactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    contactId: uuid('contact_id'),
    userId: varchar('user_id', { length: 255 }).notNull(),
    
    // Food service interaction types
    type: varchar('type', { length: 50 }).notNull(), // Email, Call, In Person, Demo/sampled, Quoted price, Follow-up
    subject: varchar('subject', { length: 255 }),
    notes: text('notes'),
    outcome: varchar('outcome', { length: 100 }),
    
    // Timing for 30-second entry target
    interactionDate: date('interaction_date').notNull(),
    followUpDate: date('follow_up_date'),
    duration: varchar('duration', { length: 20 }),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

#### 3.2.2 Extended CRM Schemas
- [ ] **Convert Lead schema**
  ```typescript
  // src/drizzle/schemas/leads.ts
  import { pgTable, varchar, text, timestamp, uuid, decimal, integer } from 'drizzle-orm/pg-core';
  
  export const leads = pgTable('leads', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id'),
    contactId: uuid('contact_id'),
    userId: varchar('user_id', { length: 255 }).notNull(),
    
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    source: varchar('source', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull(),
    score: integer('score').default(0),
    estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Opportunity schema**
  ```typescript
  // src/drizzle/schemas/opportunities.ts
  import { pgTable, varchar, text, timestamp, uuid, decimal, date, integer } from 'drizzle-orm/pg-core';
  
  export const opportunities = pgTable('opportunities', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    contactId: uuid('contact_id'),
    userId: varchar('user_id', { length: 255 }).notNull(),
    
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    
    // Food service specific fields
    principal: varchar('principal', { length: 100 }), // 11 brands: Kaufholds, Frites Street, etc.
    stage: varchar('stage', { length: 50 }).notNull(), // 5-stage pipeline
    probability: integer('probability').default(0), // 0-100%
    expectedValue: decimal('expected_value', { precision: 10, scale: 2 }),
    
    expectedCloseDate: date('expected_close_date'),
    actualCloseDate: date('actual_close_date'),
    source: varchar('source', { length: 100 }),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Campaign schema**
  ```typescript
  // src/drizzle/schemas/campaigns.ts
  import { pgTable, varchar, text, timestamp, uuid, decimal, date, boolean } from 'drizzle-orm/pg-core';
  
  export const campaigns = pgTable('campaigns', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull(),
    
    startDate: date('start_date'),
    endDate: date('end_date'),
    budget: decimal('budget', { precision: 10, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
    
    isActive: boolean('is_active').default(true),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Contract schema**
  ```typescript
  // src/drizzle/schemas/contracts.ts
  import { pgTable, varchar, text, timestamp, uuid, decimal, date } from 'drizzle-orm/pg-core';
  
  export const contracts = pgTable('contracts', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    opportunityId: uuid('opportunity_id'),
    
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull(),
    
    value: decimal('value', { precision: 12, scale: 2 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    signedDate: date('signed_date'),
    
    terms: text('terms'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Task schema**
  ```typescript
  // src/drizzle/schemas/tasks.ts
  import { pgTable, varchar, text, timestamp, uuid, date, boolean } from 'drizzle-orm/pg-core';
  
  export const tasks = pgTable('tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id'),
    contactId: uuid('contact_id'),
    userId: varchar('user_id', { length: 255 }).notNull(),
    assignedTo: varchar('assigned_to', { length: 255 }),
    
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 100 }),
    priority: varchar('priority', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull(),
    
    dueDate: date('due_date'),
    completedDate: date('completed_date'),
    isCompleted: boolean('is_completed').default(false),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

- [ ] **Convert Settings schema (Dynamic Configuration)**
  ```typescript
  // src/drizzle/schemas/settings.ts
  import { pgTable, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
  
  export const settings = pgTable('settings', {
    id: varchar('id').primaryKey(), // composite: category-key
    category: varchar('category', { length: 50 }).notNull(),
    key: varchar('key', { length: 50 }).notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    value: text('value'),
    color: varchar('color', { length: 20 }),
    sortOrder: integer('sort_order').default(0),
    active: boolean('active').default(true),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

### 3.3 Define Comprehensive Table Relations
- [ ] **Create table relations**
  ```typescript
  // src/drizzle/relations/index.ts
  import { relations } from 'drizzle-orm';
  import { 
    users, accounts, sessions,
    organizations, contacts, interactions, opportunities, leads,
    campaigns, contracts, tasks, settings 
  } from '../schemas';
  
  // User relations
  export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
  }));
  
  // Organization relations
  export const organizationsRelations = relations(organizations, ({ many }) => ({
    contacts: many(contacts),
    interactions: many(interactions),
    opportunities: many(opportunities),
    contracts: many(contracts),
    tasks: many(tasks),
  }));
  
  // Contact relations
  export const contactsRelations = relations(contacts, ({ one, many }) => ({
    organization: one(organizations, {
      fields: [contacts.organizationId],
      references: [organizations.id],
    }),
    interactions: many(interactions),
    opportunities: many(opportunities),
    tasks: many(tasks),
  }));
  
  // Additional relations for extended schemas...
  ```

### 3.4 Create Main Schema Export
- [ ] **Create consolidated schema file**
  ```typescript
  // src/drizzle/schema.ts
  export * from './schemas/auth';
  export * from './schemas/organizations';
  export * from './schemas/contacts';
  export * from './schemas/interactions';
  export * from './schemas/opportunities';
  export * from './schemas/leads';
  export * from './schemas/campaigns';
  export * from './schemas/contracts';
  export * from './schemas/tasks';
  export * from './schemas/settings';
  export * from './relations';
  ```

### 3.5 Generate Initial Migration
- [ ] **Generate Drizzle migration files**
  ```bash
  # Generate migration based on schema
  npx drizzle-kit generate
  
  # Review generated migration files
  ls -la src/drizzle/migrations/
  cat src/drizzle/migrations/0001_*.sql
  ```

---

## PHASE 4: DATA MIGRATION STRATEGY & EXECUTION
**Duration**: 2-3 days  
**Priority**: CRITICAL - Data integrity essential

### 4.1 Data Export from Azure SQL Database
- [ ] **Create comprehensive data export scripts**
  ```sql
  -- export_azure_sql_data.sql
  -- Export all tables in dependency order
  
  -- Export Users (NextAuth)
  SELECT * FROM User ORDER BY createdAt;
  
  -- Export Accounts (NextAuth)
  SELECT * FROM Account ORDER BY createdAt;
  
  -- Export Sessions (NextAuth)
  SELECT * FROM Session ORDER BY expires;
  
  -- Export Settings (no dependencies)
  SELECT * FROM Setting ORDER BY category, sortOrder;
  
  -- Export Organizations
  SELECT * FROM Organization ORDER BY createdAt;
  
  -- Export Contacts (depends on Organizations)
  SELECT * FROM Contact ORDER BY organizationId, createdAt;
  
  -- Export Interactions (depends on Organizations and Contacts)
  SELECT * FROM Interaction ORDER BY interactionDate DESC;
  
  -- Export Leads (depends on Organizations and Contacts)
  SELECT * FROM Lead ORDER BY createdAt;
  
  -- Export Opportunities (depends on Organizations and Contacts)
  SELECT * FROM Opportunity ORDER BY createdAt;
  
  -- Export Campaigns
  SELECT * FROM Campaign ORDER BY createdAt;
  
  -- Export Contracts (depends on Organizations and Opportunities)
  SELECT * FROM Contract ORDER BY createdAt;
  
  -- Export Tasks (depends on Organizations and Contacts)
  SELECT * FROM Task ORDER BY createdAt;
  ```

- [ ] **Execute data export with validation**
  ```bash
  # Use Azure CLI or SQL Server tools to export data
  # Implement row count validation for each table
  # Create checksums for data integrity verification
  ```

### 4.2 Data Transformation for PostgreSQL
- [ ] **Create comprehensive data transformation scripts**
  ```typescript
  // scripts/data-migration/transform-data.ts
  import fs from 'fs';
  import csv from 'csv-parser';
  import { v4 as uuidv4 } from 'uuid';
  
  interface MigrationMapping {
    azureSqlId: string;
    postgresqlId: string;
  }
  
  class ComprehensiveDataTransformer {
    private mappings: Map<string, Map<string, string>> = new Map();
    
    constructor() {
      // Initialize mapping tables for each entity type
      this.mappings.set('organizations', new Map());
      this.mappings.set('contacts', new Map());
      this.mappings.set('users', new Map());
      // Add mappings for all entity types
    }
    
    async transformAllTables() {
      // Transform in dependency order
      await this.transformUsers();
      await this.transformSettings();
      await this.transformOrganizations();
      await this.transformContacts();
      await this.transformInteractions();
      await this.transformLeads();
      await this.transformOpportunities();
      await this.transformCampaigns();
      await this.transformContracts();
      await this.transformTasks();
    }
    
    // Implement transformation methods for each table...
  }
  ```

### 4.3 PostgreSQL Data Import with Validation
- [ ] **Create validated data import scripts**
  ```typescript
  // scripts/data-migration/import-to-postgresql.ts
  import { drizzle } from 'drizzle-orm/node-postgres';
  import { Client } from 'pg';
  import * as schema from '../../src/drizzle/schema';
  
  const db = drizzle(client, { schema });
  
  async function importAllData() {
    try {
      await client.connect();
      console.log('🔗 Connected to PostgreSQL');
      
      // Import in dependency order with validation
      await importWithValidation('users', schema.users);
      await importWithValidation('settings', schema.settings);
      await importWithValidation('organizations', schema.organizations);
      await importWithValidation('contacts', schema.contacts);
      await importWithValidation('interactions', schema.interactions);
      await importWithValidation('leads', schema.leads);
      await importWithValidation('opportunities', schema.opportunities);
      await importWithValidation('campaigns', schema.campaigns);
      await importWithValidation('contracts', schema.contracts);
      await importWithValidation('tasks', schema.tasks);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  async function importWithValidation(tableName: string, table: any) {
    console.log(`📊 Importing ${tableName}...`);
    const data = JSON.parse(fs.readFileSync(`transformed/${tableName}.json`, 'utf8'));
    
    // Batch processing for large datasets
    const batchSize = 1000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await db.insert(table).values(batch);
      console.log(`  📦 Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)}`);
    }
    
    // Validate import
    const [importedCount] = await db.select({ count: count() }).from(table);
    console.log(`✅ Imported ${data.length} ${tableName}, validated ${importedCount.count} records`);
  }
  ```

### 4.4 Excel Migration System Adaptation
- [ ] **Update Excel import system for Drizzle ORM**
  ```typescript
  // src/lib/excel-migration/drizzle-excel-processor.ts
  import { drizzle } from 'drizzle-orm/node-postgres';
  import * as schema from '../drizzle/schema';
  
  export class DrizzleExcelProcessor {
    constructor(private db: ReturnType<typeof drizzle>) {}
    
    async processExcelFile(file: File): Promise<MigrationResult> {
      // 5-Phase Migration Engine adapted for Drizzle
      const phases = [
        { name: 'Analysis', weight: 10, fn: () => this.analyzeExcelStructure(file) },
        { name: 'Validation', weight: 25, fn: () => this.validateExcelData() },
        { name: 'Backup', weight: 5, fn: () => this.backupExistingData() },
        { name: 'Transformation', weight: 50, fn: () => this.transformAndImport(file) },
        { name: 'Verification', weight: 10, fn: () => this.verifyImportedData() },
      ];
      
      let totalProgress = 0;
      const results = {};
      
      for (const phase of phases) {
        console.log(`🔄 Starting ${phase.name} phase...`);
        results[phase.name] = await phase.fn();
        totalProgress += phase.weight;
        this.updateProgress(totalProgress);
      }
      
      return {
        success: true,
        phases: results,
        totalRecordsProcessed: this.getTotalRecordsProcessed(results),
      };
    }
    
    private async transformAndImport(file: File) {
      // Use Drizzle batch API for efficient imports
      // Process: Organizations → Contacts → Opportunities → Interactions
      const batch = [];
      
      for (const row of excelData) {
        batch.push(this.transformRowForDrizzle(row));
        
        if (batch.length >= 500) {
          await this.db.insert(schema.organizations).values(batch);
          batch.length = 0;
        }
      }
      
      if (batch.length > 0) {
        await this.db.insert(schema.organizations).values(batch);
      }
    }
  }
  ```

---

## PHASE 5: APPLICATION CODE MIGRATION
**Duration**: 3-4 days  
**Priority**: CRITICAL - Core functionality migration

### 5.1 Database Connection Layer Setup
- [ ] **Create Drizzle database connection**
  ```typescript
  // src/lib/database/connection.ts
  import { drizzle } from 'drizzle-orm/node-postgres';
  import { Pool } from 'pg';
  import * as schema from '../../drizzle/schema';
  
  const pool = new Pool({
    host: process.env.PG_HOST!,
    port: Number(process.env.PG_PORT!) || 5432,
    user: process.env.PG_USER!,
    password: process.env.PG_PASSWORD!,
    database: process.env.PG_DATABASE!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  export const db = drizzle(pool, { schema });
  
  export async function checkDatabaseConnection() {
    try {
      const result = await db.execute(sql`SELECT 1 as test`);
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  }
  ```

- [ ] **Replace lib/prisma.ts with Drizzle connection**
  ```typescript
  // Update lib/prisma.ts to export Drizzle instance
  // Maintain backward compatibility during transition
  export { db as prisma } from './database/connection';
  export { db } from './database/connection';
  ```

### 5.2 Component Migration: Database-Dependent Components

#### 5.2.1 API Routes Migration
- [ ] **app/api/organizations/route.ts - Convert to Drizzle**
  ```typescript
  import { db } from '@/lib/database/connection';
  import { organizations, contacts } from '@/drizzle/schema';
  import { eq, ilike, and, count } from 'drizzle-orm';
  
  export async function GET(request: NextRequest) {
    // Replace Prisma queries with Drizzle equivalents
    const orgList = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        // ... other fields
        contactCount: count(contacts.id),
      })
      .from(organizations)
      .leftJoin(contacts, eq(organizations.id, contacts.organizationId))
      .groupBy(organizations.id);
    
    return NextResponse.json(orgList);
  }
  ```

- [ ] **app/api/organizations/search/route.ts - Convert search functionality**
- [ ] **app/api/contacts/route.ts - Convert contact management**
- [ ] **app/api/contacts/by-organization/[orgId]/route.ts - Convert nested queries**
- [ ] **app/api/interactions/route.ts - Convert interaction tracking**
- [ ] **app/api/settings/route.ts - Convert settings management**

#### 5.2.2 CRM API Routes Migration
- [ ] **app/api/crm/account/route.ts - Convert account operations**
- [ ] **app/api/crm/account/[accountId]/route.ts - Convert account details**
- [ ] **app/api/crm/contacts/route.ts - Convert CRM contact operations**
- [ ] **app/api/crm/leads/route.ts - Convert lead management**
- [ ] **app/api/crm/opportunity/route.ts - Convert opportunity management**
- [ ] **app/api/crm/tasks/route.ts - Convert task management**
- [ ] **app/api/crm/organizations-optimized/route.ts - Convert optimized queries**

#### 5.2.3 Server Actions Migration
- [ ] **actions/organizations/create-organization.ts - Convert organization creation**
  ```typescript
  import { db } from '@/lib/database/connection';
  import { organizations } from '@/drizzle/schema';
  
  export async function createOrganization(data: OrganizationData) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newOrg;
  }
  ```

- [ ] **actions/contacts/create-contact.ts - Convert contact creation**
- [ ] **actions/crm/get-accounts.ts - Convert account retrieval**
- [ ] **actions/crm/get-contacts.ts - Convert contact retrieval**
- [ ] **actions/crm/get-leads.ts - Convert lead management**
- [ ] **actions/crm/get-opportunities.ts - Convert opportunity management**
- [ ] **actions/crm/tasks/ - Convert all task management actions**

### 5.3 Component Migration: UI Components

#### 5.3.1 Form Components (Database Integration)
- [ ] **components/organizations/OrganizationForm.tsx - Update database calls**
  ```typescript
  // Update form submission to use Drizzle API routes
  // Ensure validation schemas match new Drizzle schema
  // Test form validation and error handling
  ```

- [ ] **components/contacts/ContactForm.tsx - Update contact form**
- [ ] **components/interactions/QuickInteractionEntry.tsx - Update 30-second entry**
- [ ] **components/organizations/OrganizationSearch.tsx - Update search functionality**

#### 5.3.2 List and Display Components
- [ ] **components/organizations/OrganizationList.tsx - Update data fetching**
- [ ] **components/contacts/ContactList.tsx - Update contact display**
- [ ] **components/organizations/EnhancedOrganizationCard.tsx - Update card data**
- [ ] **components/organizations/FavoriteOrganizations.tsx - Update favorites system**

#### 5.3.3 Food Service Industry Components
- [ ] **components/food-service/DistributorField.tsx - Update distributor data**
- [ ] **components/food-service/PriorityBadge.tsx - Update priority display**
- [ ] **components/food-service/SegmentSelector.tsx - Update segment data**
- [ ] **components/food-service/dashboard/FoodServiceDashboard.tsx - Update dashboard data**

#### 5.3.4 Excel Migration Components
- [ ] **src/components/excel-migration/MigrationDashboard.tsx - Update for Drizzle**
- [ ] **src/components/excel-migration/MappingReview.tsx - Update field mapping**

### 5.4 Settings Management Migration
- [ ] **Convert Settings API for dynamic configuration**
  ```typescript
  // app/api/settings/route.ts
  import { db } from '@/lib/database/connection';
  import { settings } from '@/drizzle/schema';
  import { eq, and } from 'drizzle-orm';
  
  export async function GET(request: NextRequest) {
    const settingsList = await db
      .select()
      .from(settings)
      .where(eq(settings.active, true))
      .orderBy(settings.category, settings.sortOrder);
    
    // Group by category for easy consumption
    const groupedSettings = settingsList.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, typeof settingsList>);
    
    return NextResponse.json(groupedSettings);
  }
  ```

---

## PHASE 6: REACT 19 COMPATIBILITY & CHART LIBRARY MIGRATION
**Duration**: 2-3 days  
**Priority**: CRITICAL - Currently blocking build

### 6.1 Chart Library Assessment & Replacement
- [ ] **Remove incompatible chart libraries**
  ```bash
  # Remove Recharts and Tremor (React 19 incompatible)
  npm uninstall recharts tremor @tremor/react
  
  # Check for any remaining references
  grep -r "recharts\|tremor" src/ components/ app/ --exclude-dir=node_modules
  ```

- [ ] **Remove all Tremor chart components**
  - [ ] **DELETE components/tremor/AreaChart.tsx**
  - [ ] **DELETE components/tremor/BarChart.tsx**
  - [ ] **DELETE components/tremor/OptimizedAreaChart.tsx**
  - [ ] **DELETE components/tremor/OptimizedBarChart.tsx**
  - [ ] **DELETE components/tremor/OptimizedDonutChart.tsx**
  - [ ] **DELETE components/tremor/index.ts**
  - [ ] **DELETE components/charts/optimized/TremorBarChart.tsx**
  - [ ] **DELETE components/charts/optimized/TremorDonutChart.tsx**
  - [ ] **DELETE components/charts/optimized/TremorLineChart.tsx**

- [ ] **Install React 19 compatible chart library**
  ```bash
  # Install TanStack React Charts (recommended for enterprise)
  npm install @tanstack/react-charts
  
  # Verify React 19 compatibility
  npm ls react react-dom
  ```

### 6.2 Implement TanStack React Charts Components (React 19 Compatible)
- [ ] **Create comprehensive chart configuration system**
  ```typescript
  // components/charts/base-chart-config.ts
  import { ChartOptions } from '@tanstack/react-charts';
  
  export const baseChartConfig: Partial<ChartOptions<any>> = {
    primaryAxis: { position: 'bottom' },
    secondaryAxes: [{ position: 'left', type: 'linear' }],
    tooltip: { align: 'auto', anchor: 'closest' },
    interactionMode: 'closest',
    // React 19 Server Components integration
    data: [], // Will be populated server-side
    getSeriesId: (d: any) => d.seriesId,
  };
  
  // Food service industry color palette with accessibility
  export const CHART_COLORS = {
    primary: '#10b981',      // Green for positive metrics
    secondary: '#3b82f6',    // Blue for neutral data
    accent: '#f59e0b',       // Amber for warnings
    priority: {
      A: '#dc2626',          // Red for highest priority
      B: '#ea580c',          // Orange for high priority
      C: '#ca8a04',          // Yellow for medium priority
      D: '#65a30d',          // Green for low priority
    },
    segments: {
      FINE_DINING: '#8b5cf6',
      FAST_FOOD: '#f59e0b',
      CASUAL_DINING: '#10b981',
      CATERING: '#3b82f6',
      INSTITUTIONAL: '#6b7280',
      HEALTHCARE: '#ef4444',
      EDUCATION: '#8b5cf6',
      CORPORATE: '#1f2937',
    },
  };
  ```

- [ ] **Create comprehensive replacement chart components**
  - [ ] **components/charts/TanStackAreaChart.tsx** - Revenue trend visualization with real-time data
  - [ ] **components/charts/TanStackBarChart.tsx** - Sales performance by territory/segment
  - [ ] **components/charts/TanStackLineChart.tsx** - Lead conversion rates over time
  - [ ] **components/charts/TanStackDonutChart.tsx** - Market segment distribution
  - [ ] **components/charts/TanStackScatterChart.tsx** - Customer behavior correlation analysis
  - [ ] **components/charts/DashboardRevenueChart.tsx** - Main dashboard revenue visualization
  - [ ] **components/charts/InteractionDistributionChart.tsx** - Interaction type analysis
  - [ ] **components/charts/OrganizationGrowthChart.tsx** - Customer acquisition trends
  - [ ] **components/charts/PipelineChart.tsx** - Sales pipeline visualization
  - [ ] **components/charts/KPICard.tsx** - Key performance indicators with trend arrows
  - [ ] **components/charts/MetricsGrid.tsx** - Dashboard metrics layout
  - [ ] **components/charts/ChartContainer.tsx** - Unified chart wrapper with loading states

### 6.3 React 19 Upgrade Process
- [ ] **Update React to version 19**
  ```bash
  npm install react@19 react-dom@19
  npm install -D @types/react@19 @types/react-dom@19
  npm install next@latest
  ```

- [ ] **Update NextCRM components for React 19 compatibility**
  - [ ] **components/nextcrm/AvatarDropdown.tsx - Update React patterns**
  - [ ] **components/nextcrm/Feedback.tsx - Update React patterns**
  - [ ] **components/nextcrm/FulltextSearch.tsx - Update React patterns**
  - [ ] **components/nextcrm/ModuleMenu.tsx - Update React patterns**

- [ ] **Update all function components for React 19**
  ```bash
  # Check for deprecated React.FC patterns
  grep -r "React.FC\|React.FunctionComponent" components/
  
  # Update deprecated patterns
  # React.FC is deprecated in React 19, use direct function typing
  ```

### 6.4 Build Configuration Optimization
- [ ] **Update Next.js configuration for React 19**
  ```typescript
  // next.config.js
  const nextConfig = {
    experimental: {
      reactCompiler: true,
      optimizePackageImports: ['@tanstack/react-charts', 'drizzle-orm'],
    },
    
    webpack: (config, { isServer, dev }) => {
      if (!dev) {
        config.optimization = {
          ...config.optimization,
          moduleIds: 'deterministic',
          chunkIds: 'deterministic',
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                enforce: true,
              },
            },
          },
        };
      }
      return config;
    },
    
    swcMinify: true,
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  };
  ```

- [ ] **Update package.json scripts for memory optimization**
  ```json
  {
    "scripts": {
      "build": "cross-env NODE_OPTIONS=\"--max-old-space-size=6144\" next build",
      "db:generate": "drizzle-kit generate",
      "db:migrate": "drizzle-kit migrate",
      "db:push": "drizzle-kit push",
      "db:studio": "drizzle-kit studio"
    }
  }
  ```

---

## PHASE 7: COMPREHENSIVE TESTING & PERFORMANCE OPTIMIZATION
**Duration**: 2-3 days  
**Priority**: HIGH - Validation and performance assurance

### 7.1 Component Testing Migration
- [ ] **Update all component tests for Drizzle**
  - [ ] **components/organizations/__tests__/OrganizationForm.test.tsx**
  - [ ] **components/contacts/__tests__/ContactForm.test.tsx**
  - [ ] **components/food-service/__tests__/DistributorField.test.tsx**
  - [ ] **components/food-service/__tests__/PriorityBadge.test.tsx**
  - [ ] **components/food-service/__tests__/SegmentSelector.test.tsx**

- [ ] **Create new tests for React 19 compatibility**
  ```typescript
  // tests/react19-compatibility.test.tsx
  import { render, screen } from '@testing-library/react';
  import { QuickInteractionEntry } from '@/components/interactions/QuickInteractionEntry';
  
  describe('React 19 Compatibility', () => {
    test('QuickInteractionEntry renders with React 19', () => {
      render(<QuickInteractionEntry />);
      expect(screen.getByText(/quick interaction/i)).toBeInTheDocument();
    });
  });
  ```

### 7.2 Database Performance Optimization
- [ ] **Create PostgreSQL indexes for food service queries**
  ```sql
  -- Organizations indexes
  CREATE INDEX CONCURRENTLY idx_organizations_name_gin ON organizations USING gin(to_tsvector('english', name));
  CREATE INDEX CONCURRENTLY idx_organizations_priority ON organizations(priority_id) WHERE priority_id IS NOT NULL;
  CREATE INDEX CONCURRENTLY idx_organizations_segment ON organizations(segment_id) WHERE segment_id IS NOT NULL;
  
  -- Contact indexes
  CREATE INDEX CONCURRENTLY idx_contacts_organization_id ON contacts(organization_id);
  CREATE INDEX CONCURRENTLY idx_contacts_primary ON contacts(organization_id, is_primary) WHERE is_primary = true;
  
  -- Interaction indexes for 30-second entry performance
  CREATE INDEX CONCURRENTLY idx_interactions_organization_date ON interactions(organization_id, interaction_date DESC);
  CREATE INDEX CONCURRENTLY idx_interactions_type ON interactions(type);
  ```

- [ ] **Create performance monitoring queries**
  ```sql
  -- Monitor slow queries
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;
  ```

### 7.3 Application Performance Testing
- [ ] **Create performance test suite**
  ```typescript
  // tests/performance/database-performance.test.ts
  describe('Database Performance Tests', () => {
    test('Organization search should complete in <1 second', async () => {
      const startTime = performance.now();
      const results = await db
        .select()
        .from(organizations)
        .where(ilike(organizations.name, '%restaurant%'))
        .limit(10);
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
    
    test('30-second interaction entry target', async () => {
      const startTime = performance.now();
      const [newInteraction] = await db
        .insert(interactions)
        .values({
          organizationId: 'test-org-id',
          userId: 'test-user',
          type: 'Call',
          notes: 'Performance test',
          interactionDate: new Date(),
        })
        .returning();
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(200); // Sub-200ms for 30-second total entry
    });
  });
  ```

### 7.4 Load Testing for 4 Concurrent Users
- [ ] **Create concurrent user load testing**
  ```typescript
  // tests/load/concurrent-users.test.ts
  test('4 concurrent users can perform CRUD operations', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const userActions = contexts.map(async (context, index) => {
      const page = await context.newPage();
      
      // Perform typical CRM workflow
      await page.goto('/crm');
      await page.click('[data-testid="add-organization"]');
      await page.fill('[name="name"]', `Test Restaurant ${index + 1}`);
      await page.click('button[type="submit"]');
      
      // Quick interaction entry test
      await page.click('[data-testid="quick-interaction"]');
      await page.selectOption('[name="type"]', 'Call');
      await page.fill('[name="notes"]', `Test call from user ${index + 1}`);
      await page.click('button[type="submit"]');
      
      await context.close();
    });
    
    const startTime = Date.now();
    await Promise.all(userActions);
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(30000); // 30 seconds for 4 concurrent users
  });
  ```

### 7.5 Data Validation and Integrity Testing
- [ ] **Create comprehensive data integrity tests**
  ```typescript
  // tests/integration/data-integrity.test.ts
  describe('Data Integrity Tests', () => {
    test('Foreign key relationships are maintained', async () => {
      // Check that all contacts have valid organization references
      const orphanedContacts = await db
        .select({ count: count() })
        .from(contacts)
        .leftJoin(organizations, eq(contacts.organizationId, organizations.id))
        .where(sql`${organizations.id} IS NULL`);
      
      expect(orphanedContacts[0].count).toBe(0);
    });
    
    test('Food service industry data constraints', async () => {
      // Test priority levels A-D exist
      const priorities = await db
        .select()
        .from(settings)
        .where(and(
          eq(settings.category, 'Priority'),
          eq(settings.active, true)
        ));
      
      const priorityKeys = priorities.map(p => p.key);
      expect(priorityKeys).toContain('A');
      expect(priorityKeys).toContain('B');
      expect(priorityKeys).toContain('C');
      expect(priorityKeys).toContain('D');
    });
  });
  ```

---

## PHASE 8: PRODUCTION DEPLOYMENT & CUTOVER
**Duration**: 2-3 days  
**Priority**: CRITICAL - Final production migration

### 8.1 Azure App Service Configuration Update
- [ ] **Update App Service for PostgreSQL connection**
  ```bash
  export APP_SERVICE_NAME="kitchen-pantry-crm-app"
  export RESOURCE_GROUP="kitchen-pantry-crm-rg"
  
  # Set PostgreSQL connection string
  az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --settings \
    PG_HOST="kitchenpantrycrm-pg-server.postgres.database.azure.com" \
    PG_DATABASE="kitchen_pantry_crm" \
    DATABASE_URL="postgresql://crm_app_user:@server:5432/kitchen_pantry_crm?sslmode=require"
  ```

- [ ] **Configure App Service for Node.js 18 and Next.js**
  ```bash
  az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --linux-fx-version "NODE|18-lts" \
    --startup-file "npm start"
  ```

### 8.2 GitHub Actions Deployment Pipeline Update
- [ ] **Update GitHub Actions workflow for PostgreSQL**
  ```yaml
  # .github/workflows/azure-deploy.yml
  name: Deploy to Azure App Service
  
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '18'
            cache: 'npm'
        - name: Install dependencies
          run: npm ci
        - name: Run tests
          run: npm run test
        - name: Build application
          run: npm run build
          env:
            NODE_OPTIONS: --max-old-space-size=6144
            DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
  ```

### 8.3 Blue-Green Deployment Strategy
- [ ] **Create staging slot for zero-downtime deployment**
  ```bash
  az webapp deployment slot create \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --slot staging \
    --configuration-source $APP_SERVICE_NAME
  ```

- [ ] **Create deployment validation script**
  ```bash
  #!/bin/bash
  # scripts/deployment/validate-deployment.sh
  
  APP_URL="https://kitchen-pantry-crm-app-staging.azurewebsites.net"
  
  # Health check
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health")
  if [ "$HEALTH_STATUS" != "200" ]; then
    echo "❌ Health check failed: $HEALTH_STATUS"
    exit 1
  fi
  
  # Database connectivity check
  DB_STATUS=$(curl -s "$APP_URL/api/health/database" | jq -r '.status')
  if [ "$DB_STATUS" != "connected" ]; then
    echo "❌ Database connectivity failed"
    exit 1
  fi
  
  echo "🎉 All deployment validations passed!"
  ```

### 8.4 Production Cutover Process
- [ ] **Create cutover checklist**
  ```markdown
  # Production Cutover Checklist
  
  ## Pre-Cutover (Day -1)
  - [ ] Final data synchronization from Azure SQL to PostgreSQL
  - [ ] Deploy to staging slot and validate all functionality
  - [ ] Performance testing on staging environment
  - [ ] Backup current production database
  - [ ] Notify sales representatives of maintenance window
  
  ## Cutover Day (2-hour window)
  - [ ] Enable maintenance mode
  - [ ] Export final incremental data from Azure SQL
  - [ ] Import incremental data to PostgreSQL
  - [ ] Swap staging slot to production
  - [ ] Validate production functionality
  - [ ] Monitor system performance
  
  ## Post-Cutover (Week 1)
  - [ ] Monitor PostgreSQL performance metrics
  - [ ] Track user adoption and feedback
  - [ ] Optimize queries based on usage patterns
  ```

### 8.5 Post-Deployment Monitoring
- [ ] **Set up Azure monitoring and alerts**
  ```bash
  # Create Application Insights
  az monitor app-insights component create \
    --resource-group $RESOURCE_GROUP \
    --app kitchen-pantry-crm-insights \
    --location centralus \
    --application-type web
  
  # Configure performance alerts
  az monitor metrics alert create \
    --resource-group $RESOURCE_GROUP \
    --name "High CPU Usage" \
    --condition "avg Percentage CPU > 80" \
    --window-size 5m
  ```

- [ ] **Create performance monitoring dashboard**
  ```typescript
  // scripts/monitoring/performance-dashboard.ts
  export async function generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      database: await getDatabaseMetrics(),
      application: await getApplicationMetrics(),
      userActivity: await getUserActivityMetrics(),
    };
    
    return report;
  }
  ```

---

## SUCCESS METRICS & VALIDATION

### Technical Achievements
- [ ] Zero data loss during migration
- [ ] <30 seconds production downtime
- [ ] All components migrated and tested
- [ ] 100% API compatibility maintained
- [ ] React 19 compatibility achieved
- [ ] Build timeouts resolved
- [ ] Chart library migration completed

### Performance Targets
- [ ] Query response time <200ms (95th percentile)
- [ ] Dashboard load time <1 second
- [ ] 30-second interaction entry target met
- [ ] 4 concurrent users supported
- [ ] Database CPU <60% average utilization

### Business Continuity
- [ ] All 25+ UI components working
- [ ] All CRM functionality preserved
- [ ] Excel import system functional
- [ ] Food service industry workflows maintained
- [ ] Budget constraint of $18/month achieved

---

## COMPONENT COMPLETION CHECKLIST

### Database Layer (CRITICAL)
- [ ] lib/prisma.ts → lib/database/connection.ts
- [ ] All Prisma queries → Drizzle queries
- [ ] Database connection pooling optimized

### API Routes (25+ files)
- [ ] app/api/organizations/* (3 files)
- [ ] app/api/contacts/* (2 files)
- [ ] app/api/interactions/* (1 file)
- [ ] app/api/settings/* (1 file)
- [ ] app/api/crm/* (15+ files)
- [ ] app/api/health/* (2 files)

### Server Actions (20+ files)
- [ ] actions/organizations/*
- [ ] actions/contacts/*
- [ ] actions/crm/* (15+ files)

### UI Components (75+ files)
- [ ] **components/ui/* (50+ shadcn/ui components)**
  - [ ] Core form components (8 files)
  - [ ] Layout and navigation components (9 files)
  - [ ] Data display components (7 files)
  - [ ] Interactive components (8 files)
  - [ ] Utility components (7 files)
  - [ ] Extended data components (5 files)
  - [ ] Business intelligence components (5 files)
- [ ] **components/organizations/* (5 files)** - Organization management
- [ ] **components/contacts/* (3 files)** - Contact management
- [ ] **components/food-service/* (10 files)** - Industry-specific components
- [ ] **components/charts/* (12 files)** - REPLACE ALL with TanStack React Charts
- [ ] **components/dashboard/* (5 files)** - Business intelligence components
- [ ] **components/nextcrm/* (6 files)** - NextCRM integration
- [ ] **components/auth/* (5 files)** - Authentication system
- [ ] **components/pwa/* (5 files)** - Progressive Web App features
- [ ] **components/excel-migration/* (7 files)** - 5-phase Excel import system

### Chart Components (REMOVE & REPLACE)
- [ ] DELETE components/tremor/* (6 files)
- [ ] CREATE components/charts/tanstack/* (5 files)
- [ ] UPDATE all chart references

### Test Files (15+ files)
- [ ] Update all existing tests for Drizzle
- [ ] Create React 19 compatibility tests
- [ ] Create performance tests
- [ ] Create integration tests

### Configuration Files
- [ ] drizzle.config.ts (NEW)
- [ ] next.config.js (UPDATE)
- [ ] package.json (UPDATE)
- [ ] .env.local (UPDATE)

---

## COMPREHENSIVE UI COMPONENT ARCHITECTURE SUMMARY

### Total Component Coverage: 75+ Files
The PantryCRM migration includes comprehensive coverage of all UI components with React 19 compatibility:

**Core Foundation (50+ shadcn/ui components)**
- Complete shadcn/ui library implementation with Tailwind CSS and Radix UI primitives
- React 19 Server Components integration for optimal performance
- TypeScript strict mode compatibility with Drizzle ORM generated types

**Specialized Business Components (25+ custom components)**
- Food service industry-specific components for priority management, distributor relationships, and market segmentation
- 5-phase Excel migration system with real-time progress tracking and confidence scoring
- NextCRM integration with multi-provider authentication and PWA capabilities

**Data Visualization Modernization**
- Complete replacement of Tremor Charts (React 19 incompatible) with TanStack React Charts
- Business intelligence dashboard with real-time WebSocket updates
- Industry-specific KPI tracking and revenue pipeline visualization

**Performance Optimization Architecture**
- Server Components for database queries executed ahead of time
- Client Components with "use client" directive for interactivity
- Connection pooling integration for Azure PostgreSQL Basic tier
- Progressive enhancement with Suspense boundaries

**Type Safety & Integration**
- Drizzle ORM schema-generated TypeScript interfaces
- Runtime validation with Zod schemas
- Automated form generation with react-hook-form
- Compile-time SQL validation and Server Action compatibility

This architecture ensures the PantryCRM delivers a professional, responsive, and feature-rich customer relationship management experience optimized for the food service industry while maintaining excellent performance within the $18/month Azure infrastructure budget constraint.

---

This comprehensive plan ensures every component is reviewed, migrated, and tested during the PostgreSQL + Drizzle ORM migration while addressing React 19 compatibility and maintaining the $18/month budget constraint.