# Settings System Migration Plan - Drizzle/PostgreSQL

## Executive Summary

The PantryCRM settings system requires comprehensive migration to resolve **model inconsistencies**, implement **missing components**, and fully port to **Drizzle ORM with PostgreSQL**. The current system has architectural gaps that need to be addressed during migration.

## Current State Analysis

### ❌ Critical Issues Identified

1. **Model Inconsistency**
   - Prisma schema defines `SystemSetting` model
   - API routes reference non-existent `setting` model with different fields
   - Field mismatch causes runtime errors

2. **Incomplete Implementation**
   - Settings context and hooks files exist but are empty
   - Settings dropdown component is not implemented
   - Frontend settings management is basic

3. **Data Structure Gaps**
   - Missing fields: `label`, `category`, `sortOrder`, `color`, `active`
   - JSON values stored as strings need proper typing
   - Category grouping not properly implemented

## Current Settings Architecture

### Database Schema (SQLite/Prisma)
```prisma
// Current SystemSetting model
model SystemSetting {
  id    String @id @default(cuid())
  key   String @unique
  value String
  type  String @default("string") // string, number, boolean, json
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([key])
  @@index([type])
}
```

### API Endpoints
- ❌ `/api/settings` - Uses undefined `setting` model
- ✅ `/api/metadata` - Cached settings access (working)
- ✅ `/api/crm/industries` - Industry-specific settings (working)
- ✅ `/api/admin/activateModule/[moduleId]` - Module management (working)

### Frontend Components
- ✅ Settings page - Basic display functionality
- ❌ Settings context - Empty file
- ❌ Settings hooks - Empty file
- ❌ Settings dropdown - Empty file

### Settings Categories (Food Service Industry)
- **Priority Settings**: A, B, C, D with color coding (4 items)
- **Market Segments**: Fine Dining, Fast Food, Healthcare, etc. (5 items)
- **Distributors**: Sysco, US Foods, Performance Food Group, etc. (5 items)
- **Contact Roles**: Executive Chef, Buyer, Manager, etc. (5 items)
- **Interaction Types**: Email, Call, In Person, Demo, etc. (6 items)
- **Principals**: Kaufholds, Frites Street, Better Balance, etc. (11 items)

**Total Settings**: ~36 predefined + custom settings

## Migration Strategy

### Phase 1: Schema Unification and Design (Week 1)

#### 1.1 Create Unified Drizzle Schema
```typescript
// lib/db/schema/settings.ts
export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => cuid()),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('string'), // string, number, boolean, json
  sortOrder: integer('sort_order').notNull().default(0),
  color: varchar('color', { length: 7}), // hex color code
  active: boolean('active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  keyIdx: index('settings_key_idx').on(table.key),
  categoryIdx: index('settings_category_idx').on(table.category),
  typeIdx: index('settings_type_idx').on(table.type),
  activeIdx: index('settings_active_idx').on(table.active),
}));

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
```

#### 1.2 Create Settings Type Definitions
```typescript
// types/settings.ts
export interface SettingCategory {
  key: string;
  label: string;
  description?: string;
  sortOrder: number;
}

export interface SettingValue {
  raw: string;
  parsed: any;
  type: 'string' | 'number' | 'boolean' | 'json';
}

export interface SettingWithMetadata extends SystemSetting {
  parsedValue: any;
  categoryInfo?: SettingCategory;
}
```

#### 1.3 Create Settings Migration Script
```typescript
// lib/db/migrations/settings-migration.ts
export async function migrateSettingsFromPrisma() {
  // 1. Fetch all SystemSetting records from SQLite
  // 2. Transform data to match new schema
  // 3. Insert into PostgreSQL with new fields
  // 4. Validate data integrity
}
```

### Phase 2: Data Layer Migration (Week 1-2)

#### 2.1 Create Settings Service Layer
```typescript
// lib/services/settings-service.ts
export class SettingsService {
  // CRUD operations using Drizzle ORM
  async getSettings(category?: string): Promise<SystemSetting[]>
  async getSetting(key: string): Promise<SystemSetting | null>
  async upsertSetting(setting: NewSystemSetting): Promise<SystemSetting>
  async deleteSetting(key: string): Promise<void>
  
  // Typed value access
  async getTypedValue<T>(key: string): Promise<T | null>
  async setTypedValue<T>(key: string, value: T, type: string): Promise<void>
  
  // Category management
  async getSettingsByCategory(): Promise<Record<string, SystemSetting[]>>
  async getCategories(): Promise<SettingCategory[]>
}
```

