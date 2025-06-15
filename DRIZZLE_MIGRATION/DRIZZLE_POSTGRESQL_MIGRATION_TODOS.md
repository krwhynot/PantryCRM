# Kitchen Pantry CRM - Drizzle + Azure PostgreSQL Migration

## Migration Overview
Complete migration from Prisma + Azure SQL to Drizzle ORM + Azure PostgreSQL (Flexible Server). This migration aims to:
- **Reduce costs**: Azure PostgreSQL Basic (~$15/month vs SQL Basic $5/month + better performance)
- **Improve performance**: PostgreSQL with native JSON support and better indexing
- **Type safety**: Drizzle's superior TypeScript integration and compile-time guarantees
- **Schema evolution**: Better migration handling and schema versioning
- **Developer experience**: Faster development cycles and better debugging

---

## Pre-Migration Analysis and Planning

### TODO-DZ-001: Database Architecture Analysis and Planning
**Priority**: Critical  
**Estimated Time**: 8 hours  
**Dependencies**: None  
**Risk Level**: Low  

#### Task
Comprehensive analysis of current Prisma schema and design of equivalent Drizzle + PostgreSQL architecture.

#### Steps
1. **Schema Analysis**:
   - Document all 8 models: Account, Session, User, VerificationToken, Organization, Contact, Interaction, Opportunity, Lead, Contract
   - Map 47 indexes and their performance characteristics
   - Identify foreign key relationships and cascade behaviors
   - Document custom types and enums (priorities, segments, statuses)

2. **PostgreSQL Feature Mapping**:
   - Map Azure SQL string types to PostgreSQL text/varchar
   - Convert Azure SQL datetime to PostgreSQL timestamp with timezone
   - Plan JSONB usage for flexible fields (notes, metadata)
   - Design PostgreSQL-specific indexes (GIN, GIST for full-text search)

3. **Performance Optimization Plan**:
   - Design connection pooling for Azure PostgreSQL (max 100 connections on Basic)
   - Plan partitioning strategy for large tables (Interactions, Organizations)
   - Design materialized views for dashboard metrics
   - Plan query optimization using PostgreSQL-specific features

4. **Migration Risk Assessment**:
   - Identify potential data loss scenarios
   - Plan rollback strategies
   - Document breaking changes and required code updates
   - Create testing strategy for data integrity

#### Deliverables
- [ ] Complete schema mapping document (Prisma → Drizzle)
- [ ] PostgreSQL performance optimization plan
- [ ] Migration risk assessment and mitigation strategies
- [ ] Data migration strategy with rollback procedures

---

### TODO-DZ-002: Azure PostgreSQL Infrastructure Setup
**Priority**: Critical  
**Estimated Time**: 6 hours  
**Dependencies**: TODO-DZ-001  
**Risk Level**: Medium  

#### Task
Provision and configure Azure PostgreSQL Flexible Server optimized for Kitchen Pantry CRM workload.

#### Steps
1. **Azure PostgreSQL Provisioning**:
   ```bash
   # Create resource group (if needed)
   az group create --name pantrycrm-rg --location eastus

   # Create PostgreSQL Flexible Server
   az postgres flexible-server create \
     --resource-group pantrycrm-rg \
     --name pantrycrm-postgres \
     --location eastus \
     --admin-user crmadmin \
     --admin-password <secure-password> \
     --sku-name Standard_B1ms \
     --tier Burstable \
     --version 15 \
     --storage-size 32 \
     --storage-auto-grow Enabled \
     --backup-retention 7
   ```

2. **Security Configuration**:
   - Configure firewall rules for Azure App Service
   - Enable Azure AD authentication
   - Set up SSL enforcement (required)
   - Configure connection security and encryption

3. **Performance Tuning**:
   ```sql
   -- PostgreSQL configuration for Azure B1 workload
   ALTER SYSTEM SET shared_buffers = '128MB';
   ALTER SYSTEM SET effective_cache_size = '1GB'; 
   ALTER SYSTEM SET maintenance_work_mem = '64MB';
   ALTER SYSTEM SET checkpoint_completion_target = 0.9;
   ALTER SYSTEM SET wal_buffers = '16MB';
   ALTER SYSTEM SET default_statistics_target = 100;
   SELECT pg_reload_conf();
   ```

4. **Monitoring Setup**:
   - Enable Azure Monitor for PostgreSQL
   - Configure query performance insights
   - Set up alerting for CPU, memory, and connection limits
   - Configure backup validation

5. **Extensions Installation**:
   ```sql
   -- Required PostgreSQL extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search
   CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
   ```

#### Validation
- [ ] PostgreSQL server provisioned and accessible
- [ ] SSL connection working from development environment
- [ ] Performance parameters configured correctly
- [ ] Extensions installed and functional
- [ ] Backup and monitoring configured

---

## Drizzle ORM Implementation

### TODO-DZ-003: Install and Configure Drizzle ORM
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: TODO-DZ-002  
**Risk Level**: Low  

#### Task
Install Drizzle ORM and configure for Azure PostgreSQL with TypeScript strict mode support.

#### Steps
1. **Package Installation**:
   ```bash
   # Remove Prisma dependencies
   npm uninstall prisma @prisma/client

   # Install Drizzle and PostgreSQL dependencies
   npm install drizzle-orm drizzle-kit pg
   npm install -D @types/pg tsx

   # Install connection pooling for Azure
   npm install @neondatabase/serverless  # Or pg-pool for traditional pooling
   ```

2. **Project Structure Setup**:
   ```
   lib/
   ├── db/
   │   ├── index.ts              # Database connection and client
   │   ├── schema.ts             # Drizzle schema definitions
   │   ├── migrations/           # Migration files
   │   ├── connection-pool.ts    # Azure-optimized connection pooling
   │   └── seed.ts              # Database seeding utilities
   ```

3. **Drizzle Configuration**:
   ```typescript
   // drizzle.config.ts
   import type { Config } from 'drizzle-kit';

   export default {
     schema: './lib/db/schema.ts',
     out: './lib/db/migrations',
     driver: 'pg',
     dbCredentials: {
       connectionString: process.env.DATABASE_URL!,
     },
     verbose: true,
     strict: true,
   } satisfies Config;
   ```

4. **Environment Configuration**:
   ```bash
   # Update .env with PostgreSQL connection
   DATABASE_URL="postgresql://crmadmin:password@pantrycrm-postgres.postgres.database.azure.com:5432/pantrycrm?sslmode=require"
   DIRECT_DATABASE_URL="postgresql://crmadmin:password@pantrycrm-postgres.postgres.database.azure.com:5432/pantrycrm?sslmode=require"
   ```

5. **TypeScript Configuration**:
   ```json
   // Update tsconfig.json for Drizzle
   {
     "compilerOptions": {
       "target": "ES2022",
       "lib": ["dom", "dom.iterable", "esnext"],
       "strict": true,
       "esModuleInterop": true,
       "experimentalDecorators": false,
       "emitDecoratorMetadata": false
     }
   }
   ```

#### Validation
- [ ] Drizzle packages installed successfully
- [ ] Configuration files created and valid
- [ ] TypeScript compilation works with new setup
- [ ] Database connection test passes

---

### TODO-DZ-004: Create Drizzle Schema Definition
**Priority**: High  
**Estimated Time**: 12 hours  
**Dependencies**: TODO-DZ-003  
**Risk Level**: Medium  

#### Task
Convert complete Prisma schema to Drizzle schema with PostgreSQL optimizations and enhanced type safety.

#### Steps
1. **Core Authentication Schema**:
   ```typescript
   // lib/db/schema.ts
   import { 
     pgTable, 
     text, 
     timestamp, 
     boolean, 
     integer,
     real,
     uuid,
     index,
     primaryKey,
     foreignKey
   } from 'drizzle-orm/pg-core';
   import { relations } from 'drizzle-orm';

   // Account model for NextAuth
   export const accounts = pgTable('Account', {
     id: text('id').primaryKey(),
     userId: text('userId').notNull(),
     type: text('type').notNull(),
     provider: text('provider').notNull(),
     providerAccountId: text('providerAccountId').notNull(),
     refresh_token: text('refresh_token'),
     access_token: text('access_token'),
     expires_at: integer('expires_at'),
     token_type: text('token_type'),
     scope: text('scope'),
     id_token: text('id_token'),
     session_state: text('session_state'),
     createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
     updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
   }, (table) => ({
     providerProviderAccountIdIdx: index('Account_provider_providerAccountId_key')
       .on(table.provider, table.providerAccountId),
     userIdIdx: index('Account_userId_idx').on(table.userId),
   }));
   ```

2. **User Management Schema**:
   ```typescript
   export const users = pgTable('User', {
     id: text('id').primaryKey(),
     name: text('name'),
     email: text('email').notNull().unique(),
     emailVerified: timestamp('emailVerified', { withTimezone: true }),
     image: text('image'),
     password: text('password'),
     role: text('role').default('user').notNull(),
     isActive: boolean('isActive').default(true).notNull(),
     lastLoginAt: timestamp('lastLoginAt', { withTimezone: true }),
     resetToken: text('resetToken'),
     resetTokenExpiry: timestamp('resetTokenExpiry', { withTimezone: true }),
     createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
     updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
   }, (table) => ({
     emailIdx: index('User_email_idx').on(table.email),
     roleIsActiveIdx: index('User_role_isActive_idx').on(table.role, table.isActive),
   }));
   ```

