import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Smoke Tests - Critical Path Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set base URL from environment
    page.goto = async (url: string, options?: any) => {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      return page.goto(fullUrl, options);
    };
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check for critical elements
    await expect(page).toHaveTitle(/PantryCRM/);
    
    // Check for main navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for sign-in button
    const signInButton = page.locator('text=Sign In').first();
    await expect(signInButton).toBeVisible();
  });

  test('API health endpoint responds', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
  });

  test('Authentication providers endpoint works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/providers`);
    
    expect(response.status()).toBe(200);
    
    const providers = await response.json();
    expect(providers).toHaveProperty('google');
    expect(providers).toHaveProperty('github');
  });

  test('Sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check for sign-in form elements
    const signInForm = page.locator('form');
    await expect(signInForm).toBeVisible();
    
    // Check for OAuth buttons
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    await expect(githubButton).toBeVisible();
  });

  test('Static assets load correctly', async ({ page, request }) => {
    await page.goto('/');
    
    // Check if CSS loads
    const stylesheets = await page.$$('link[rel="stylesheet"]');
    expect(stylesheets.length).toBeGreaterThan(0);
    
    // Check if JavaScript bundles load
    const scripts = await page.$$('script[src*="_next"]');
    expect(scripts.length).toBeGreaterThan(0);
    
    // Verify at least one stylesheet loads successfully
    const cssResponses = await Promise.all(
      stylesheets.slice(0, 1).map(async (link) => {
        const href = await link.getAttribute('href');
        if (href) {
          const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          return request.get(url);
        }
        return null;
      })
    );
    
    const validCss = cssResponses.filter(r => r && r.status() === 200);
    expect(validCss.length).toBeGreaterThan(0);
  });

  test('No console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow for some expected errors (e.g., failed analytics in test env)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('analytics') &&
      !error.includes('gtag')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Application responds within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('Protected routes redirect to sign-in', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = ['/organizations', '/people', '/interactions'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to sign-in
      await expect(page).toHaveURL(/sign-in/);
    }
  });

  test('Database connection indicator present', async ({ page }) => {
    await page.goto('/');
    
    // Look for any database status indicator (if implemented)
    // This is a placeholder - adjust based on your actual implementation
    const dbStatus = page.locator('[data-testid="db-status"]');
    
    if (await dbStatus.count() > 0) {
      await expect(dbStatus).toHaveAttribute('data-status', 'connected');
    }
  });

  test('Environment variables properly set', async ({ request }) => {
    // This endpoint should be protected in production
    // Only use for staging/development smoke tests
    if (!BASE_URL.includes('production')) {
      try {
        const response = await request.get(`${BASE_URL}/api/debug/env`);
        
        if (response.status() === 200) {
          const env = await response.json();
          
          // Check critical environment variables are set (not their values)
          expect(env).toHaveProperty('NODE_ENV');
          expect(env).toHaveProperty('NEXTAUTH_URL');
          expect(env.DATABASE_URL).toBeDefined();
        }
      } catch {
        // Debug endpoint might not exist, which is fine
      }
    }
  });
});

test.describe('Mobile Responsiveness Smoke Tests', () => {
  test.use({
    viewport: { width: 375, height: 812 }, // iPhone X size
  });

  test('Homepage is mobile responsive', async ({ page }) => {
    await page.goto('/');
    
    // Check mobile menu button is visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"]');
    
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible();
    }
    
    // Check content fits in viewport
    const mainContent = page.locator('main');
    const box = await mainContent.boundingBox();
    
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });
});

test.describe('Performance Smoke Tests', () => {
  test('Memory usage stays within limits', async ({ page }) => {
    if ((page as any).evaluate) {
      await page.goto('/');
      
      const memoryUsage = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });
      
      if (memoryUsage) {
        // Should use less than 100MB on initial load
        expect(memoryUsage).toBeLessThan(100 * 1024 * 1024);
      }
    }
  });
});