# PantryCRM System Architecture & Order of Operations

## Overview

Kitchen Pantry CRM is a specialized Customer Relationship Management system for the food service industry with comprehensive Excel data migration capabilities. The system is optimized for Azure SQL Basic tier deployment and features enterprise-level security, performance monitoring, and data migration tools.

## System Execution Flow & Order of Operations

### 1. Application Bootstrap (`/workspaces/PantryCRM/app/layout.tsx`)
**Purpose**: Main application layout and provider initialization
- **Key Functions**:
  - `RootLayout()`: Configures global providers and error boundaries
  - Initializes ThemeProvider, DeviceProvider, and ErrorBoundary
  - Handles development bypass authentication
  - Sets up global Toaster notifications

### 2. Request Interception (`/workspaces/PantryCRM/middleware.ts`)
**Purpose**: Global security and authentication middleware
- **Key Functions**:
  - Security header validation and CVE-2025-29927 protection
  - Automated security tool detection and blocking
  - NextAuth session validation
  - Request logging and monitoring
  - Route protection (excludes: `/api`, `/_next/*`, `/favicon.ico`, `/sign-in`)

### 3. Authentication System (`/workspaces/PantryCRM/lib/auth.ts`)
**Purpose**: Multi-provider authentication with security hardening
- **Key Functions**:
  - `authorize()`: Credentials validation with timing attack prevention
  - OAuth provider configuration (Google, GitHub)
  - Automatic user creation for OAuth providers
  - Session management with Prisma adapter
  - Role-based access control

### 4. Database Layer (`/workspaces/PantryCRM/lib/prisma.ts`)
**Purpose**: Azure SQL Basic optimized database connection
- **Key Functions**:
  - Connection pooling (max 3 concurrent for DTU limits)
  - Query performance monitoring and logging
  - Connection health checks and error recovery
  - Graceful shutdown handling
  - DTU-optimized timeout configurations

### 5. Route Protection (`/workspaces/PantryCRM/app/(routes)/layout.tsx`)
**Purpose**: Server-side session validation and layout rendering
- **Key Functions**:
  - `ProtectedLayout()`: Session validation and user status checks
  - Redirect logic for unauthenticated users
  - Dynamic component loading with error boundaries
  - Layout components: SideBar, Header, Footer

### 6. Main Dashboard (`/workspaces/PantryCRM/app/(routes)/page.tsx`)
**Purpose**: Primary dashboard with CRM overview
- **Key Functions**:
  - Session validation with fallback redirects
  - Priority account statistics (A/B/C/D levels)
  - Market segment distribution
  - Recent activity monitoring
  - Quick navigation to core CRM functions

## API Layer & Data Operations

### 7. Organizations API (`/workspaces/PantryCRM/app/api/organizations/route.ts`)
**Purpose**: Organization management with search and filtering
- **Key Functions**:
  - `GET()`: Search and filter organizations (limit 50 for performance)
  - `POST()`: Create new organizations with validation
  - Input sanitization and security checks
  - Performance optimizations for Azure SQL Basic

### 8. Contacts API (`/workspaces/PantryCRM/app/api/contacts/route.ts`)
**Purpose**: Contact management scoped to organizations
- **Key Functions**:
  - `GET()`: Retrieve organization-scoped contacts
  - Rate limiting (100 requests/minute)
  - Active record filtering
  - Comprehensive contact data retrieval

### 9. CRM Data Actions (`/workspaces/PantryCRM/actions/crm/get-crm-data.ts`)
**Purpose**: Centralized CRM data aggregation
- **Key Functions**:
  - `getCrmData()`: Aggregate CRM statistics
  - Active user retrieval
  - Migration-ready structure for legacy CRM models

### 10. Dashboard Metrics (`/workspaces/PantryCRM/actions/dashboard/get-accounts-count.ts`)
**Purpose**: Dashboard statistics and KPIs
- **Key Functions**:
  - `getAccountsCount()`: Organization count for dashboard
  - Performance-optimized queries
  - Part of critical dependency fixes

### 11. Health Monitoring (`/workspaces/PantryCRM/app/api/health/route.ts`)
**Purpose**: Comprehensive system health checks
- **Key Functions**:
  - `GET()`: Detailed health status with metrics
  - `HEAD()`: Quick ping health check
  - Database connectivity and latency testing
  - Memory usage monitoring
  - Environment detection and uptime tracking

## Excel Migration System

### 12. Migration Entry Point (`/workspaces/PantryCRM/src/lib/excel-migration/index.ts`)
**Purpose**: Central export hub for migration utilities
- **Key Exports**:
  - ExcelAnalyzer, DataTransformer, MigrationCoordinator
  - Transformation functions as `Transforms`
  - Type definitions for migration interfaces

### 13. Migration Orchestration (`/workspaces/PantryCRM/src/lib/excel-migration/migration-coordinator.ts`)
**Purpose**: High-level migration workflow management
- **Key Functions**:
  - `coordinateMigration()`: 5-phase migration process
  - `createRollbackCheckpoint()`: Backup creation before migration
  - `rollback()`: Complete migration reversal
  - `generateDefaultMapping()`: Auto-mapping generation
  - Progress reporting and dry-run capabilities

