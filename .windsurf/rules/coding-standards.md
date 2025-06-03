---
trigger: manual
---

# Food Service CRM - Coding Standards

## Activation Context
Apply to all TypeScript, JavaScript, React, and Prisma files using NextCRM foundation.

## NextCRM Foundation Compliance

### Preserved Components
- **UI:** shadcn/ui + Radix primitives (iPad compatible)
- **Charts:** Tremor charts for reporting
- **Auth:** Auth.js (email/password only)
- **Data:** SWR + Server Actions + TanStack Query
- **Style:** Tailwind CSS + NextCRM tokens

### Required Changes
- **Database:** Prisma `mongodb` → `sqlserver`
- **Deploy:** Vercel → Azure App Service
- **Schema:** Food service entities + Settings system
- **UI:** iPad-first (44px touch targets)

## TypeScript Standards

```typescript
// NextCRM interface patterns
interface Organization {
  id: number;                    // Auto-increment vs ObjectId
  name: string;
  priorityId: number;           // FK to SettingOption
  segmentId: number;
  distributorId: number;
  accountManagerId: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}

// Settings Hook
interface SettingsHook {
  priorities: SettingOption[];
  segments: SettingOption[];
  distributors: SettingOption[];
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}
```

## React Component Standards

```typescript
// Component structure
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (id: number) => void;
  className?: string;
}

export function OrganizationCard({ organization, onEdit, className }: OrganizationCardProps) {
  const { priorities } = useSettings();
  
  const handleEdit = useCallback(() => {
    onEdit(organization.id);
  }, [organization.id, onEdit]);
  
  return (
    <Card className={cn("min-h-[120px]", className)}>
      <CardContent>
        <Button 
          onClick={handleEdit}
          className="min-h-11 min-w-20" // iPad touch target
        >
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}
```

## iPad Optimization

```scss
// Touch targets
.touch-target {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}

.form-input {
  min-height: 44px;
  font-size: 16px; // Prevent iOS zoom
}

.btn-primary {
  min-height: 44px;
  min-width: 88px;
}
```

## Database Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"  // Changed from mongodb
  url      = env("AZURE_SQL_DATABASE_URL")
}

model SettingCategory {
  id            Int      @id @default(autoincrement())
  categoryName  String   @unique @map("category_name")
  displayName   String   @map("display_name")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  options       SettingOption[]
  @@map("setting_categories")
}

model Organization {
  id              Int      @id @default(autoincrement())
  name            String   @unique @db.NVarChar(255)
  priorityId      Int      @map("priority_id")
  segmentId       Int      @map("segment_id")
  distributorId   Int      @map("distributor_id")
  accountManagerId Int     @map("account_manager_id")
  
  priority        SettingOption @relation("OrganizationPriority", fields: [priorityId], references: [id])
  segment         SettingOption @relation("OrganizationSegment", fields: [segmentId], references: [id])
  
  contacts        Contact[]
  interactions    Interaction[]
  opportunities   Opportunity[]

  @@map("organizations")
  @@index([name])
}
```

## API Standards

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  switch (req.method) {
    case 'GET': return await getOrganizations(req, res);
    case 'POST': return await createOrganization(req, res);
    default: return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
```

## Food Service Logic

```typescript
// Priority colors (matching Excel)
export const PRIORITY_COLORS = {
  A: '#10B981', // Green
  B: '#F59E0B', // Yellow
  C: '#F97316', // Orange
  D: '#EF4444', // Red
} as const;

export function PriorityBadge({ priorityId }: { priorityId: number }) {
  const { priorities } = useSettings();
  const priority = priorities.find(p => p.id === priorityId);
  
  return priority ? (
    <Badge 
      className="text-white font-medium"
      style={{ backgroundColor: priority.colorCode }}
    >
      {priority.displayText}
    </Badge>
  ) : null;
}
```

## Performance & Quality

### Azure SQL Optimization
```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: process.env.AZURE_SQL_DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});
```

### Quality Checklist
- [ ] NextCRM patterns preserved
- [ ] TypeScript strict mode
- [ ] iPad 44px touch targets
- [ ] Azure SQL schema documented
- [ ] Settings system functional
- [ ] <1 second search performance
- [ ] Food service logic accurate
- [ ] Tests passing
- [ ] iPad Safari verified
- [ ] Code reviewed