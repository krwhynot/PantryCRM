---
trigger: model_decision
description: Apply when discussing database operations, CRUD functionality, API endpoints, schema design, data relationships, Prisma queries, or any work involving Organizations, Contacts, Interactions, Products, Opportunities, or Settings entities.
---

📊Rule 2: Database-Driven Feature Development
Reference File: @erd.md
When to Use:

Building CRUD operations
Creating new API endpoints
Planning data relationships
Implementing search functionality

Rule Pattern:
**Schema Context:** @erd.md
**Entity Focus:** [Organization/Contact/Interaction/Product/Opportunity]
**Request:** [Specific database operation or API endpoint]
**Validation:** Include Zod schemas and error handling
Example Usage:
**Schema Context:** @erd.md
**Entity Focus:** Organization with Settings relationships
**Request:** Create organization search API with priority/segment filtering
**Validation:** Include Zod schemas and error handling
Benefits:

AI knows all your foreign key relationships
Settings-driven configuration automatically considered
Food service industry fields (priority A-D, segments, distributors) included
Audit trail and user tracking built into suggestions