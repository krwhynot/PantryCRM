import { Page, expect } from '@playwright/test';

export class TestHelper {
  constructor(private page: Page) {}

  /**
   * Wait for network to be idle and page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Login helper for authenticated tests
   */
  async login(email: string = 'test@foodservice.com', password: string = 'testpassword') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.waitForPageLoad();
  }

  /**
   * Create a test organization
   */
  async createOrganization(orgData: {
    name: string;
    type: string;
    priority: string;
    revenue?: number;
    contact?: string;
  }) {
    await this.page.click('[data-testid="add-organization-btn"]');
    await this.page.fill('[data-testid="org-name-input"]', orgData.name);
    await this.page.selectOption('[data-testid="org-type-select"]', orgData.type);
    await this.page.selectOption('[data-testid="org-priority-select"]', orgData.priority);
    
    if (orgData.revenue) {
      await this.page.fill('[data-testid="org-revenue-input"]', orgData.revenue.toString());
    }
    
    if (orgData.contact) {
      await this.page.fill('[data-testid="org-contact-input"]', orgData.contact);
    }
    
    await this.page.click('[data-testid="save-organization-btn"]');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a specific tab
   */
  async navigateToTab(tabName: string) {
    await this.page.click(`[data-testid="${tabName}-tab"]`);
    await this.page.waitForSelector(`[data-testid="${tabName}-content"]`, { state: 'visible' });
  }

  /**
   * Test swipe gesture on mobile
   */
  async swipeElement(element: string, direction: 'left' | 'right') {
    const locator = this.page.locator(element);
    const box = await locator.boundingBox();
    
    if (!box) {
      throw new Error(`Element ${element} not found or not visible`);
    }

    const startX = direction === 'left' ? box.x + box.width - 10 : box.x + 10;
    const endX = direction === 'left' ? box.x + 10 : box.x + box.width - 10;
    const y = box.y + box.height / 2;

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, y);
    await this.page.mouse.up();
    
    // Wait for animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Test pull-to-refresh gesture
   */
  async pullToRefresh() {
    const container = this.page.locator('[data-testid="pull-to-refresh-container"]');
    const box = await container.boundingBox();
    
    if (!box) {
      throw new Error('Pull-to-refresh container not found');
    }

    const centerX = box.x + box.width / 2;
    const startY = box.y + 10;
    const endY = box.y + 100; // Pull down 100px

    await this.page.mouse.move(centerX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(centerX, endY);
    await this.page.mouse.up();
    
    // Wait for refresh animation
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check touch target size compliance (WCAG 2.5.5)
   */
  async checkTouchTargetSize(element: string, minimumSize: number = 44) {
    const locator = this.page.locator(element);
    const box = await locator.boundingBox();
    
    if (!box) {
      throw new Error(`Element ${element} not found`);
    }

    expect(box.width).toBeGreaterThanOrEqual(minimumSize);
    expect(box.height).toBeGreaterThanOrEqual(minimumSize);
  }

  /**
   * Simulate network conditions
   */
  async simulateNetworkCondition(condition: 'offline' | 'slow' | 'fast') {
    switch (condition) {
      case 'offline':
        await this.page.context().setOffline(true);
        break;
      case 'slow':
        await this.page.context().setOffline(false);
        await this.page.route('**/*', route => {
          setTimeout(() => route.continue(), 2000);
        });
        break;
      case 'fast':
        await this.page.context().setOffline(false);
        await this.page.unroute('**/*');
        break;
    }
  }

  /**
   * Check for accessibility violations
   */
  async checkAccessibility() {
    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt === null) {
        console.warn('Image without alt text found');
      }
    }

    // Check for form labels
    const inputs = await this.page.locator('input[type="text"], input[type="email"], textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        const ariaLabel = await input.getAttribute('aria-label');
        
        if (!hasLabel && !ariaLabel) {
          console.warn(`Input without label found: ${id}`);
        }
      }
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for specific text to appear
   */
  async waitForText(text: string, timeout: number = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Check if element is in viewport
   */
  async isElementInViewport(element: string): Promise<boolean> {
    return await this.page.locator(element).isInViewport();
  }

  /**
   * Scroll to element
   */
  async scrollToElement(element: string) {
    await this.page.locator(element).scrollIntoViewIfNeeded();
  }

  /**
   * Clear all data (for test cleanup)
   */
  async clearTestData() {
    // Clear local storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear IndexedDB
    await this.page.evaluate(async () => {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });

    // Clear service worker cache
    await this.page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    });
  }

  /**
   * Mock geolocation for mobile tests
   */
  async mockGeolocation(latitude: number, longitude: number) {
    await this.page.context().grantPermissions(['geolocation']);
    await this.page.context().setGeolocation({ latitude, longitude });
  }

  /**
   * Check Performance metrics
   */
  async checkPerformance() {
    const performanceData = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
      };
    });

    // Assert reasonable performance thresholds for food service operations
    expect(performanceData.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(performanceData.load).toBeLessThan(5000); // 5 seconds
    
    if (performanceData.firstContentfulPaint > 0) {
      expect(performanceData.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
    }

    return performanceData;
  }

  /**
   * Verify offline storage functionality
   */
  async verifyOfflineStorage() {
    // Check IndexedDB
    const idbSupported = await this.page.evaluate(() => {
      return 'indexedDB' in window;
    });
    expect(idbSupported).toBe(true);

    // Check Service Worker
    const swSupported = await this.page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swSupported).toBe(true);

    // Check Cache API
    const cacheSupported = await this.page.evaluate(() => {
      return 'caches' in window;
    });
    expect(cacheSupported).toBe(true);
  }
}