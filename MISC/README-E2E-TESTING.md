# E2E Testing Guide - PantryCRM Food Service CRM

## Overview

Comprehensive end-to-end testing suite designed specifically for food service industry workflows using Playwright framework.

## Test Structure

### 📁 Test Files

- **`critical-user-journeys.spec.ts`** - Core business workflows
- **`mobile-responsiveness.spec.ts`** - Mobile UX and touch interactions  
- **`cross-browser-compatibility.spec.ts`** - Browser compatibility matrix
- **`food-service-workflows.spec.ts`** - Industry-specific scenarios
- **`test-helper.ts`** - Shared utilities and helpers

### 🎯 Critical User Journeys

1. **Customer Acquisition & Onboarding**
   - Lead capture → Organization creation → Contact assignment → First interaction → Opportunity creation

2. **Sales Cycle Management**
   - Opportunity identification → Quote generation → Proposal tracking → Deal closure → Commission calculation

3. **Relationship Management**
   - Regular touchpoints → Interaction logging → Follow-up scheduling → Customer satisfaction tracking

4. **Mobile Field Operations**
   - Offline data access → Customer visit logging → Order placement → Online sync → Report generation

5. **Territory & Commission Management**
   - Territory assignment → Customer mapping → Sales tracking → Commission calculation → Payout processing

## 📱 Mobile Testing

### Touch Interface Patterns
- **Touch Target Size**: WCAG 2.5.5 Level AAA compliance (44px minimum)
- **Swipe Gestures**: Organization card actions (call, edit, delete)
- **Pull-to-Refresh**: Data synchronization with visual feedback
- **Tab Navigation**: Swipe between dashboard sections

### Responsive Design
- **Viewport Coverage**: 320px (iPhone SE) to 1024px (iPad Pro)
- **Orientation Testing**: Portrait/landscape mode switching
- **Layout Adaptation**: Grid to column stacking

### Offline Functionality
- **Network Status**: Visual indicators for offline/slow connection
- **Data Caching**: IndexedDB storage for offline access
- **Background Sync**: Automatic sync when connection restored
- **Progressive Web App**: Installation prompts and service worker

## 🌐 Cross-Browser Support

### Desktop Browsers
- **Chrome** (Primary) - Latest stable
- **Firefox** - Latest stable  
- **Safari** - Latest stable (macOS)
- **Edge** - Latest stable

### Mobile Browsers
- **iOS Safari** - iPhone/iPad field operations
- **Android Chrome** - Samsung Galaxy devices
- **Samsung Internet** - Secondary Android support

### Feature Compatibility
- **IndexedDB** - Offline storage with Safari private mode handling
- **Service Workers** - Background sync and caching
- **Web Workers** - Performance optimization
- **CSS Grid/Flexbox** - Layout systems
- **Touch Events** - Mobile gesture handling

## 🍽️ Food Service Workflows

### Restaurant Type Management
- **FINE_DINING** - Premium indicators and specialized features
- **FAST_FOOD** - Volume-based operations
- **CASUAL_DINING** - Mixed service model
- **CAFE** - Quick service optimization

### Commission Tracking
- **Territory Management** - Northeast (5%), Southeast (4.5%)
- **Revenue Calculation** - Automated commission computation
- **Payment Processing** - Monthly payout tracking

### Order Processing
- **Product Categories** - Dairy, Proteins, Vegetables, etc.
- **Inventory Alerts** - Low stock notifications
- **Delivery Tracking** - GPS location and time stamps

### Compliance & Safety
- **Food Safety Certifications** - HACCP, FDA tracking
- **Temperature Logs** - Walk-in cooler monitoring
- **Expiry Alerts** - 60-day certification warnings

## 🚀 Running Tests

### All Tests
```bash
npm run test:e2e
```

### Mobile-Specific Tests
```bash
npm run test:mobile
```

### Desktop Browser Tests
```bash
npm run test:desktop
```

