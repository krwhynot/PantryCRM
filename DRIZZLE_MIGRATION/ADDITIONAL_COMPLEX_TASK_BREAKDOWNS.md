# Additional Complex Task Breakdowns - Drizzle PostgreSQL Migration

After analyzing the remaining tasks, here are 3 additional complex tasks that benefit from further breakdown:

---

## 🔥 TASK DZ-009: Update Tests for Drizzle (12 hours, Medium Risk)

**Why Complex**: Converting entire test suite, multiple test types, database setup changes

### Subtask DZ-009A: Test Infrastructure Setup (3 hours)
**Priority**: High  
**Risk**: Medium  

#### Steps
1. **Test database configuration**:
   ```typescript
   // __tests__/setup/test-db-config.ts
   export const TEST_CONFIG = {
     database: {
       host: 'localhost',
       port: 5432,
       database: 'pantrycrm_test',
       username: 'test_user',
       password: 'test_password',
       ssl: false // Local testing
     },
     pooling: {
       max: 2, // Minimal for testing
       min: 1,
       idle: 1000
     }
   };
   ```

2. **Test database lifecycle management**:
   ```typescript
   // Setup before all tests
   export async function globalTestSetup() {
     await createTestDatabase();
     await runMigrations();
     await seedBasicData();
   }
   
   // Cleanup after each test
   export async function cleanTestData() {
     await db.delete(interactions);
     await db.delete(contacts);
     await db.delete(organizations);
   }
   
   // Teardown after all tests
   export async function globalTestTeardown() {
     await dropTestDatabase();
     await closeConnections();
   }
   ```

3. **Test utilities and factories**:
   ```typescript
   // __tests__/factories/organization-factory.ts
   export const createTestOrganization = (overrides = {}) => ({
     name: 'Test Restaurant',
     priority: 'A' as const,
     segment: 'FINE_DINING' as const,
     email: 'test@restaurant.com',
     ...overrides
   });
   ```

#### Validation
- [ ] Test database setup/teardown working
- [ ] Migration runner functional in test environment
- [ ] Test factories producing valid data
- [ ] Parallel test execution safe

### Subtask DZ-009B: Unit Test Migration (3 hours)
**Priority**: High  
**Risk**: Low  

#### Steps
1. **Query builder unit tests**:
   ```typescript
   // __tests__/unit/queries/organization-queries.test.ts
   describe('OrganizationQueries', () => {
     describe('findMany', () => {
       it('should build correct SQL for status filter', async () => {
         const spy = jest.spyOn(db, 'select');
         
         await OrganizationQueries.findMany({ status: 'ACTIVE' });
         
         expect(spy).toHaveBeenCalledWith(
           expect.objectContaining({
             where: expect.any(Function) // Check WHERE clause
           })
         );
       });
     });
   });
   ```

2. **Type validation tests**:
   ```typescript
   // __tests__/unit/types/schema-types.test.ts
   describe('Schema Types', () => {
     it('should enforce enum constraints', () => {
       expect(() => {
         const invalid: OrganizationPriority = 'X' as any;
       }).toThrow();
     });
   });
   ```

3. **Validation schema tests**:
   ```typescript
   // __tests__/unit/validation/organization-validation.test.ts
   describe('Organization Validation', () => {
     it('should reject invalid priority values', () => {
       const result = createOrganizationSchema.safeParse({
         name: 'Test',
         priority: 'X', // Invalid
         segment: 'FINE_DINING'
       });
       
       expect(result.success).toBe(false);
     });
   });
   ```

#### Validation
- [ ] All unit tests passing
- [ ] Test coverage maintained
- [ ] Type validation working
- [ ] Schema validation comprehensive

### Subtask DZ-009C: Integration Test Migration (4 hours)
**Priority**: High  
**Risk**: Medium  

