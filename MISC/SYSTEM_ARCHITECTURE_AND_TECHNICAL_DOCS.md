# 🏗️ PantryCRM System Architecture & Technical Documentation

This document consolidates all technical architecture documentation, component structure, database schema details, and technical decisions for PantryCRM.

---

## System Architecture Overview

Kitchen Pantry CRM is a specialized Customer Relationship Management system for the food service industry with comprehensive Excel data migration capabilities. The system is optimized for Azure SQL Basic tier deployment and features enterprise-level security, performance monitoring, and data migration tools.

### Core Execution Flow

1. **Application Bootstrap** (`/app/layout.tsx`)
   - Configures global providers and error boundaries
   - Initializes ThemeProvider, DeviceProvider, and ErrorBoundary
   - Handles development bypass authentication
   - Sets up global Toaster notifications

2. **Request Interception** (`/middleware.ts`)
   - Security header validation and CVE-2025-29927 protection
   - Automated security tool detection and blocking
   - NextAuth session validation
   - Route protection (excludes: `/api`, `/_next/*`, `/favicon.ico`, `/sign-in`)

3. **Authentication System** (`/lib/auth.ts`)
   - Credentials validation with timing attack prevention
   - OAuth provider configuration (Google, GitHub)
   - Session management with Prisma adapter

4. **Data Access Layer** (`/lib/prismadb.ts`)
   - Global Prisma Client instance
   - Connection pooling (max: 3 for Azure SQL Basic tier)
   - Query optimization and caching strategy

5. **Component Rendering** (`/app/(routes)/page.tsx`)
   - Dashboard components with data fetching
   - Settings management system
   - Organization and contact management
   - Sales pipeline visualization

---

## NextCRM Component Architecture

### Core Components

#### 1. Dashboard Components
- `Dashboard.tsx`: Main dashboard layout with KPI cards
- `DashboardMetricsCard.tsx`: Performance metrics display
- `DashboardChart.tsx`: Sales pipeline visualization

#### 2. CRM Components
- `OrganizationForm.tsx`: Create/edit organization records
- `ContactForm.tsx`: Create/edit contact records
- `InteractionForm.tsx`: Log sales interactions
- `PipelineView.tsx`: Sales pipeline visualization

#### 3. UI Components
- `Button.tsx`: Touch-optimized button with 44px targets
- `IconButton.tsx`: Icon-only touch buttons
- `PriorityBadge.tsx`: Priority level visualization
- `SegmentSelector.tsx`: Food service segment selection
- `DistributorSelector.tsx`: Distributor selection component

#### 4. Layout Components
- `SideBar.tsx`: Application navigation
- `Header.tsx`: Context-specific actions and user menu
- `ResponsiveLayout.tsx`: Device-adaptive layout system
- `DeviceProvider.tsx`: Device capability detection

---

## Database Schema Architecture

### Core Entities

#### 1. Organizations
- Primary entity for restaurant/food service business
- Fields: name, website, phone, address, segment, distributor
- Relationships: contacts[], interactions[], opportunities[]

#### 2. Contacts
- People at customer organizations
- Fields: firstName, lastName, email, phone, position, notes
- Relationships: organization, interactions[], opportunities[]

#### 3. Interactions
- Sales activities with contacts/organizations
- Fields: type, date, notes, outcome, followUpDate
- Relationships: organization, contact, user, product[]

#### 4. Settings
- Dynamic configuration for dropdowns and system settings
- Categories: PRIORITY, SEGMENT, DISTRIBUTOR, PRODUCT_TYPE, etc.
- Fields: key, value, label, active, sortOrder

### Schema Performance Optimization

**Composite Indexes:**
```prisma
@@index([organizationId, interactionDate])
@@index([organizationId, contactId])
@@index([userId, interactionDate])
@@unique([category, key])
```

**Azure SQL Configuration:**
```sql
-- Azure SQL Basic Tier Settings
-- DTU: 5 (shared processing power)
-- Storage: 2GB maximum
-- Backup: 7-day retention
-- Monitoring: Basic metrics available
```

---

## Technical Decisions Log

### 1. NextCRM as Foundation (2025-05-10)
**Decision:** Use NextCRM as the foundation framework
**Rationale:**
- Provides pre-built CRM components and routing
- Includes authentication, dashboard, and data table components
- Allows customization for food service industry needs
**Alternatives Considered:**
- Building from scratch with Next.js
- Using SaaS CRM with customization

### 2. Azure SQL Over MongoDB (2025-05-15)
**Decision:** Use Azure SQL Database (Basic tier) instead of MongoDB
**Rationale:**
- Better relational data structure for CRM entities
- Lower cost for small deployment ($5/month vs $15/month)
- Better query performance for reporting needs
**Alternatives Considered:**
- MongoDB Atlas ($15/month minimum)
- SQLite (rejected due to concurrency limitations)
- PostgreSQL (similar choice, slightly higher cost)

### 3. Prisma ORM with Connection Pooling (2025-05-20)
**Decision:** Implement Prisma with optimized connection pooling
**Rationale:**
- Type-safe database access
- Automatic query optimization
- Limited to 3 connections for Azure SQL Basic tier
**Alternatives Considered:**
- Raw SQL (rejected due to maintenance overhead)
- TypeORM (rejected due to performance concerns)

### 4. @hello-pangea/dnd for Drag-and-Drop (2025-06-05)
**Decision:** Replace react-beautiful-dnd with @hello-pangea/dnd
**Rationale:**
- Active maintenance with React 18+ support
- API-compatible with react-beautiful-dnd
- Better touch support for sales representatives' devices
**Alternatives Considered:**
- dnd-kit (rejected due to API differences)
- Maintaining react-beautiful-dnd (rejected due to React 18+ issues)

---

## Technical Debt Register

### Critical Items (Address in Sprint 27)
1. **API Test Coverage Below 50%**
   - Risk: Regressions in data access layer
   - Solution: Add integration tests for API routes
   - Complexity: Medium (4 days)

2. **Authentication Error Handling Inconsistent**
   - Risk: User confusion, security edge cases
   - Solution: Standardize error responses
   - Complexity: Low (2 days)

### Important Items (Address in Sprint 28)
1. **Bundle Size Exceeding 800KB**
   - Risk: Slow load times on mobile
   - Solution: Code splitting, lazy loading
   - Complexity: Medium (3 days)

2. **Duplicate CSS Utility Classes**
   - Risk: Inconsistent UI, maintenance overhead
   - Solution: Extract to common components
   - Complexity: Low (2 days)

### Monitoring Items (Review in Q3)
1. **Typescript strictNullChecks Disabled**
   - Risk: Potential runtime null errors
   - Solution: Enable check, address issues
   - Complexity: High (5 days)

2. **NextCRM Core Components Modified**
   - Risk: Upgrade difficulties
   - Solution: Extract to custom components
   - Complexity: High (7 days)

---

## Migration and System Evolution

### Phase 1: Foundation & Infrastructure
- ✅ Azure infrastructure setup
- ✅ NextCRM base installation
- ✅ Authentication system
- ✅ Organization & contact models

### Phase 2: Core CRM Features
- ✅ Organization management
- ✅ Contact management
- ✅ Interaction logging
- ✅ Settings system

### Phase 3: Advanced Features
- 🔄 Sales pipeline visualization
- 🔄 Excel data import/export
- 🔄 Reporting system
- 🔄 Mobile optimization

### Phase 4: Production Readiness
- ⏳ Performance optimization
- ⏳ Data migration tools
- ⏳ User training documentation
- ⏳ Production deployment