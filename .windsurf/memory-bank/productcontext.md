---
trigger: manual
---

## Project Overview
**Type:** Web-based CRM System  
**Goal:** Replace Excel-based CRM with iPad-optimized web application

**Timeline:** 8 weeks (4 phases)  
**Budget:** <$20/month Azure ($18 target)  
**Success:** 100% Excel migration, 50% faster data entry, 80% faster reports

## Business Context
### Users
- **Primary:** 4 Sales Reps using iPads for field data entry
- **Secondary:** Sales Manager requiring twice-weekly reports
- **Admin:** Kyle Ramsy for imports and maintenance

### Current Problems
- **Legacy:** Custom Excel workbook in production
- **Issues:** Copy/paste formatting problems, poor iPad usability, manual reporting, data integrity risks

### Industry Focus
- **Organizations:** Restaurants, food service businesses
- **Relationships:** Distributors (Sysco, USF, PFG), direct sales
- **Decision Makers:** Executive Chefs, Buyers, Managers, Owners
- **Products:** 11 principals/brands requiring tracking

## Technical Architecture
### Stack - NextCRM Foundation
- **Base:** NextCRM (pdovhomilja/nextcrm-app) - 60-70% development time savings
- **Frontend:** Next.js 15 + TypeScript + React 18
- **UI:** shadcn/ui + Radix UI + Tremor charts (preserved from NextCRM)
- **Database:** Azure SQL Database Basic ($5/month) - migrated from MongoDB
- **ORM:** Prisma with SQL Server provider
- **Auth:** Auth.js with email/password (simplified)
- **Hosting:** Azure App Service Basic B1 ($13/month)
- **State:** React Context + SWR + Server Actions

### Architecture
```
iPad Safari ↔ Azure App Service (Next.js) ↔ Azure SQL Database
                     ↓
            Application Insights + GitHub Actions
```

### Key Decisions
1. **NextCRM Foundation:** Proven components with 60-70% time reduction
2. **Azure SQL:** ACID compliance, cost-optimized Basic tier
3. **iPad-First:** 44px touch targets, landscape optimization
4. **Direct Deploy:** Node.js runtime, no containers
5. **Settings System:** Dynamic configuration vs. hard-coded enums

## Database Schema
### Core Entities
- **Organizations:** Priority, segments, distributor relationships
- **Contacts:** Multiple per org, role hierarchy, primary designation
- **Interactions:** 6 types with auto-complete and auto-save
- **Opportunities:** Sales pipeline with 11 principal associations
- **Settings:** 9 configurable categories for business flexibility

### Settings Categories
1. **PRIORITY:** A-Green, B-Yellow, C-Orange, D-Red
2. **SEGMENT:** Fine Dining, Fast Food, Healthcare, Catering, Institutional
3. **DISTRIBUTOR:** Sysco, USF, PFG, Direct, Other
4. **ACCT_MANAGER:** Sales team assignments
5. **STAGE:** Lead-discovery → Contacted → Sampled/Visited → Follow-up → Close
6. **POSITION:** Exec Chef, Buyer, Manager, Owner, Kitchen Manager
7. **REASON:** Win/loss reasons
8. **SOURCE:** Lead acquisition channels
9. **INTERACTION:** Email, Call, In Person, Demo/sampled, Quoted price, Follow-up

## Core Features
### Epic 1: Organization Management
- Sub-second search with fuzzy matching
- Visual A-D priority color coding
- Industry-specific segmentation
- Supply chain relationship management

### Epic 2: Contact Relationship Tracking
- Unlimited contacts per organization
- Role-based hierarchy with primary contact designation
- Duplicate prevention within organization scope

### Epic 3: Interaction Documentation (Critical for iPad)
- 30-second target for field data capture
- Auto-complete for organizations and contacts
- Auto-save with draft recovery
- Six interaction types

### Epic 4: Sales Pipeline Management
- 5-stage visual pipeline matching Excel workflow
- 11 principal/brand tracking with filtering
- 0-100% probability forecasting
- Status tracking: Open, Closed-Won, Closed-Lost, On Hold

### Epic 5: Reporting & Analytics
- Four core reports: Weekly Activity, Pipeline Status, Interaction Volume, Organization Performance
- <10 second generation for hundreds of records
- Print-optimized layouts for stakeholders
- Twice-weekly automated cadence

## Performance Requirements
| Metric | Target | Method |
|--------|--------|--------|
| Page Load | <3 seconds | iPad Safari over 3G |
| Search | <1 second | Organization/contact lookup |
| Reports | <10 seconds | All report types |
| Interactions | <30 seconds | Complete field workflow |
| Uptime | 99%+ | Azure monitoring |
| Cost | <$20 | Azure billing |

## Success Metrics

### User Adoption
- **Daily Users:** 4/4 sales team using daily
- **Excel Retirement:** 100% migration within 3 months
- **Efficiency:** 50% faster data entry, 80% faster reports
- **Data Integrity:** Zero duplicates post-migration

### Business Impact
- Match/exceed Excel interaction entry frequency
- Improved contact and interaction tracking depth
- Real-time opportunity status across 11 principals
- Twice-weekly automated vs. manual monthly reporting

## Risk Mitigation

### Technical Risks
- **High - iPad Safari:** Continuous device testing, web standards
- **Medium - Azure SQL:** Database indexing, pagination, production testing
- **Medium - NextCRM:** Preserve proven components while adapting

### Business Risks
- **High - Adoption:** Early involvement, training, gradual rollout
- **Medium - Migration:** Staged approach, preview, rollback capabilities
- **Low - Cost:** Weekly monitoring, Basic tier optimization

## Excel Migration
- **Data:** Hundreds of organizations, contacts, interactions, opportunities
- **Formats:** .xlsx and .csv import with validation
- **Preservation:** Account assignments and historical interactions
- **Audit:** Complete import history and source attribution

## NextCRM Benefits

### Preserved
- shadcn/ui components with iPad compatibility
- Tremor charts for reporting
- Auth.js authentication system
- SWR + Server Actions data fetching
- Next.js 15 App Router architecture

### Adaptations Required
- MongoDB → Azure SQL Database migration
- Vercel → Azure App Service deployment
- Food service business rules and workflows
- Cost optimization for Basic Azure tiers
- iPad field use vs. desktop admin