import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import * as React from 'react';

// Add global types for test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockOrganization: (overrides?: Record<string, any>) => any;
        createMockContact: (overrides?: Record<string, any>) => any;
        createMockInteraction: (overrides?: Record<string, any>) => any;
      };
    }
  }
}

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
    };
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
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

// Mock window.matchMedia for responsive testing
// Mock Element.prototype.getBoundingClientRect unconditionally for JSDOM
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 44, // Default mock width for iPad touch target compliance
    height: 44, // Default mock height for iPad touch target compliance
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
  // Using TypeScript syntax with proper type assertion
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
  } as any;
}

// Note: next-themes is mocked per-test to avoid conflicts with test-specific mocks

// Only set up window-related mocks if we're in a jsdom environment
if (typeof window !== 'undefined') {
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
}

// Polyfill for TextEncoder/TextDecoder for Node.js environments
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

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

// Mock Recharts for chart components - only if recharts is available
// This prevents test failures when recharts is not installed
try {
  jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-testid="responsive-container" {...props}>{children}</div>
    ),
    BarChart: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-testid="bar-chart" {...props}>{children}</div>
    ),
    AreaChart: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-testid="area-chart" {...props}>{children}</div>
    ),
    Bar: (props: any) => <div data-testid="bar" {...props} />,
    Area: (props: any) => <div data-testid="area" {...props} />,
    XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
    YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
    CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
    Tooltip: (props: any) => <div data-testid="tooltip" {...props} />
  }));
} catch (error) {
  // If recharts is not available, create a fallback mock
  const mockComponent = (testId: string) => (props: any) => 
    <div data-testid={testId} {...props} />;
  
  (global as any).recharts = {
    ResponsiveContainer: mockComponent('responsive-container'),
    BarChart: mockComponent('bar-chart'),
    AreaChart: mockComponent('area-chart'),
    Bar: mockComponent('bar'),
    Area: mockComponent('area'),
    XAxis: mockComponent('x-axis'),
    YAxis: mockComponent('y-axis'),
    CartesianGrid: mockComponent('cartesian-grid'),
    Tooltip: mockComponent('tooltip')
  };
}

// Console error suppression for React Testing Library and React 19 compatibility
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Not wrapped in act') ||
       args[0].includes('Warning: useLayoutEffect does nothing on the server') ||
       args[0].includes('Warning: flushSync was called from inside a lifecycle method') ||
       args[0].includes('Warning: Suspense fallback is suspending during hydration'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// React 19 specific configuration
// Configure React Testing Library for React 19 compatibility
if (typeof window !== 'undefined') {
  // Ensure proper cleanup and prevent memory leaks in React 19
  const originalCreateElement = React.createElement;
  
  // Add React 19 concurrent features support
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
}

// Global test utilities for Kitchen Pantry CRM
(global as any).testUtils = {
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