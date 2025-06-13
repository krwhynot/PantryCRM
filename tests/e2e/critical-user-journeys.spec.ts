import { test, expect } from '@playwright/test';
import { foodServiceOrganizations, foodServiceContacts, foodServiceOpportunities } from './fixtures/food-service-data';

test.describe('Critical User Journeys - Food Service CRM', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');
    
    // Wait for the page to load and check for basic elements
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test.describe('Journey 1: Customer Acquisition & Onboarding', () => {
    
    test('should complete full customer onboarding flow', async ({ page }) => {
      // Step 1: Lead capture - Navigate to add new organization
      await page.click('[data-testid="add-organization-btn"]');
      
      // Step 2: Organization creation
      await page.fill('[data-testid="org-name-input"]', foodServiceOrganizations[0].name);
      await page.selectOption('[data-testid="org-type-select"]', foodServiceOrganizations[0].type);
      await page.selectOption('[data-testid="org-priority-select"]', foodServiceOrganizations[0].priority);
      await page.fill('[data-testid="org-contact-input"]', foodServiceOrganizations[0].contact);
      await page.fill('[data-testid="org-phone-input"]', foodServiceOrganizations[0].phone);
      await page.fill('[data-testid="org-address-input"]', foodServiceOrganizations[0].address);
      
      await page.click('[data-testid="save-organization-btn"]');
      
      // Verify organization was created
      await expect(page.locator('[data-testid="organization-card"]')).toContainText(foodServiceOrganizations[0].name);
      
      // Step 3: Contact assignment - Navigate to contacts
      await page.click('[data-testid="contacts-tab"]');
      await page.click('[data-testid="add-contact-btn"]');
      
      await page.fill('[data-testid="contact-first-name"]', foodServiceContacts[0].firstName);
      await page.fill('[data-testid="contact-last-name"]', foodServiceContacts[0].lastName);
      await page.fill('[data-testid="contact-title"]', foodServiceContacts[0].title);
      await page.fill('[data-testid="contact-email"]', foodServiceContacts[0].email);
      await page.selectOption('[data-testid="contact-role"]', foodServiceContacts[0].role);
      
      await page.click('[data-testid="save-contact-btn"]');
      
      // Step 4: First interaction logging
      await page.click('[data-testid="interactions-tab"]');
      await page.click('[data-testid="add-interaction-btn"]');
      
      await page.fill('[data-testid="interaction-subject"]', 'Initial Contact Call');
      await page.selectOption('[data-testid="interaction-type"]', 'SALES_CALL');
      await page.fill('[data-testid="interaction-description"]', 'Introduction call to discuss product offerings');
      await page.selectOption('[data-testid="interaction-outcome"]', 'POSITIVE');
      
      await page.click('[data-testid="save-interaction-btn"]');
      
      // Step 5: Opportunity creation
      await page.click('[data-testid="opportunities-tab"]');
      await page.click('[data-testid="add-opportunity-btn"]');
      
      await page.fill('[data-testid="opportunity-title"]', foodServiceOpportunities[0].title);
      await page.fill('[data-testid="opportunity-value"]', foodServiceOpportunities[0].value.toString());
      await page.selectOption('[data-testid="opportunity-stage"]', foodServiceOpportunities[0].stage);
      await page.fill('[data-testid="opportunity-probability"]', foodServiceOpportunities[0].probability.toString());
      
      await page.click('[data-testid="save-opportunity-btn"]');
      
      // Verify complete customer onboarding
      await expect(page.locator('[data-testid="opportunity-card"]')).toContainText(foodServiceOpportunities[0].title);
    });
  });

  test.describe('Journey 2: Sales Cycle Management', () => {
    
    test('should manage complete sales cycle from opportunity to closure', async ({ page }) => {
      // Assume organization and opportunity already exist
      await page.click('[data-testid="opportunities-tab"]');
      
      // Step 1: Opportunity identification (already exists)
      await expect(page.locator('[data-testid="opportunity-card"]').first()).toBeVisible();
      
      // Step 2: Quote generation
      await page.click('[data-testid="opportunity-card"]').first();
      await page.click('[data-testid="generate-quote-btn"]');
      
      await page.fill('[data-testid="quote-products"]', 'Artisanal Cheese Selection');
      await page.fill('[data-testid="quote-quantity"]', '50');
      await page.fill('[data-testid="quote-unit-price"]', '25.00');
      await page.click('[data-testid="save-quote-btn"]');
      
      // Step 3: Proposal tracking
      await page.click('[data-testid="update-stage-btn"]');
      await page.selectOption('[data-testid="opportunity-stage-select"]', 'PROPOSAL');
      await page.click('[data-testid="confirm-stage-update"]');
      
      // Step 4: Deal closure
      await page.click('[data-testid="update-stage-btn"]');
      await page.selectOption('[data-testid="opportunity-stage-select"]', 'CLOSED_WON');
      await page.fill('[data-testid="actual-close-date"]', '2024-03-15');
      await page.click('[data-testid="confirm-stage-update"]');
      
      // Step 5: Commission calculation
      await page.click('[data-testid="view-commission-btn"]');
      
      // Verify commission calculation
      const commissionAmount = await page.locator('[data-testid="commission-amount"]').textContent();
      expect(commissionAmount).toContain('$1,250.00'); // 5% of $25,000
    });
  });

  test.describe('Journey 3: Relationship Management', () => {
    
    test('should track ongoing customer relationship activities', async ({ page }) => {
      // Step 1: Regular touchpoints
      await page.click('[data-testid="interactions-tab"]');
      
      // Log follow-up call
      await page.click('[data-testid="add-interaction-btn"]');
      await page.fill('[data-testid="interaction-subject"]', 'Monthly Check-in Call');
      await page.selectOption('[data-testid="interaction-type"]', 'FOLLOW_UP');
      await page.fill('[data-testid="interaction-description"]', 'Discussed satisfaction with recent deliveries');
      await page.selectOption('[data-testid="interaction-outcome"]', 'POSITIVE');
      await page.click('[data-testid="save-interaction-btn"]');
      
      // Step 2: Follow-up scheduling
      await page.click('[data-testid="schedule-follow-up-btn"]');
      await page.fill('[data-testid="follow-up-date"]', '2024-02-15');
      await page.fill('[data-testid="follow-up-notes"]', 'Discuss spring menu planning');
      await page.click('[data-testid="save-follow-up-btn"]');
      
      // Step 3: Customer satisfaction tracking
      await page.click('[data-testid="record-satisfaction-btn"]');
      await page.selectOption('[data-testid="satisfaction-rating"]', '5');
      await page.fill('[data-testid="satisfaction-comments"]', 'Very satisfied with product quality and delivery');
      await page.click('[data-testid="save-satisfaction-btn"]');
      
      // Verify relationship tracking
      await expect(page.locator('[data-testid="interaction-list"]')).toContainText('Monthly Check-in Call');
      await expect(page.locator('[data-testid="satisfaction-indicator"]')).toContainText('5/5');
    });
  });

  test.describe('Journey 4: Mobile Field Operations', () => {
    
    test('should handle mobile field operations workflow', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Step 1: Offline data access
      await page.setOffline(true);
      
      // Verify offline indicator appears
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('You\'re offline');
      
      // Step 2: Customer visit logging (offline)
      await page.click('[data-testid="organizations-tab"]');
      
      // Verify organization data is available from cache
      await expect(page.locator('[data-testid="organization-card"]').first()).toBeVisible();
      
      await page.click('[data-testid="organization-card"]').first();
      await page.click('[data-testid="log-visit-btn"]');
      
      await page.fill('[data-testid="visit-notes"]', 'Met with chef to discuss new spring menu items');
      await page.selectOption('[data-testid="visit-outcome"]', 'POSITIVE');
      await page.click('[data-testid="save-visit-btn"]');
      
      // Verify data is queued for sync
      await expect(page.locator('[data-testid="sync-pending-indicator"]')).toContainText('1 pending');
      
      // Step 3: Order placement (offline)
      await page.click('[data-testid="place-order-btn"]');
      await page.fill('[data-testid="order-product"]', 'Organic Herbs');
      await page.fill('[data-testid="order-quantity"]', '10');
      await page.click('[data-testid="save-order-btn"]');
      
      // Verify order is queued
      await expect(page.locator('[data-testid="sync-pending-indicator"]')).toContainText('2 pending');
      
      // Step 4: Sync when online
      await page.setOffline(false);
      
      // Wait for sync indicator
      await expect(page.locator('[data-testid="sync-indicator"]')).toContainText('Syncing...');
      
      // Step 5: Report generation
      await page.click('[data-testid="generate-field-report-btn"]');
      
      // Verify report includes offline activities
      await expect(page.locator('[data-testid="field-report"]')).toContainText('Met with chef to discuss');
      await expect(page.locator('[data-testid="field-report"]')).toContainText('Organic Herbs');
    });
  });

  test.describe('Journey 5: Territory & Commission Management', () => {
    
    test('should manage territory assignments and commission tracking', async ({ page }) => {
      // Step 1: Territory assignment
      await page.click('[data-testid="territory-management-tab"]');
      
      await page.click('[data-testid="assign-territory-btn"]');
      await page.selectOption('[data-testid="broker-select"]', 'John Smith');
      await page.selectOption('[data-testid="territory-select"]', 'NORTHEAST');
      await page.click('[data-testid="save-assignment-btn"]');
      
      // Step 2: Customer mapping
      await page.click('[data-testid="map-customers-btn"]');
      
      // Assign organizations to territory
      await page.check('[data-testid="org-checkbox-1"]');
      await page.check('[data-testid="org-checkbox-2"]');
      await page.click('[data-testid="assign-to-territory-btn"]');
      
      // Step 3: Sales tracking
      await page.click('[data-testid="sales-tracking-tab"]');
      
      // Verify territory sales are tracked
      await expect(page.locator('[data-testid="territory-revenue"]')).toContainText('$415,000');
      await expect(page.locator('[data-testid="territory-target"]')).toContainText('$500,000');
      
      // Step 4: Commission calculation
      await page.click('[data-testid="calculate-commission-btn"]');
      
      // Verify commission calculations
      await expect(page.locator('[data-testid="commission-total"]')).toContainText('$20,750'); // 5% of $415,000
      
      // Step 5: Payout processing
      await page.click('[data-testid="process-payout-btn"]');
      await page.fill('[data-testid="payout-period"]', 'Q1 2024');
      await page.click('[data-testid="confirm-payout-btn"]');
      
      // Verify payout is processed
      await expect(page.locator('[data-testid="payout-status"]')).toContainText('Processed');
    });
  });
});