#### 2.2 Create Settings Cache Service
```typescript
// lib/cache/settings-cache.ts
export class SettingsCache {
  private static cache = new Map<string, { data: any; expires: number }>();
  
  static async getCachedSettings(category?: string): Promise<SystemSetting[]>
  static async invalidateCache(pattern?: string): Promise<void>
  static async getTypedSetting<T>(key: string): Promise<T | null>
}
```

#### 2.3 Update API Routes
- Fix `/api/settings` to use correct model and new fields
- Update `/api/metadata` for new schema structure
- Enhance `/api/crm/industries` with new query patterns
- Update module activation API to use new fields

### Phase 3: Frontend Implementation (Week 2)

#### 3.1 Implement Settings Context
```typescript
// contexts/SettingsContext.tsx
export interface SettingsContextType {
  settings: Record<string, SystemSetting[]>;
  loading: boolean;
  error: string | null;
  
  getSetting: (key: string) => SystemSetting | null;
  getTypedSetting: <T>(key: string) => T | null;
  updateSetting: (key: string, value: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
}
```

#### 3.2 Create Settings Hooks
```typescript
// hooks/useSettings.ts
export function useSettings(category?: string) {
  // Settings CRUD operations
  // Typed value access
  // Real-time updates
  // Error handling
}

export function useSetting<T>(key: string) {
  // Individual setting management
  // Type-safe value access
  // Optimistic updates
}
```

#### 3.3 Build Settings Management UI
- Enhanced settings page with full CRUD capabilities
- Category-based organization
- Color picker for priority settings
- Drag-and-drop sort ordering
- Bulk import/export functionality

### Phase 4: Data Migration and Validation (Week 2-3)

#### 4.1 Food Service Settings Migration
```typescript
// scripts/migrate-food-service-settings.ts
const FOOD_SERVICE_SETTINGS = [
  // Priority Settings
  { key: 'PRIORITY_A', label: 'Priority A', category: 'PRIORITIES', color: '#ef4444', sortOrder: 1 },
  { key: 'PRIORITY_B', label: 'Priority B', category: 'PRIORITIES', color: '#f97316', sortOrder: 2 },
  { key: 'PRIORITY_C', label: 'Priority C', category: 'PRIORITIES', color: '#eab308', sortOrder: 3 },
  { key: 'PRIORITY_D', label: 'Priority D', category: 'PRIORITIES', color: '#22c55e', sortOrder: 4 },
  
  // Market Segments (5 items)
  { key: 'MARKET_FINE_DINING', label: 'Fine Dining', category: 'MARKET_SEGMENTS', sortOrder: 1 },
  // ... etc
  
  // Distributors (5 items)
  { key: 'DISTRIBUTOR_SYSCO', label: 'Sysco', category: 'DISTRIBUTORS', sortOrder: 1 },
  // ... etc
  
  // Contact Roles (5 items)
  { key: 'ROLE_EXECUTIVE_CHEF', label: 'Executive Chef', category: 'CONTACT_ROLES', sortOrder: 1 },
  // ... etc
  
  // Interaction Types (6 items)
  { key: 'INTERACTION_EMAIL', label: 'Email', category: 'INTERACTION_TYPES', sortOrder: 1 },
  // ... etc
  
  // Principals (11 items)
  { key: 'PRINCIPAL_KAUFHOLDS', label: 'Kaufholds', category: 'PRINCIPALS', sortOrder: 1 },
  // ... etc
];
```

#### 4.2 Validation Scripts
- Verify all settings migrated correctly
- Test category grouping
- Validate color codes and sort orders
- Ensure cache invalidation works
- Test API endpoints with new schema

### Phase 5: Integration and Testing (Week 3)

#### 5.1 Component Integration Testing
- Settings page with new backend
- Priority badge components with color system
- Dropdown components with dynamic settings
- Form validation with settings constraints

