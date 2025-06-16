# Kitchen Pantry CRM - Claude Code Development Guide

## PROJECT OVERVIEW
**Kitchen Pantry CRM** - NextCRM-based Customer Relationship Management system for food service industry. Family company with 4 sales representatives replacing Excel-based system.

### Current Status
- **Phase 1**: Foundation setup COMPLETED ✅ 
- **Phase 2**: Core CRM functionality 95% COMPLETE
- **Location**: `R:\Projects\PantryCRM`
- **Development Server**: localhost:3000 (3.4s startup)
- **Next Steps**: Production deployment fixes (ESLint + Windows EPERM)

## CRITICAL PROTOCOLS

### 1. Memory-First Protocol (ALWAYS ACTIVE)
- **ALWAYS** start every response with "Remembering..." followed by memory check
- Use `read_graph` to check existing project context before any development tasks
- Save new learnings to memory: `create_entities`, `add_observations`, `create_relations`
- Track all project decisions, issues resolved, and implementation patterns

### 2. Research-First Development (MANDATORY)
- **NEVER** assume technical solutions - always research first
- Use MCP tools for evidence-based development decisions
- Primary research tools: Tavily (current info), Context7 (official docs), GitHub search
- Cross-reference multiple sources for critical architectural decisions

### 3. Complete Output Priority
- **ALWAYS** provide complete, untruncated code and solutions
- Use PowerShell syntax for all command examples (never bash)
- Structure responses with bullet points and clear sections
- Include full implementation steps, not just summaries

## TECHNICAL ARCHITECTURE

### Stack
- **Frontend**: Next.js 15, React 18.2.0 (stable), TypeScript, shadcn/ui
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: Azure SQL Server Basic ($5/month)
- **Hosting**: Azure App Service B1 ($13/month)
- **Budget**: Strict $18/month limit

### Performance Constraints
- **Search**: <1 second response
- **Reports**: <10 seconds generation
- **Dev Server**: <10 seconds startup (achieved: 3.4s)
- **Touch Targets**: 44px minimum for iPad compatibility
- **Concurrent Users**: 4 on Azure Basic tier

### Database Schema (Settings-Driven)
```typescript
// Use Settings system instead of hard-coded enums
model Organization {
  priorityId    String?  // FK to Setting
  segmentId     String?  // FK to Setting  
  distributorId String?  // FK to Setting
}

model Setting {
  category  String  // 'Priority', 'Segment', etc.
  key       String  // 'A', 'fine-dining', etc.
  label     String  // Display name
  color     String? // For priority colors
  sortOrder Int
  active    Boolean @default(true)
}
```

## BUSINESS REQUIREMENTS

### Core Entities
- **Organizations**: Restaurants with priority A-D, segments (Fine Dining, Fast Food, Healthcare, Catering, Institutional)
- **Contacts**: Multiple per org, roles (Exec Chef, Buyer, Manager, Owner, Kitchen Manager)
- **Interactions**: 6 types (Email, Call, In Person, Demo/sampled, Quoted price, Follow-up)
- **Pipeline**: 5 stages (Lead-discovery → Contacted → Sampled/Visited → Follow-up → Close)
- **Principals**: 11 food service brands (Kaufholds, Frites Street, Better Balance, etc.)

### Critical Goals
- **30-second interaction entry** (primary workflow optimization)
- **100% Excel data migration accuracy**
- **50% faster data entry than Excel**
- **<1 second search performance**
- **Multi-device optimization** (Windows touch + iPad Safari)

## MCP TOOL USAGE HIERARCHY

### Tier 1: Core Development Tools
1. **Memory** - Always first, track all project decisions
2. **Filesystem** - Code file management and project navigation
3. **Sequential Thinking** - Complex problem solving and architecture planning
4. **Tavily Search** - Current tech information and real-time research

### Tier 2: Specialized Research
5. **Context7** - Official documentation (Next.js, React, Azure, Prisma)
6. **Exa Research** - GitHub code examples and implementation patterns
7. **Perplexity** - Technical validation and cross-referencing

### Tier 3: Support Tools
8. **Postgres MCP** - Database schema and migration management
9. **Brave Search** - Fallback research when other tools insufficient
10. **Google Maps** - Location and mapping services

### MCP Server Installation & Setup
**Automatic Setup Commands:**
- `npm run setup:mcp` (Linux/Mac) - Installs all required MCP servers
- `npm run setup:mcp:windows` (Windows) - PowerShell version for Windows users

**Installed MCP Servers:**
- `@modelcontextprotocol/server-memory` - Memory management with .windsurf/memory.json
- `@modelcontextprotocol/server-sequential-thinking` - Complex problem solving
- `@modelcontextprotocol/server-filesystem` - File operations and project navigation
- `@upstash/context7-mcp` - Documentation search (Next.js, React, Azure, Prisma)
- `tavily-mcp` - Web search and current information retrieval
- `exa-mcp-server` - Academic research and GitHub code examples
- `@jschuller/perplexity-mcp` - AI-powered search and technical validation
- `@modelcontextprotocol/server-brave-search` - Alternative web search
- `@modelcontextprotocol/server-postgres` - Database operations and schema management
- `@modelcontextprotocol/server-google-maps` - Maps and location services

**Configuration Location:** `/mnt/r/Projects/PantryCRM/.claude/claude_desktop_config.json`

### Tool Selection Logic
```
User Query → Memory Check → Task Analysis →
├── Code Issues → Filesystem + Context7
├── Research Needed → Tavily + Exa Research  
├── Complex Planning → Sequential Thinking
├── Database Changes → Prisma MCP
└── Terminal Operations → Desktop Commander
```

## DEVELOPMENT GUIDELINES

