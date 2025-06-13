import { test, expect } from '@playwright/test';
import { foodServiceOrganizations, territoryData, foodServiceOpportunities } from './fixtures/food-service-data';

test.describe('Food Service Industry Workflows', () => {

  test.describe('Restaurant Type Management', () => {
    
    test('should handle different restaurant types correctly', async ({ page }) => {
      await page.goto('/');
      
      for (const org of foodServiceOrganizations) {
        await page.click('[data-testid="add-organization-btn"]');
        
        // Fill organization details
        await page.fill('[data-testid="org-name-input"]', org.name);
        await page.selectOption('[data-testid="org-type-select"]', org.type);
        await page.selectOption('[data-testid="org-priority-select"]', org.priority);
        await page.fill('[data-testid="org-revenue-input"]', org.revenue.toString());
        await page.fill('[data-testid="org-contact-input"]', org.contact);
        
        await page.click('[data-testid="save-organization-btn"]');
        
        // Verify organization was created with correct type
        const orgCard = page.locator(`[data-testid="org-card-${org.id}"]`);
        await expect(orgCard).toContainText(org.name);
        await expect(orgCard).toContainText(org.type.replace('_', ' '));
        
        // Verify type-specific features
        if (org.type === 'FINE_DINING') {
          await expect(orgCard.locator('[data-testid="premium-indicator"]')).toBeVisible();
        } else if (org.type === 'FAST_FOOD') {
          await expect(orgCard.locator('[data-testid="volume-indicator"]')).toBeVisible();
        }
      }
    });

    test('should calculate revenue targets by restaurant type', async ({ page }) => {
      await page.goto('/analytics');
      
      // Check revenue breakdown by restaurant type
      await expect(page.locator('[data-testid="fine-dining-revenue"]')).toContainText('$125,000');
      await expect(page.locator('[data-testid="fast-food-revenue"]')).toContainText('$89,000');
      await expect(page.locator('[data-testid="casual-dining-revenue"]')).toContainText('$156,000');
      
      // Verify total revenue calculation
      await expect(page.locator('[data-testid="total-revenue"]')).toContainText('$370,000');
    });
  });

  test.describe('Food Broker Commission Tracking', () => {
    
    test('should calculate commissions correctly for different territories', async ({ page }) => {
      await page.goto('/territory-management');
      
      // Check Northeast territory
      const northeastTerritory = page.locator('[data-testid="territory-northeast"]');
      await expect(northeastTerritory).toContainText(territoryData.NORTHEAST.name);
      await expect(northeastTerritory).toContainText(territoryData.NORTHEAST.broker);
      
      // Calculate expected commission
      const expectedCommission = territoryData.NORTHEAST.currentRevenue * territoryData.NORTHEAST.commissionRate;
      await expect(northeastTerritory.locator('[data-testid="commission-amount"]')).toContainText(`$${expectedCommission.toLocaleString()}`);
      
      // Check commission rate
      await expect(northeastTerritory.locator('[data-testid="commission-rate"]')).toContainText('5%');
      
      // Verify territory performance
      const performancePercentage = (territoryData.NORTHEAST.currentRevenue / territoryData.NORTHEAST.targetRevenue) * 100;
      await expect(northeastTerritory.locator('[data-testid="performance-percentage"]')).toContainText(`${performancePercentage.toFixed(1)}%`);
    });

    test('should track monthly commission payments', async ({ page }) => {
      await page.goto('/commission-tracking');
      
      // Select broker
      await page.selectOption('[data-testid="broker-select"]', 'John Smith');
      
      // Select month
      await page.selectOption('[data-testid="month-select"]', '2024-01');
      
      // View commission details
      await page.click('[data-testid="view-commission-details"]');
      
      // Verify commission breakdown
      await expect(page.locator('[data-testid="base-commission"]')).toBeVisible();
      await expect(page.locator('[data-testid="bonus-commission"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-commission"]')).toBeVisible();
      
      // Check payment status
      await expect(page.locator('[data-testid="payment-status"]')).toContainText('Processed');
    });
  });

  test.describe('Order Processing & Inventory Management', () => {
    
    test('should process food service orders with proper validation', async ({ page }) => {
      await page.goto('/orders');
      
      await page.click('[data-testid="create-order-btn"]');
      
      // Select customer
      await page.selectOption('[data-testid="customer-select"]', 'org-1');
      
      // Add products
      await page.click('[data-testid="add-product-btn"]');
      await page.selectOption('[data-testid="product-category"]', 'DAIRY');
      await page.selectOption('[data-testid="product-item"]', 'Artisanal Cheese');
      await page.fill('[data-testid="product-quantity"]', '25');
      await page.fill('[data-testid="product-unit-price"]', '12.50');
      
      // Verify calculations
      await expect(page.locator('[data-testid="line-total"]')).toContainText('$312.50');
      
      // Add delivery information
      await page.fill('[data-testid="delivery-date"]', '2024-02-15');
      await page.selectOption('[data-testid="delivery-window"]', 'MORNING');
      await page.fill('[data-testid="special-instructions"]', 'Deliver to kitchen entrance');
      
      // Submit order
      await page.click('[data-testid="submit-order-btn"]');
      
      // Verify order confirmation
      await expect(page.locator('[data-testid="order-confirmation"]')).toContainText('Order #');
      await expect(page.locator('[data-testid="order-total"]')).toContainText('$312.50');
    });

    test('should handle inventory alerts for low stock items', async ({ page }) => {
      await page.goto('/inventory');
      
      // Check for low stock alerts
      const lowStockItems = page.locator('[data-testid="low-stock-item"]');
      const count = await lowStockItems.count();
      
      if (count > 0) {
        // Check first low stock item
        const firstItem = lowStockItems.first();
        await expect(firstItem.locator('[data-testid="stock-level"]')).toContainText('Low');
        await expect(firstItem.locator('[data-testid="reorder-alert"]')).toBeVisible();
        
        // Test reorder functionality
        await firstItem.locator('[data-testid="reorder-btn"]').click();
        
        // Verify reorder form
        await expect(page.locator('[data-testid="reorder-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="suggested-quantity"]')).toHaveValue(/\d+/);
      }
    });
  });

  test.describe('Customer Relationship Management', () => {
    
    test('should track customer preferences and dietary restrictions', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to organization details
      await page.click('[data-testid="organization-card"]').first();
      
      // Add customer preferences
      await page.click('[data-testid="preferences-tab"]');
      await page.click('[data-testid="add-preference-btn"]');
      
      await page.selectOption('[data-testid="preference-type"]', 'DIETARY_RESTRICTION');
      await page.fill('[data-testid="preference-value"]', 'Gluten-Free Options Required');
      await page.fill('[data-testid="preference-notes"]', 'Chef requires certified gluten-free ingredients');
      
      await page.click('[data-testid="save-preference-btn"]');
      
      // Verify preference is saved
      await expect(page.locator('[data-testid="preference-list"]')).toContainText('Gluten-Free Options Required');
      
      // Test preference filtering in product recommendations
      await page.click('[data-testid="product-recommendations-tab"]');
      
      // Should show gluten-free products
      await expect(page.locator('[data-testid="recommended-products"]')).toContainText('Gluten-Free');
    });

    test('should manage seasonal menu planning', async ({ page }) => {
      await page.goto('/menu-planning');
      
      // Select season
      await page.selectOption('[data-testid="season-select"]', 'SPRING');
      
      // Add seasonal items
      await page.click('[data-testid="add-seasonal-item-btn"]');
      await page.fill('[data-testid="item-name"]', 'Spring Asparagus Special');
      await page.selectOption('[data-testid="item-category"]', 'VEGETABLES');
      await page.fill('[data-testid="item-description"]', 'Fresh local asparagus with hollandaise');
      await page.fill('[data-testid="start-date"]', '2024-03-01');
      await page.fill('[data-testid="end-date"]', '2024-05-31');
      
      await page.click('[data-testid="save-seasonal-item-btn"]');
      
      // Verify item is added to seasonal menu
      await expect(page.locator('[data-testid="seasonal-menu"]')).toContainText('Spring Asparagus Special');
      
      // Test automatic supplier recommendations
      await page.click('[data-testid="view-suppliers-btn"]');
      await expect(page.locator('[data-testid="supplier-recommendations"]')).toContainText('Local Farm');
    });
  });

  test.describe('Compliance & Food Safety', () => {
    
    test('should track food safety certifications', async ({ page }) => {
      await page.goto('/compliance');
      
      // Add HACCP certification
      await page.click('[data-testid="add-certification-btn"]');
      await page.selectOption('[data-testid="cert-type"]', 'HACCP');
      await page.fill('[data-testid="cert-number"]', 'HACCP-2024-001');
      await page.fill('[data-testid="issue-date"]', '2024-01-15');
      await page.fill('[data-testid="expiry-date"]', '2025-01-15');
      await page.selectOption('[data-testid="issuing-body"]', 'FDA');
      
      await page.click('[data-testid="save-certification-btn"]');
      
      // Verify certification is tracked
      await expect(page.locator('[data-testid="cert-list"]')).toContainText('HACCP-2024-001');
      
      // Check expiry alerts
      await page.click('[data-testid="expiry-alerts-tab"]');
      
      // Should show certifications expiring within 60 days
      const expiringCerts = page.locator('[data-testid="expiring-cert"]');
      const expiringCount = await expiringCerts.count();
      
      if (expiringCount > 0) {
        await expect(expiringCerts.first()).toContainText('Expires in');
      }
    });

    test('should maintain temperature tracking logs', async ({ page }) => {
      await page.goto('/temperature-logs');
      
      // Add temperature reading
      await page.click('[data-testid="add-temp-reading-btn"]');
      await page.selectOption('[data-testid="location-select"]', 'WALK_IN_COOLER');
      await page.fill('[data-testid="temperature-value"]', '38');
      await page.selectOption('[data-testid="temperature-unit"]', 'FAHRENHEIT');
      await page.fill('[data-testid="reading-time"]', '2024-01-15T08:00');
      
      await page.click('[data-testid="save-temp-reading-btn"]');
      
      // Verify reading is logged
      await expect(page.locator('[data-testid="temp-log"]')).toContainText('38°F');
      
      // Test alert for out-of-range temperatures
      await page.click('[data-testid="add-temp-reading-btn"]');
      await page.fill('[data-testid="temperature-value"]', '45'); // Above safe range
      await page.click('[data-testid="save-temp-reading-btn"]');
      
      // Should trigger alert
      await expect(page.locator('[data-testid="temp-alert"]')).toContainText('Temperature out of safe range');
    });
  });

  test.describe('Reporting & Analytics', () => {
    
    test('should generate sales reports by territory', async ({ page }) => {
      await page.goto('/reports');
      
      // Select territory report
      await page.selectOption('[data-testid="report-type"]', 'TERRITORY_SALES');
      await page.selectOption('[data-testid="time-period"]', 'Q1_2024');
      
      await page.click('[data-testid="generate-report-btn"]');
      
      // Verify report data
      await expect(page.locator('[data-testid="report-title"]')).toContainText('Territory Sales Report - Q1 2024');
      
      // Check territory breakdown
      await expect(page.locator('[data-testid="northeast-sales"]')).toContainText('$415,000');
      await expect(page.locator('[data-testid="southeast-sales"]')).toContainText('$380,000');
      
      // Verify charts are displayed
      await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="territory-comparison-chart"]')).toBeVisible();
    });

    test('should track customer retention metrics', async ({ page }) => {
      await page.goto('/analytics/retention');
      
      // View retention dashboard
      await expect(page.locator('[data-testid="retention-rate"]')).toContainText('%');
      await expect(page.locator('[data-testid="churn-rate"]')).toContainText('%');
      
      // Check customer segments
      await page.click('[data-testid="segment-analysis-tab"]');
      
      await expect(page.locator('[data-testid="new-customers"]')).toBeVisible();
      await expect(page.locator('[data-testid="returning-customers"]')).toBeVisible();
      await expect(page.locator('[data-testid="at-risk-customers"]')).toBeVisible();
      
      // Test customer lifecycle tracking
      await page.click('[data-testid="lifecycle-tab"]');
      
      const lifecycleStages = page.locator('[data-testid="lifecycle-stage"]');
      const stageCount = await lifecycleStages.count();
      
      expect(stageCount).toBeGreaterThan(0);
      
      // Should show progression through stages
      await expect(lifecycleStages.first()).toContainText('Prospect');
    });
  });

  test.describe('Mobile Field Operations', () => {
    
    test('should handle offline order entry', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is for mobile field operations');
      
      await page.goto('/');
      
      // Go offline
      await page.setOffline(true);
      
      // Navigate to orders
      await page.click('[data-testid="orders-tab"]');
      await page.click('[data-testid="create-order-btn"]');
      
      // Fill order form offline
      await page.selectOption('[data-testid="customer-select"]', 'org-1');
      await page.fill('[data-testid="product-search"]', 'Cheese');
      await page.click('[data-testid="product-option"]').first();
      await page.fill('[data-testid="quantity"]', '10');
      
      await page.click('[data-testid="save-order-btn"]');
      
      // Verify order is queued for sync
      await expect(page.locator('[data-testid="sync-queue"]')).toContainText('1 order pending');
      
      // Go back online
      await page.setOffline(false);
      
      // Verify sync occurs
      await expect(page.locator('[data-testid="sync-status"]')).toContainText('Syncing...');
      
      // Wait for sync completion
      await page.waitForTimeout(3000);
      
      await expect(page.locator('[data-testid="sync-queue"]')).toContainText('0 orders pending');
    });

    test('should support GPS location tracking for deliveries', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is for mobile field operations');
      
      await page.goto('/deliveries');
      
      // Mock geolocation
      await page.context().grantPermissions(['geolocation']);
      await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
      
      await page.click('[data-testid="start-delivery-btn"]');
      
      // Should capture current location
      await expect(page.locator('[data-testid="current-location"]')).toContainText('40.7128');
      
      // Mark delivery as complete
      await page.click('[data-testid="complete-delivery-btn"]');
      
      // Should log delivery location and time
      await expect(page.locator('[data-testid="delivery-log"]')).toContainText('Delivered at');
      await expect(page.locator('[data-testid="delivery-coordinates"]')).toContainText('40.7128, -74.0060');
    });
  });
});