#### Steps
1. **API route integration tests**:
   ```typescript
   // __tests__/integration/api/crm-routes.test.ts
   describe('CRM API Integration', () => {
     beforeEach(async () => {
       await cleanTestData();
       await seedTestData();
     });
     
     it('should handle full organization lifecycle', async () => {
       // Create organization
       const createResponse = await POST(createOrgRequest);
       expect(createResponse.status).toBe(201);
       
       // Read organization
       const getResponse = await GET(getOrgRequest);
       expect(getResponse.status).toBe(200);
       
       // Update organization
       const updateResponse = await PUT(updateOrgRequest);
       expect(updateResponse.status).toBe(200);
       
       // Verify in database
       const dbOrg = await testDb
         .select()
         .from(organizations)
         .where(eq(organizations.id, orgId));
       
       expect(dbOrg[0].name).toBe('Updated Name');
     });
   });
   ```

2. **Database operation integration tests**:
   ```typescript
   // __tests__/integration/db/organization-operations.test.ts
   describe('Organization Database Operations', () => {
     it('should maintain referential integrity', async () => {
       const org = await testDb.insert(organizations).values(testOrgData).returning();
       const contact = await testDb.insert(contacts).values({
         ...testContactData,
         organizationId: org[0].id
       }).returning();
       
       // Try to delete organization (should fail due to foreign key)
       await expect(
         testDb.delete(organizations).where(eq(organizations.id, org[0].id))
       ).rejects.toThrow();
     });
   });
   ```

3. **Cross-table query tests**:
   ```typescript
   // Test complex joins and aggregations
   it('should calculate organization metrics correctly', async () => {
     await seedOrganizationWithRelatedData();
     
     const metrics = await optimizedDrizzleClient.getDashboardMetrics();
     
     expect(metrics.totalOrganizations).toBe(1);
     expect(metrics.totalContacts).toBe(3);
     expect(metrics.totalInteractions).toBe(5);
   });
   ```

#### Validation
- [ ] All integration tests passing
- [ ] Database constraints tested
- [ ] Complex query logic verified
- [ ] API-to-database flow working

### Subtask DZ-009D: Performance and Load Tests (2 hours)
**Priority**: Medium  
**Risk**: Low  

#### Steps
1. **Query performance benchmarks**:
   ```typescript
   // __tests__/performance/query-benchmarks.test.ts
   describe('Query Performance', () => {
     beforeAll(async () => {
       await seedLargeDataset(1000); // 1000 organizations
     });
     
     it('should handle large result sets efficiently', async () => {
       const startTime = performance.now();
       
       const results = await OrganizationQueries.findMany({ limit: 500 });
       
       const duration = performance.now() - startTime;
       
       expect(results.length).toBe(500);
       expect(duration).toBeLessThan(1000); // Under 1 second
     });
   });
   ```

2. **Index usage verification**:
   ```typescript
   it('should use indexes for filtered queries', async () => {
     // Enable query plan analysis
     await testDb.execute(sql`SET log_statement = 'all'`);
     
     const startTime = performance.now();
     
     await OrganizationQueries.findMany({
       status: 'ACTIVE',
       priority: 'A'
     });
     
     const duration = performance.now() - startTime;
     
     expect(duration).toBeLessThan(100); // Very fast with indexes
   });
   ```

#### Validation
- [ ] Performance benchmarks established
- [ ] Index usage verified
- [ ] Large dataset handling tested
- [ ] Performance regressions caught

---

## 🔥 TASK DZ-010: Staging Environment Migration (10 hours, High Risk)

**Why Complex**: Full environment setup, deployment automation, validation procedures

### Subtask DZ-010A: Azure Infrastructure Provisioning (3 hours)
**Priority**: Critical  
**Risk**: Medium  

#### Steps
1. **Resource group and networking**:
   ```bash
   # Create staging resource group
   az group create \
     --name pantrycrm-staging-rg \
     --location eastus \
     --tags environment=staging project=pantrycrm
   
   # Create virtual network for staging
   az network vnet create \
     --resource-group pantrycrm-staging-rg \
     --name pantrycrm-staging-vnet \
     --address-prefix 10.1.0.0/16
   ```