3. **CRM Core Schema with PostgreSQL Enums**:
   ```typescript
   import { pgEnum } from 'drizzle-orm/pg-core';

   // Define enums for better type safety
   export const organizationPriorityEnum = pgEnum('OrganizationPriority', ['A', 'B', 'C', 'D']);
   export const organizationSegmentEnum = pgEnum('OrganizationSegment', [
     'FINE_DINING', 'FAST_FOOD', 'CASUAL_DINING', 'CATERING', 
     'INSTITUTIONAL', 'HEALTHCARE', 'EDUCATION', 'CORPORATE'
   ]);
   export const organizationTypeEnum = pgEnum('OrganizationType', ['PROSPECT', 'CUSTOMER', 'INACTIVE']);
   export const organizationStatusEnum = pgEnum('OrganizationStatus', ['ACTIVE', 'INACTIVE', 'LEAD']);

   export const organizations = pgTable('Organization', {
     id: uuid('id').defaultRandom().primaryKey(),
     name: text('name').notNull(),
     priority: organizationPriorityEnum('priority').notNull(),
     segment: organizationSegmentEnum('segment').notNull(),
     type: organizationTypeEnum('type').default('PROSPECT').notNull(),
     address: text('address'),
     city: text('city'),
     state: text('state'),
     zipCode: text('zipCode'),
     phone: text('phone'),
     email: text('email'),
     website: text('website'),
     notes: text('notes'), // PostgreSQL text supports unlimited length
     estimatedRevenue: real('estimatedRevenue'),
     employeeCount: integer('employeeCount'),
     primaryContact: text('primaryContact'),
     lastContactDate: timestamp('lastContactDate', { withTimezone: true }),
     nextFollowUpDate: timestamp('nextFollowUpDate', { withTimezone: true }),
     status: organizationStatusEnum('status').default('ACTIVE').notNull(),
     metadata: jsonb('metadata'), // PostgreSQL JSONB for flexible data
     createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
     updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
   }, (table) => ({
     // Performance indexes optimized for PostgreSQL
     statusPriorityNameIdx: index('Organization_status_priority_name_idx')
       .on(table.status, table.priority, table.name),
     nameSearchIdx: index('Organization_name_search_idx')
       .using('gin', sql`to_tsvector('english', ${table.name})`), // Full-text search
     emailIdx: index('Organization_email_idx').on(table.email),
     priorityUpdatedAtIdx: index('Organization_priority_updatedAt_idx')
       .on(table.priority, table.updatedAt),
     segmentStatusIdx: index('Organization_segment_status_idx')
       .on(table.segment, table.status),
     lastContactDateIdx: index('Organization_lastContactDate_idx')
       .on(table.lastContactDate),
     nextFollowUpDateIdx: index('Organization_nextFollowUpDate_idx')
       .on(table.nextFollowUpDate),
     // Composite indexes for complex queries
     statusPrioritySegmentIdx: index('Organization_status_priority_segment_idx')
       .on(table.status, table.priority, table.segment),
     geographicIdx: index('Organization_geographic_idx')
       .on(table.city, table.state, table.zipCode),
     revenueAnalysisIdx: index('Organization_revenue_analysis_idx')
       .on(table.priority, table.estimatedRevenue),
   }));
   ```

4. **Contact Schema with Advanced Indexing**:
   ```typescript
   export const contacts = pgTable('Contact', {
     id: uuid('id').defaultRandom().primaryKey(),
     firstName: text('firstName').notNull(),
     lastName: text('lastName').notNull(),
     email: text('email'),
     phone: text('phone'),
     position: text('position'),
     isPrimary: boolean('isPrimary').default(false).notNull(),
     notes: text('notes'),
     organizationId: uuid('organizationId').notNull(),
     metadata: jsonb('metadata'),
     createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
     updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
   }, (table) => ({
     organizationIdIsPrimaryIdx: index('Contact_organizationId_isPrimary_idx')
       .on(table.organizationId, table.isPrimary),
     nameSearchIdx: index('Contact_name_search_idx')
       .using('gin', sql`to_tsvector('english', ${table.firstName} || ' ' || ${table.lastName})`),
     emailIdx: index('Contact_email_idx').on(table.email),
     organizationCreatedAtIdx: index('Contact_organizationId_createdAt_idx')
       .on(table.organizationId, table.createdAt),
     positionIdx: index('Contact_organizationId_position_idx')
       .on(table.organizationId, table.position),
     // Foreign key constraint
     organizationFk: foreignKey({
       columns: [table.organizationId],
       foreignColumns: [organizations.id],
       name: 'Contact_organizationId_fkey'
     }).onDelete('cascade'),
   }));
   ```

5. **Complete Remaining Models**: Interaction, Opportunity, Lead, Contract with similar PostgreSQL optimizations

6. **Relations Definition**:
   ```typescript
   // Define Drizzle relations for type-safe joins
   export const organizationsRelations = relations(organizations, ({ many }) => ({
     contacts: many(contacts),
     interactions: many(interactions),
     opportunities: many(opportunities),
     leads: many(leads),
     contracts: many(contracts),
   }));

   export const contactsRelations = relations(contacts, ({ one, many }) => ({
     organization: one(organizations, {
       fields: [contacts.organizationId],
       references: [organizations.id],
     }),
     interactions: many(interactions),
     opportunities: many(opportunities),
     contracts: many(contracts),
   }));
   ```

#### Validation
- [ ] All 8 models converted to Drizzle schema
- [ ] PostgreSQL-specific optimizations applied
- [ ] Enums properly defined and used
- [ ] Indexes optimized for query patterns
- [ ] Relations correctly defined
- [ ] Schema generates valid TypeScript types

---

### TODO-DZ-005: Create Database Connection Layer
**Priority**: High  
**Estimated Time**: 6 hours  
**Dependencies**: TODO-DZ-004  
**Risk Level**: Medium  

#### Task
Implement Azure-optimized database connection layer with connection pooling, monitoring, and error handling.

#### Steps
1. **Connection Pool Configuration**:
   ```typescript
   // lib/db/connection-pool.ts
   import { Pool, PoolConfig } from 'pg';
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { schema } from './schema';

   const AZURE_POSTGRESQL_CONFIG: PoolConfig = {
     connectionString: process.env.DATABASE_URL,
     // Azure PostgreSQL Basic tier optimizations
     max: 8, // Maximum connections (Azure Basic supports 100)
     min: 2, // Minimum idle connections
     idleTimeoutMillis: 30000, // 30 seconds idle timeout
     connectionTimeoutMillis: 5000, // 5 seconds connection timeout
     maxUses: 7500, // Rotate connections to prevent Azure timeouts
     ssl: {
       rejectUnauthorized: false, // Azure requires SSL but uses self-signed certs
     },
     // Performance optimizations
     query_timeout: 30000, // 30 second query timeout
     statement_timeout: 30000, // Statement timeout
     keepAlive: true,
     keepAliveInitialDelayMillis: 10000,
   };

   class AzurePostgreSQLConnectionManager {
     private static instance: AzurePostgreSQLConnectionManager;
     private pool: Pool;
     private db: ReturnType<typeof drizzle>;

     private constructor() {
       this.pool = new Pool(AZURE_POSTGRESQL_CONFIG);
       this.db = drizzle(this.pool, { schema });
       this.setupEventHandlers();
     }

     static getInstance(): AzurePostgreSQLConnectionManager {
       if (!this.instance) {
         this.instance = new AzurePostgreSQLConnectionManager();
       }
       return this.instance;
     }

     getDatabase() {
       return this.db;
     }

     private setupEventHandlers() {
       this.pool.on('connect', (client) => {
         console.log('PostgreSQL client connected');
         // Set session parameters for performance
         client.query(`
           SET statement_timeout = '30s';
           SET idle_in_transaction_session_timeout = '30s';
           SET search_path = public;
         `);
       });

       this.pool.on('error', (err) => {
         console.error('PostgreSQL pool error:', err);
         // Implement retry logic or alerting
       });

       // Graceful shutdown
       process.on('SIGINT', () => this.close());
       process.on('SIGTERM', () => this.close());
     }

     async close() {
       await this.pool.end();
     }

     // Health check for Azure monitoring
     async healthCheck(): Promise<boolean> {
       try {
         const client = await this.pool.connect();
         await client.query('SELECT 1');
         client.release();
         return true;
       } catch (error) {
         console.error('PostgreSQL health check failed:', error);
         return false;
       }
     }

     // Connection metrics for monitoring
     getConnectionMetrics() {
       return {
         totalCount: this.pool.totalCount,
         idleCount: this.pool.idleCount,
         waitingCount: this.pool.waitingCount,
       };
     }
   }

   export const connectionManager = AzurePostgreSQLConnectionManager.getInstance();
   export const db = connectionManager.getDatabase();
   ```

2. **Query Performance Monitoring**:
   ```typescript
   // lib/db/query-monitor.ts
   import { performance } from 'perf_hooks';

   export class QueryPerformanceMonitor {
     private static slowQueryThreshold = 1000; // 1 second

     static wrapQuery<T>(
       queryName: string,
       queryFn: () => Promise<T>
     ): Promise<T> {
       return new Promise(async (resolve, reject) => {
         const startTime = performance.now();
         
         try {
           const result = await queryFn();
           const duration = performance.now() - startTime;
           
           if (duration > this.slowQueryThreshold) {
             console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
             // Send to Azure Application Insights
           }
           
           resolve(result);
         } catch (error) {
           const duration = performance.now() - startTime;
           console.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
           reject(error);
         }
       });
     }
   }
   ```

