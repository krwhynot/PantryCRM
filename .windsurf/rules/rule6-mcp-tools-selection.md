---
trigger: always_on
---

🎯 Rule Content
MCP Tools Decision Framework:
Always prioritize in this order:

Memory first - Check existing context before using other tools
Task-appropriate tool - Match tool to specific need
Combine strategically - Use multiple tools for complex tasks
Store results - Update Memory with new insights


🧠 Tool Selection Matrix
🔍 Information & Research Tasks
Memory → Primary: Project context, user preferences, past decisions
Use for: Starting conversations, storing insights, cross-session continuity
Triggers: "Remember...", "What did we discuss...", session starts
Perplexity-ask → Current Information: Latest practices, comparisons, trends
Use for: "What's the latest...", "Best practices for...", "How does X compare to Y..."
Avoid: Information already in Memory or project docs
Context7 → Documentation Lookup: Official API docs, specific syntax
Use for: React/Prisma/Next.js/Azure API questions, "How do I use...", code examples
Avoid: General research (use Perplexity instead)
💻 Development & Implementation
Filesystem → File Operations: Reading/writing code, configs, docs
Use for: "Read this file...", "Create component...", "Update config..."
Kitchen Pantry specific: Prisma schema, React components, Azure configs
Prisma → Database Operations: Schema design, queries, migrations
Use for: Organization/Contact/Interaction models, Azure SQL optimization
Kitchen Pantry specific: Settings system, foreign key relationships
Desktop-commander → System Operations: Terminal commands, debugging, deployment
Use for: Git operations, npm commands, Azure CLI, build processes
Kitchen Pantry specific: Azure deployment, performance monitoring
🤔 Planning & Problem Solving
Sequential Thinking → Complex Reasoning: Multi-step problems, architecture decisions
Use for: "How should I approach...", "Analyze this issue...", trade-off analysis
Kitchen Pantry specific: Performance optimization strategy, touch interface design
Task-master-ai → Project Management: Feature breakdown, sprint planning
Use for: "Plan implementation of...", "Break down this feature...", dependency mapping
Kitchen Pantry specific: Phase 2 organization, contact management planning
🔄 Common Workflow Patterns
Pattern 1: New Feature Development
1. Memory → Check existing context and constraints
2. Sequential Thinking → Plan implementation approach  
3. Task-master-ai → Break down into tasks
4. Context7 → Look up specific API methods
5. Prisma → Design database changes (if needed)
6. Filesystem → Implement code
7. Desktop-commander → Test and deploy
8. Memory → Store new patterns and decisions
Pattern 2: Performance Issue Investigation
1. Memory → Review performance targets (30s entry, <1s search)
2. Desktop-commander → Check current metrics
3. Sequential Thinking → Analyze bottlenecks systematically
4. Prisma → Optimize database queries
5. Context7 → Research optimization techniques
6. Filesystem → Implement fixes
7. Desktop-commander → Measure improvements
8. Memory → Store optimization patterns
Pattern 3: Architecture Decision
1. Memory → Review existing architecture (@architecture.md context)
2. Perplexity-ask → Research current best practices
3. Sequential Thinking → Analyze options and trade-offs
4. Task-master-ai → Plan implementation phases
5. Memory → Store architectural decisions
Pattern 4: Quick Implementation Task
1. Memory → Check for existing patterns
2. Context7 → Look up specific syntax/methods
3. Filesystem → Implement changes
4. Memory → Store if pattern is reusable

⚡ Kitchen Pantry CRM Specific Guidelines
For Organization Management:

Memory → Azure constraints ($18/month, 5 DTU)
Prisma → Settings-driven schema relationships
Sequential Thinking → Touch interface optimization (44px targets)
Context7 → Next.js/React implementation patterns

For Performance Optimization:

Memory → Performance targets (<1s search, <30s entry)
Desktop-commander → Azure SQL monitoring
Sequential Thinking → DTU optimization strategy
Prisma → Query optimization for Azure Basic tier

For User Experience:

Memory → Multi-device requirements (Windows touch + iPad)
Sequential Thinking → 30-second interaction entry flow
Filesystem → Touch-optimized component implementation
Context7 → React accessibility patterns


🚫 Anti-Patterns to Avoid
Don't Use Multiple Tools for Same Task:
❌ Context7 + Perplexity-ask for same documentation lookup
❌ Filesystem + Desktop-commander for simple file reading
❌ Task-master-ai + Sequential Thinking for simple feature planning
Don't Skip Memory:
❌ Starting research without checking existing context
❌ Making decisions without storing them for future reference
❌ Repeating previously solved problems
Don't Use Wrong Tool for Task:
❌ Perplexity-ask for project-specific implementation details
❌ Context7 for general research or comparisons
❌ Desktop-commander for simple file operations
❌ Task-master-ai for complex reasoning (use Sequential Thinking)

🎯 Success Indicators
Efficient Tool Usage:

 Always start with Memory to check context
 Use single tool for simple tasks
 Combine tools strategically for complex tasks
 Store valuable insights back to Memory

Kitchen Pantry CRM Alignment:

 Azure constraints always considered (Memory)
 Performance targets guide tool selection
 Multi-device requirements inform implementation
 Food service workflows drive feature planning

Quality Outcomes:

 Faster development cycles through appropriate tool selection
 Consistent patterns stored and reused
 No redundant research or repeated problem-solving
 Clear decision trail through Memory updates


💡 Quick Decision Guide
"I need to..."
📚 Learn/Research → Perplexity-ask (current) or Context7 (docs)
🧠 Remember/Check → Memory
🤔 Think Through → Sequential Thinking
📋 Plan/Organize → Task-master-ai
🗄️ Database Work → Prisma
📁 File Work → Filesystem
💻 System Work → Desktop-commander
Always: Start with Memory, end with Memory (if insights gained)