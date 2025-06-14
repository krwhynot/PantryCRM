/**
 * Global Polyfill for Server-Side Rendering
 * Must be injected before any webpack chunks load
 */

// Only apply in Node.js environment (server-side)
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Polyfill self with globalThis
  if (typeof self === 'undefined') {
    global.self = globalThis;
  }
  
  // Ensure webpack chunk loading works
  if (typeof globalThis.webpackChunk_N_E === 'undefined') {
    globalThis.webpackChunk_N_E = [];
  }
  
  // Polyfill other common browser globals
  if (typeof window === 'undefined') {
    global.window = globalThis;
  }
  
  if (typeof document === 'undefined') {
    global.document = {
      createElement: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      cookie: '',
      readyState: 'complete'
    };
  }
  
  if (typeof navigator === 'undefined') {
    global.navigator = {
      userAgent: 'Node.js SSR',
      platform: 'Node.js',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: false,
      onLine: true
    };
  }
  
  if (typeof localStorage === 'undefined') {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    };
  }
  
  if (typeof sessionStorage === 'undefined') {
    global.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    };
  }
}