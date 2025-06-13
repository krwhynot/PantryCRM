# PantryCRM Prisma Schema Documentation

## Overview

This document provides a comprehensive analysis of the PantryCRM Prisma schema, which implements a customer relationship management system specialized for the food service industry. The schema is designed for Azure SQL Server deployment with performance optimizations for Azure SQL Basic tier (5 DTU) constraints.

---

## Schema Configuration

### Generator & Datasource

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["metrics"]
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

**SQL Server Configuration:**
- **Provider**: Microsoft SQL Server
- **Target**: Azure SQL Database Basic Tier
- **Performance Features**: Metrics collection enabled for monitoring
- **Connection**: Environment-based connection string for security

---

## Models Overview

The schema consists of **10 primary models** organized into three functional groups:

### 1. Authentication & Session Management (4 models)
- `User` - Core user accounts
- `Account` - OAuth provider accounts
- `Session` - Active user sessions
- `VerificationToken` - Email/password verification

### 2. CRM Core Entities (5 models)
- `Organization` - Companies/restaurants (primary entity)
- `Contact` - Individual contacts within organizations
- `Interaction` - Communication history and activities
- `Opportunity` - Sales opportunities and pipeline
- `Lead` - Potential customers and prospects
- `Contract` - Agreements and deals

### 3. System Configuration (1 model)
- `SystemSetting` - Application configuration and settings

---

## Detailed Model Analysis

### 1. User Model - Authentication Core

```prisma
model User {
  id               String    @id
  name             String?
  email            String    @unique
  emailVerified    DateTime?
  image            String?
  password         String?
  role             String    @default("user")
  isActive         Boolean   @default(true)
  lastLoginAt      DateTime?
  resetToken       String?
  resetTokenExpiry DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  accounts     Account[]
  sessions     Session[]
  assignedLeads Lead[]
}
```

**SQL Equivalent:**
```sql
CREATE TABLE [User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [emailVerified] DATETIME2,
    [image] NVARCHAR(1000),
    [password] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL DEFAULT 'user',
    [isActive] BIT NOT NULL DEFAULT 1,
    [lastLoginAt] DATETIME2,
    [resetToken] NVARCHAR(1000),
    [resetTokenExpiry] DATETIME2,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PK_User] PRIMARY KEY ([id]),
    CONSTRAINT [User_email_key] UNIQUE ([email])
);
```

**Relationships:**
- **One-to-Many**: User → Account (OAuth providers)
- **One-to-Many**: User → Session (active sessions)
- **One-to-Many**: User → Lead (assigned leads)

**Business Logic:**
- Supports multiple authentication methods (OAuth + credentials)
- Role-based access control with default 'user' role
- Account lockout and password reset functionality
- Activity tracking with lastLoginAt timestamps

---

### 2. Organization Model - CRM Primary Entity

```prisma
model Organization {
  id                String   @id @default(cuid())
  name              String
  priority          String   // A, B, C, D
  segment           String   // FINE_DINING, FAST_FOOD, etc.
  type              String   @default("PROSPECT")
  address           String?
  city              String?
  state             String?
  zipCode           String?
  phone             String?
  email             String?
  website           String?
  notes             String?
  estimatedRevenue  Float?
  employeeCount     Int?
  primaryContact    String?
  lastContactDate   DateTime?
  nextFollowUpDate  DateTime?
  status            String   @default("ACTIVE")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  contacts      Contact[]
  interactions  Interaction[]
  opportunities Opportunity[]
  leads         Lead[]
  contracts     Contract[]

  // 16 performance indexes for Azure SQL Basic optimization
  @@index([status, priority, name])
  @@index([name])
  @@index([email])
  // ... additional indexes
}
```