3. **Transaction Management**:
   ```typescript
   // lib/db/transactions.ts
   import { db } from './connection-pool';

   export async function withTransaction<T>(
     callback: (tx: typeof db) => Promise<T>
   ): Promise<T> {
     return await db.transaction(async (tx) => {
       return await callback(tx);
     });
   }

   // Optimistic locking for concurrent updates
   export async function withOptimisticLocking<T>(
     tableName: string,
     id: string,
     expectedVersion: number,
     updateFn: () => Promise<T>
   ): Promise<T> {
     return await db.transaction(async (tx) => {
       // Check version hasn't changed
       const current = await tx.execute(
         sql`SELECT updated_at FROM ${sql.identifier(tableName)} WHERE id = ${id}`
       );
       
       if (!current.rows.length) {
         throw new Error('Record not found');
       }
       
       // Perform update with version check
       return await updateFn();
     });
   }
   ```

#### Validation
- [ ] Connection pool configured and working
- [ ] Health check endpoint functional
- [ ] Query monitoring logging slow queries
- [ ] Transaction management working
- [ ] Connection metrics available for monitoring

---

## Data Migration

### TODO-DZ-006: Create Data Migration Scripts
**Priority**: Critical  
**Estimated Time**: 16 hours  
**Dependencies**: TODO-DZ-005  
**Risk Level**: High  

#### Task
Create comprehensive data migration scripts to transfer all data from Azure SQL (Prisma) to Azure PostgreSQL (Drizzle) with data integrity validation.

#### Steps
1. **Migration Framework Setup**:
   ```typescript
   // scripts/migration/migration-framework.ts
   import { PrismaClient } from '@prisma/client';
   import { db as drizzleDb } from '../../lib/db/connection-pool';
   import { organizations, contacts, interactions } from '../../lib/db/schema';

   interface MigrationStep {
     name: string;
     execute: () => Promise<void>;
     rollback: () => Promise<void>;
     validate: () => Promise<boolean>;
   }

   class DataMigrationManager {
     private prisma: PrismaClient;
     private drizzle: typeof drizzleDb;
     private migrationSteps: MigrationStep[] = [];

     constructor() {
       this.prisma = new PrismaClient();
       this.drizzle = drizzleDb;
     }

     addStep(step: MigrationStep) {
       this.migrationSteps.push(step);
     }

     async executeMigration(): Promise<boolean> {
       console.log('Starting data migration...');
       
       for (const step of this.migrationSteps) {
         try {
           console.log(`Executing: ${step.name}`);
           await step.execute();
           
           const isValid = await step.validate();
           if (!isValid) {
             throw new Error(`Validation failed for step: ${step.name}`);
           }
           
           console.log(`✓ Completed: ${step.name}`);
         } catch (error) {
           console.error(`✗ Failed: ${step.name}`, error);
           await this.rollback(step);
           return false;
         }
       }
       
       console.log('Migration completed successfully!');
       return true;
     }

     private async rollback(failedStep: MigrationStep) {
       console.log('Rolling back migration...');
       
       const stepIndex = this.migrationSteps.indexOf(failedStep);
       for (let i = stepIndex; i >= 0; i--) {
         try {
           await this.migrationSteps[i].rollback();
           console.log(`Rolled back: ${this.migrationSteps[i].name}`);
         } catch (error) {
           console.error(`Rollback failed: ${this.migrationSteps[i].name}`, error);
         }
       }
     }
   }
   ```

2. **User and Authentication Data Migration**:
   ```typescript
   // scripts/migration/migrate-auth-data.ts
   const migrateUsers: MigrationStep = {
     name: 'Migrate Users',
     execute: async () => {
       const prismaUsers = await prisma.user.findMany({
         include: {
           accounts: true,
           sessions: true,
         }
       });

       console.log(`Migrating ${prismaUsers.length} users...`);

       for (const user of prismaUsers) {
         // Migrate user
         await drizzleDb.insert(users).values({
           id: user.id,
           name: user.name,
           email: user.email,
           emailVerified: user.emailVerified,
           image: user.image,
           password: user.password,
           role: user.role,
           isActive: user.isActive,
           lastLoginAt: user.lastLoginAt,
           resetToken: user.resetToken,
           resetTokenExpiry: user.resetTokenExpiry,
           createdAt: user.createdAt,
           updatedAt: user.updatedAt,
         });

         // Migrate accounts
         for (const account of user.accounts) {
           await drizzleDb.insert(accounts).values({
             id: account.id,
             userId: account.userId,
             type: account.type,
             provider: account.provider,
             providerAccountId: account.providerAccountId,
             refresh_token: account.refresh_token,
             access_token: account.access_token,
             expires_at: account.expires_at,
             token_type: account.token_type,
             scope: account.scope,
             id_token: account.id_token,
             session_state: account.session_state,
           });
         }

         // Migrate sessions
         for (const session of user.sessions) {
           await drizzleDb.insert(sessions).values({
             id: session.id,
             sessionToken: session.sessionToken,
             userId: session.userId,
             expires: session.expires,
           });
         }
       }
     },
     rollback: async () => {
       await drizzleDb.delete(sessions);
       await drizzleDb.delete(accounts);
       await drizzleDb.delete(users);
     },
     validate: async () => {
       const prismaCount = await prisma.user.count();
       const drizzleCount = await drizzleDb.select({ count: count() }).from(users);
       return prismaCount === drizzleCount[0].count;
     }
   };
   ```

3. **CRM Data Migration with Batch Processing**:
   ```typescript
   // scripts/migration/migrate-crm-data.ts
   const migrateOrganizations: MigrationStep = {
     name: 'Migrate Organizations',
     execute: async () => {
       const totalCount = await prisma.organization.count();
       const batchSize = 100; // Process in batches to avoid memory issues
       
       console.log(`Migrating ${totalCount} organizations in batches of ${batchSize}...`);

       for (let skip = 0; skip < totalCount; skip += batchSize) {
         const prismaOrgs = await prisma.organization.findMany({
           skip,
           take: batchSize,
           include: {
             contacts: true,
             interactions: true,
             opportunities: true,
             leads: true,
             contracts: true,
           }
         });

         await drizzleDb.transaction(async (tx) => {
           for (const org of prismaOrgs) {
             // Convert and validate enum values
             const priority = org.priority as 'A' | 'B' | 'C' | 'D';
             const segment = org.segment as any; // Map to new enum values
             const type = org.type as 'PROSPECT' | 'CUSTOMER' | 'INACTIVE';
             const status = org.status as 'ACTIVE' | 'INACTIVE' | 'LEAD';

             await tx.insert(organizations).values({
               id: org.id,
               name: org.name,
               priority,
               segment,
               type,
               address: org.address,
               city: org.city,
               state: org.state,
               zipCode: org.zipCode,
               phone: org.phone,
               email: org.email,
               website: org.website,
               notes: org.notes,
               estimatedRevenue: org.estimatedRevenue,
               employeeCount: org.employeeCount,
               primaryContact: org.primaryContact,
               lastContactDate: org.lastContactDate,
               nextFollowUpDate: org.nextFollowUpDate,
               status,
               metadata: {}, // Initialize empty JSONB
               createdAt: org.createdAt,
               updatedAt: org.updatedAt,
             });
           }
         });

         console.log(`Migrated batch ${skip + 1}-${Math.min(skip + batchSize, totalCount)}`);
       }
     },
     rollback: async () => {
       await drizzleDb.delete(organizations);
     },
     validate: async () => {
       const prismaCount = await prisma.organization.count();
       const drizzleCount = await drizzleDb.select({ count: count() }).from(organizations);
       const result = prismaCount === drizzleCount[0].count;
       
       if (!result) {
         console.error(`Organization count mismatch: Prisma ${prismaCount}, Drizzle ${drizzleCount[0].count}`);
       }
       
       return result;
     }
   };
   ```

4. **Data Integrity Validation**:
   ```typescript
   // scripts/migration/data-validation.ts
   class DataIntegrityValidator {
     static async validateForeignKeys(): Promise<boolean> {
       // Check all foreign key relationships are preserved
       const orphanedContacts = await drizzleDb
         .select({ count: count() })
         .from(contacts)
         .leftJoin(organizations, eq(contacts.organizationId, organizations.id))
         .where(isNull(organizations.id));

       if (orphanedContacts[0].count > 0) {
         console.error(`Found ${orphanedContacts[0].count} orphaned contacts`);
         return false;
       }

       return true;
     }

     static async validateDataConsistency(): Promise<boolean> {
       // Validate critical business logic
       const orgsWithoutPrimaryContact = await drizzleDb
         .select({ id: organizations.id, name: organizations.name })
         .from(organizations)
         .leftJoin(contacts, and(
           eq(contacts.organizationId, organizations.id),
           eq(contacts.isPrimary, true)
         ))
         .where(isNull(contacts.id))
         .limit(10);

       if (orgsWithoutPrimaryContact.length > 0) {
         console.warn('Organizations without primary contacts:', orgsWithoutPrimaryContact);
       }

       return true;
     }

     static async generateMigrationReport(): Promise<void> {
       const report = {
         timestamp: new Date().toISOString(),
         tables: {
           users: await drizzleDb.select({ count: count() }).from(users),
           organizations: await drizzleDb.select({ count: count() }).from(organizations),
           contacts: await drizzleDb.select({ count: count() }).from(contacts),
           interactions: await drizzleDb.select({ count: count() }).from(interactions),
         },
         dataIntegrity: {
           foreignKeysValid: await this.validateForeignKeys(),
           dataConsistent: await this.validateDataConsistency(),
         }
       };

       console.log('Migration Report:', JSON.stringify(report, null, 2));
       
       // Save report to file
       await fs.writeFile(
         `migration-report-${Date.now()}.json`, 
         JSON.stringify(report, null, 2)
       );
     }
   }
   ```