2. **PostgreSQL server setup**:
   ```bash
   # Create PostgreSQL Flexible Server for staging
   az postgres flexible-server create \
     --resource-group pantrycrm-staging-rg \
     --name pantrycrm-staging-postgres \
     --location eastus \
     --admin-user crmadmin \
     --admin-password $(az keyvault secret show --name staging-db-password --vault-name pantrycrm-kv --query value -o tsv) \
     --sku-name Standard_B1ms \
     --tier Burstable \
     --version 15 \
     --storage-size 32 \
     --backup-retention 7 \
     --high-availability Disabled
   ```

3. **App Service provisioning**:
   ```bash
   # Create App Service Plan
   az appservice plan create \
     --name pantrycrm-staging-plan \
     --resource-group pantrycrm-staging-rg \
     --sku B1 \
     --is-linux \
     --location eastus
   
   # Create Web App
   az webapp create \
     --resource-group pantrycrm-staging-rg \
     --plan pantrycrm-staging-plan \
     --name pantrycrm-staging \
     --runtime "NODE:18-lts"
   ```

#### Validation
- [ ] All Azure resources provisioned successfully
- [ ] Networking configured correctly
- [ ] PostgreSQL server accessible
- [ ] App Service ready for deployment

### Subtask DZ-010B: CI/CD Pipeline Configuration (3 hours)
**Priority**: High  
**Risk**: Medium  

#### Steps
1. **GitHub Actions workflow**:
   ```yaml
   # .github/workflows/staging-deployment.yml
   name: Deploy to Staging Environment
   
   on:
     push:
       branches: [ drizzle-migration-staging ]
     pull_request:
       branches: [ drizzle-migration-staging ]
   
   env:
     NODE_VERSION: '18'
     AZURE_WEBAPP_NAME: pantrycrm-staging
   
   jobs:
     test:
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: pantrycrm_test
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: ${{ env.NODE_VERSION }}
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Run Drizzle migrations
           run: npm run db:migrate
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pantrycrm_test
         
         - name: Run tests
           run: npm run test:ci
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pantrycrm_test
   
     deploy:
       needs: test
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/drizzle-migration-staging'
       
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: ${{ env.NODE_VERSION }}
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build application
           run: npm run build
           env:
             DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
             NODE_ENV: staging
         
         - name: Deploy to Azure Web App
           uses: azure/webapps-deploy@v2
           with:
             app-name: ${{ env.AZURE_WEBAPP_NAME }}
             publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
   ```

2. **Environment configuration**:
   ```bash
   # Configure staging app settings
   az webapp config appsettings set \
     --resource-group pantrycrm-staging-rg \
     --name pantrycrm-staging \
     --settings \
     DATABASE_URL="postgresql://crmadmin:password@pantrycrm-staging-postgres.postgres.database.azure.com:5432/pantrycrm?sslmode=require" \
     NODE_ENV="staging" \
     NEXTAUTH_URL="https://pantrycrm-staging.azurewebsites.net" \
     NEXTAUTH_SECRET="${{ secrets.STAGING_NEXTAUTH_SECRET }}" \
     JWT_SECRET="${{ secrets.STAGING_JWT_SECRET }}"
   ```

3. **Database migration automation**:
   ```typescript
   // scripts/staging/deploy-with-migration.ts
   export async function deployStagingWithMigration() {
     console.log('Starting staging deployment with database migration...');
     
     try {
       // 1. Backup current staging database
       await backupStagingDatabase();
       
       // 2. Run Drizzle migrations
       await runDrizzleMigrations();
       
       // 3. Validate migration success
       const migrationValid = await validateMigration();
       if (!migrationValid) {
         throw new Error('Migration validation failed');
       }
       
       // 4. Deploy application
       await deployApplication();
       
       // 5. Run post-deployment tests
       await runSmokeTests();
       
       console.log('Staging deployment completed successfully');
     } catch (error) {
       console.error('Staging deployment failed:', error);
       await rollbackStagingDeployment();
       throw error;
     }
   }
   ```

#### Validation
- [ ] CI/CD pipeline running successfully
- [ ] Automated testing working
- [ ] Database migrations automated
- [ ] Deployment rollback procedures tested