**SQL Equivalent:**
```sql
CREATE TABLE [Organization] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [priority] NVARCHAR(1000) NOT NULL,
    [segment] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL DEFAULT 'PROSPECT',
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [zipCode] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [website] NVARCHAR(1000),
    [notes] NVARCHAR(MAX),
    [estimatedRevenue] FLOAT,
    [employeeCount] INT,
    [primaryContact] NVARCHAR(1000),
    [lastContactDate] DATETIME2,
    [nextFollowUpDate] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL DEFAULT 'ACTIVE',
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PK_Organization] PRIMARY KEY ([id])
);

-- Performance Indexes (16 total for Azure SQL Basic optimization)
CREATE INDEX [Organization_status_priority_name_idx] ON [Organization]([status], [priority], [name]);
CREATE INDEX [Organization_name_idx] ON [Organization]([name]);
CREATE INDEX [Organization_email_idx] ON [Organization]([email]);
CREATE INDEX [Organization_priority_updatedAt_idx] ON [Organization]([priority], [updatedAt]);
-- ... 12 additional indexes
```

**Food Service Industry Specialization:**
- **Priority System**: A/B/C/D classification for sales focus
- **Segment Classification**: FINE_DINING, FAST_FOOD, HEALTHCARE, INSTITUTIONAL
- **Revenue Tracking**: estimatedRevenue for opportunity sizing
- **Follow-up Management**: lastContactDate and nextFollowUpDate

**Performance Optimization:**
- **16 composite indexes** designed for Azure SQL Basic (5 DTU) performance
- **Multi-column indexes** for common query patterns
- **Selective indexing** to balance query speed vs. DTU consumption

---

### 3. Contact Model - Individual Relationships

```prisma
model Contact {
  id             String       @id @default(cuid())
  firstName      String
  lastName       String
  email          String?
  phone          String?
  position       String?
  isPrimary      Boolean      @default(false)
  notes          String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  interactions  Interaction[]
  opportunities Opportunity[]
  contracts     Contract[]

  @@index([organizationId, isPrimary])
  @@index([firstName, lastName])
  @@index([email])
  @@index([organizationId, createdAt])
  @@index([organizationId, position])
}
```

**SQL Equivalent:**
```sql
CREATE TABLE [Contact] (
    [id] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [position] NVARCHAR(1000),
    [isPrimary] BIT NOT NULL DEFAULT 0,
    [notes] NVARCHAR(MAX),
    [organizationId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PK_Contact] PRIMARY KEY ([id]),
    CONSTRAINT [FK_Contact_organizationId] FOREIGN KEY ([organizationId]) 
        REFERENCES [Organization]([id]) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX [Contact_organizationId_isPrimary_idx] ON [Contact]([organizationId], [isPrimary]);
CREATE INDEX [Contact_firstName_lastName_idx] ON [Contact]([firstName], [lastName]);
CREATE INDEX [Contact_email_idx] ON [Contact]([email]);
```

**Relationships:**
- **Many-to-One**: Contact → Organization (CASCADE delete)
- **One-to-Many**: Contact → Interaction
- **One-to-Many**: Contact → Opportunity
- **One-to-Many**: Contact → Contract

**Business Logic:**
- **Primary Contact Flag**: isPrimary for main point of contact
- **Position Tracking**: Job titles for relationship mapping
- **Cascade Deletion**: Contacts deleted when organization is removed

---

### 4. Interaction Model - Communication History

```prisma
model Interaction {
  id             String       @id @default(cuid())
  type           String       // CALL, EMAIL, MEETING, VISIT
  subject        String
  description    String?
  date           DateTime
  duration       Int?         // in minutes
  outcome        String?      // POSITIVE, NEUTRAL, NEGATIVE, FOLLOW_UP_NEEDED
  nextAction     String?
  organizationId String
  contactId      String?
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contact        Contact?     @relation(fields: [contactId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId, date])
  @@index([contactId, date])
  @@index([type, date])
  @@index([outcome, nextAction])
}
```

