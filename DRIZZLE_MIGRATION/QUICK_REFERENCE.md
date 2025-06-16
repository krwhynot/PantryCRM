clau# Drizzle Migration - Quick Reference Guide

## 🚀 **Getting Started Checklist**

### **Before You Begin**
- [ ] Read the [main migration plan](./DRIZZLE_POSTGRESQL_MIGRATION_TODOS.md)
- [ ] Review your assigned tasks in the breakdown files
- [ ] Ensure you have Azure CLI access and appropriate permissions
- [ ] Backup current development database
- [ ] Set up local PostgreSQL for testing

### **Critical Dependencies**
```
DZ-001 → DZ-002 → DZ-003 → DZ-004 → DZ-005 → DZ-006 → DZ-007 → DZ-008 → DZ-009 → DZ-010 → DZ-011 → DZ-012 → DZ-013
```

## 📋 **Task Assignment Matrix**

| Role | Primary Tasks | Secondary Tasks |
|------|---------------|-----------------|
| **Senior Developer** | DZ-004, DZ-006, DZ-007 | DZ-011 (Production) |
| **DevOps Engineer** | DZ-002, DZ-010, DZ-011 | DZ-012 (Monitoring) |
| **Frontend Developer** | DZ-008, DZ-009 | DZ-007 (API Updates) |
| **QA Engineer** | DZ-009, DZ-010 | DZ-006 (Validation) |
| **Team Lead** | DZ-001, DZ-013 | DZ-011 (Coordination) |

## ⚡ **Common Commands**

### **Azure PostgreSQL Setup**
```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group pantrycrm-rg \
  --name pantrycrm-postgres \
  --location eastus \
  --admin-user crmadmin \
  --sku-name Standard_B1ms \
  --version 15

# Configure firewall
az postgres flexible-server firewall-rule create \
  --resource-group pantrycrm-rg \
  --name pantrycrm-postgres \
  --rule-name allow-azure-services \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### **Drizzle Setup**
```bash
# Install Drizzle
npm install drizzle-orm drizzle-kit pg
npm install -D @types/pg

# Generate migrations
npx drizzle-kit generate:pg

# Run migrations
npx drizzle-kit push:pg
```

### **Database Connection**
```typescript
// Connection string format
DATABASE_URL="postgresql://crmadmin:password@pantrycrm-postgres.postgres.database.azure.com:5432/pantrycrm?sslmode=require"
```

## 🔧 **Development Workflow**

### **Schema Changes**
1. Update `lib/db/schema.ts`
2. Generate migration: `npx drizzle-kit generate:pg`
3. Review generated SQL
4. Apply migration: `npx drizzle-kit push:pg`
5. Update TypeScript types

### **Query Development**
```typescript
// Basic query pattern
const results = await db
  .select()
  .from(organizations)
  .where(eq(organizations.status, 'ACTIVE'))
  .orderBy(desc(organizations.updatedAt));

// With joins
const orgsWithContacts = await db
  .select()
  .from(organizations)
  .leftJoin(contacts, eq(contacts.organizationId, organizations.id))
  .where(eq(organizations.id, orgId));
```

### **Testing Pattern**
```typescript
// Test setup
beforeEach(async () => {
  await cleanTestData();
  await seedTestData();
});

// Test validation
expect(result).toHaveLength(expectedCount);
expect(result[0]).toMatchObject(expectedShape);
```

## 🚨 **Emergency Procedures**

### **Migration Rollback**
```bash
# Emergency rollback command
npm run migration:emergency-rollback

# Verify rollback success
npm run health:check-full
```

### **Production Issues**
1. **Check health endpoint**: `https://app-url/api/health`
2. **View Azure metrics**: Application Insights dashboard
3. **Database status**: Azure PostgreSQL monitoring
4. **Rollback if needed**: Execute rollback procedures

### **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Connection Pool Exhausted** | "pool exhausted" errors | Restart app, check connection limits |
| **Slow Queries** | Response times >2s | Check `pg_stat_statements`, optimize indexes |
| **Migration Failures** | Data inconsistencies | Run validation scripts, check foreign keys |
| **Type Errors** | TypeScript compilation fails | Regenerate Drizzle types, check schema |

## 📊 **Monitoring Dashboard**

### **Key Metrics to Watch**
- **Query Duration**: <200ms average
- **Connection Pool**: <70% utilization
- **Cache Hit Ratio**: >95%
- **Error Rate**: <0.1%
- **Memory Usage**: <80% of 1.75GB

### **Azure Application Insights Queries**
```kusto
// Slow queries
customMetrics
| where name == "Database.QueryDuration"
| where value > 1000
| summarize count() by bin(timestamp, 1h)

// Connection pool usage
customMetrics
| where name == "Database.ConnectionPool.Active"
| summarize avg(value) by bin(timestamp, 5m)
```

## 🔍 **Troubleshooting Guide**

### **Schema Issues**
```typescript
// Check current schema
npx drizzle-kit introspect:pg

// Validate schema consistency
npm run db:validate-schema
```

### **Performance Issues**
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### **Connection Issues**
```typescript
// Test connection
const testConnection = async () => {
  try {
    await db.select({ test: sql`1` });
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
};
```

## 📚 **Resources**

### **Documentation Links**
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Azure PostgreSQL Docs](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Migration Main Plan](./DRIZZLE_POSTGRESQL_MIGRATION_TODOS.md)

### **Code Templates**
- **Schema Definition**: See DZ-004 in main plan
- **Query Builders**: See DZ-007 breakdown
- **Test Setup**: See DZ-009 breakdown
- **Migration Scripts**: See DZ-006 breakdown

### **Support Contacts**
- **Technical Lead**: [Lead developer for complex issues]
- **DevOps**: [Infrastructure and deployment issues]  
- **Database Admin**: [PostgreSQL performance and configuration]
- **Emergency**: [24/7 support contact for production issues]

## ✅ **Success Criteria**

### **Task Completion**
- [ ] All validation checkboxes completed
- [ ] TypeScript compilation successful
- [ ] Tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated

### **Migration Milestones**
- [ ] **Week 2**: Infrastructure ready
- [ ] **Week 5**: Schema conversion complete
- [ ] **Week 9**: Data migration validated
- [ ] **Week 11**: Staging environment validated
- [ ] **Week 12**: Production migration successful
- [ ] **Week 13**: Team training complete

---

**💡 Pro Tip**: Always test your changes in the staging environment before applying to production. The migration plan includes comprehensive validation procedures - use them!