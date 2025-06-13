# PantryCRM Excel Migration Plan

## Overview
This document outlines the migration strategy for importing data from the CRM-WORKBOOK.xlsx Excel file into the PantryCRM database.

## Source Data Analysis

### Excel Workbook Structure
- **File**: `excel/CRM-WORKBOOK.xlsx`
- **Total Sheets**: 30
- **Key Data Sheets**:
  - Organizations: 2,284 rows
  - Contacts: 1,954 rows
  - Opportunities: 1,068 rows
  - Interactions: 3,470 rows

### Data Volume Summary
- **Total Records**: ~8,776 core CRM records
- **Estimated Migration Time**: 15-30 minutes for full migration
- **Memory Requirements**: ~512MB (streaming enabled for Azure B1 optimization)

## Migration Phases

### Phase 1: Data Validation & Preparation (Current)
- ✅ Excel structure analysis completed
- ✅ Field mapping configuration created
- ⏳ Data validation rules implementation
- ⏳ Test data extraction

### Phase 2: Entity Migration Order
Due to foreign key relationships, entities must be migrated in this order:

1. **Organizations** (no dependencies)
   - Clean and validate organization names
   - Map priority values (A-D → HIGH/MEDIUM/LOW/NONE)
   - Validate addresses and contact information

2. **Contacts** (depends on Organizations)
   - Split full names into firstName/lastName
   - Resolve organization references
   - Validate email addresses and phone numbers

3. **Opportunities** (depends on Organizations, Contacts)
   - Convert Excel date serial numbers
   - Map stage values to standard pipeline stages
   - Calculate monetary values from volume data

4. **Interactions** (depends on all above)
   - Convert date formats
   - Resolve all entity references
   - Map interaction types

### Phase 3: Data Transformation Pipeline
- Streaming processing for large datasets
- Batch size: 1,000 records
- Checkpoint frequency: Every 5,000 records
- Progress reporting: Real-time updates

### Phase 4: Post-Migration Validation
- Row count verification
- Data integrity checks
- Relationship validation
- Missing data reports

## Field Mappings

### Organizations
| Excel Column | Database Field | Transformation |
|-------------|----------------|----------------|
| ORGANIZATIONS | name | Trim whitespace |
| PRIORITY-FOCUS (A-D) | priority | A→HIGH, B→MEDIUM, C→LOW, D→NONE |
| SEGMENT | segment | Direct mapping |
| PHONE | phone | Clean format, digits only |
| STREET ADDRESS | address | Direct mapping |
| CITY | city | Direct mapping |
| STATE | state | Uppercase |
| ZIP CODE | zipCode | Validate format |

### Contacts
| Excel Column | Database Field | Transformation |
|-------------|----------------|----------------|
| FULL NAME (FIRST, LAST) | firstName, lastName | Split on comma/space |
| Organizations | organizationId | Lookup by name |
| POSITION | title | Direct mapping |
| EMAIL | email | Lowercase, validate format |
| PHONE | phone | Clean format |

### Opportunities
| Excel Column | Database Field | Transformation |
|-------------|----------------|----------------|
| Organizations | organizationId | Lookup by name |
| OPPORTUNITY NAME | name | Direct mapping |
| Start Date | createdAt | Excel serial → ISO date |
| STATUS | status | Map to OPEN/CLOSED_WON/CLOSED_LOST |
| STAGE | stage | Map to standard pipeline stages |
| PROBABILITY | probability | Convert to percentage |
| CASES Per Week VOLUME | value | Parse as number |

### Interactions
| Excel Column | Database Field | Transformation |
|-------------|----------------|----------------|
| DATE | date | Excel serial → ISO date |
| INTERACTION | type | Map to CALL/EMAIL/MEETING/OTHER |
| Organizations | organizationId | Lookup by name |
| CONTACT | contactId | Lookup by name |
| NOTES | notes | Direct mapping |

## Error Handling

### Validation Errors
- Required field missing → Log error, skip record
- Invalid data format → Attempt transformation, use default if fails
- Foreign key not found → Create placeholder or skip

### Recovery Strategy
- All operations are transactional
- Rollback capability for each entity type
- Detailed error logs with row numbers
- Option to fix and retry failed records

## Migration Execution

### Pre-Migration Checklist
- [ ] Backup current database
- [ ] Verify Excel file accessibility
- [ ] Check available memory (4GB minimum)
- [ ] Clear any existing test data

### Migration Command
```bash
npm run migrate:excel
```

### Progress Monitoring
- Real-time progress bar
- Entity-level completion status
- Error count display
- Estimated time remaining

### Post-Migration Steps
1. Verify record counts match expectations
2. Run data integrity checks
3. Review error logs
4. Test application functionality
5. Generate migration report

## Performance Considerations

### Azure B1 Optimizations
- Streaming mode enabled for large files
- Batch processing to manage memory
- Garbage collection between entity types
- Connection pooling for database operations

### Expected Performance
- Organizations: ~500 records/minute
- Contacts: ~400 records/minute
- Opportunities: ~300 records/minute
- Interactions: ~600 records/minute

## Rollback Plan

### Full Rollback
```bash
npm run migrate:rollback
```

### Partial Rollback
- Rollback specific entity type
- Preserve successfully migrated data
- Detailed rollback logs

## Success Criteria
- ✅ All valid records migrated
- ✅ < 5% error rate
- ✅ All relationships preserved
- ✅ Application functional post-migration
- ✅ Performance within acceptable limits

## Next Steps
1. Complete UI dashboard for migration monitoring
2. Implement dry-run mode
3. Add data enrichment capabilities
4. Create automated testing suite