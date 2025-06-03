import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
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
    }
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock window.matchMedia for responsive testing
// Mock Element.prototype.getBoundingClientRect unconditionally for JSDOM
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 44, // Default mock width
    height: 44, // Default mock height
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
  global.Element = { prototype: { getBoundingClientRect: jest.fn(() => ({ width: 44, height: 44, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0 }))}} as any;
}

// Mock next-themes
jest.mock('next-themes', () => ({
  __esModule: true,
  useTheme: jest.fn(() => ({
    theme: 'light', // Default theme
    setTheme: jest.fn(),
    themes: ['light', 'dark'],
  })),
  ThemeProvider: ({ children }) => <div>{children}</div>, // Minimal ThemeProvider mock
}));

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
})

// Mock window.getComputedStyle for touch target testing
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop) => {
      // Mock common CSS properties for touch target testing
      if (prop === 'width') return '44px'
      if (prop === 'height') return '44px'
      if (prop === 'min-width') return '44px'
      if (prop === 'min-height') return '44px'
      return ''
    },
    width: '44px',
    height: '44px',
    minWidth: '44px',
    minHeight: '44px'
  }),
})

// Mock Prisma for database tests (when we get to Phase 2)
jest.mock('@/lib/prisma.ts', () => ({
  __esModule: true,
  default: {
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
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    opportunity: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

// Mock Auth.js session for authentication tests
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@kitchenpantrycrm.com',
        name: 'Test User'
      },
      expires: '2025-12-31T23:59:59.999Z'
    },
    status: 'authenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Tremor charts for dashboard testing
jest.mock('@tremor/react', () => ({
  BarChart: ({ data, children, ...props }) => (
    <div data-testid="tremor-bar-chart" {...props}>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      {children}
    </div>
  ),
  Card: ({ children, ...props }) => (
    <div data-testid="tremor-card" {...props}>{children}</div>
  ),
  Title: ({ children, ...props }) => (
    <h3 data-testid="tremor-title" {...props}>{children}</h3>
  ),
  Text: ({ children, ...props }) => (
    <p data-testid="tremor-text" {...props}>{children}</p>
  ),
  Metric: ({ children, ...props }) => (
    <div data-testid="tremor-metric" {...props}>{children}</div>
  ),
  Flex: ({ children, ...props }) => (
    <div data-testid="tremor-flex" {...props}>{children}</div>
  ),
  Grid: ({ children, ...props }) => (
    <div data-testid="tremor-grid" {...props}>{children}</div>
  ),
  Col: ({ children, ...props }) => (
    <div data-testid="tremor-col" {...props}>{children}</div>
  )
}))

// Console error suppression for React Testing Library
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Not wrapped in act'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

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
}