#### 5.2 Performance Testing
- Settings cache performance
- Database query optimization
- Frontend render performance
- Memory usage validation

#### 5.3 End-to-End Testing
- Settings CRUD operations
- Category management
- Color and sorting functionality
- Cache invalidation flows

## Risk Assessment and Mitigation

### 🔴 High Risk Areas

1. **Model Inconsistency Impact**
   - **Risk**: API routes break due to undefined model
   - **Mitigation**: Create compatibility layer during transition
   - **Rollback**: Keep old API endpoints until migration complete

2. **Data Loss During Migration**
   - **Risk**: Settings data corruption or loss
   - **Mitigation**: Full backup before migration, validation scripts
   - **Rollback**: Restore from backup, revert API changes

3. **Cache Invalidation Issues**
   - **Risk**: Stale settings in production
   - **Mitigation**: Comprehensive cache flush, monitoring
   - **Rollback**: Manual cache clear, settings refresh

### 🟡 Medium Risk Areas

1. **Frontend Breaking Changes**
   - **Risk**: Settings UI stops working
   - **Mitigation**: Gradual rollout, feature flags
   - **Rollback**: Disable new settings UI, use basic version

2. **Performance Impact**
   - **Risk**: Settings queries slower than SQLite
   - **Mitigation**: Proper indexing, query optimization
   - **Rollback**: Increase cache TTL, optimize queries

### 🟢 Low Risk Areas

1. **New Feature Implementation**
   - **Risk**: Additional features may have bugs
   - **Mitigation**: Incremental feature rollout
   - **Rollback**: Disable new features, use basic functionality

## Success Criteria

### ✅ Phase 1 Complete
- [ ] Unified Drizzle schema created and validated
- [ ] Type definitions comprehensive and type-safe
- [ ] Migration scripts tested in development

### ✅ Phase 2 Complete
- [ ] Settings service layer fully implemented
- [ ] Cache service working with new schema
- [ ] All API routes updated and tested

### ✅ Phase 3 Complete
- [ ] Settings context and hooks implemented
- [ ] Settings management UI fully functional
- [ ] Color and sorting features working

### ✅ Phase 4 Complete
- [ ] All 36+ food service settings migrated
- [ ] Data validation scripts pass 100%
- [ ] Performance benchmarks met

### ✅ Migration Complete
- [ ] All settings functionality working in production
- [ ] No performance degradation
- [ ] Cache performance optimal
- [ ] UI responsive and functional
- [ ] Documentation updated

## Timeline and Dependencies

| Phase | Duration | Key Dependencies |
|-------|----------|------------------|
| **Phase 1** | 3-4 days | Drizzle schema design, type definitions |
| **Phase 2** | 4-5 days | Database migration, API updates |
| **Phase 3** | 3-4 days | Frontend implementation |
| **Phase 4** | 3-4 days | Data migration, validation |
| **Phase 5** | 2-3 days | Integration testing |
| **Total** | **2-3 weeks** | **DZ-004 (schema), DZ-006 (data), DZ-007 (API)** |

## Integration with Main Migration Plan

This settings migration is part of the broader Drizzle/PostgreSQL migration and depends on:

- **DZ-002**: Azure PostgreSQL infrastructure
- **DZ-004**: Core schema conversion
- **DZ-006**: Data migration scripts
- **DZ-007**: API route updates
- **DZ-008**: Frontend component updates
- **DZ-009**: Testing validation

## Monitoring and Rollback

### Monitoring Metrics
- Settings query response time < 50ms
- Cache hit ratio > 95%
- Settings API error rate < 0.1%
- UI render time < 100ms

### Rollback Procedures
1. **Immediate**: Revert API routes to use SystemSetting model
2. **Data**: Restore settings from SQLite backup
3. **Frontend**: Disable new settings UI features
4. **Cache**: Clear all caches, rebuild from database

---

**Status**: Ready for implementation  
**Priority**: High (blocks configurable features)  
**Estimated Effort**: 2-3 weeks  
**Risk Level**: Medium (model inconsistencies need resolution)  
**Dependencies**: Core Drizzle migration (DZ-004, DZ-006, DZ-007)