5. **Migration Execution Script**:
   ```typescript
   // scripts/run-migration.ts
   import { DataMigrationManager } from './migration/migration-framework';

   async function runFullMigration() {
     const migrator = new DataMigrationManager();

     // Add migration steps in dependency order
     migrator.addStep(migrateUsers);
     migrator.addStep(migrateOrganizations);
     migrator.addStep(migrateContacts);
     migrator.addStep(migrateInteractions);
     migrator.addStep(migrateOpportunities);
     migrator.addStep(migrateLeads);
     migrator.addStep(migrateContracts);

     const success = await migrator.executeMigration();
     
     if (success) {
       await DataIntegrityValidator.generateMigrationReport();
       console.log('✅ Migration completed successfully!');
     } else {
       console.log('❌ Migration failed. Check logs for details.');
       process.exit(1);
     }
   }

   if (require.main === module) {
     runFullMigration().catch(console.error);
   }
   ```

#### Validation
- [ ] Migration framework implemented and tested
- [ ] All data types properly converted
- [ ] Batch processing prevents memory issues
- [ ] Foreign key relationships preserved
- [ ] Data integrity validation passes
- [ ] Rollback procedures tested and working
- [ ] Migration report generated with full statistics

---

## Code Migration

### TODO-DZ-007: Update Database Access Layer
**Priority**: High  
**Estimated Time**: 20 hours  
**Dependencies**: TODO-DZ-006  
**Risk Level**: Medium  

#### Task
Replace all Prisma database operations with Drizzle equivalents while maintaining performance optimizations and API compatibility.

#### Steps
1. **Create Drizzle Query Builders**:
   ```typescript
   // lib/db/queries/organizations.ts
   import { db } from '../connection-pool';
   import { organizations, contacts, interactions } from '../schema';
   import { eq, and, like, desc, asc, sql, count } from 'drizzle-orm';
   import type { OrganizationWithDetails, OrganizationFilters } from '@/types/crm';

   export class OrganizationQueries {
     // Replace Prisma findMany with Drizzle select
     static async findMany(filters?: OrganizationFilters): Promise<OrganizationWithDetails[]> {
       let query = db
         .select()
         .from(organizations)
         .leftJoin(contacts, eq(contacts.organizationId, organizations.id));

       // Apply filters
       if (filters?.status) {
         query = query.where(eq(organizations.status, filters.status));
       }
       
       if (filters?.priority) {
         query = query.where(eq(organizations.priority, filters.priority));
       }

       if (filters?.search) {
         query = query.where(
           sql`to_tsvector('english', ${organizations.name}) @@ plainto_tsquery('english', ${filters.search})`
         );
       }

       return await query
         .orderBy(desc(organizations.updatedAt))
         .limit(filters?.limit || 50);
     }

     // Replace Prisma create with Drizzle insert
     static async create(data: CreateOrganizationRequest): Promise<OrganizationWithDetails> {
       const [newOrg] = await db
         .insert(organizations)
         .values({
           name: data.name,
           priority: data.priority,
           segment: data.segment,
           type: data.type || 'PROSPECT',
           address: data.address,
           city: data.city,
           state: data.state,
           zipCode: data.zipCode,
           phone: data.phone,
           email: data.email,
           website: data.website,
           notes: data.notes,
           estimatedRevenue: data.estimatedRevenue,
           employeeCount: data.employeeCount,
           status: 'ACTIVE',
         })
         .returning();

       return newOrg;
     }

     // Replace Prisma update with Drizzle update
     static async update(id: string, data: UpdateOrganizationRequest): Promise<OrganizationWithDetails> {
       const [updatedOrg] = await db
         .update(organizations)
         .set({
           ...data,
           updatedAt: new Date(),
         })
         .where(eq(organizations.id, id))
         .returning();

       if (!updatedOrg) {
         throw new Error('Organization not found');
       }

       return updatedOrg;
     }

     // Complex query with joins and aggregations
     static async getWithAnalytics(id: string): Promise<OrganizationWithDetails & { analytics: any }> {
       const [org] = await db
         .select({
           ...organizations,
           contactCount: count(contacts.id),
           lastInteraction: sql<Date>`MAX(${interactions.createdAt})`,
         })
         .from(organizations)
         .leftJoin(contacts, eq(contacts.organizationId, organizations.id))
         .leftJoin(interactions, eq(interactions.organizationId, organizations.id))
         .where(eq(organizations.id, id))
         .groupBy(organizations.id);

       return org;
     }
   }
   ```

2. **Replace OptimizedPrismaClient**:
   ```typescript
   // lib/db/optimized-drizzle-client.ts
   import { db } from './connection-pool';
   import { OrganizationQueries } from './queries/organizations';
   import { ContactQueries } from './queries/contacts';
   import { InteractionQueries } from './queries/interactions';
   import { QueryPerformanceMonitor } from './query-monitor';

   export class OptimizedDrizzleClient {
     // Organization operations
     async getOrganizations(filters?: OrganizationFilters): Promise<OrganizationWithDetails[]> {
       return QueryPerformanceMonitor.wrapQuery(
         'getOrganizations',
         () => OrganizationQueries.findMany(filters)
       );
     }

     async createOrganization(data: CreateOrganizationRequest): Promise<OrganizationWithDetails> {
       return QueryPerformanceMonitor.wrapQuery(
         'createOrganization',
         () => OrganizationQueries.create(data)
       );
     }

     async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<OrganizationWithDetails> {
       return QueryPerformanceMonitor.wrapQuery(
         'updateOrganization',
         () => OrganizationQueries.update(id, data)
       );
     }

     // Contact operations
     async getContacts(organizationId?: string): Promise<ContactWithDetails[]> {
       return QueryPerformanceMonitor.wrapQuery(
         'getContacts',
         () => ContactQueries.findMany({ organizationId })
       );
     }

     // Dashboard metrics with PostgreSQL-specific optimizations
     async getDashboardMetrics(): Promise<DashboardMetrics> {
       return QueryPerformanceMonitor.wrapQuery(
         'getDashboardMetrics',
         async () => {
           const [metrics] = await db
             .select({
               totalOrganizations: count(organizations.id),
               activeOrganizations: sql<number>`COUNT(CASE WHEN ${organizations.status} = 'ACTIVE' THEN 1 END)`,
               totalContacts: sql<number>`(SELECT COUNT(*) FROM ${contacts})`,
               totalInteractions: sql<number>`(SELECT COUNT(*) FROM ${interactions})`,
               avgRevenue: sql<number>`AVG(${organizations.estimatedRevenue})`,
               topPriorityCount: sql<number>`COUNT(CASE WHEN ${organizations.priority} = 'A' THEN 1 END)`,
             })
             .from(organizations);

           return metrics;
         }
       );
     }

     // Health check
     async healthCheck(): Promise<boolean> {
       try {
         await db.select({ test: sql<number>`1` });
         return true;
       } catch {
         return false;
       }
     }
   }

   // Export singleton instance
   export const optimizedDrizzleClient = new OptimizedDrizzleClient();
   ```

3. **Update API Routes**:
   ```typescript
   // app/api/crm/account/route.ts - Update to use Drizzle
   import { optimizedDrizzleClient } from '@/lib/db/optimized-drizzle-client';

   export async function POST(req: NextRequest): Promise<NextResponse<APIResponse<OrganizationWithDetails>>> {
     try {
       const result = await parseRequestBody(req, validateCreateOrganization);
       if (!result.success) {
         return handleValidationError([{ field: 'body', message: result.error.message }]);
       }
       const { data } = result;

       // Replace prisma.createOrganization with drizzle equivalent
       const newOrganization = await optimizedDrizzleClient.createOrganization(data);
       
       return createSuccessResponse(newOrganization);
     } catch (error) {
       return handlePrismaError(error); // Will be renamed to handleDatabaseError
     }
   }

   export async function GET(req: NextRequest): Promise<NextResponse<APIResponse<OrganizationWithDetails[]>>> {
     try {
       const url = new URL(req.url);
       const filters = {
         status: url.searchParams.get('status'),
         priority: url.searchParams.get('priority'),
         search: url.searchParams.get('search'),
         limit: Number(url.searchParams.get('limit')) || 50,
       };

       const organizations = await optimizedDrizzleClient.getOrganizations(filters);
       
       return createSuccessResponse(organizations);
     } catch (error) {
       return handleDatabaseError(error);
     }
   }
   ```

4. **Update Components and Actions**:
   ```typescript
   // actions/organizations/create-organization.ts
   import { optimizedDrizzleClient } from '@/lib/db/optimized-drizzle-client';

   export async function createOrganization(data: CreateOrganizationRequest): Promise<ActionResult<OrganizationWithDetails>> {
     try {
       const newOrg = await optimizedDrizzleClient.createOrganization(data);
       
       revalidatePath('/organizations');
       
       return {
         success: true,
         data: newOrg,
       };
     } catch (error) {
       return {
         success: false,
         error: {
           code: ErrorCode.DATABASE_ERROR,
           message: 'Failed to create organization',
           details: error
         }
       };
     }
   }
   ```

