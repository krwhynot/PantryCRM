# Performance Testing Guide - PantryCRM Food Service CRM

## Overview

Comprehensive performance testing suite designed for food service industry operations, validating system performance under real-world usage patterns with 4 concurrent users representing typical food broker teams.

## 🎯 Performance Requirements

### Food Service Industry Benchmarks
- **Field Operations**: <1s response time for mobile endpoints
- **Dashboard Loading**: <2s initial load time  
- **Search Operations**: <500ms for autocomplete, <1s for full search
- **Report Generation**: <5s for simple reports, <30s for complex exports
- **Memory Usage**: <512MB heap for sustained operations
- **Concurrent Users**: Support 4+ simultaneous users without degradation

## 🛠️ Testing Tools

### Primary Tools (Installed)
- **Artillery** - Load testing and performance benchmarking
- **Autocannon** - Fast HTTP/1.1 benchmarking tool  
- **Node.js Profiling** - Built-in heap profiling and memory monitoring

### Official Documentation References
- **Artillery Documentation**: [artillery.io/docs](https://www.artillery.io/docs)
- **Next.js Memory Optimization**: [nextjs.org/docs/memory-usage](https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage)
- **Node.js Performance**: [nodejs.org/api/perf_hooks.html](https://nodejs.org/api/perf_hooks.html)

## 📊 Test Suites

### 1. Load Testing (4 Concurrent Users)
**File**: `tests/performance/load-testing-4-users.yml`

**Scenarios**:
- **Food Broker Daily Workflow** (40%) - Territory management, customer visits
- **Mobile Field Operations** (30%) - Offline sync, GPS check-ins  
- **Management Reporting** (20%) - Sales analytics, commission reports
- **Customer Data Management** (10%) - CRUD operations, bulk updates

**Performance Thresholds**:
- Response time: <2s average, <3s P95
- Error rate: <1%
- Throughput: Support 4 concurrent sessions

**Usage**:
```bash
# Run full load test
npm run test:performance:load

# Monitor with real-time metrics
artillery run tests/performance/load-testing-4-users.yml --output results.json
```

### 2. Search Performance Testing
**File**: `tests/performance/search-performance-test.yml`

**Search Types Tested**:
- **Organization Name Search** (35%) - Restaurant, cafe, bistro lookups
- **Territory-Based Search** (25%) - Geographic filtering
- **Contact Search** (20%) - Chef, manager, decision-maker lookups
- **Interaction History** (15%) - Call logs, meeting notes
- **Global Search** (5%) - Cross-entity full-text search
- **Autocomplete** (15%) - Real-time typeahead suggestions

**Performance Targets**:
- Autocomplete: <200ms response time
- Basic search: <500ms response time
- Complex filtered search: <1s response time
- Database queries: <300ms execution time

**Usage**:
```bash
# Run search performance tests
npm run test:performance:search

# Test specific search patterns
artillery run tests/performance/search-performance-test.yml --scenario "Organization Name Search"
```

### 3. Report Generation Testing
**File**: `tests/performance/report-generation-test.yml`

**Report Categories**:
- **Sales Performance Reports** (30%) - Territory, revenue, trends
- **Commission Reports** (25%) - Broker payouts, calculations
- **Customer Interaction Reports** (20%) - Touchpoint analysis
- **Financial Performance** (15%) - P&L, customer lifetime value
- **Compliance & Audit** (10%) - Data access logs, system activity
- **Large Data Exports** (5%) - Complete database exports

**Performance Standards**:
- Simple reports (monthly summaries): <5s
- Complex reports (annual analysis): <30s  
- Export generation (CSV/Excel): <15s
- PDF generation: <10s

**Usage**:
```bash
# Run report generation tests
npm run test:performance:reports

# Test specific report types
artillery run tests/performance/report-generation-test.yml --scenario "Sales Performance Reports"
```

### 4. Memory Usage Pattern Testing
**File**: `tests/performance/memory-usage-test.js`

**Memory Analysis**:
- **Heap Usage Monitoring** - Real-time memory consumption tracking
- **Memory Leak Detection** - Pattern analysis for retention issues
- **Garbage Collection** - GC frequency and impact analysis
- **Operation Memory Patterns** - Memory usage per CRM operation
- **Concurrent Load Memory** - Memory behavior under user load

**Memory Thresholds**:
- Heap usage: <512MB sustained operation
- RSS usage: <1GB total memory
- Memory growth: <10MB/hour baseline growth
- GC frequency: <5% CPU time in GC

**Usage**:
```bash
# Run memory analysis
npm run test:performance:memory

# Enable heap profiling during development  
npm run performance:memory-profile

# Quick memory check with Next.js built-in debugging
next build --experimental-debug-memory-usage
```

## 🚀 Running Performance Tests

### Complete Test Suite
```bash
# Run all performance tests (recommended)
npm run test:performance

# Run with specific options
node tests/performance/run-all-performance-tests.js --skip-memory --output-dir ./custom-results
```

### Individual Test Categories  
```bash
# Load testing only
npm run test:performance:load

# Search performance only
npm run test:performance:search  

# Report generation only
npm run test:performance:reports

# Memory usage only
npm run test:performance:memory
```

### Quick Performance Check
```bash
# Fast HTTP benchmarking (30 seconds, 4 connections)
npm run performance:quick

# Target specific endpoint
autocannon -c 4 -d 30 http://localhost:3000/api/search/organizations
```

## 📈 Performance Monitoring Setup

### Real-Time Monitoring
```bash
# Start application with profiling
NODE_OPTIONS="--inspect --max-old-space-size=4096" npm run dev

# Connect Chrome DevTools to localhost:9229 for live profiling
```

### Memory Profiling
```bash
# Generate heap profile during operation
node --heap-prof node_modules/next/dist/bin/next dev

# Analyze .heapprofile files in Chrome DevTools Memory tab
```

### Production Monitoring
```bash
# Enable Next.js memory optimization (Next.js 15+)
# Add to next.config.js:
experimental: {
  webpackMemoryOptimizations: true
}
```

## 📊 Results Analysis

### Test Reports Location
- **JSON Reports**: `tests/results/performance-test-report.json`
- **HTML Dashboard**: `tests/results/performance-test-report.html`
- **Artillery Reports**: `tests/results/artillery-*.json`
- **Memory Analysis**: `tests/results/memory-*.json`

### Key Metrics to Monitor

**Load Testing**:
- Requests per second (target: >100 RPS)
- Response time percentiles (P50, P95, P99)
- Error rates (target: <1%)
- Concurrent user capacity

**Search Performance**:
- Query execution time
- Database connection pool utilization  
- Cache hit ratios
- Index usage efficiency

**Report Generation**:
- Memory allocation during processing
- CPU utilization peaks
- Export file generation time
- Large dataset handling

**Memory Usage**:
- Heap growth patterns
- Memory leak indicators
- Garbage collection frequency
- Process restart frequency

## 🎯 Food Service Industry Optimizations

### Field Operations Performance
```yaml
# Optimized for mobile food brokers
Mobile Endpoints:
  - Response time: <500ms
  - Offline capability: Full CRUD
  - Sync performance: <5s for daily data
  - GPS accuracy: <10m for location tracking
```

### Territory Management Performance  
```yaml
# Optimized for geographic operations
Territory Operations:
  - Map loading: <2s initial load
  - Customer filtering: <300ms
  - Route optimization: <5s calculation
  - Commission calculation: <1s real-time
```

### High-Volume Data Scenarios
```yaml
# Tested with realistic food service data volumes
Data Volumes:
  - Organizations: 10,000+ restaurants
  - Contacts: 50,000+ decision makers  
  - Interactions: 100,000+ touchpoints/year
  - Transactions: 500,000+ orders/year
```

## 🔧 Performance Optimization Guide

### Database Optimization
```typescript
// Prisma query optimization for food service operations
const organizations = await prisma.organization.findMany({
  where: { territory: 'NORTHEAST' },
  select: { id: true, name: true, type: true }, // Minimal fields
  take: 20, // Pagination
  skip: (page - 1) * 20,
  orderBy: { lastContactDate: 'desc' }
});
```

### Caching Strategy
```typescript
// Redis caching for frequent searches  
const cacheKey = `search:${territory}:${type}:${page}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const results = await performSearch();
await redis.setex(cacheKey, 300, JSON.stringify(results)); // 5min cache
```

### Memory Management
```typescript
// Streaming for large exports
const stream = new Transform({
  transform(chunk, encoding, callback) {
    // Process data in chunks to avoid memory spikes
    this.push(processChunk(chunk));
    callback();
  }
});
```

## 🚨 Performance Alerts & Thresholds

### Critical Alerts (Immediate Action Required)
- Response time >5s sustained
- Memory usage >1GB sustained  
- Error rate >5%
- Database connections >80% pool capacity

### Warning Alerts (Monitor Closely)
- Response time >2s for 10+ minutes
- Memory growth >50MB/hour
- Search queries >1s consistently
- Report generation >15s average

### Food Service Specific Alerts
- Mobile endpoint response >1s (field operations impacted)
- Territory loading >3s (sales productivity impacted)
- Commission calculation errors (payroll impact)
- Bulk import failures (data integrity risk)

## 📚 Best Practices

### Development Performance Testing
1. **Local Testing**: Run performance tests before major deployments
2. **Feature Testing**: Test new features under load scenarios
3. **Regression Testing**: Ensure performance doesn't degrade over time
4. **Memory Profiling**: Regular heap analysis during development

### Production Performance Monitoring
1. **Continuous Monitoring**: Real-time performance metrics
2. **Alerting**: Automated notifications for threshold breaches
3. **Capacity Planning**: Proactive scaling based on growth patterns
4. **User Experience**: End-to-end transaction monitoring

### Food Service Industry Considerations
1. **Peak Hours**: Test during lunch rush equivalent loads
2. **Mobile Performance**: Optimize for field sales representatives
3. **Offline Resilience**: Ensure graceful degradation without connectivity
4. **Data Integrity**: Performance testing should not compromise data accuracy

## 🔍 Troubleshooting Performance Issues

### Common Issues & Solutions

**Slow Response Times**:
```bash
# Analyze slow queries
npm run test:performance:search -- --verbose

# Check database query plans
EXPLAIN ANALYZE SELECT * FROM organizations WHERE territory = 'NORTHEAST';
```

**Memory Leaks**:
```bash
# Generate heap snapshot
node --inspect --heap-prof npm run dev

# Analyze in Chrome DevTools Memory tab
```

**High CPU Usage**:
```bash
# Profile CPU usage
node --prof npm run dev

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

## 📞 Support & Documentation

- **Performance Issues**: Check `tests/results/` for detailed reports
- **Memory Problems**: Use `npm run performance:memory-profile`
- **Load Testing**: Artillery documentation at [artillery.io](https://artillery.io)
- **Next.js Optimization**: [Next.js Performance Guide](https://nextjs.org/docs/app/building-your-application/optimizing)

This comprehensive performance testing suite ensures PantryCRM meets the demanding requirements of food service industry operations while maintaining optimal user experience for field sales teams.