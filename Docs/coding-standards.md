# PantryCRM Coding Rules & Standards

## Overview
This guide establishes coding standards for the PantryCRM project, built with React 19, Azure SQL Database, Prisma ORM, and TypeScript. These rules ensure code quality, performance, and compatibility with the project's $18/month Azure budget constraints.

## 1. React 19 Development Standards

### Server vs. Client Components
- Use Server Components (default) for data fetching and static content rendering
- Mark Client Components explicitly with `"use client"` directive for interactive functionality
- Server Components can fetch data directly without useEffect, reducing bundle size
- Use React `children` prop to create placeholders in Client Components

### Actions and Form Handling
- Leverage React 19's Actions API for form submissions and async operations
- Use `useActionState` hook for simplified form state management
- Implement form `action` prop with async functions to eliminate manual event handlers

### React 19 Hooks Implementation
- `useOptimistic` for immediate UI feedback during async operations
- `useFormStatus` for form submission states
- `use` hook for promise-based data fetching (with Suspense boundaries)
- Treat refs as regular props (React 19 style) instead of using `forwardRef`

## 2. TypeScript Best Practices

### Configuration
- Enable `"strict": true` in tsconfig.json for comprehensive type checking
- Implement strict null checks and undefined handling

### Type Safety Guidelines
- Use explicit type annotations for function parameters and return types
- Leverage TypeScript's inference for variable declarations
- Avoid `any` type and prefer `unknown` for uncertain types
- Implement proper type narrowing with type guards

### Interface and Type Usage
- Prefer interfaces for object shapes (more extensible and readable)
- Use type aliases for complex types, unions, and intersections
- Implement generics with constraints for reusable components

## 3. Prisma ORM and Azure SQL Guidelines

### Database Connection Management
- Implement singleton pattern for Prisma Client to avoid multiple instances
- Use the global variable approach to ensure one Prisma Client instance exists

### Query Optimization (Critical for Azure SQL Basic Tier)
- Use Prisma's `select` and `include` strategically to fetch only required data
- Implement database indexes for frequently queried columns
- Consider Azure SQL Basic tier DTU limitations (5 DTU) when designing queries
- Monitor query performance using Azure SQL Database's built-in insights

### Schema Management
- Use descriptive model and field names
- Implement proper relationships
- Test schema migrations thoroughly before production deployment

## 4. Component Architecture and Testing

### Component Design Principles
- Create reusable components following single responsibility principle
- Implement pure functional components when possible
- Define clear props interfaces with TypeScript
- Use error boundaries to handle component failures gracefully

### Testing Strategy
- Use Jest and React Testing Library
- Focus on user interactions over implementation details
- Test rendering, state changes, and event handling

### Error Handling
- Implement strategic error boundaries throughout the application
- Use error reporting hooks to capture and log errors

## 5. Multi-Device Compatibility

### Responsive Design Requirements
- Design with flexible grids using percentages and relative measurements
- Implement media queries for different devices and screen sizes
- **CRITICAL: Ensure minimum 44px touch targets for all interactive elements**
- Test on Windows touch laptop and iPad Safari (required platforms)

### Touch and Mouse Interface Support
- Support both touch and mouse/keyboard inputs
- Implement touch-friendly UI components that work across devices

## 6. Security and Deployment

### Azure Cloud Security
- Leverage Azure Security Center and built-in security features
- Protect against common attacks (SQL injection, XSS, etc.)
- Enforce strong authentication practices

### Deployment Best Practices
- Follow Azure's secure deployment guidelines
- Implement automated deployment pipelines
- Use infrastructure-as-code for consistency
- **CRITICAL: Stay within $18/month budget (SQL Basic $5 + App Service B1 $13)**

### Secrets Management
- Never store secrets in source code
- Use Azure Key Vault for secure secrets storage
- Implement proper access policies

## 7. Code Quality and Performance

### Code Review Process
- Verify feature requirements, readability, maintainability
- Ensure proper error handling and security considerations
- Check performance optimization, especially for Azure SQL Basic tier

### Git Workflow Standards
- Follow consistent feature branching strategy
- Make atomic commits with descriptive messages
- Implement code reviews for every pull request

### Performance Requirements
- Sub-second search response time
- Reports completed in <10 seconds
- Efficient UI rendering (minimize component re-renders)
- Mobile-optimized bundle size

## 8. Food Service Industry Specifics

### Organization and Contact Management
- Properly handle 11 food service brands relationships
- Implement comprehensive customer tracking (restaurants/food services)
- Support 5-stage sales pipeline workflow with 6 interaction types

### Data Integrity
- Prevent duplicate entries for organizations/contacts
- Preserve account manager assignments
- Implement Settings Management system for configurable dropdowns

## 9. User Experience Standards

### Sales Workflow Optimization
- Minimize clicks for common tasks
- Implement auto-complete for frequent entries
- Create logical field tab order for keyboard navigation
- Support 30-second interaction entry target

### Excel Import/Export
- Validate data during import (prevent duplicates/orphaned records)
- Implement proper error handling for malformed data
- Display clear progress indicators during processing

## Implementation Priority
1. Security and data integrity
2. Performance optimization for Azure SQL Basic tier
3. Touch-friendly responsive design
4. Food service industry-specific workflows
5. User experience enhancements