### Critical User Journeys Only
```bash
npm run test:critical
```

### Food Service Workflows Only
```bash
npm run test:workflows
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### View Test Results
```bash
npm run test:e2e:report
```

## 📊 Test Configuration

### Performance Thresholds
- **Page Load**: < 6 seconds (8 seconds for Firefox)
- **DOM Content Loaded**: < 3 seconds
- **First Contentful Paint**: < 2 seconds
- **Large Dataset Processing**: < 1 second for 1000 records

### Network Conditions
- **Offline Mode**: Complete functionality with cached data
- **Slow Connection (2G)**: Warning indicators and timeout handling
- **Fast Connection**: Optimal performance benchmarks

### Accessibility Standards
- **WCAG 2.5.5 Level AAA**: Touch target compliance
- **Screen Reader**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Full application accessibility

## 🛠️ Test Utilities

### TestHelper Class
- **Authentication**: Login helper for protected routes
- **Data Creation**: Organization and contact creation
- **Mobile Gestures**: Swipe and pull-to-refresh simulation
- **Network Simulation**: Offline/slow/fast connection testing
- **Performance Monitoring**: Load time and metric tracking
- **Accessibility Checks**: Automated a11y validation

### Custom Assertions
- **Touch Target Size**: Automated WCAG compliance checking
- **Network Status**: Connection state validation
- **Offline Storage**: IndexedDB and cache verification
- **Geolocation**: GPS coordinate testing for mobile

## 📈 Performance Monitoring

### Key Metrics
- **Time to Interactive**: < 3 seconds
- **Bundle Size**: Optimized for mobile networks
- **Memory Usage**: Efficient for field devices
- **Battery Impact**: Minimal drain during field operations

### Food Service Specific
- **Order Entry Speed**: < 30 seconds per order
- **Commission Calculation**: Real-time updates
- **Territory Loading**: < 2 seconds for full territory data
- **Offline Sync**: < 5 seconds after reconnection

## 🔧 Development Guidelines

### Test Data Management
- **Fixtures**: Realistic food service data in `fixtures/food-service-data.ts`
- **Cleanup**: Automatic test data clearing between runs
- **Seed Data**: Consistent baseline for all tests

### Test Isolation
- **Independent Tests**: Each test can run in isolation
- **Parallel Execution**: Safe concurrent test running
- **State Management**: Clean slate for each test case

### Debugging Support
- **Screenshots**: Automatic capture on failure
- **Video Recording**: Full test session playback
- **Trace Viewer**: Step-by-step execution analysis
- **Console Logs**: Captured for troubleshooting

## 📋 CI/CD Integration

### GitHub Actions
- **Pull Request Checks**: Automated E2E testing
- **Cross-Browser Matrix**: All supported browsers
- **Mobile Device Emulation**: iOS and Android testing
- **Performance Regression**: Automated performance monitoring

### Quality Gates
- **All Critical Journeys**: Must pass before merge
- **Mobile Compatibility**: Touch and gesture validation
- **Accessibility Standards**: WCAG compliance checks
- **Performance Thresholds**: Load time requirements

## 🎯 Testing Strategy

### Priority Levels
1. **Critical**: Core food service workflows
2. **High**: Mobile field operations
3. **Medium**: Cross-browser compatibility
4. **Low**: Edge cases and error handling

### Coverage Areas
- **Functional**: Business logic and workflows
- **UI/UX**: Mobile-first design patterns
- **Performance**: Food service operation requirements
- **Security**: Data protection and compliance
- **Accessibility**: Universal usability

## 📞 Support

For E2E testing issues:
1. Check test reports: `npm run test:e2e:report`
2. Run in debug mode: `npm run test:e2e:debug`
3. Review trace files in `test-results/`
4. Consult `test-helper.ts` for utility functions

This comprehensive E2E testing suite ensures PantryCRM meets the demanding requirements of food service industry operations across all devices and browsers.