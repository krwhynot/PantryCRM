---
description: Create comprehensive architectural blueprint and technical requirements for Food Service CRM using NextCRM foundation. Defines database schema, UI specifications, and implementation roadmap before development begins.
---

# Food Service CRM - Blueprint Planning

## Description
Create comprehensive architectural blueprint and technical requirements for Food Service CRM using NextCRM foundation. Defines database schema, UI specifications, and implementation roadmap before development begins.

---

## Steps

### 1. Analyze Current NextCRM Architecture
```bash
# Review NextCRM codebase structure
find . -name "*.tsx" -o -name "*.ts" | grep -E "(components|pages|api)" | head -20
```

### 2. Design Food Service Database Schema
Create `docs/database-schema.md`:
```markdown
## Core Entities
- Organizations: priority_id, segment_id, distributor_id, account_manager_id
- Contacts: organization_id, position_id, is_primary
- Interactions: organization_id, contact_id, interaction_type_id, account_manager_id
- Opportunities: organization_id, principal, stage_id, status_id, probability
- SettingOptions: Dynamic configuration for all dropdowns
```

### 3. Define Food Service Business Requirements
Document requirements in `docs/business-requirements.md`:
```markdown
## Priority System: A (Green), B (Yellow), C (Orange), D (Red)
## Market Segments: Fine Dining, Fast Food, Healthcare, Catering, Institutional
## Distributors: Sysco, USF, PFG, Direct, Other
## Contact Roles: Exec Chef, Buyer, Manager, Owner, Kitchen Manager
## Interaction Types: Email, Call, In Person, Demo/sampled, Quoted price, Follow-up
## Pipeline Stages: Lead-discovery → Contacted → Sampled/Visited → Follow-up → Close
## Principals: Kaufholds, Frites Street, Better Balance, VAF, Ofk, Annasea, Wicks, RJC, Kayco, Abdale, Land Lovers
```

### 4. Create iPad UI Specifications
Document in `docs/ipad-ui-specs.md`:
```markdown
## Touch Targets: Minimum 44px for all interactive elements
## Layout: Landscape orientation optimization
## Performance: <1 second search, <10 second reports
## Auto-complete: Fuzzy matching for organizations/contacts
## Visual Indicators: Color-coded priority levels
## Form Optimization: Large input fields, clear validation
```

### 5. Plan Database Migration Strategy
Create `docs/migration-plan.md`:
```markdown
## MongoDB → Azure SQL Database conversion
## Prisma schema modifications required
## Settings system implementation for dynamic configuration
## Data validation and integrity checks
## Performance optimization for 4 concurrent users
```

### 6. Define Performance Requirements
Document in `docs/performance-targets.md`:
```markdown
## Search Response: <1 second for organization/contact lookup
## Report Generation: <10 seconds for all report types
## Interaction Logging: <30 seconds per entry on iPad
## System Uptime: 99%+ availability
## Monthly Cost: <$20 ($18 target)
```

### 7. Create Technology Stack Documentation
Document in `docs/tech-stack.md`:
```markdown
## Frontend: Next.js 15, TypeScript, shadcn/ui, Tremor charts
## Backend: Prisma ORM, Auth.js, Server Actions
## Database: Azure SQL Database Basic
## Deployment: Azure App Service B1
## Authentication: Email/password via NextAuth.js
```

### 8. Plan 8-Week Implementation Timeline
Create `docs/implementation-phases.md`:
```markdown
## Phase 1 (Weeks 1-2): Foundation Setup
## Phase 2 (Weeks 3-5): Core CRM Functionality  
## Phase 3 (Weeks 6-7): Pipeline and Reporting
## Phase 4 (Week 8): Data Migration and Launch
```

### 9. Design Settings Management System
Create `docs/settings-architecture.md`:
```markdown
## 9 Setting Categories: Priority, Segment, Distributor, Account Manager, Stage, Position, Reason, Source, Interaction Type, Status
## Dynamic dropdown population
## Color coding for visual indicators
## Sort order management
## System vs user-defined protection
```

### 10. Create Risk Assessment
Document in `docs/risk-assessment.md`:
```markdown
## Technical Risks: iPad Safari compatibility, performance with large datasets
## Business Risks: User adoption resistance, data migration complexity
## Mitigation Strategies: Daily device testing, staged rollout, comprehensive training
```

### 11. Validate Azure Cost Model
```bash
# Calculate monthly Azure costs
echo "Azure SQL Basic: $5/month"
echo "Azure App Service B1: $13/month" 
echo "Total: $18/month (within $20 budget)"
```

### 12. Generate Architecture Diagrams
Create system architecture documentation:
```markdown
## Frontend Layer: NextCRM Web App (Next.js 15 + TypeScript)
## API Layer: Next.js App Router + Prisma ORM
## Data Layer: Azure SQL Database with Settings system
## Azure Infrastructure: App Service + SQL Database
```

---

## Success Criteria
- Complete architectural blueprint documented
- Database schema designed for food service requirements
- iPad UI specifications defined with 44px touch targets
- Technology stack validated for NextCRM → Azure migration
- 8-week implementation timeline established
- Azure cost model confirmed at $18/month
- All documentation ready for development team