**SQL Equivalent:**
```sql
CREATE TABLE [Interaction] (
    [id] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(MAX),
    [date] DATETIME2 NOT NULL,
    [duration] INT,
    [outcome] NVARCHAR(1000),
    [nextAction] NVARCHAR(1000),
    [organizationId] NVARCHAR(1000) NOT NULL,
    [contactId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PK_Interaction] PRIMARY KEY ([id]),
    CONSTRAINT [FK_Interaction_organizationId] FOREIGN KEY ([organizationId]) 
        REFERENCES [Organization]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Interaction_contactId] FOREIGN KEY ([contactId]) 
        REFERENCES [Contact]([id]) ON DELETE NO ACTION
);
```

**Sales Activity Tracking:**
- **Type Classification**: CALL, EMAIL, MEETING, VISIT for activity categorization
- **Outcome Tracking**: POSITIVE, NEUTRAL, NEGATIVE for relationship health
- **Duration Metrics**: Time investment tracking for ROI analysis
- **Follow-up Planning**: nextAction for pipeline management

---

### 5. Opportunity Model - Sales Pipeline

```prisma
model Opportunity {
  id                String   @id @default(cuid())
  name              String
  organizationId    String
  contactId         String?
  value             Float?
  stage             String   @default("PROSPECT")
  probability       Int      @default(50) // 0-100%
  expectedCloseDate DateTime?
  notes             String?
  reason            String?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contact      Contact?     @relation(fields: [contactId], references: [id])

  @@index([organizationId, stage])
  @@index([stage, expectedCloseDate])
  @@index([isActive, updatedAt])
}
```

**Sales Pipeline Stages:**
```sql
-- Stage Values: PROSPECT → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON/CLOSED_LOST
-- Probability: 0-100% confidence scoring
-- Value: Deal size in currency
-- expectedCloseDate: Forecasting and pipeline management
```

**Business Intelligence:**
- **Pipeline Visualization**: Stage-based opportunity progression
- **Revenue Forecasting**: value × probability calculations
- **Win/Loss Analysis**: reason field for closed opportunities
- **Time-to-Close Metrics**: expectedCloseDate vs actual close tracking

---

### 6. Lead Model - Prospect Management

```prisma
model Lead {
  id             String       @id @default(cuid())
  firstName      String
  lastName       String
  email          String?
  phone          String?
  company        String?
  source         String?      // Website, referral, cold call, etc.
  status         String       @default("NEW")
  notes          String?
  organizationId String?
  assignedToId   String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  assignedTo   User?         @relation(fields: [assignedToId], references: [id], onDelete: SetNull)

  @@index([status, createdAt])
  @@index([organizationId])
  @@index([assignedToId])
}
```

**Lead Conversion Pipeline:**
```sql
-- Status Flow: NEW → CONTACTED → QUALIFIED → CONVERTED → LOST
-- Source Tracking: Attribution for marketing ROI
-- Assignment: User-based lead distribution
-- Conversion: organizationId links to converted accounts
```

---

## Relational Architecture

### Entity Relationship Diagram

```
User (1) ←→ (M) Account (OAuth providers)
User (1) ←→ (M) Session (active sessions)
User (1) ←→ (M) Lead (assigned leads)

Organization (1) ←→ (M) Contact (organization contacts)
Organization (1) ←→ (M) Interaction (communication history)
Organization (1) ←→ (M) Opportunity (sales pipeline)
Organization (1) ←→ (M) Lead (converted prospects)
Organization (1) ←→ (M) Contract (agreements)

Contact (1) ←→ (M) Interaction (contact interactions)
Contact (1) ←→ (M) Opportunity (contact opportunities)
Contact (1) ←→ (M) Contract (contact contracts)
```

### Cascading Delete Strategy

**CASCADE Operations:**
- User deletion → Account and Session cleanup
- Organization deletion → Contact, Interaction, Opportunity, Contract cleanup

**SET NULL Operations:**
- User deletion → Lead assignment removal (preserves lead data)
- Organization deletion → Lead organization reference removal

