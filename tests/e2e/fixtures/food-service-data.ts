export const foodServiceOrganizations = [
  {
    id: 'org-1',
    name: 'Gourmet Bistro Downtown',
    type: 'FINE_DINING',
    priority: 'A',
    revenue: 125000,
    contact: 'chef@gourmetbistro.com',
    address: '123 Main St, Downtown, NY 10001',
    phone: '+1-555-0123',
    territory: 'NORTHEAST',
    broker: 'John Smith'
  },
  {
    id: 'org-2',
    name: 'Quick Eats Chain',
    type: 'FAST_FOOD',
    priority: 'B',
    revenue: 89000,
    contact: 'manager@quickeats.com',
    address: '456 Oak Ave, Midtown, NY 10002',
    phone: '+1-555-0456',
    territory: 'NORTHEAST',
    broker: 'Sarah Johnson'
  },
  {
    id: 'org-3',
    name: 'Family Restaurant & Catering',
    type: 'CASUAL_DINING',
    priority: 'A',
    revenue: 156000,
    contact: 'owner@familyrest.com',
    address: '789 Pine St, Uptown, NY 10003',
    phone: '+1-555-0789',
    territory: 'NORTHEAST',
    broker: 'Mike Wilson'
  },
  {
    id: 'org-4',
    name: 'Coffee & Pastry Corner',
    type: 'CAFE',
    priority: 'C',
    revenue: 45000,
    contact: 'barista@coffeecorner.com',
    address: '321 Elm St, Village, NY 10004',
    phone: '+1-555-0321',
    territory: 'NORTHEAST',
    broker: 'Emily Davis'
  }
];

export const foodServiceContacts = [
  {
    id: 'contact-1',
    organizationId: 'org-1',
    firstName: 'Marco',
    lastName: 'Rodriguez',
    title: 'Executive Chef',
    email: 'marco@gourmetbistro.com',
    phone: '+1-555-0124',
    role: 'DECISION_MAKER'
  },
  {
    id: 'contact-2',
    organizationId: 'org-1',
    firstName: 'Lisa',
    lastName: 'Chen',
    title: 'Restaurant Manager',
    email: 'lisa@gourmetbistro.com',
    phone: '+1-555-0125',
    role: 'INFLUENCER'
  },
  {
    id: 'contact-3',
    organizationId: 'org-2',
    firstName: 'David',
    lastName: 'Brown',
    title: 'Operations Manager',
    email: 'david@quickeats.com',
    phone: '+1-555-0457',
    role: 'DECISION_MAKER'
  }
];

export const foodServiceInteractions = [
  {
    id: 'interaction-1',
    organizationId: 'org-1',
    contactId: 'contact-1',
    type: 'SALES_CALL',
    subject: 'Q1 Product Presentation',
    description: 'Presented new artisanal cheese line for spring menu',
    date: new Date('2024-01-15'),
    outcome: 'POSITIVE',
    nextAction: 'Send samples for tasting',
    followUpDate: new Date('2024-01-22')
  },
  {
    id: 'interaction-2',
    organizationId: 'org-2',
    contactId: 'contact-3',
    type: 'ORDER_PLACEMENT',
    subject: 'Monthly Protein Order',
    description: 'Placed order for chicken and beef products',
    date: new Date('2024-01-10'),
    outcome: 'COMPLETED',
    orderValue: 8500,
    nextAction: 'Schedule delivery confirmation call'
  }
];

export const foodServiceOpportunities = [
  {
    id: 'opp-1',
    organizationId: 'org-1',
    title: 'Spring Menu Expansion',
    description: 'Opportunity to supply premium ingredients for new spring menu items',
    value: 25000,
    stage: 'PROPOSAL',
    probability: 75,
    expectedCloseDate: new Date('2024-03-15'),
    products: ['Artisanal Cheese', 'Organic Herbs', 'Premium Oils']
  },
  {
    id: 'opp-2',
    organizationId: 'org-3',
    title: 'Catering Contract Renewal',
    description: 'Annual catering supply contract up for renewal',
    value: 45000,
    stage: 'NEGOTIATION',
    probability: 90,
    expectedCloseDate: new Date('2024-02-28'),
    products: ['Bulk Proteins', 'Frozen Vegetables', 'Disposables']
  }
];

export const territoryData = {
  NORTHEAST: {
    name: 'Northeast Territory',
    broker: 'John Smith',
    states: ['NY', 'NJ', 'CT', 'MA', 'RI'],
    targetRevenue: 500000,
    currentRevenue: 415000,
    commissionRate: 0.05
  },
  SOUTHEAST: {
    name: 'Southeast Territory',
    broker: 'Sarah Johnson',
    states: ['FL', 'GA', 'SC', 'NC', 'VA'],
    targetRevenue: 450000,
    currentRevenue: 380000,
    commissionRate: 0.045
  }
};

export const mobileTestScenarios = {
  swipeActions: [
    { action: 'swipe-left', expected: 'reveal-right-actions' },
    { action: 'swipe-right', expected: 'reveal-left-actions' },
    { action: 'tap-call', expected: 'initiate-call' },
    { action: 'tap-edit', expected: 'open-edit-form' },
    { action: 'tap-delete', expected: 'show-confirmation' }
  ],
  pullToRefresh: {
    threshold: 80,
    expectedText: 'Updating CRM data...',
    duration: 2000
  },
  touchTargets: {
    minimumSize: 44, // px - WCAG 2.5.5 Level AAA
    buttons: ['add-organization', 'tab-navigation', 'floating-action'],
    cards: ['organization-card', 'contact-card']
  }
};

export const networkTestScenarios = {
  offline: {
    expectedBehavior: 'show-offline-indicator',
    cacheAvailable: true,
    syncPending: true
  },
  slowConnection: {
    connectionType: '2g',
    expectedWarning: 'Slow connection - Features may load slowly',
    timeout: 10000
  },
  backOnline: {
    expectedMessage: 'Back online',
    syncTrigger: true,
    duration: 3000
  }
};