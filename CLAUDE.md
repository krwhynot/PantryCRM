# PantryCRM - Kitchen Pantry CRM Excel Migration Project

## Project Overview
Kitchen Pantry CRM specialized for food service industry with Excel data migration capabilities.

## Core Configuration

### Model Settings
- Model: claude-opus-4-20250514
- Max tokens: 4096
- Temperature: 0.3
- Context strategy: sliding window with 40% retention

### Token Optimization Strategy
- File chunk size: 4000 tokens
- Cache enabled with 8-hour TTL
- Smart context loading with priority files
- Parallel processing enabled
- Memory optimization for 32GB RAM

## Excel Migration Focus

### Priority Files
1. `excel/CRM-WORKBOOK.xlsx` - Primary data source
2. `src/lib/excel-migration/*.ts` - Migration utilities
3. `prisma/schema.prisma` - Target database schema
4. `docs/migration-plan.md` - Migration documentation

### Exclude Patterns
- node_modules/**
- .next/**
- dist/**
- *.test.ts
- *.spec.ts
- coverage/**
- build/**

### Excel Processing Configuration
- Streaming enabled for large files
- Batch size: 2000 records (optimized for Azure Basic 5 DTU)
- Memory limit: 4GB
- Progress reporting enabled
- Checkpoint frequency: 10000 records (DTU optimized)
- Parallel processing: 8 workers
- Buffer size: 64MB
- Database batch operations: 25 records (DTU constrained)

## MCP Tool Usage Priority

### High Priority (FREE) - Optimized for 32GB RAM
- filesystem - Batch multiple file operations, use read_multiple_files
- sequential-thinking - Enable complex multi-step reasoning
- memory - Aggressive caching with large knowledge graphs

### Medium Priority (Use Selectively) - Parallel Usage
- context7 - Cache documentation locally, batch requests
- research_paper_search - Concurrent searches up to 4 threads

### Low Priority (Minimize Usage) - Cost-Conscious
- web_search_exa - ~$0.01 per search, batch queries when possible
- tavily-search - Current info only, use sparingly
- perplexity_ask - Avoid redundancy, cache responses

## Migration Phases

### Phase 1: Structure Analysis
- Max tokens: 1000
- Cache enabled
- Focus: Excel worksheet structure mapping

### Phase 2: Data Validation
- Max tokens: 500
- Batch processing enabled
- Focus: Data integrity checks

### Phase 3: Transformation
- Max tokens: 2000
- Streaming enabled
- Focus: Excel to database pipeline

### Phase 4: Rollback Planning
- Max tokens: 800
- Persist results
- Focus: Recovery strategies

## Response Preferences
- Format: Concise
- Code comments: Minimal
- Explanations: On request only
- Examples: Single instance
- Verbose errors: Disabled
- Alternatives: Not included

## Token Usage Monitoring
- Track usage: Enabled
- Alert threshold: 50,000 tokens
- Daily limit: 100,000 tokens
- Report frequency: Per session
- Cost tracking: Enabled

## Emergency Mode
Triggers when:
- Daily usage > 80,000 tokens
- Session usage > 20,000 tokens

Actions:
- Response limit: 500 tokens
- Disable explanations
- Code only mode
- No alternatives

## Current Migration Status
- Initial migration infrastructure created
- Azure B1 optimizations implemented
- Excel parsing libraries to be added
- Data transformation pipelines pending

## Commands Reference
- Run tests: `npm test`
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`