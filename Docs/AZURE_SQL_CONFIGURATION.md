# Azure SQL Configuration Guide for Kitchen Pantry CRM

## Budget Constraints
- **Total Budget**: $18/month for Azure services
- **Database Allocation**: $5/month (Azure SQL Basic tier, 2GB storage, 5 DTUs)
- **App Service**: $13/month (B1 tier, 1.75GB RAM)
- **Performance Requirements**: Sub-second searches, < 10 second simple reports, < 30 second complex reports

## Azure SQL Basic Tier Specifications
- **DTUs**: 5
- **Max Database Size**: 2 GB
- **IOPS Limit**: ~15-20 IOPS
- **Concurrent Connections**: ~30 max recommended

## Connection Configuration

### Environment Variables
Update your `.env.local` file with the following configuration:

```
# Azure SQL Connection
DATABASE_URL="sqlserver://your-server-name.database.windows.net:1433;database=pantry-crm;user=pantry_admin;password=your-secure-password;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net"
SHADOW_DATABASE_URL="sqlserver://your-server-name.database.windows.net:1433;database=pantry-crm-shadow;user=pantry_admin;password=your-secure-password;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net"

# Prisma Connection Pool
PRISMA_CONNECTION_POOL_URL="sqlserver://your-server-name.database.windows.net:1433;database=pantry-crm;user=pantry_admin;password=your-secure-password;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;poolTimeout=30;pool=5"
```

### Prisma Configuration
Ensure your `prisma/schema.prisma` file is configured correctly:

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex", "relationJoins"]
  engineType      = "binary"
}
```

## Performance Optimization

### 1. Indexing Strategy
Create appropriate indexes for frequently queried fields:

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  segment     String?
  distributor String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name]) // Index for name searches
  @@index([segment, distributor]) // Composite index for filtering
  @@index([createdAt]) // Index for date-based queries
}
```

### 2. Connection Pooling
Implement connection pooling to reduce connection overhead:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.PRISMA_CONNECTION_POOL_URL || process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Query Optimization
Optimize queries to reduce database load:

```typescript
// Bad - fetches all fields
const contacts = await prisma.contact.findMany();

// Good - fetches only needed fields
const contacts = await prisma.contact.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
  },
  take: 10, // Pagination
  skip: (page - 1) * 10,
  orderBy: { updatedAt: 'desc' },
});
```

### 4. Batching Queries
Use Prisma transactions for batched operations:

```typescript
// Efficient batch operation
await prisma.$transaction([
  prisma.organization.create({ data: orgData }),
  prisma.contact.createMany({ data: contactsData }),
  prisma.interaction.create({ data: interactionData })
]);
```

## Azure SQL Monitoring

### Key Metrics to Monitor
1. **DTU Utilization**: Should stay below 80% of the 5 DTU limit
2. **Database Size**: Monitor growth to stay under 2GB limit
3. **Query Performance**: Watch for slow queries (>100ms)
4. **Connection Count**: Keep below 30 concurrent connections

### Setting Up Alerts
Configure Azure Monitor alerts for:
- DTU usage exceeding 80% for more than 15 minutes
- Database size approaching 1.8GB (90% of limit)
- Failed connection attempts

## Backup Strategy

### Automated Backups
Azure SQL Basic tier includes:
- 7-day point-in-time restore
- Weekly full backups
- Daily differential backups
- Transaction log backups every 5-10 minutes

### Manual Export
Schedule weekly manual exports using:

```bash
# Using Azure CLI
az sql db export --admin-password <admin-password> \
  --admin-user <admin-username> \
  --storage-key-type StorageAccessKey \
  --storage-key <storage-key> \
  --storage-uri https://<storage-account>.blob.core.windows.net/<container>/<bacpac-name>.bacpac \
  --name pantry-crm \
  --resource-group <resource-group-name> \
  --server <server-name>
```

## Migration Strategy

### Initial Schema Deployment
Deploy your initial schema using Prisma:

```bash
# Generate Prisma client
npx prisma generate

# Deploy schema to Azure SQL
npx prisma db push

# Or use migrations for production
npx prisma migrate deploy
```

### Schema Updates
For schema updates in production:

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Deploy to production
npx prisma migrate deploy
```

## Scaling Considerations

### When to Upgrade
Consider upgrading from Basic to Standard tier ($20/month) when:
- DTU utilization consistently exceeds 80%
- Database size approaches 2GB limit
- Query performance degrades under load
- Concurrent users exceed 20-25

### Cost-Effective Scaling Options
1. **Implement caching** before upgrading tiers
2. **Optimize queries and indexes** to reduce DTU usage
3. **Archive old data** to stay within size limits
4. **Use read replicas** only for specific reporting needs

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check firewall rules in Azure Portal
   - Verify connection string parameters
   - Check for connection pool exhaustion

2. **Slow Queries**
   - Use Query Store to identify problematic queries
   - Add missing indexes
   - Review execution plans

3. **DTU Throttling**
   - Implement exponential backoff for retries
   - Add caching for frequent queries
   - Schedule batch operations during off-peak hours

## Compliance and Security

### Data Protection
1. **Enable Transparent Data Encryption (TDE)**
2. **Use Azure Key Vault** for connection string storage
3. **Implement column-level encryption** for sensitive data

### Audit Trail
Configure SQL auditing for compliance:
- User authentication events
- Data modification operations
- Schema changes

## Conclusion

By following these guidelines, the Kitchen Pantry CRM project can maintain excellent database performance while staying within the $5/month Azure SQL Basic tier budget. Regular monitoring and optimization should be part of the operational workflow to ensure continued performance as data volume grows.