#### Validation
- [ ] All Prisma queries replaced with Drizzle equivalents
- [ ] Performance monitoring maintained
- [ ] API routes updated and tested
- [ ] Components and actions updated
- [ ] Query performance equal or better than Prisma
- [ ] Error handling properly updated

---

### TODO-DZ-008: Update Type Definitions
**Priority**: Medium  
**Estimated Time**: 8 hours  
**Dependencies**: TODO-DZ-007  
**Risk Level**: Low  

#### Task
Update TypeScript type definitions to use Drizzle-generated types instead of Prisma types.

#### Steps
1. **Generate Drizzle Types**:
   ```typescript
   // lib/db/types.ts - Generated from Drizzle schema
   import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
   import { 
     organizations, 
     contacts, 
     interactions, 
     opportunities,
     users,
     accounts,
     sessions
   } from './schema';

   // Base model types
   export type Organization = InferSelectModel<typeof organizations>;
   export type NewOrganization = InferInsertModel<typeof organizations>;
   export type Contact = InferSelectModel<typeof contacts>;
   export type NewContact = InferInsertModel<typeof contacts>;
   export type Interaction = InferSelectModel<typeof interactions>;
   export type NewInteraction = InferInsertModel<typeof interactions>;
   export type User = InferSelectModel<typeof users>;
   export type Account = InferSelectModel<typeof accounts>;
   export type Session = InferSelectModel<typeof sessions>;

   // Complex types with relations
   export type OrganizationWithDetails = Organization & {
     contacts: Contact[];
     interactions: Interaction[];
     opportunities: Opportunity[];
     _count?: {
       contacts: number;
       interactions: number;
       opportunities: number;
     };
   };

   export type ContactWithDetails = Contact & {
     organization: Organization;
     interactions: Interaction[];
   };
   ```

2. **Update CRM Types**:
   ```typescript
   // types/crm.ts - Update to use Drizzle types
   import type { 
     Organization,
     OrganizationWithDetails,
     Contact,
     ContactWithDetails,
     Interaction,
     User
   } from '@/lib/db/types';

   // Re-export Drizzle types
   export type {
     Organization,
     OrganizationWithDetails,
     Contact,
     ContactWithDetails,
     Interaction,
     User
   };

   // Keep existing enum and utility types
   export const ORGANIZATION_PRIORITIES = ['A', 'B', 'C', 'D'] as const;
   export type OrganizationPriority = typeof ORGANIZATION_PRIORITIES[number];

   // Update request/response types
   export type CreateOrganizationRequest = Omit<NewOrganization, 'id' | 'createdAt' | 'updatedAt'>;
   export type UpdateOrganizationRequest = Partial<CreateOrganizationRequest>;

   // API response types remain the same
   export interface APIResponse<T> {
     success: boolean;
     data?: T;
     error?: AppError;
     metadata?: {
       total?: number;
       page?: number;
       limit?: number;
       hasMore?: boolean;
     };
   }
   ```

3. **Update Component Props**:
   ```typescript
   // components/organizations/organization-list.tsx
   import type { OrganizationWithDetails } from '@/types/crm';

   interface OrganizationListProps {
     organizations: OrganizationWithDetails[];
     onSelect?: (org: OrganizationWithDetails) => void;
   }

   export function OrganizationList({ organizations, onSelect }: OrganizationListProps) {
     // Component implementation remains the same
     // Types now come from Drizzle instead of Prisma
   }
   ```

4. **Update Validation Schemas**:
   ```typescript
   // lib/types/validation.ts - Update Zod schemas for Drizzle types
   import { z } from 'zod';
   import { ORGANIZATION_PRIORITIES, ORGANIZATION_SEGMENTS } from '@/types/crm';

   export const createOrganizationSchema = z.object({
     name: z.string().min(1, 'Name is required').max(255),
     priority: z.enum(['A', 'B', 'C', 'D']),
     segment: z.enum([
       'FINE_DINING', 'FAST_FOOD', 'CASUAL_DINING', 'CATERING',
       'INSTITUTIONAL', 'HEALTHCARE', 'EDUCATION', 'CORPORATE'
     ]),
     type: z.enum(['PROSPECT', 'CUSTOMER', 'INACTIVE']).default('PROSPECT'),
     address: z.string().optional(),
     city: z.string().optional(),
     state: z.string().optional(),
     zipCode: z.string().optional(),
     phone: z.string().optional(),
     email: z.string().email().optional().or(z.literal('')),
     website: z.string().url().optional().or(z.literal('')),
     notes: z.string().optional(),
     estimatedRevenue: z.number().positive().optional(),
     employeeCount: z.number().int().positive().optional(),
   });

   export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;
   ```

#### Validation
- [ ] All Prisma type imports replaced
- [ ] Drizzle-generated types properly exported
- [ ] Component props updated to use new types
- [ ] Validation schemas compatible with Drizzle types
- [ ] TypeScript compilation passes without errors
- [ ] No runtime type errors

---

## Testing and Deployment

### TODO-DZ-009: Update Tests for Drizzle
**Priority**: Medium  
**Estimated Time**: 12 hours  
**Dependencies**: TODO-DZ-008  
**Risk Level**: Medium  

#### Task
Update all tests to use Drizzle instead of Prisma, including unit tests, integration tests, and API tests.

#### Steps
1. **Update Test Database Setup**:
   ```typescript
   // __tests__/setup/test-db.ts
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';
   import { migrate } from 'drizzle-kit/migrator';
   import { schema } from '@/lib/db/schema';

   const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
     'postgresql://test:test@localhost:5432/pantrycrm_test';

   let testDb: ReturnType<typeof drizzle>;
   let testClient: postgres.Sql;

   export async function setupTestDatabase() {
     testClient = postgres(TEST_DATABASE_URL, { max: 1 });
     testDb = drizzle(testClient, { schema });

     // Run migrations
     await migrate(testDb, { migrationsFolder: './lib/db/migrations' });

     return testDb;
   }

   export async function cleanupTestDatabase() {
     // Clean all tables
     await testDb.delete(interactions);
     await testDb.delete(contacts);
     await testDb.delete(organizations);
     await testDb.delete(sessions);
     await testDb.delete(accounts);
     await testDb.delete(users);
   }

   export async function teardownTestDatabase() {
     await testClient.end();
   }

   export { testDb };
   ```

2. **Update API Route Tests**:
   ```typescript
   // __tests__/api/organizations.test.ts
   import { POST, GET } from '@/app/api/crm/account/route';
   import { setupTestDatabase, cleanupTestDatabase, testDb } from '../setup/test-db';
   import { organizations } from '@/lib/db/schema';

   describe('/api/crm/account', () => {
     beforeAll(async () => {
       await setupTestDatabase();
     });

     afterEach(async () => {
       await cleanupTestDatabase();
     });

     describe('POST', () => {
       it('should create a new organization', async () => {
         const mockRequest = new Request('http://localhost:3000/api/crm/account', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             name: 'Test Restaurant',
             priority: 'A',
             segment: 'FINE_DINING',
             email: 'test@restaurant.com'
           }),
         });

         const response = await POST(mockRequest);
         const data = await response.json();

         expect(response.status).toBe(201);
         expect(data.success).toBe(true);
         expect(data.data.name).toBe('Test Restaurant');

         // Verify in database
         const dbOrg = await testDb
           .select()
           .from(organizations)
           .where(eq(organizations.id, data.data.id));
         
         expect(dbOrg).toHaveLength(1);
         expect(dbOrg[0].name).toBe('Test Restaurant');
       });

       it('should validate required fields', async () => {
         const mockRequest = new Request('http://localhost:3000/api/crm/account', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({}), // Missing required fields
         });

         const response = await POST(mockRequest);
         const data = await response.json();

         expect(response.status).toBe(400);
         expect(data.success).toBe(false);
         expect(data.error.code).toBe('VALIDATION_ERROR');
       });
     });
   });
   ```

3. **Update Database Integration Tests**:
   ```typescript
   // __tests__/db/organization-queries.test.ts
   import { OrganizationQueries } from '@/lib/db/queries/organizations';
   import { setupTestDatabase, cleanupTestDatabase, testDb } from '../setup/test-db';
   import { organizations } from '@/lib/db/schema';

   describe('OrganizationQueries', () => {
     beforeAll(async () => {
       await setupTestDatabase();
     });

     afterEach(async () => {
       await cleanupTestDatabase();
     });

     describe('findMany', () => {
       it('should return filtered organizations', async () => {
         // Seed test data
         await testDb.insert(organizations).values([
           {
             name: 'High Priority Restaurant',
             priority: 'A',
             segment: 'FINE_DINING',
             status: 'ACTIVE'
           },
           {
             name: 'Low Priority Cafe',
             priority: 'D',
             segment: 'FAST_FOOD',
             status: 'ACTIVE'
           }
         ]);

         const results = await OrganizationQueries.findMany({
           priority: 'A'
         });

         expect(results).toHaveLength(1);
         expect(results[0].name).toBe('High Priority Restaurant');
       });

       it('should support full-text search', async () => {
         await testDb.insert(organizations).values([
           {
             name: 'Italian Bistro',
             priority: 'B',
             segment: 'FINE_DINING',
             status: 'ACTIVE'
           },
           {
             name: 'Mexican Grill',
             priority: 'B',
             segment: 'CASUAL_DINING',
             status: 'ACTIVE'
           }
         ]);

         const results = await OrganizationQueries.findMany({
           search: 'Italian'
         });

         expect(results).toHaveLength(1);
         expect(results[0].name).toBe('Italian Bistro');
       });
     });
   });
   ```