**NO ACTION Operations:**
- Contact deletion → Interaction, Opportunity, Contract preservation (audit trail)

---

## Performance Optimization Strategy

### Azure SQL Basic Tier Constraints
- **DTU Limit**: 5 Database Transaction Units
- **Storage**: 2GB maximum
- **Concurrent Connections**: Limited
- **Index Strategy**: Selective indexing to balance performance vs. DTU consumption

### Index Design Philosophy

**Composite Indexes for Common Queries:**
```sql
-- Multi-filter dashboard queries
CREATE INDEX [Organization_status_priority_segment_idx] 
ON [Organization]([status], [priority], [segment]);

-- Follow-up workflow queries
CREATE INDEX [Organization_lastContactDate_nextFollowUpDate_idx] 
ON [Organization]([lastContactDate], [nextFollowUpDate]);

-- Revenue analysis queries
CREATE INDEX [Organization_segment_estimatedRevenue_idx] 
ON [Organization]([segment], [estimatedRevenue]);
```

**Query Pattern Optimization:**
1. **Dashboard Queries**: Priority + Status filtering with name sorting
2. **Search Operations**: Text search on name, email, phone
3. **Follow-up Tasks**: Date-based querying for scheduling
4. **Analytics**: Segment and revenue analysis
5. **Geographic**: City, state, zipCode for territory management

---

## Data Types & Constraints

### SQL Server Type Mapping

| Prisma Type | SQL Server Type | Usage |
|-------------|----------------|--------|
| `String` | `NVARCHAR(1000)` | Standard text fields |
| `String?` | `NVARCHAR(1000) NULL` | Optional text fields |
| `Int` | `INT` | Numeric values |
| `Float` | `FLOAT` | Currency/revenue values |
| `Boolean` | `BIT` | True/false flags |
| `DateTime` | `DATETIME2` | Timestamps with timezone |
| `@default(cuid())` | `NEWID()` | Unique identifiers |
| `@default(now())` | `GETDATE()` | Current timestamp |
| `@updatedAt` | Trigger-based | Auto-update on modification |

### Constraint Implementation

**Primary Keys:**
```sql
CONSTRAINT [PK_Organization] PRIMARY KEY ([id])
```

**Foreign Keys with Actions:**
```sql
CONSTRAINT [FK_Contact_organizationId] FOREIGN KEY ([organizationId]) 
    REFERENCES [Organization]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
```

**Unique Constraints:**
```sql
CONSTRAINT [User_email_key] UNIQUE ([email])
CONSTRAINT [Session_sessionToken_key] UNIQUE ([sessionToken])
```

**Composite Unique Constraints:**
```sql
CONSTRAINT [Account_provider_providerAccountId_key] UNIQUE ([provider], [providerAccountId])
```

---

## Business Logic Implementation

### Food Service Industry Specialization

**Organization Priority Classification:**
```typescript
// Priority levels for sales focus
type Priority = 'A' | 'B' | 'C' | 'D';
// A: High-value, strategic accounts
// B: Medium-value, growth potential  
// C: Standard accounts
// D: Low-priority, maintenance mode
```

**Market Segment Categories:**
```typescript
type Segment = 
  | 'FINE_DINING'      // High-end restaurants
  | 'FAST_FOOD'        // Quick service restaurants
  | 'CASUAL_DINING'    // Mid-tier restaurants
  | 'HEALTHCARE'       // Hospitals, nursing homes
  | 'INSTITUTIONAL'    // Schools, prisons, corporate
  | 'CATERING'         // Event and catering services
  | 'FOOD_SERVICE'     // General food service
  | 'RETAIL'           // Grocery stores, markets
```

**Interaction Outcome Analysis:**
```typescript
type Outcome = 
  | 'POSITIVE'         // Advancing relationship
  | 'NEUTRAL'          // Maintenance contact
  | 'NEGATIVE'         // Relationship concern
  | 'FOLLOW_UP_NEEDED' // Action required
```

### Revenue Forecasting Logic

