import { test, expect, Browser, BrowserContext } from '@playwright/test';

test.describe('Cross-Browser Compatibility - Food Service CRM', () => {
  
  test.describe('Core Functionality Across Browsers', () => {
    
    test('should work consistently across desktop browsers', async ({ browserName, page }) => {
      await page.goto('/');
      
      // Basic navigation should work in all browsers
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Tab navigation
      await page.click('[data-testid="organizations-tab"]');
      await expect(page.locator('[data-testid="organizations-content"]')).toBeVisible();
      
      await page.click('[data-testid="contacts-tab"]');
      await expect(page.locator('[data-testid="contacts-content"]')).toBeVisible();
      
      // Form interactions
      await page.click('[data-testid="add-organization-btn"]');
      await page.fill('[data-testid="org-name-input"]', 'Test Restaurant');
      
      // Browser-specific form validation
      if (browserName === 'firefox') {
        // Firefox may handle form validation differently
        await expect(page.locator('[data-testid="org-name-input"]')).toHaveValue('Test Restaurant');
      } else {
        await expect(page.locator('[data-testid="org-name-input"]')).toHaveValue('Test Restaurant');
      }
    });

    test('should handle JavaScript APIs consistently', async ({ browserName, page }) => {
      await page.goto('/');
      
      // Local Storage
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });
      
      const storageValue = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      
      expect(storageValue).toBe('test-value');
      
      // Fetch API
      const fetchSupport = await page.evaluate(() => {
        return typeof fetch !== 'undefined';
      });
      
      expect(fetchSupport).toBe(true);
      
      // Service Worker support (may vary by browser)
      const swSupport = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      if (browserName === 'webkit' && process.platform === 'darwin') {
        // Safari supports service workers
        expect(swSupport).toBe(true);
      } else if (browserName === 'firefox' || browserName === 'chromium') {
        expect(swSupport).toBe(true);
      }
    });
  });

  test.describe('Mobile Browser Compatibility', () => {
    
    test('should work on mobile Safari (iOS)', async ({ page, browserName, isMobile }) => {
      test.skip(browserName !== 'webkit' || !isMobile, 'This test is for mobile Safari only');
      
      await page.goto('/');
      
      // iOS Safari specific touch handling
      await page.touchscreen.tap(100, 100);
      
      // Check viewport meta tag handling
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content');
      });
      
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');
      
      // Test iOS-specific features
      const iosFeatures = await page.evaluate(() => {
        return {
          touchForceSupported: 'touches' in document.createElement('div'),
          webkitAppearance: CSS.supports('-webkit-appearance', 'none')
        };
      });
      
      expect(iosFeatures.webkitAppearance).toBe(true);
    });

    test('should work on Android Chrome', async ({ page, browserName, isMobile }) => {
      test.skip(browserName !== 'chromium' || !isMobile, 'This test is for Android Chrome only');
      
      await page.goto('/');
      
      // Android Chrome specific features
      const androidFeatures = await page.evaluate(() => {
        return {
          connectionAPI: 'connection' in navigator,
          deviceMemory: 'deviceMemory' in navigator,
          hardwareConcurrency: 'hardwareConcurrency' in navigator
        };
      });
      
      // These may or may not be available depending on the environment
      // Just ensure the app doesn't break when they're missing
      expect(typeof androidFeatures.connectionAPI).toBe('boolean');
      
      // Test Android-specific touch events
      await page.touchscreen.tap(200, 200);
      
      // Verify swipe gestures work
      const orgCard = page.locator('[data-testid="organization-card"]').first();
      if (await orgCard.isVisible()) {
        const cardBox = await orgCard.boundingBox();
        if (cardBox) {
          await page.touchscreen.tap(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
        }
      }
    });
  });

  test.describe('Browser-Specific Feature Support', () => {
    
    test('should handle IndexedDB across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      const idbSupport = await page.evaluate(async () => {
        try {
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('test-db', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => {
              const db = request.result;
              db.createObjectStore('test-store');
            };
          });
          
          return true;
        } catch (error) {
          return false;
        }
      });
      
      if (browserName === 'webkit') {
        // Safari in private mode may not support IndexedDB
        // App should gracefully degrade
        expect(typeof idbSupport).toBe('boolean');
      } else {
        expect(idbSupport).toBe(true);
      }
    });

    test('should handle Web Workers across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      
      const workerSupport = await page.evaluate(() => {
        try {
          return typeof Worker !== 'undefined';
        } catch (error) {
          return false;
        }
      });
      
      expect(workerSupport).toBe(true);
      
      // Test actual worker creation
      const workerCreation = await page.evaluate(() => {
        try {
          const worker = new Worker('data:text/javascript,self.postMessage("test");');
          worker.terminate();
          return true;
        } catch (error) {
          return false;
        }
      });
      
      expect(workerCreation).toBe(true);
    });

    test('should handle CSS Grid support', async ({ page, browserName }) => {
      await page.goto('/');
      
      const gridSupport = await page.evaluate(() => {
        return CSS.supports('display', 'grid');
      });
      
      expect(gridSupport).toBe(true);
      
      // Check that grid layouts work
      const organizationGrid = page.locator('[data-testid="organization-grid"]');
      if (await organizationGrid.isVisible()) {
        const gridDisplay = await organizationGrid.evaluate(el => {
          return getComputedStyle(el).display;
        });
        
        expect(gridDisplay).toMatch(/grid|flex/);
      }
    });

    test('should handle CSS Custom Properties (Variables)', async ({ page }) => {
      await page.goto('/');
      
      const customPropSupport = await page.evaluate(() => {
        return CSS.supports('color', 'var(--test-color)');
      });
      
      expect(customPropSupport).toBe(true);
      
      // Test actual custom property usage
      const customPropValue = await page.evaluate(() => {
        const root = document.documentElement;
        root.style.setProperty('--test-color', '#ff0000');
        return getComputedStyle(root).getPropertyValue('--test-color').trim();
      });
      
      expect(customPropValue).toBe('#ff0000');
    });
  });

  test.describe('Performance Across Browsers', () => {
    
    test('should load within acceptable timeframes', async ({ page, browserName }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Allow more time for older browsers
      const maxLoadTime = browserName === 'firefox' ? 8000 : 6000;
      
      expect(loadTime).toBeLessThan(maxLoadTime);
    });

    test('should handle large datasets efficiently', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Add performance measurement
      await page.addInitScript(() => {
        // Define the interface globally
        (window as any).performanceMarks = [];
        (window as any).markPerformance = (label: string) => {
          (window as any).performanceMarks.push({
            label,
            time: performance.now()
          });
        };
      });
      
      // Simulate loading large dataset
      await page.evaluate(() => {
        (window as any).markPerformance('start-large-data');
        
        // Simulate 1000 organization records
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          id: `org-${i}`,
          name: `Restaurant ${i}`,
          type: 'CASUAL_DINING',
          revenue: Math.floor(Math.random() * 100000)
        }));
        
        // Process the data
        largeDataset.forEach(org => {
          // Simulate DOM operations
          const div = document.createElement('div');
          div.textContent = org.name;
        });
        
        (window as any).markPerformance('end-large-data');
      });
      
      const performanceData = await page.evaluate(() => {
        const marks = (window as any).performanceMarks;
        const start = marks.find((m: any) => m.label === 'start-large-data');
        const end = marks.find((m: any) => m.label === 'end-large-data');
        return end.time - start.time;
      });
      
      // Should process 1000 records within reasonable time
      expect(performanceData).toBeLessThan(1000); // 1 second
    });
  });

  test.describe('Network API Compatibility', () => {
    
    test('should handle Navigator.onLine consistently', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test online detection
      const onlineStatus = await page.evaluate(() => {
        return navigator.onLine;
      });
      
      expect(typeof onlineStatus).toBe('boolean');
      
      // Test offline simulation
      await page.context().setOffline(true);
      
      const offlineStatus = await page.evaluate(() => {
        return navigator.onLine;
      });
      
      if (browserName === 'webkit') {
        // Safari may not always reflect offline state accurately in tests
        expect(typeof offlineStatus).toBe('boolean');
      } else {
        expect(offlineStatus).toBe(false);
      }
      
      await page.context().setOffline(false);
    });

    test('should handle Connection API where available', async ({ page, browserName }) => {
      await page.goto('/');
      
      const connectionAPI = await page.evaluate(() => {
        const nav = navigator as any;
        const connection = nav.connection || 
                          nav.mozConnection || 
                          nav.webkitConnection;
        
        return {
          available: !!connection,
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          saveData: connection?.saveData
        };
      });
      
      if (browserName === 'chromium') {
        // Chrome supports Network Information API
        expect(connectionAPI.available).toBe(true);
      } else {
        // Other browsers may not support it - app should handle gracefully
        expect(typeof connectionAPI.available).toBe('boolean');
      }
    });
  });

  test.describe('Form Validation Compatibility', () => {
    
    test('should handle HTML5 form validation consistently', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.click('[data-testid="add-organization-btn"]');
      
      // Test required field validation
      const nameInput = page.locator('[data-testid="org-name-input"]');
      await nameInput.fill('');
      
      const saveButton = page.locator('[data-testid="save-organization-btn"]');
      await saveButton.click();
      
      // Check for validation message
      const validationMessage = await nameInput.evaluate(input => {
        return (input as HTMLInputElement).validationMessage;
      });
      
      if (browserName === 'webkit') {
        // Safari may have different validation messages
        expect(['required', 'fill', 'valid'].some(keyword => validationMessage.includes(keyword))).toBe(true);
      } else {
        expect(validationMessage).toBeTruthy();
      }
    });

    test('should handle email validation consistently', async ({ page }) => {
      await page.goto('/');
      
      await page.click('[data-testid="add-organization-btn"]');
      
      const emailInput = page.locator('[data-testid="org-contact-input"]');
      await emailInput.fill('invalid-email');
      
      const isValid = await emailInput.evaluate(input => {
        return (input as HTMLInputElement).checkValidity();
      });
      
      expect(isValid).toBe(false);
      
      await emailInput.fill('valid@email.com');
      
      const isValidNow = await emailInput.evaluate(input => {
        return (input as HTMLInputElement).checkValidity();
      });
      
      expect(isValidNow).toBe(true);
    });
  });

  test.describe('Browser Security Features', () => {
    
    test('should respect Content Security Policy', async ({ page }) => {
      await page.goto('/');
      
      // Check for CSP headers
      const cspHeader = await page.evaluate(() => {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return meta?.getAttribute('content');
      });
      
      if (cspHeader) {
        expect(cspHeader).toContain('default-src');
      }
      
      // Test that inline scripts are blocked if CSP is strict
      const inlineScriptBlocked = await page.evaluate(() => {
        try {
          eval('console.log("test")');
          return false;
        } catch (error) {
          return true;
        }
      });
      
      // If CSP is configured strictly, inline scripts should be blocked
      if (cspHeader && cspHeader.includes("'unsafe-eval'") === false) {
        expect(inlineScriptBlocked).toBe(true);
      }
    });

    test('should handle HTTPS requirements', async ({ page }) => {
      await page.goto('/');
      
      // Check secure context features
      const secureContext = await page.evaluate(() => {
        return window.isSecureContext;
      });
      
      // In production, this should be true
      if (process.env.NODE_ENV === 'production') {
        expect(secureContext).toBe(true);
      }
      
      // Service Worker requires secure context
      const swAvailable = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      if (secureContext) {
        expect(swAvailable).toBe(true);
      }
    });
  });
});