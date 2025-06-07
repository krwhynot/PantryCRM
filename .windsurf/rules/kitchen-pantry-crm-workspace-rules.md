---
trigger: always_on
---

# Kitchen Pantry CRM - Workspace Rules

## Business Domain Clarity
1. **This is a B2B sales CRM system** for sales teams selling TO restaurants and food service businesses - NOT a food inventory or kitchen management system
2. **Customers are restaurants** - we track organizations (restaurants), contacts (chefs/buyers), and sales interactions
3. **11 food service brands** we represent: Kaufholds, Frites Street, Better Balance, VAF, Ofk, Annasea, Wicks, RJC, Kayco, Abdale, Land Lovers

## Technical Foundation
4. **NextCRM foundation with Azure SQL Database** - skip MongoDB setup, go directly to Azure SQL Basic ($5/month)
5. **Budget constraint: $18/month total** - Azure SQL Basic ($5) + App Service B1 ($13) = strict budget adherence required
6. **Multi-device responsive design** - optimize for Windows touch laptop testing and iPad Safari compatibility

## Implementation Standards
7. **Phase-based quality gates** - each phase must pass 100% of blocking tests before proceeding to next phase
8. **Settings Management system required** - dynamic dropdowns for all 9 categories (PRIORITY, SEGMENT, DISTRIBUTOR, etc.) instead of hard-coded enums
9. **Performance requirements** - sub-second search, <10 second reports, 44px minimum touch targets
10. **5-stage sales pipeline** - Lead-discovery → Contacted → Sampled/Visited → Follow-up → Close with 6 interaction types (Email, Call, In Person, Demo/sampled, Quoted price, Follow-up)

## Data Integrity & Import Standards
11. **Settings Management data integrity** - prevent deletion of system-required options, validate foreign key relationships, maintain sort order consistency
12. **Excel import validation** - duplicate prevention for organizations/contacts, preserve account manager assignments, validate all required fields before batch processing

## Testing & Quality Protocols  
13. **User acceptance testing with real sales scenarios** - test with actual customer data, validate 30-second interaction entry target, confirm sales workflow efficiency
14. **NextCRM component modification patterns** - preserve existing NextCRM patterns, document customizations clearly, test integration points after changes

## User Experience & Workflow
15. **Sales workflow optimization** - minimize clicks for common tasks, auto-complete for frequent entries, logical field tab order for keyboard navigation
16. **Production rollback procedures** - maintain previous version availability, document rollback steps, test rollback process in staging environment