4. **Performance and Load Tests**:
   ```typescript
   // __tests__/performance/query-performance.test.ts
   import { OrganizationQueries } from '@/lib/db/queries/organizations';
   import { setupTestDatabase, cleanupTestDatabase } from '../setup/test-db';

   describe('Query Performance', () => {
     beforeAll(async () => {
       await setupTestDatabase();
       // Seed large dataset for performance testing
       await seedLargeDataset();
     });

     afterAll(async () => {
       await cleanupTestDatabase();
     });

     it('should handle large result sets efficiently', async () => {
       const startTime = performance.now();
       
       const results = await OrganizationQueries.findMany({
         limit: 1000
       });
       
       const duration = performance.now() - startTime;
       
       expect(results).toHaveLength(1000);
       expect(duration).toBeLessThan(1000); // Should complete in under 1 second
     });

     it('should use indexes for filtered queries', async () => {
       const startTime = performance.now();
       
       const results = await OrganizationQueries.findMany({
         status: 'ACTIVE',
         priority: 'A'
       });
       
       const duration = performance.now() - startTime;
       
       expect(duration).toBeLessThan(100); // Indexed query should be very fast
     });
   });
   ```

#### Validation
- [ ] All tests updated to use Drizzle
- [ ] Test database setup working
- [ ] API tests passing
- [ ] Database query tests passing
- [ ] Performance tests validate query optimization
- [ ] Test coverage maintained or improved

---

### TODO-DZ-010: Staging Environment Migration
**Priority**: High  
**Estimated Time**: 10 hours  
**Dependencies**: TODO-DZ-009  
**Risk Level**: High  

#### Task
Create and deploy staging environment with Drizzle + PostgreSQL to validate the complete migration before production deployment.

#### Steps
1. **Create Staging Azure Resources**:
   ```bash
   # Create staging resource group
   az group create --name pantrycrm-staging-rg --location eastus

   # Create staging PostgreSQL server
   az postgres flexible-server create \
     --resource-group pantrycrm-staging-rg \
     --name pantrycrm-staging-postgres \
     --location eastus \
     --admin-user crmadmin \
     --admin-password <staging-password> \
     --sku-name Standard_B1ms \
     --tier Burstable \
     --version 15 \
     --storage-size 32 \
     --backup-retention 7

   # Create staging App Service
   az appservice plan create \
     --name pantrycrm-staging-plan \
     --resource-group pantrycrm-staging-rg \
     --sku B1 \
     --is-linux

   az webapp create \
     --resource-group pantrycrm-staging-rg \
     --plan pantrycrm-staging-plan \
     --name pantrycrm-staging \
     --runtime "NODE:18-lts"
   ```

2. **Staging Deployment Pipeline**:
   ```yaml
   # .github/workflows/staging-deployment.yml
   name: Deploy to Staging

   on:
     push:
       branches: [ drizzle-migration ]

   jobs:
     deploy-staging:
       runs-on: ubuntu-latest
       
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Run tests
           run: npm run test:ci
           env:
             TEST_DATABASE_URL: ${{ secrets.STAGING_TEST_DATABASE_URL }}
             
         - name: Build application
           run: npm run build
           env:
             DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
             
         - name: Run Drizzle migrations
           run: npm run db:migrate
           env:
             DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
             
         - name: Deploy to Azure
           uses: azure/webapps-deploy@v2
           with:
             app-name: pantrycrm-staging
             publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
   ```

3. **Staging Migration Validation**:
   ```typescript
   // scripts/staging-validation.ts
   import { optimizedDrizzleClient } from '@/lib/db/optimized-drizzle-client';
   import { connectionManager } from '@/lib/db/connection-pool';

   class StagingValidator {
     async validateDatabaseConnection(): Promise<boolean> {
       try {
         const isHealthy = await connectionManager.healthCheck();
         console.log('Database health check:', isHealthy ? 'PASS' : 'FAIL');
         return isHealthy;
       } catch (error) {
         console.error('Database connection failed:', error);
         return false;
       }
     }

     async validateDataIntegrity(): Promise<boolean> {
       try {
         // Test basic CRUD operations
         const testOrg = await optimizedDrizzleClient.createOrganization({
           name: 'Staging Test Organization',
           priority: 'A',
           segment: 'FINE_DINING'
         });

         const retrieved = await optimizedDrizzleClient.getOrganizations({
           search: 'Staging Test'
         });

         const found = retrieved.find(org => org.id === testOrg.id);
         
         if (!found) {
           console.error('Created organization not found in search');
           return false;
         }

         console.log('Data integrity check: PASS');
         return true;
       } catch (error) {
         console.error('Data integrity check failed:', error);
         return false;
       }
     }

     async validatePerformance(): Promise<boolean> {
       try {
         const startTime = performance.now();
         
         const metrics = await optimizedDrizzleClient.getDashboardMetrics();
         
         const duration = performance.now() - startTime;
         
         if (duration > 2000) { // Should complete in under 2 seconds
           console.error(`Dashboard metrics too slow: ${duration}ms`);
           return false;
         }

         console.log(`Performance check: PASS (${duration.toFixed(2)}ms)`);
         return true;
       } catch (error) {
         console.error('Performance validation failed:', error);
         return false;
       }
     }

     async runFullValidation(): Promise<boolean> {
       console.log('Running staging environment validation...');
       
       const tests = [
         this.validateDatabaseConnection(),
         this.validateDataIntegrity(),
         this.validatePerformance()
       ];

       const results = await Promise.all(tests);
       const allPassed = results.every(result => result);

       console.log('Staging validation:', allPassed ? 'PASS' : 'FAIL');
       return allPassed;
     }
   }

   if (require.main === module) {
     const validator = new StagingValidator();
     validator.runFullValidation()
       .then(success => process.exit(success ? 0 : 1))
       .catch(error => {
         console.error('Validation failed:', error);
         process.exit(1);
       });
   }
   ```

4. **Staging Environment Configuration**:
   ```bash
   # Set staging environment variables
   az webapp config appsettings set \
     --resource-group pantrycrm-staging-rg \
     --name pantrycrm-staging \
     --settings \
     DATABASE_URL="postgresql://crmadmin:password@pantrycrm-staging-postgres.postgres.database.azure.com:5432/pantrycrm?sslmode=require" \
     NODE_ENV="staging" \
     NEXTAUTH_URL="https://pantrycrm-staging.azurewebsites.net" \
     JWT_SECRET="staging-jwt-secret"
   ```

#### Validation
- [ ] Staging environment provisioned successfully
- [ ] Database migration completed without errors
- [ ] Application deployed and accessible
- [ ] All validation tests passing
- [ ] Performance meets requirements
- [ ] User acceptance testing completed

---

### TODO-DZ-011: Production Migration Planning
**Priority**: Critical  
**Estimated Time**: 16 hours  
**Dependencies**: TODO-DZ-010  
**Risk Level**: Very High  

#### Task
Plan and execute production migration with zero-downtime strategy and comprehensive rollback procedures.

#### Steps
1. **Pre-Migration Production Backup**:
   ```bash
   # Create full backup of production Azure SQL database
   az sql db export \
     --resource-group pantrycrm-prod-rg \
     --server pantrycrm-sql-server \
     --name pantrycrm \
     --admin-user crmadmin \
     --admin-password <password> \
     --storage-key <storage-key> \
     --storage-key-type StorageAccessKey \
     --storage-uri "https://backupstorage.blob.core.windows.net/sql-backups/pre-migration-backup.bacpac"

   # Verify backup integrity
   az sql db show-deleted \
     --resource-group pantrycrm-prod-rg \
     --server pantrycrm-sql-server
   ```

2. **Zero-Downtime Migration Strategy**:
   ```typescript
   // scripts/production-migration/zero-downtime-migration.ts
   import { ProductionMigrationManager } from './production-migration-manager';

   class ZeroDowntimeMigration {
     private migrationManager: ProductionMigrationManager;

     constructor() {
       this.migrationManager = new ProductionMigrationManager();
     }

     async executeBlueGreenDeployment(): Promise<boolean> {
       console.log('Starting blue-green deployment...');

       try {
         // Phase 1: Setup green environment (PostgreSQL)
         await this.migrationManager.setupGreenEnvironment();
         
         // Phase 2: Replicate data to green environment
         await this.migrationManager.replicateDataToGreen();
         
         // Phase 3: Set up data synchronization
         await this.migrationManager.setupDataSync();
         
         // Phase 4: Run validation tests on green
         const greenValid = await this.migrationManager.validateGreenEnvironment();
         if (!greenValid) {
           throw new Error('Green environment validation failed');
         }
         
         // Phase 5: Switch traffic to green (atomic operation)
         await this.migrationManager.switchTrafficToGreen();
         
         // Phase 6: Monitor for issues
         const monitoringResults = await this.migrationManager.monitorPostSwitch(
           5 * 60 * 1000 // 5 minutes
         );
         
         if (!monitoringResults.healthy) {
           // Rollback if issues detected
           await this.migrationManager.rollbackToBlue();
           return false;
         }
         
         // Phase 7: Cleanup blue environment
         await this.migrationManager.cleanupBlueEnvironment();
         
         console.log('Blue-green deployment completed successfully');
         return true;
         
       } catch (error) {
         console.error('Migration failed:', error);
         await this.migrationManager.rollbackToBlue();
         return false;
       }
     }
   }
   ```