### Subtask DZ-010C: Data Migration to Staging (2 hours)
**Priority**: High  
**Risk**: High  

#### Steps
1. **Production data subset extraction**:
   ```typescript
   // scripts/staging/extract-production-subset.ts
   export async function extractProductionSubset() {
     const prodDb = new PrismaClient({
       datasources: {
         db: { url: process.env.PRODUCTION_DATABASE_URL }
       }
     });
     
     // Extract last 30 days of data for realistic testing
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 30);
     
     const organizations = await prodDb.organization.findMany({
       where: {
         updatedAt: { gte: cutoffDate }
       },
       include: {
         contacts: true,
         interactions: {
           where: { createdAt: { gte: cutoffDate } }
         }
       },
       take: 100 // Limit for staging
     });
     
     return { organizations };
   }
   ```

2. **Data anonymization for staging**:
   ```typescript
   // scripts/staging/anonymize-data.ts
   import { faker } from '@faker-js/faker';
   
   export function anonymizeOrganization(org: any) {
     return {
       ...org,
       name: faker.company.name(),
       email: faker.internet.email(),
       phone: faker.phone.number(),
       address: faker.location.streetAddress(),
       // Keep business logic fields intact
       priority: org.priority,
       segment: org.segment,
       status: org.status
     };
   }
   ```

3. **Staging data seeding**:
   ```typescript
   // scripts/staging/seed-staging-data.ts
   export async function seedStagingData() {
     const prodSubset = await extractProductionSubset();
     const anonymizedData = prodSubset.organizations.map(anonymizeOrganization);
     
     // Use migration framework to populate staging
     const migrator = new DataMigrationManager();
     await migrator.seedStagingEnvironment(anonymizedData);
   }
   ```

#### Validation
- [ ] Production data subset extracted
- [ ] Data properly anonymized
- [ ] Staging database populated
- [ ] Business logic integrity maintained

### Subtask DZ-010D: Comprehensive Staging Validation (2 hours)
**Priority**: Critical  
**Risk**: High  

#### Steps
1. **Automated health checks**:
   ```typescript
   // scripts/staging/comprehensive-validation.ts
   export class StagingEnvironmentValidator {
     async runFullValidationSuite(): Promise<ValidationReport> {
       const results = await Promise.allSettled([
         this.validateDatabaseHealth(),
         this.validateApplicationHealth(),
         this.validateAPIEndpoints(),
         this.validateUserWorkflows(),
         this.validatePerformance(),
         this.validateSecurity()
       ]);
       
       return this.generateValidationReport(results);
     }
     
     async validateAPIEndpoints(): Promise<boolean> {
       const endpoints = [
         '/api/crm/account',
         '/api/crm/contacts',
         '/api/crm/leads',
         '/api/organizations'
       ];
       
       for (const endpoint of endpoints) {
         const response = await fetch(`${STAGING_BASE_URL}${endpoint}`);
         if (!response.ok) {
           throw new Error(`API endpoint ${endpoint} failed: ${response.status}`);
         }
       }
       
       return true;
     }
     
     async validateUserWorkflows(): Promise<boolean> {
       // Test critical user journeys
       await this.testOrganizationCreation();
       await this.testContactManagement();
       await this.testInteractionLogging();
       await this.testDashboardLoading();
       
       return true;
     }
   }
   ```

2. **Performance baseline establishment**:
   ```typescript
   async validatePerformance(): Promise<PerformanceMetrics> {
     const metrics = {
       dashboardLoadTime: await this.measureDashboardLoad(),
       apiResponseTimes: await this.measureAPIResponses(),
       databaseQueryTimes: await this.measureDatabaseQueries(),
       memoryUsage: await this.measureMemoryUsage()
     };
     
     // Verify against production baselines
     if (metrics.dashboardLoadTime > 2000) {
       throw new Error('Dashboard load time exceeds acceptable threshold');
     }
     
     return metrics;
   }
   ```

