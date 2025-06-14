// Mock for @prisma/client
const mockPrismaClient = {
  // Organization model mocks
  organization: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Contact model mocks
  contact: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Interaction model mocks
  interaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Account model mocks
  account: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Opportunity model mocks
  opportunity: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Lead model mocks
  lead: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Contract model mocks
  contract: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Task model mocks
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // User model mocks
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Transaction support
  $transaction: jest.fn((fn) => fn(mockPrismaClient)),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
}

// Add mock implementations for all methods
Object.keys(mockPrismaClient).forEach(key => {
  if (typeof mockPrismaClient[key] === 'object' && mockPrismaClient[key] !== null) {
    Object.keys(mockPrismaClient[key]).forEach(method => {
      if (typeof mockPrismaClient[key][method] === 'function') {
        mockPrismaClient[key][method].mockResolvedValue = jest.fn().mockResolvedValue({});
        mockPrismaClient[key][method].mockRejectedValue = jest.fn().mockRejectedValue(new Error('Mock error'));
        mockPrismaClient[key][method].mockImplementation = jest.fn().mockImplementation(() => Promise.resolve({}));
      }
    });
  }
});

module.exports = {
  PrismaClient: jest.fn(() => mockPrismaClient),
  Prisma: {
    TransactionIsolationLevel: {
      ReadUncommitted: 'ReadUncommitted',
      ReadCommitted: 'ReadCommitted',
      RepeatableRead: 'RepeatableRead',
      Serializable: 'Serializable',
    },
    DbNull: 'DbNull',
    JsonNull: 'JsonNull',
    AnyNull: 'AnyNull',
  },
};