**Opportunity Value Calculation:**
```sql
-- Pipeline value calculation
SELECT 
    stage,
    COUNT(*) as opportunity_count,
    SUM(value) as total_value,
    SUM(value * probability / 100.0) as weighted_value
FROM Opportunity 
WHERE isActive = 1 
GROUP BY stage;
```

**Sales Performance Metrics:**
```sql
-- Territory performance analysis
SELECT 
    o.city,
    o.state,
    COUNT(DISTINCT o.id) as organization_count,
    COUNT(DISTINCT op.id) as opportunity_count,
    SUM(op.value) as pipeline_value,
    AVG(op.probability) as avg_probability
FROM Organization o
LEFT JOIN Opportunity op ON o.id = op.organizationId
WHERE o.status = 'ACTIVE'
GROUP BY o.city, o.state;
```

---

## Security & Compliance

### Data Protection Implementation

**Password Security:**
- Encrypted password storage in User.password
- Reset token expiration in User.resetTokenExpiry
- Session management via Session model

**Audit Trail Preservation:**
- Soft delete patterns via status fields
- CreatedAt/UpdatedAt timestamps on all entities
- NO ACTION on contact deletion preserves interaction history

**Access Control:**
- Role-based permissions via User.role
- User assignment via Lead.assignedToId
- Organization-scoped data access

### GDPR Compliance Considerations

**Data Subject Rights:**
- User.email as primary identifier
- Contact.email for individual requests
- Organization.notes for consent tracking
- Systematic deletion via CASCADE operations

**Data Minimization:**
- Optional fields marked as nullable
- Selective indexing to reduce storage overhead
- Notes fields for additional context only when needed

---

## Migration & Deployment

### Azure SQL Database Setup

**Connection String Format:**
```bash
DATABASE_URL="sqlserver://server.database.windows.net:1433;database=pantrycrm;user=admin;password=password;encrypt=true;trustServerCertificate=false;connectionTimeout=30;"
```

**Performance Tier Configuration:**
```sql
-- Azure SQL Basic Tier Settings
-- DTU: 5 (shared processing power)
-- Storage: 2GB maximum
-- Backup: 7-day retention
-- Monitoring: Basic metrics available
```

### Production Optimization

**Index Maintenance:**
```sql
-- Monitor index usage and DTU consumption
SELECT 
    i.name AS index_name,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates
FROM sys.indexes i
JOIN sys.dm_db_index_usage_stats s ON i.object_id = s.object_id 
    AND i.index_id = s.index_id
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1;
```

**Query Performance Monitoring:**
```sql
-- Top resource-consuming queries
SELECT TOP 10
    qs.execution_count,
    qs.total_worker_time/1000 AS total_cpu_time_ms,
    qs.total_elapsed_time/1000 AS total_elapsed_time_ms,
    SUBSTRING(qt.text, qs.statement_start_offset/2+1, 
        (CASE WHEN qs.statement_end_offset = -1 
         THEN LEN(CONVERT(nvarchar(max), qt.text)) * 2 
         ELSE qs.statement_end_offset 
         END - qs.statement_start_offset)/2) AS statement_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS qt
ORDER BY qs.total_worker_time DESC;
```

---

## Conclusion

The PantryCRM Prisma schema implements a comprehensive, performance-optimized CRM system specifically designed for the food service industry. Key architectural strengths include:

1. **Industry Specialization**: Custom fields and enums for food service business logic
2. **Performance Optimization**: 16+ composite indexes designed for Azure SQL Basic tier
3. **Scalable Relationships**: Proper foreign key constraints with strategic delete cascades
4. **Audit Trail Preservation**: Comprehensive timestamp tracking and soft delete patterns
5. **Security Implementation**: Role-based access control and encrypted credential storage

The schema balances feature richness with performance constraints, making it ideal for small-to-medium food service sales teams requiring enterprise-level CRM functionality within Azure's cost-effective Basic tier pricing.