### 14. Migration Execution (`/workspaces/PantryCRM/src/lib/excel-migration/migration-executor.ts`)
**Purpose**: Low-level data processing and database operations
- **Key Functions**:
  - `processBatch()`: Batch processing (100 records/batch)
  - `saveOrganizations()`, `saveContacts()`, `saveOpportunities()`, `saveInteractions()`: Entity-specific handlers
  - Event-driven progress reporting
  - SSE integration for real-time web UI updates
  - Graceful abort handling

### 15. CLI Migration Tool (`/workspaces/PantryCRM/scripts/migrate-excel.ts`)
**Purpose**: Command-line interface for migrations
- **Key Functions**:
  - Commander.js CLI with comprehensive options
  - Visual progress indicators (Ora spinner)
  - Color-coded output (Chalk)
  - Detailed migration reporting
  - Rollback command support

## Migration Process Flow

```
Phase 1: ANALYSIS (10%)
├── Excel workbook structure analysis
├── Worksheet and header identification
├── Data type and pattern analysis
└── Analysis report generation

Phase 2: VALIDATION (25%)
├── Mapping configuration validation
├── Required column verification
├── Data type compatibility checks
└── Validation error collection

Phase 3: BACKUP (if rollback enabled)
├── Pre-migration checkpoint creation
├── Table-wise data backup
└── Rollback metadata storage

Phase 4: TRANSFORMATION (50%)
├── Entity processing order: Organizations → Contacts → Opportunities → Interactions
├── Batch processing with configurable size
├── Field mapping and data transformation
├── Relationship resolution and foreign key handling
└── Database operations with error handling

Phase 5: VERIFICATION (90%)
├── Record count validation
├── Data integrity checks
├── Relationship validation
└── Verification reporting

Phase 6: COMPLETION (100%)
├── Final migration report generation
├── Resource cleanup
└── Completion event emission
```

## Entity Processing Dependencies

The system processes entities in dependency order to maintain referential integrity:

1. **Organizations** (`crm_Accounts`) - No dependencies
2. **Contacts** (`crm_contacts`) - Depends on Organizations
3. **Opportunities** (`crm_Opportunities`) - Depends on Organizations
4. **Interactions** (`crm_Interactions`) - Depends on Organizations, Contacts, Opportunities

## Security Architecture

### Multi-Layer Security:
1. **Middleware Level**: Request validation, security tool detection
2. **Authentication Level**: Multi-provider OAuth, credentials validation
3. **Authorization Level**: Role-based access control, session validation
4. **API Level**: Rate limiting, input sanitization
5. **Database Level**: SQL injection protection, connection security

### Performance Optimizations:
- **Azure SQL Basic Tier**: DTU-optimized queries and connection pooling
- **Batch Processing**: Configurable batch sizes for large data operations
- **Memory Management**: Heap usage monitoring and optimization
- **Caching**: Strategic caching for frequently accessed data

## Configuration Files

### Core Configuration:
- **`/workspaces/PantryCRM/package.json`**: Dependencies and scripts
- **`/workspaces/PantryCRM/prisma/schema.prisma`**: Database schema definition
- **`/workspaces/PantryCRM/next.config.ts`**: Next.js configuration
- **`/workspaces/PantryCRM/CLAUDE.md`**: Project-specific instructions

### Migration Configuration:
- **`/workspaces/PantryCRM/excel/CRM-WORKBOOK.xlsx`**: Source data file
- **`/workspaces/PantryCRM/docs/migration-plan.md`**: Migration documentation

## Commands Reference

### Development:
```bash
npm run dev          # Start development server
npm run build        # Production build with optimizations
npm run typecheck    # TypeScript validation
npm run lint         # Code linting
```

### Testing:
```bash
npm test            # Unit tests
npm run test:e2e    # End-to-end tests
npm run test:mobile # Mobile-specific tests
```

### Migration:
```bash
npm run migrate:excel    # CLI Excel migration
npm run migrate:analyze  # Analyze Excel structure
npm run migrate:test     # Test migration process
```

### Performance:
```bash
npm run test:performance     # Performance test suite
npm run analyze:bundle       # Bundle analysis
npm run performance:quick    # Quick load test
```

## System Health Monitoring

The system includes comprehensive health monitoring:
- **Database Health**: Connection status and query latency
- **Memory Usage**: Heap utilization and external memory
- **System Uptime**: Process uptime tracking
- **Performance Metrics**: Response times and throughput
- **Error Monitoring**: Centralized error logging and reporting

## Deployment Architecture

**Target Platform**: Azure App Service Basic B1
**Database**: Azure SQL Database Basic Tier
**Optimizations**: 
- DTU-conscious connection pooling
- Memory usage optimization (4GB limit)
- Performance monitoring and alerting
- Automated backup and disaster recovery

This architecture provides a robust, scalable, and secure CRM solution specifically designed for food service industry requirements with enterprise-level Excel migration capabilities.