3. **Data Synchronization During Migration**:
   ```typescript
   // scripts/production-migration/data-sync.ts
   import { PrismaClient } from '@prisma/client';
   import { optimizedDrizzleClient } from '@/lib/db/optimized-drizzle-client';

   class ProductionDataSync {
     private prisma: PrismaClient;
     private drizzle: typeof optimizedDrizzleClient;
     private syncInterval: NodeJS.Timeout | null = null;

     constructor() {
       this.prisma = new PrismaClient();
       this.drizzle = optimizedDrizzleClient;
     }

     async startRealTimeSync(): Promise<void> {
       console.log('Starting real-time data synchronization...');

       // Set up change tracking on SQL Server
       await this.setupChangeTracking();

       // Start sync process
       this.syncInterval = setInterval(async () => {
         try {
           await this.syncChanges();
         } catch (error) {
           console.error('Sync error:', error);
           // Implement alerting here
         }
       }, 5000); // Sync every 5 seconds
     }

     private async setupChangeTracking(): Promise<void> {
       // Enable change tracking on source database
       await this.prisma.$executeRaw`
         ALTER DATABASE pantrycrm SET CHANGE_TRACKING = ON
         (CHANGE_RETENTION = 2 DAYS, AUTO_CLEANUP = ON)
       `;

       await this.prisma.$executeRaw`
         ALTER TABLE Organization ENABLE CHANGE_TRACKING
         WITH (TRACK_COLUMNS_UPDATED = ON)
       `;

       await this.prisma.$executeRaw`
         ALTER TABLE Contact ENABLE CHANGE_TRACKING
         WITH (TRACK_COLUMNS_UPDATED = ON)
       `;
     }

     private async syncChanges(): Promise<void> {
       // Get changes since last sync
       const changedOrgs = await this.prisma.$queryRaw`
         SELECT o.*, CT.SYS_CHANGE_OPERATION
         FROM Organization o
         RIGHT OUTER JOIN CHANGETABLE(CHANGES Organization, 0) AS CT
         ON o.id = CT.id
       `;

       // Apply changes to PostgreSQL
       for (const change of changedOrgs as any[]) {
         if (change.SYS_CHANGE_OPERATION === 'I') {
           // Insert
           await this.drizzle.createOrganization(change);
         } else if (change.SYS_CHANGE_OPERATION === 'U') {
           // Update
           await this.drizzle.updateOrganization(change.id, change);
         } else if (change.SYS_CHANGE_OPERATION === 'D') {
           // Delete
           await this.drizzle.deleteOrganization(change.id);
         }
       }
     }

     async stopSync(): Promise<void> {
       if (this.syncInterval) {
         clearInterval(this.syncInterval);
         this.syncInterval = null;
       }
       console.log('Data synchronization stopped');
     }
   }
   ```

4. **Production Rollback Procedures**:
   ```typescript
   // scripts/production-migration/rollback-procedures.ts
   class ProductionRollback {
     async executeEmergencyRollback(): Promise<boolean> {
       console.log('EMERGENCY ROLLBACK INITIATED');

       try {
         // Step 1: Switch traffic back to blue environment (SQL Server)
         await this.switchTrafficToBlue();
         
         // Step 2: Verify blue environment health
         const blueHealthy = await this.verifyBlueEnvironmentHealth();
         if (!blueHealthy) {
           throw new Error('Blue environment is not healthy');
         }
         
         // Step 3: Stop data sync to prevent conflicts
         await this.stopDataSync();
         
         // Step 4: Notify operations team
         await this.sendRollbackNotification();
         
         console.log('Emergency rollback completed successfully');
         return true;
         
       } catch (error) {
         console.error('CRITICAL: Rollback failed:', error);
         await this.sendCriticalAlert(error);
         return false;
       }
     }

     private async switchTrafficToBlue(): Promise<void> {
       // Update Azure Traffic Manager or Load Balancer
       // to route traffic back to SQL Server deployment
       await this.updateTrafficRouting('blue');
     }

     private async verifyBlueEnvironmentHealth(): Promise<boolean> {
       // Comprehensive health check of SQL Server environment
       const checks = [
         this.checkDatabaseConnectivity(),
         this.checkApplicationHealth(),
         this.checkPerformanceMetrics()
       ];

       const results = await Promise.all(checks);
       return results.every(result => result);
     }
   }
   ```

5. **Production Migration Checklist**:
   ```markdown
   ## Production Migration Checklist

   ### Pre-Migration (24 hours before)
   - [ ] Staging environment fully validated
   - [ ] Production backup completed and verified
   - [ ] Emergency contacts notified
   - [ ] Rollback procedures tested
   - [ ] Monitoring and alerting configured
   - [ ] Customer communication sent

   ### Migration Day (T-0)
   - [ ] Final staging validation completed
   - [ ] Production traffic baseline captured
   - [ ] Migration team assembled
   - [ ] Blue-green deployment initiated
   - [ ] Data synchronization started
   - [ ] Green environment validation passed

   ### Traffic Switch (T+2 hours)
   - [ ] Final data sync completed
   - [ ] Traffic switched to green environment
   - [ ] Health checks passing
   - [ ] Performance metrics within acceptable range
   - [ ] Customer-facing features working

   ### Post-Migration (T+4 hours)
   - [ ] Extended monitoring period completed
   - [ ] Customer feedback positive
   - [ ] Performance improved or maintained
   - [ ] Data integrity verified
   - [ ] Blue environment cleanup scheduled

   ### Migration Success Criteria
   - [ ] Zero data loss
   - [ ] <30 seconds downtime
   - [ ] Performance equal or better than before
   - [ ] All customer-facing features working
   - [ ] No critical issues reported
   ```

#### Validation
- [ ] Production migration plan reviewed and approved
- [ ] Backup and recovery procedures tested
- [ ] Zero-downtime strategy validated
- [ ] Rollback procedures tested in staging
- [ ] Emergency contacts and communication plan ready
- [ ] Performance and monitoring baselines established

---

## Post-Migration Optimization

### TODO-DZ-012: Performance Optimization and Monitoring
**Priority**: Medium  
**Estimated Time**: 8 hours  
**Dependencies**: TODO-DZ-011  
**Risk Level**: Low  

#### Task
Optimize PostgreSQL performance and implement comprehensive monitoring for the production environment.

#### Steps
1. **PostgreSQL Performance Tuning**:
   ```sql
   -- Production PostgreSQL optimization for Azure B1 workload
   
   -- Memory settings for 1.75GB RAM
   ALTER SYSTEM SET shared_buffers = '256MB';              -- 25% of RAM
   ALTER SYSTEM SET effective_cache_size = '1GB';          -- 75% of RAM
   ALTER SYSTEM SET maintenance_work_mem = '128MB';
   ALTER SYSTEM SET work_mem = '8MB';                       -- Per connection
   ALTER SYSTEM SET max_connections = 80;                  -- Leave room for Azure overhead
   
   -- WAL and checkpoint optimization
   ALTER SYSTEM SET wal_buffers = '16MB';
   ALTER SYSTEM SET checkpoint_completion_target = 0.9;
   ALTER SYSTEM SET checkpoint_segments = 32;
   ALTER SYSTEM SET checkpoint_timeout = '15min';
   
   -- Query optimization
   ALTER SYSTEM SET random_page_cost = 1.1;                -- SSD storage
   ALTER SYSTEM SET effective_io_concurrency = 200;        -- SSD value
   ALTER SYSTEM SET default_statistics_target = 100;
   
   -- Autovacuum tuning for CRM workload
   ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
   ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;
   ALTER SYSTEM SET autovacuum_vacuum_cost_delay = 10;
   
   SELECT pg_reload_conf();
   ```

2. **Query Performance Monitoring**:
   ```typescript
   // lib/monitoring/query-performance.ts
   import { db } from '@/lib/db/connection-pool';

   export class QueryPerformanceAnalyzer {
     async analyzeSlowQueries(): Promise<SlowQueryReport[]> {
       const slowQueries = await db.execute(sql`
         SELECT 
           query,
           calls,
           total_time,
           mean_time,
           rows,
           100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
         FROM pg_stat_statements 
         WHERE mean_time > 100  -- Queries taking more than 100ms
         ORDER BY mean_time DESC 
         LIMIT 20
       `);

       return slowQueries.rows.map(row => ({
         query: row.query,
         calls: row.calls,
         avgTime: row.mean_time,
         totalTime: row.total_time,
         hitPercent: row.hit_percent
       }));
     }

     async generatePerformanceReport(): Promise<PerformanceReport> {
       const [
         slowQueries,
         indexUsage,
         tableStats,
         connectionStats
       ] = await Promise.all([
         this.analyzeSlowQueries(),
         this.analyzeIndexUsage(),
         this.analyzeTableStats(),
         this.analyzeConnectionStats()
       ]);

       return {
         timestamp: new Date(),
         slowQueries,
         indexUsage,
         tableStats,
         connectionStats,
         recommendations: this.generateRecommendations({
           slowQueries,
           indexUsage,
           tableStats
         })
       };
     }

     private generateRecommendations(data: any): string[] {
       const recommendations: string[] = [];

       // Check for unused indexes
       const unusedIndexes = data.indexUsage.filter(idx => idx.usage < 10);
       if (unusedIndexes.length > 0) {
         recommendations.push(`Consider dropping ${unusedIndexes.length} unused indexes`);
       }

       // Check for missing indexes on frequent queries
       const slowQueries = data.slowQueries.filter(q => q.calls > 100 && q.avgTime > 500);
       if (slowQueries.length > 0) {
         recommendations.push(`${slowQueries.length} frequent slow queries need optimization`);
       }

       return recommendations;
     }
   }
   ```

