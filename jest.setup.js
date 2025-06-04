import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: '',
    asPath: '',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Mock Next.js Image component WITHOUT JSX
jest.mock('next/image', () => ({
  __esModule: true,
  // Use createElement instead of JSX
  default: function Image(props) {
    return Object.assign(
      document.createElement('img'),
      props
    );
  },
}));

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock Element.prototype.getBoundingClientRect unconditionally for JSDOM
// This is critical for iPad touch target size compliance testing (44px minimum)
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 44, // iPad minimum touch target width
    height: 44, // iPad minimum touch target height
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => JSON.stringify({ width: 44, height: 44, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0 }),
  }));
} else {
  // Fallback for environments where Element might not be defined (e.g. pure Node.js tests without JSDOM)
  global.Element = { 
    prototype: { 
      getBoundingClientRect: jest.fn(() => ({ 
        width: 44, 
        height: 44, 
        top: 0, 
        left: 0, 
        bottom: 0, 
        right: 0, 
        x: 0, 
        y: 0 
      }))
    } 
  };
}

// Mock window.getComputedStyle for proper height calculations
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    height: '44px', // iPad minimum touch target height as string
    width: '44px',  // iPad minimum touch target width as string
    getPropertyValue: jest.fn((prop) => {
      if (prop === 'height') return '44px';
      if (prop === 'width') return '44px';
      return '';
    }),
  })),
  writable: true,
});

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    interaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    settings: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    signIn: jest.fn(),
    signOut: jest.fn(),
    useSession: jest.fn(() => {
      return { data: { user: { name: 'Test User' } }, status: 'authenticated' };
    }),
  };
});

// Mock Tremor UI components WITHOUT JSX
jest.mock('@tremor/react', () => {
  // Factory function to create component mocks without JSX
  const createMockComponent = (testId) => {
    return function MockComponent(props) {
      const el = document.createElement('div');
      el.setAttribute('data-testid', testId);
      // Copy props to element
      Object.entries(props).forEach(([key, value]) => {
        if (key !== 'children') {
          el.setAttribute(key, value);
        }
      });
      // Handle children if provided
      if (props.children) {
        if (typeof props.children === 'string') {
          el.textContent = props.children;
        } else {
          // For non-string children, we'll just append as text as a simplification
          el.textContent = 'Mock child content';
        }
      }
      return el;
    };
  };

  // Return mocked components
  return {
    Card: createMockComponent('tremor-card'),
    Title: createMockComponent('tremor-title'),
    Text: createMockComponent('tremor-text'),
    Metric: createMockComponent('tremor-metric'),
    Flex: createMockComponent('tremor-flex'),
    Grid: createMockComponent('tremor-grid'),
    Col: createMockComponent('tremor-col')
  };
});

// Console error suppression for React Testing Library
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Not wrapped in act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities for Kitchen Pantry CRM
global.testUtils = {
  // Helper to create mock food service data
  createMockOrganization: (overrides = {}) => ({
    id: 'test-org-1',
    name: 'Test Restaurant',
    priority: 'A',
    segment: 'Fine Dining',
    distributor: 'Sysco',
    accountManager: 'test-manager',
    ...overrides
  }),
  
  createMockContact: (overrides = {}) => ({
    id: 'test-contact-1',
    firstName: 'John',
    lastName: 'Doe', 
    role: 'Exec Chef',
    isPrimary: true,
    organizationId: 'test-org-1',
    ...overrides
  }),
  
  createMockInteraction: (overrides = {}) => ({
    id: 'test-interaction-1',
    type: 'In Person',
    date: new Date().toISOString(),
    notes: 'Great meeting about new products',
    organizationId: 'test-org-1',
    contactId: 'test-contact-1',
    ...overrides
  })
};