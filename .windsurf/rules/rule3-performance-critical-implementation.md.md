---
trigger: model_decision
description: Apply when discussing performance optimization, slow operations, Azure DTU limits, 30-second targets, sub-second search, mobile touch interfaces, responsive design, caching strategies, or any speed/efficiency concerns.
---

**Content Structure:**
**Performance Context:** @architecture.md @implementation_guide.md

**Azure Constraints:**
- Database: Azure SQL Basic tier (5 DTU limit)
- Budget: $18/month total
- Concurrent Users: 4 maximum

**Performance Targets:**
- Search operations: < 1 second
- Simple reports: < 10 seconds
- Interaction entry: < 30 seconds total
- Touch targets: 44px minimum

**Request:** [Specific optimization need]
**Expected Output:** [Optimized code/queries/configuration]