3. **Azure Monitor Integration**:
   ```typescript
   // lib/monitoring/azure-monitor.ts
   import { ApplicationInsights } from '@azure/monitor-opentelemetry';

   export class CRMMonitoring {
     private appInsights: ApplicationInsights;

     constructor() {
       this.appInsights = new ApplicationInsights({
         connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
       });
     }

     trackDatabaseMetrics(metrics: DatabaseMetrics): void {
       this.appInsights.trackMetric({
         name: 'database.query.duration',
         value: metrics.avgQueryTime,
         properties: {
           database: 'postgresql',
           environment: process.env.NODE_ENV
         }
       });

       this.appInsights.trackMetric({
         name: 'database.connections.active',
         value: metrics.activeConnections,
       });

       this.appInsights.trackMetric({
         name: 'database.cache.hit_ratio',
         value: metrics.cacheHitRatio,
       });
     }

     trackBusinessMetrics(metrics: BusinessMetrics): void {
       this.appInsights.trackMetric({
         name: 'crm.organizations.total',
         value: metrics.totalOrganizations,
       });

       this.appInsights.trackMetric({
         name: 'crm.interactions.daily',
         value: metrics.dailyInteractions,
       });

       this.appInsights.trackMetric({
         name: 'crm.revenue.pipeline',
         value: metrics.pipelineRevenue,
       });
     }

     async createDashboard(): Promise<void> {
       // Create Azure Monitor dashboard with key CRM metrics
       const dashboardConfig = {
         title: 'Kitchen Pantry CRM - PostgreSQL Performance',
         widgets: [
           {
             type: 'metric',
             title: 'Database Query Performance',
             metrics: ['database.query.duration', 'database.connections.active']
           },
           {
             type: 'metric',
             title: 'Business Metrics',
             metrics: ['crm.organizations.total', 'crm.interactions.daily']
           },
           {
             type: 'log',
             title: 'Slow Queries',
             query: 'customMetrics | where name == "database.query.duration" | where value > 1000'
           }
         ]
       };

       // Deploy dashboard via Azure REST API
       await this.deployDashboard(dashboardConfig);
     }
   }
   ```

#### Validation
- [ ] PostgreSQL performance tuned for workload
- [ ] Query performance monitoring implemented
- [ ] Azure Monitor integration working
- [ ] Performance dashboard created
- [ ] Alerting configured for critical metrics

---

## Final Documentation and Cleanup

### TODO-DZ-013: Documentation and Team Training
**Priority**: Medium  
**Estimated Time**: 6 hours  
**Dependencies**: TODO-DZ-012  
**Risk Level**: Low  

#### Task
Create comprehensive documentation for the new Drizzle + PostgreSQL architecture and train the development team.

#### Steps
1. **Architecture Documentation**:
   ```markdown
   # Kitchen Pantry CRM - Drizzle + PostgreSQL Architecture

   ## Overview
   The Kitchen Pantry CRM has been migrated from Prisma + Azure SQL to Drizzle ORM + Azure PostgreSQL for improved performance, cost efficiency, and developer experience.

   ## Key Benefits Achieved
   - **Cost Reduction**: 40% reduction in monthly database costs
   - **Performance Improvement**: 60% faster query execution
   - **Type Safety**: Compile-time SQL validation
   - **Developer Experience**: Faster development cycles

   ## Architecture Components

   ### Database Layer
   - **Database**: Azure PostgreSQL Flexible Server 15
   - **ORM**: Drizzle ORM with TypeScript
   - **Connection Pool**: pg with Azure-optimized configuration
   - **Migrations**: drizzle-kit migration system

   ### Performance Optimizations
   - Connection pooling optimized for Azure B1 (8 max connections)
   - PostgreSQL-specific indexes (GIN, GIST)
   - Full-text search using PostgreSQL tsvector
   - JSONB for flexible metadata storage
   - Materialized views for dashboard metrics

   ### Monitoring and Alerting
   - Azure Monitor integration
   - Custom performance dashboards
   - Slow query detection and alerting
   - Business metrics tracking
   ```

2. **Developer Guide**:
   ```markdown
   # Drizzle Development Guide

   ## Getting Started

   ### Database Connection
   ```typescript
   import { db } from '@/lib/db/connection-pool';
   import { organizations, contacts } from '@/lib/db/schema';
   ```

   ### Basic Operations

   #### Create
   ```typescript
   const newOrg = await db.insert(organizations).values({
     name: 'New Restaurant',
     priority: 'A',
     segment: 'FINE_DINING'
   }).returning();
   ```

   #### Read
   ```typescript
   const orgs = await db
     .select()
     .from(organizations)
     .where(eq(organizations.status, 'ACTIVE'))
     .orderBy(desc(organizations.updatedAt));
   ```

   #### Update
   ```typescript
   const updated = await db
     .update(organizations)
     .set({ priority: 'B' })
     .where(eq(organizations.id, orgId))
     .returning();
   ```

   #### Complex Queries with Joins
   ```typescript
   const orgWithContacts = await db
     .select({
       organization: organizations,
       contacts: contacts
     })
     .from(organizations)
     .leftJoin(contacts, eq(contacts.organizationId, organizations.id))
     .where(eq(organizations.id, orgId));
   ```

   ## Best Practices

   1. **Always use the optimized client**: `optimizedDrizzleClient.getOrganizations()`
   2. **Use transactions for multi-table operations**: `db.transaction()`
   3. **Leverage PostgreSQL features**: Full-text search, JSONB
   4. **Monitor query performance**: Use QueryPerformanceMonitor
   5. **Validate types at compile time**: Drizzle provides full type safety
   ```

3. **Migration Runbook**:
   ```markdown
   # Production Migration Runbook

   ## Emergency Procedures

   ### Immediate Rollback
   If critical issues are detected within 1 hour of migration:
   
   1. Execute emergency rollback:
      ```bash
      npm run migration:emergency-rollback
      ```
   
   2. Verify system health:
      ```bash
      npm run health:check-full
      ```
   
   3. Notify stakeholders immediately

   ### Common Issues and Solutions

   #### Connection Pool Exhausted
   - **Symptoms**: "connection pool exhausted" errors
   - **Solution**: Restart application pods
   - **Prevention**: Monitor connection metrics

   #### Slow Query Performance
   - **Symptoms**: Response times > 2 seconds
   - **Investigation**: Check pg_stat_statements
   - **Solution**: Analyze and optimize queries

   #### Data Sync Issues
   - **Symptoms**: Data inconsistencies
   - **Investigation**: Check sync logs
   - **Solution**: Re-run specific data migration
   ```

4. **Team Training Materials**:
   - Create hands-on workshop materials
   - Record video tutorials for common operations
   - Set up pair programming sessions
   - Document troubleshooting procedures

#### Validation
- [ ] Architecture documentation complete
- [ ] Developer guide created and reviewed
- [ ] Migration runbook tested
- [ ] Team training completed
- [ ] Knowledge transfer sessions conducted

---

## Migration Success Metrics

### Critical Success Criteria
- [ ] **Zero Data Loss**: 100% data integrity maintained
- [ ] **Minimal Downtime**: <30 seconds during traffic switch
- [ ] **Performance Improvement**: ≥20% faster query execution
- [ ] **Cost Reduction**: ≥30% reduction in monthly database costs
- [ ] **Type Safety**: 100% compile-time query validation
- [ ] **Team Adoption**: 100% team comfortable with new stack

### Performance Targets
- [ ] **Query Response Time**: <200ms for 95th percentile
- [ ] **Dashboard Load Time**: <1 second
- [ ] **API Response Time**: <500ms for 95th percentile
- [ ] **Database CPU**: <60% average utilization
- [ ] **Connection Pool**: <70% utilization
- [ ] **Memory Usage**: <80% of available RAM

### Business Continuity
- [ ] **Feature Parity**: All existing features working
- [ ] **User Experience**: No degradation in UX
- [ ] **Data Accuracy**: 100% accurate reporting
- [ ] **Integration Health**: All third-party integrations working
- [ ] **Backup Strategy**: Automated backups configured
- [ ] **Disaster Recovery**: Recovery procedures tested

---

## Estimated Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Planning** | DZ-001, DZ-002 | 2 weeks | None |
| **Development** | DZ-003, DZ-004, DZ-005 | 3 weeks | Planning complete |
| **Migration** | DZ-006, DZ-007, DZ-008 | 4 weeks | Development complete |
| **Testing** | DZ-009, DZ-010 | 2 weeks | Migration complete |
| **Production** | DZ-011, DZ-012 | 1 week | Testing complete |
| **Documentation** | DZ-013 | 1 week | Production stable |

**Total Estimated Duration**: 13 weeks (3.25 months)

**Critical Path**: DZ-001 → DZ-002 → DZ-006 → DZ-011

**Risk Mitigation**: Add 20% buffer (3 additional weeks) for unforeseen issues

---

## Success Celebration 🎉

Upon successful completion of all TODOs:

1. **Technical Achievement**: Modern, type-safe, performant database layer
2. **Business Value**: Reduced costs, improved performance, better scalability  
3. **Developer Experience**: Faster development, better debugging, compile-time safety
4. **Team Growth**: Advanced PostgreSQL and Drizzle expertise

The migration to Drizzle + Azure PostgreSQL positions Kitchen Pantry CRM for future growth while maintaining the high performance standards required for the food service industry.