3. **User acceptance testing automation**:
   ```typescript
   // scripts/staging/user-acceptance-tests.ts
   describe('User Acceptance Tests - Staging', () => {
     it('should allow complete organization management workflow', async () => {
       // Create organization
       const org = await createOrganization(testOrgData);
       expect(org.id).toBeDefined();
       
       // Add contacts
       const contact = await createContact(org.id, testContactData);
       expect(contact.organizationId).toBe(org.id);
       
       // Log interaction
       const interaction = await createInteraction(org.id, testInteractionData);
       expect(interaction.organizationId).toBe(org.id);
       
       // View dashboard
       const dashboard = await loadDashboard();
       expect(dashboard.totalOrganizations).toBeGreaterThan(0);
     });
   });
   ```

#### Validation
- [ ] All health checks passing
- [ ] Performance within acceptable ranges
- [ ] User workflows functional
- [ ] Security validations passed

---

## 🔥 TASK DZ-012: Performance Optimization and Monitoring (8 hours, Low Risk)

**Why Complex**: Multiple optimization areas, monitoring setup, Azure integration

### Subtask DZ-012A: PostgreSQL Performance Tuning (3 hours)
**Priority**: High  
**Risk**: Low  

#### Steps
1. **Memory and connection optimization**:
   ```sql
   -- PostgreSQL configuration for Azure B1 workload (1.75GB RAM)
   
   -- Memory settings
   ALTER SYSTEM SET shared_buffers = '256MB';              -- 25% of RAM
   ALTER SYSTEM SET effective_cache_size = '1GB';          -- 75% of RAM  
   ALTER SYSTEM SET maintenance_work_mem = '128MB';        -- For maintenance ops
   ALTER SYSTEM SET work_mem = '8MB';                      -- Per connection/operation
   ALTER SYSTEM SET max_connections = 80;                 -- Leave room for Azure overhead
   
   -- WAL and checkpoint optimization
   ALTER SYSTEM SET wal_buffers = '16MB';
   ALTER SYSTEM SET checkpoint_completion_target = 0.9;
   ALTER SYSTEM SET checkpoint_timeout = '15min';
   ALTER SYSTEM SET max_wal_size = '1GB';
   ALTER SYSTEM SET min_wal_size = '256MB';
   
   -- Query optimizer settings
   ALTER SYSTEM SET random_page_cost = 1.1;               -- SSD storage
   ALTER SYSTEM SET effective_io_concurrency = 200;       -- SSD concurrency
   ALTER SYSTEM SET default_statistics_target = 100;      -- Statistics detail
   
   SELECT pg_reload_conf();
   ```

2. **Autovacuum tuning for CRM workload**:
   ```sql
   -- Autovacuum optimization for frequent updates
   ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;  -- Vacuum at 10% change
   ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05; -- Analyze at 5% change
   ALTER SYSTEM SET autovacuum_vacuum_cost_delay = 10;     -- Reduce I/O impact
   ALTER SYSTEM SET autovacuum_max_workers = 2;            -- Limit workers for B1
   
   -- Table-specific tuning for high-frequency tables
   ALTER TABLE "Organization" SET (autovacuum_vacuum_scale_factor = 0.05);
   ALTER TABLE "Contact" SET (autovacuum_vacuum_scale_factor = 0.05);
   ALTER TABLE "Interaction" SET (autovacuum_vacuum_scale_factor = 0.1);
   
   SELECT pg_reload_conf();
   ```

3. **Extension optimization**:
   ```sql
   -- Enable performance extensions
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;      -- Query statistics
   CREATE EXTENSION IF NOT EXISTS pg_buffercache;          -- Buffer cache analysis
   CREATE EXTENSION IF NOT EXISTS pgstattuple;             -- Table statistics
   
   -- Configure pg_stat_statements for monitoring
   ALTER SYSTEM SET pg_stat_statements.max = 1000;
   ALTER SYSTEM SET pg_stat_statements.track = 'all';
   ALTER SYSTEM SET pg_stat_statements.track_utility = 'on';
   
   SELECT pg_reload_conf();
   ```

#### Validation
- [ ] PostgreSQL configuration optimized
- [ ] Memory usage within limits
- [ ] Connection pooling efficient
- [ ] Extensions configured and working

