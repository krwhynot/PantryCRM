import { test, expect, devices } from '@playwright/test';
import { mobileTestScenarios, networkTestScenarios } from './fixtures/food-service-data';

test.describe('Mobile Responsiveness - Food Service CRM', () => {

  test.describe('Touch Interface Patterns', () => {
    
    test('should have proper touch target sizes (WCAG 2.5.5 Level AAA)', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      await page.goto('/');
      
      // Check tab navigation touch targets
      const tabButtons = page.locator('[data-testid="tab-button"]');
      const tabCount = await tabButtons.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabButtons.nth(i);
        const boundingBox = await tab.boundingBox();
        
        expect(boundingBox?.width).toBeGreaterThanOrEqual(mobileTestScenarios.touchTargets.minimumSize);
        expect(boundingBox?.height).toBeGreaterThanOrEqual(mobileTestScenarios.touchTargets.minimumSize);
      }
      
      // Check floating action button
      const floatingButton = page.locator('[data-testid="floating-action-button"]');
      const fabBox = await floatingButton.boundingBox();
      
      expect(fabBox?.width).toBeGreaterThanOrEqual(mobileTestScenarios.touchTargets.minimumSize);
      expect(fabBox?.height).toBeGreaterThanOrEqual(mobileTestScenarios.touchTargets.minimumSize);
      
      // Check organization card touch areas
      const orgCards = page.locator('[data-testid="organization-card"]');
      if (await orgCards.count() > 0) {
        const cardBox = await orgCards.first().boundingBox();
        expect(cardBox?.height).toBeGreaterThanOrEqual(mobileTestScenarios.touchTargets.minimumSize);
      }
    });

    test('should handle swipe gestures on organization cards', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      await page.goto('/');
      
      // Wait for organization cards to load
      await page.waitForSelector('[data-testid="organization-card"]', { timeout: 10000 });
      
      const orgCard = page.locator('[data-testid="organization-card"]').first();
      
      // Test swipe left to reveal right actions
      await orgCard.hover();
      
      // Simulate swipe left gesture
      const cardBox = await orgCard.boundingBox();
      if (cardBox) {
        await page.mouse.move(cardBox.x + cardBox.width - 10, cardBox.y + cardBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(cardBox.x + 10, cardBox.y + cardBox.height / 2);
        await page.mouse.up();
        
        // Check if right actions are revealed
        await expect(page.locator('[data-testid="card-action-delete"]')).toBeVisible();
      }
      
      // Test swipe right to reveal left actions
      if (cardBox) {
        await page.mouse.move(cardBox.x + 10, cardBox.y + cardBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(cardBox.x + cardBox.width - 10, cardBox.y + cardBox.height / 2);
        await page.mouse.up();
        
        // Check if left actions are revealed
        await expect(page.locator('[data-testid="card-action-call"]')).toBeVisible();
        await expect(page.locator('[data-testid="card-action-edit"]')).toBeVisible();
      }
    });

    test('should support pull-to-refresh functionality', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      await page.goto('/');
      
      // Find the pull-to-refresh container
      const refreshContainer = page.locator('[data-testid="pull-to-refresh-container"]');
      
      // Simulate pull down gesture
      const containerBox = await refreshContainer.boundingBox();
      if (containerBox) {
        // Start pull gesture from top
        await page.mouse.move(containerBox.x + containerBox.width / 2, containerBox.y + 10);
        await page.mouse.down();
        
        // Pull down beyond threshold
        await page.mouse.move(
          containerBox.x + containerBox.width / 2, 
          containerBox.y + mobileTestScenarios.pullToRefresh.threshold + 20
        );
        
        // Check for pull indicator
        await expect(page.locator('[data-testid="pull-indicator"]')).toBeVisible();
        await expect(page.locator('[data-testid="pull-indicator"]')).toContainText('Release to update');
        
        // Release to trigger refresh
        await page.mouse.up();
        
        // Check for refresh indicator
        await expect(page.locator('[data-testid="pull-indicator"]')).toContainText(mobileTestScenarios.pullToRefresh.expectedText);
        
        // Wait for refresh to complete
        await page.waitForTimeout(mobileTestScenarios.pullToRefresh.duration);
      }
    });
  });

  test.describe('Responsive Design Implementation', () => {
    
    test('should adapt layout for different screen sizes', async ({ page }) => {
      // Test mobile viewport (iPhone SE)
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');
      
      // Check that navigation tabs are horizontally scrollable
      const tabContainer = page.locator('[data-testid="tab-container"]');
      await expect(tabContainer).toHaveCSS('overflow-x', 'auto');
      
      // Check that cards stack vertically
      const organizationGrid = page.locator('[data-testid="organization-grid"]');
      await expect(organizationGrid).toHaveCSS('flex-direction', 'column');
      
      // Test tablet viewport (iPad)
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that layout adapts
      await expect(organizationGrid).toHaveCSS('display', 'grid');
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // Check that layout uses full width efficiently
      const dashboard = page.locator('[data-testid="dashboard-container"]');
      await expect(dashboard).toHaveCSS('max-width', '1200px');
    });

    test('should handle orientation changes', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Test portrait orientation
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      
      // Check portrait layout
      const sidePanel = page.locator('[data-testid="side-panel"]');
      await expect(sidePanel).toHaveCSS('display', 'none');
      
      // Test landscape orientation
      await page.setViewportSize({ width: 812, height: 375 });
      
      // Check landscape layout adaptations
      const tabIndicator = page.locator('[data-testid="tab-indicator"]');
      await expect(tabIndicator).toHaveCSS('bottom', '10px');
    });
  });

  test.describe('Gesture Handling Validation', () => {
    
    test('should handle tab navigation swipes', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      await page.goto('/');
      
      // Start on first tab
      await expect(page.locator('[data-testid="tab-0"]')).toHaveClass(/active/);
      
      // Swipe left to go to next tab
      const tabContent = page.locator('[data-testid="tab-content"]');
      const contentBox = await tabContent.boundingBox();
      
      if (contentBox) {
        await page.mouse.move(contentBox.x + contentBox.width - 10, contentBox.y + contentBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(contentBox.x + 10, contentBox.y + contentBox.height / 2);
        await page.mouse.up();
        
        // Check that we moved to the next tab
        await expect(page.locator('[data-testid="tab-1"]')).toHaveClass(/active/);
      }
      
      // Swipe right to go back
      if (contentBox) {
        await page.mouse.move(contentBox.x + 10, contentBox.y + contentBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(contentBox.x + contentBox.width - 10, contentBox.y + contentBox.height / 2);
        await page.mouse.up();
        
        // Check that we moved back to the first tab
        await expect(page.locator('[data-testid="tab-0"]')).toHaveClass(/active/);
      }
    });

    test('should prevent over-scrolling on boundaries', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      await page.goto('/');
      
      // Try to swipe right on first tab (should not move)
      await expect(page.locator('[data-testid="tab-0"]')).toHaveClass(/active/);
      
      const tabContent = page.locator('[data-testid="tab-content"]');
      const contentBox = await tabContent.boundingBox();
      
      if (contentBox) {
        await page.mouse.move(contentBox.x + 10, contentBox.y + contentBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(contentBox.x + contentBox.width - 10, contentBox.y + contentBox.height / 2);
        await page.mouse.up();
        
        // Should still be on first tab
        await expect(page.locator('[data-testid="tab-0"]')).toHaveClass(/active/);
      }
    });
  });

  test.describe('Offline Functionality Requirements', () => {
    
    test('should display offline indicator when network is unavailable', async ({ page }) => {
      await page.goto('/');
      
      // Go offline
      await page.setOffline(true);
      
      // Check for offline indicator
      await expect(page.locator('[data-testid="network-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="network-status"]')).toContainText(networkTestScenarios.offline.expectedBehavior.replace('-', ' '));
      
      // Check for offline features
      await expect(page.locator('[data-testid="offline-features"]')).toContainText('Local data available');
      await expect(page.locator('[data-testid="offline-features"]')).toContainText('Auto-sync enabled');
    });

    test('should handle slow connection warnings', async ({ page }) => {
      await page.goto('/');
      
      // Simulate slow connection
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 2000); // Add 2s delay
      });
      
      // Trigger network quality detection
      await page.evaluate(() => {
        // Mock slow connection
        Object.defineProperty(navigator, 'connection', {
          value: {
            effectiveType: '2g',
            downlink: 0.5,
            saveData: false
          },
          writable: true
        });
        
        // Trigger connection change event
        window.dispatchEvent(new Event('online'));
      });
      
      // Check for slow connection warning
      await expect(page.locator('[data-testid="network-status"]')).toContainText('Slow connection detected');
    });

    test('should sync data when back online', async ({ page }) => {
      await page.goto('/');
      
      // Go offline
      await page.setOffline(true);
      
      // Add some offline data
      await page.click('[data-testid="add-organization-btn"]');
      await page.fill('[data-testid="org-name-input"]', 'Offline Restaurant');
      await page.click('[data-testid="save-organization-btn"]');
      
      // Check pending sync indicator
      await expect(page.locator('[data-testid="sync-pending-indicator"]')).toContainText('1 pending');
      
      // Go back online
      await page.setOffline(false);
      
      // Check for back online message
      await expect(page.locator('[data-testid="network-status"]')).toContainText(networkTestScenarios.backOnline.expectedMessage);
      
      // Check for sync activity
      await expect(page.locator('[data-testid="sync-indicator"]')).toContainText('Syncing...');
      
      // Wait for sync to complete
      await page.waitForTimeout(networkTestScenarios.backOnline.duration);
      
      // Check that pending count is cleared
      await expect(page.locator('[data-testid="sync-pending-indicator"]')).toContainText('0 pending');
    });
  });

  test.describe('Progressive Web App Features', () => {
    
    test('should show PWA install prompt', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'PWA install is primarily for mobile');
      
      await page.goto('/');
      
      // Trigger PWA install prompt
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeinstallprompt'));
      });
      
      // Check for install prompt
      await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="pwa-install-prompt"]')).toContainText('Install PantryCRM');
    });

    test('should register service worker', async ({ page }) => {
      await page.goto('/');
      
      // Check service worker registration
      const swRegistration = await page.evaluate(() => {
        return navigator.serviceWorker.getRegistration();
      });
      
      expect(swRegistration).toBeTruthy();
    });

    test('should cache resources for offline use', async ({ page }) => {
      await page.goto('/');
      
      // Wait for service worker to cache resources
      await page.waitForTimeout(2000);
      
      // Check that cache is populated
      const cacheKeys = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        return cacheNames;
      });
      
      expect(cacheKeys).toContain('pantry-crm-v1');
    });
  });
});