### Code Standards
- **TypeScript strict mode** enabled
- **React functional components** with hooks only
- **Prisma** for all database operations
- **shadcn/ui** component patterns
- **Mobile-first** responsive design
- **Error boundaries** for component resilience
- **Zod schemas** for validation

### NextCRM Integration Patterns
- Adapt existing NextCRM components where possible
- Check `components/` directory for reusable patterns
- Verify compatibility with food service requirements
- Maintain 60-70% development time reduction benefit

### Performance Optimization
- **Database**: Add indexes for common queries, use select/include strategically
- **Caching**: Implement for Settings and frequent lookups
- **Bundle Size**: Target 800KB compressed, lazy load components
- **Azure SQL**: Minimize DTU usage, optimize for Basic tier

## CURRENT PROJECT STATUS

### Completed (Phase 1 & 2)
✅ NextCRM foundation integration  
✅ React 18.2.0 stable implementation  
✅ Azure SQL schema migration  
✅ Organization search API (54-104ms response)  
✅ Contact management with role hierarchy  
✅ QuickInteractionEntry component (30-second target)  
✅ Settings seed data (all food service categories)  
✅ Touch target compliance (44px minimum)  
✅ All 31 tests passing  
✅ Development server optimization (3.4s startup)  

### Immediate Tasks
🔧 **ESLint Configuration Fix** - Change TypeScript rules from 'error' to 'warn'  
🔧 **Windows EPERM Resolution** - Implement prebuild script for .next cleanup  
🚀 **Production Deployment** - Azure App Service B1 with GitHub Actions  

### Phase 3 Targets
- User acceptance testing with 4 sales representatives
- Excel data migration completion
- Performance monitoring and optimization
- Training and adoption support

## CRITICAL FILE LOCATIONS

### Core Application
- `app/crm/page.tsx` - Main CRM dashboard with QuickInteractionEntry
- `components/interactions/QuickInteractionEntry.tsx` - 30-second entry component
- `app/api/organizations/search/route.ts` - Fast organization search
- `app/api/contacts/by-organization/[orgId]/route.ts` - Contact fetching

### Configuration
- `prisma/schema.prisma` - Database schema with Settings system
- `prisma/seed.ts` - Food service data seeding
- `.eslintrc.json` - TypeScript ESLint configuration
- `next.config.js` - Build and deployment configuration

### Testing
- `__tests__/` - Component tests with touch target compliance
- `jest.config.js` - Testing framework configuration
- `package.json` - Dependencies and scripts

## DEVELOPMENT WORKFLOW

### 1. Task Analysis
```powershell
# Always start with memory check and project status
claude "Check memory for [specific topic] and analyze current implementation"
```

### 2. Research Phase
```powershell
# Use MCP tools for evidence-based decisions
claude "Research [technical requirement] using Context7 and Tavily"
```

### 3. Implementation
```powershell
# Follow NextCRM patterns and performance requirements
claude "Implement [feature] following Kitchen Pantry CRM standards"
```

### 4. Testing & Validation
```powershell
# Multi-device testing with touch compliance
npm test -- --testNamePattern="[component]"
npm run dev  # Verify localhost:3000 functionality
```

### 5. Memory Update
```powershell
# Save learnings for future reference
claude "Save implementation decision and performance results to memory"
```

## TROUBLESHOOTING PRIORITIES

### 1. Performance Issues
- Check Azure SQL DTU usage patterns
- Analyze bundle size impact
- Verify search response times (<1s target)
- Test touch interface responsiveness

### 2. NextCRM Integration Issues
- Verify component import paths
- Check for missing dependencies
- Validate with existing patterns
- Test multi-device compatibility

### 3. Database Issues
- Use Prisma Studio for data verification
- Check Settings system relationships
- Validate foreign key constraints
- Monitor query performance

### 4. Build/Deployment Issues
- ESLint configuration conflicts
- Windows file permission errors
- Azure App Service deployment
- Environment variable configuration

## SUCCESS METRICS

### Technical Performance
- ✅ Search: <1 second (achieved: 54-104ms)
- ✅ Dev startup: <10 seconds (achieved: 3.4s)
- 🎯 Reports: <10 seconds generation
- 🎯 Bundle size: <800KB compressed

### Business Impact
- 🎯 100% Excel data migration accuracy
- 🎯 50% faster data entry than Excel
- 🎯 80% faster report generation
- 🎯 100% user adoption within 3 months
- ✅ $18/month Azure cost maintained

## KEY ARCHITECTURAL DECISIONS

### Design Principles
- **No MongoDB**: Direct Azure SQL implementation
- **No Docker**: Direct deployment to Azure App Service
- **No Revenue Tracking**: Simplified opportunity model
- **All Users Equal**: No complex permissions system
- **Settings-Driven**: Dynamic configuration for all dropdowns
- **Excel Import**: One-time migration, no ongoing sync

### Quality Standards
- Multi-device compatibility (touch + mouse/keyboard)
- Error handling and loading states for all operations
- Tests for critical functionality
- Azure SQL Basic tier DTU optimization
- Settings system for all configurable options

---

## CLAUDE CODE SPECIFIC INSTRUCTIONS

When working on Kitchen Pantry CRM:

1. **Always use memory first** - Check project context before implementing
2. **Research before coding** - Use MCP tools for technical validation
3. **Follow performance constraints** - Azure Basic tier is non-negotiable
4. **Maintain NextCRM patterns** - Leverage existing 60-70% time savings
5. **Test multi-device** - Touch targets and iPad Safari compatibility
6. **Update memory** - Save all implementation decisions and learnings

Remember: This is a real-world project for an actual family business. Code quality, performance, and user experience directly impact daily operations of 4 sales representatives replacing their Excel-based workflow.

**Project Success = 30-second interaction entry + <1 second search + 100% Excel replacement within $18/month budget**