### Subtask DZ-012B: Query Performance Analysis and Optimization (2 hours)
**Priority**: High  
**Risk**: Low  

#### Steps
1. **Slow query identification system**:
   ```typescript
   // lib/monitoring/slow-query-analyzer.ts
   export class SlowQueryAnalyzer {
     async identifySlowQueries(): Promise<SlowQuery[]> {
       const slowQueries = await db.execute(sql`
         SELECT 
           query,
           calls,
           total_exec_time,
           mean_exec_time,
           max_exec_time,
           rows,
           100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
         FROM pg_stat_statements 
         WHERE mean_exec_time > 100  -- Queries > 100ms average
         ORDER BY mean_exec_time DESC 
         LIMIT 20
       `);
       
       return slowQueries.rows.map(row => ({
         query: this.normalizeQuery(row.query),
         calls: row.calls,
         avgTime: row.mean_exec_time,
         maxTime: row.max_exec_time,
         totalTime: row.total_exec_time,
         avgRows: row.rows / row.calls,
         hitPercent: row.hit_percent
       }));
     }
     
     async analyzeQueryPlan(query: string): Promise<QueryPlan> {
       const plan = await db.execute(sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql.raw(query)}`);
       return this.parseQueryPlan(plan.rows[0]['QUERY PLAN']);
     }
     
     generateOptimizationRecommendations(queries: SlowQuery[]): Recommendation[] {
       const recommendations: Recommendation[] = [];
       
       queries.forEach(query => {
         if (query.hitPercent < 95) {
           recommendations.push({
             type: 'INDEX_MISSING',
             query: query.query,
             suggestion: 'Consider adding indexes to improve cache hit ratio'
           });
         }
         
         if (query.avgRows > 1000 && query.avgTime > 500) {
           recommendations.push({
             type: 'QUERY_OPTIMIZATION',
             query: query.query,
             suggestion: 'Large result set with slow execution - consider pagination or filtering'
           });
         }
       });
       
       return recommendations;
     }
   }
   ```

2. **Index usage analysis**:
   ```typescript
   // lib/monitoring/index-analyzer.ts
   export class IndexAnalyzer {
     async analyzeIndexUsage(): Promise<IndexUsageReport[]> {
       const indexStats = await db.execute(sql`
         SELECT 
           schemaname,
           tablename,
           indexname,
           idx_tup_read,
           idx_tup_fetch,
           idx_scan,
           idx_blks_read,
           idx_blks_hit
         FROM pg_stat_user_indexes 
         ORDER BY idx_scan DESC
       `);
       
       return indexStats.rows.map(row => ({
         schema: row.schemaname,
         table: row.tablename,
         index: row.indexname,
         scans: row.idx_scan,
         tuples_read: row.idx_tup_read,
         tuples_fetched: row.idx_tup_fetch,
         blocks_read: row.idx_blks_read,
         blocks_hit: row.idx_blks_hit,
         efficiency: row.idx_blks_hit / (row.idx_blks_hit + row.idx_blks_read) * 100
       }));
     }
     
     async findUnusedIndexes(): Promise<UnusedIndex[]> {
       const unusedIndexes = await db.execute(sql`
         SELECT 
           schemaname,
           tablename,
           indexname,
           pg_size_pretty(pg_relation_size(indexrelid)) as size
         FROM pg_stat_user_indexes 
         WHERE idx_scan = 0
         AND schemaname = 'public'
       `);
       
       return unusedIndexes.rows;
     }
   }
   ```

#### Validation
- [ ] Slow query monitoring functional
- [ ] Index usage analysis working
- [ ] Performance recommendations generated
- [ ] Query optimization applied

### Subtask DZ-012C: Azure Monitor Integration (2 hours)
**Priority**: Medium  
**Risk**: Low  

#### Steps
1. **Application Insights setup**:
   ```typescript
   // lib/monitoring/azure-application-insights.ts
   import { ApplicationInsights, TelemetryClient } from 'applicationinsights';
   
   export class CRMTelemetry {
     private client: TelemetryClient;
     
     constructor() {
       ApplicationInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
         .setAutoDependencyCorrelation(true)
         .setAutoCollectRequests(true)
         .setAutoCollectPerformance(true, true)
         .setAutoCollectExceptions(true)
         .setAutoCollectDependencies(true)
         .setAutoCollectConsole(true)
         .setUseDiskRetryCaching(true)
         .start();
         
       this.client = ApplicationInsights.defaultClient;
     }
     
     trackDatabaseMetrics(metrics: DatabaseMetrics): void {
       this.client.trackMetric({
         name: 'Database.QueryDuration',
         value: metrics.avgQueryTime,
         properties: {
           database: 'postgresql',
           environment: process.env.NODE_ENV
         }
       });
       
       this.client.trackMetric({
         name: 'Database.ConnectionPool.Active',
         value: metrics.activeConnections
       });
       
       this.client.trackMetric({
         name: 'Database.Cache.HitRatio',
         value: metrics.cacheHitRatio
       });
     }
     
     trackBusinessMetrics(metrics: BusinessMetrics): void {
       this.client.trackMetric({
         name: 'CRM.Organizations.Total',
         value: metrics.totalOrganizations
       });
       
       this.client.trackMetric({
         name: 'CRM.Interactions.Daily',
         value: metrics.dailyInteractions
       });
       
       this.client.trackMetric({
         name: 'CRM.Revenue.Pipeline',
         value: metrics.pipelineRevenue
       });
     }
   }
   ```

2. **Custom dashboard creation**:
   ```typescript
   // scripts/monitoring/create-azure-dashboard.ts
   export async function createPerformanceDashboard() {
     const dashboardConfig = {
       lenses: {
         "0": {
           order: 0,
           parts: {
             "0": {
               position: { x: 0, y: 0, rowSpan: 4, colSpan: 6 },
               metadata: {
                 inputs: [{
                   name: "chartType",
                   value: "Line"
                 }, {
                   name: "metrics",
                   value: [{
                     name: "Database.QueryDuration",
                     aggregationType: "Average"
                   }]
                 }]
               }
             },
             "1": {
               position: { x: 6, y: 0, rowSpan: 4, colSpan: 6 },
               metadata: {
                 inputs: [{
                   name: "chartType", 
                   value: "Line"
                 }, {
                   name: "metrics",
                   value: [{
                     name: "Database.ConnectionPool.Active",
                     aggregationType: "Average"
                   }]
                 }]
               }
             }
           }
         }
       }
     };
     
     await deployDashboardToAzure(dashboardConfig);
   }
   ```

3. **Alert configuration**:
   ```typescript
   // scripts/monitoring/setup-alerts.ts
   export async function setupPerformanceAlerts() {
     const alerts = [
       {
         name: "High Database Query Duration",
         condition: "Database.QueryDuration > 1000", // 1 second
         severity: "Warning",
         actions: ["email", "webhook"]
       },
       {
         name: "Connection Pool Exhaustion",
         condition: "Database.ConnectionPool.Active > 70", // 70% of max
         severity: "Critical",
         actions: ["email", "sms", "webhook"]
       },
       {
         name: "Low Cache Hit Ratio",
         condition: "Database.Cache.HitRatio < 90", // Below 90%
         severity: "Warning",
         actions: ["email"]
       }
     ];
     
     for (const alert of alerts) {
       await createAzureAlert(alert);
     }
   }
   ```

#### Validation
- [ ] Application Insights configured
- [ ] Custom metrics flowing to Azure
- [ ] Performance dashboard created
- [ ] Alert rules configured and tested

### Subtask DZ-012D: Automated Performance Reporting (1 hour)
**Priority**: Low  
**Risk**: Low  

#### Steps
1. **Daily performance report generation**:
   ```typescript
   // scripts/monitoring/daily-performance-report.ts
   export class PerformanceReportGenerator {
     async generateDailyReport(): Promise<PerformanceReport> {
       const [
         slowQueries,
         indexUsage,
         connectionMetrics,
         businessMetrics
       ] = await Promise.all([
         this.slowQueryAnalyzer.getSlowQueries(24), // Last 24 hours
         this.indexAnalyzer.analyzeUsage(),
         this.getConnectionMetrics(),
         this.getBusinessMetrics()
       ]);
       
       const report: PerformanceReport = {
         timestamp: new Date(),
         period: '24h',
         database: {
           slowQueries: slowQueries.length,
           avgQueryTime: this.calculateAverage(slowQueries.map(q => q.avgTime)),
           indexEfficiency: this.calculateIndexEfficiency(indexUsage),
           connectionUtilization: connectionMetrics.utilizationPercent
         },
         business: {
           totalOrganizations: businessMetrics.organizations,
           dailyInteractions: businessMetrics.interactions,
           activeUsers: businessMetrics.activeUsers
         },
         recommendations: this.generateRecommendations({
           slowQueries,
           indexUsage,
           connectionMetrics
         })
       };
       
       return report;
     }
     
     async sendReportToTeam(report: PerformanceReport): Promise<void> {
       const emailContent = this.formatReportAsEmail(report);
       await this.emailService.send({
         to: process.env.TEAM_EMAIL_LIST,
         subject: `Daily Performance Report - ${report.timestamp.toDateString()}`,
         html: emailContent
       });
     }
   }
   ```

2. **Automated optimization suggestions**:
   ```typescript
   // lib/monitoring/auto-optimization.ts
   export class AutoOptimizer {
     async analyzeAndSuggest(): Promise<OptimizationSuggestion[]> {
       const suggestions: OptimizationSuggestion[] = [];
       
       // Check for missing indexes
       const missingIndexes = await this.findMissingIndexes();
       missingIndexes.forEach(index => {
         suggestions.push({
           type: 'INDEX_CREATION',
           priority: 'HIGH',
           description: `Create index on ${index.table}.${index.columns.join(', ')}`,
           estimatedImpact: 'Improve query performance by 60-80%',
           sqlCommand: index.createStatement
         });
       });
       
       // Check for unused indexes
       const unusedIndexes = await this.findUnusedIndexes();
       unusedIndexes.forEach(index => {
         suggestions.push({
           type: 'INDEX_REMOVAL',
           priority: 'MEDIUM',
           description: `Remove unused index ${index.name}`,
           estimatedImpact: 'Reduce storage overhead and improve write performance',
           sqlCommand: `DROP INDEX IF EXISTS ${index.name};`
         });
       });
       
       return suggestions;
     }
   }
   ```

#### Validation
- [ ] Daily reports generating correctly
- [ ] Reports contain actionable insights
- [ ] Automated suggestions accurate
- [ ] Team notifications working

---

## Summary of Additional Complex Task Breakdowns

### **Task Complexity Scores (Updated)**:

| Task | Original Hours | Subtasks | Complexity Reduction |
|------|----------------|----------|---------------------|
| **DZ-009: Test Migration** | 12 hours | 4 subtasks (2-4h each) | 🟡 Medium → 🟢 Low |
| **DZ-010: Staging Migration** | 10 hours | 4 subtasks (2-3h each) | 🔴 High → 🟡 Medium |
| **DZ-012: Performance Optimization** | 8 hours | 4 subtasks (1-3h each) | 🟡 Medium → 🟢 Low |

### **Key Benefits of These Breakdowns**:

1. **Parallel Execution**: Multiple team members can work simultaneously
2. **Risk Isolation**: Failures in one subtask don't block others
3. **Clear Validation**: Each subtask has specific success criteria
4. **Incremental Progress**: Visible progress on complex tasks
5. **Easier Debugging**: Smaller scope makes troubleshooting simpler

### **Execution Recommendations**:

- **DZ-009**: Can be done in parallel with DZ-007 (Database Access Layer)
- **DZ-010**: Critical blocker for production migration - requires dedicated focus
- **DZ-012**: Can be done after production migration for continuous improvement

All subtasks include detailed implementation code, validation criteria, and clear dependencies to ensure successful execution.