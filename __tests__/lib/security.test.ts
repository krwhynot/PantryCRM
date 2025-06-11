import { sanitizeInput, isValidEmail, rateLimiter, requireAuth, requireAdmin } from '@/lib/security';
import { prismadb } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prismadb: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const mockPrisma = prismadb as jest.Mocked<typeof prismadb>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Security Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('scriptalert(xss)/script');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      expect(result).toBe('hello world');
    });

    it('should limit length to 1000 characters', () => {
      const input = 'a'.repeat(1500);
      const result = sanitizeInput(input);
      expect(result.length).toBe(1000);
    });

    it('should handle empty strings', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should preserve safe characters', () => {
      const input = 'Hello World 123 @domain.com';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World 123 @domain.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('test+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test..test@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('rateLimiter', () => {
    beforeEach(() => {
      // Clear rate limiter state
      (rateLimiter as any).attempts.clear();
    });

    it('should allow requests within limit', () => {
      const identifier = 'test-user';
      
      // First request should be allowed
      expect(rateLimiter.check(identifier, 3, 60000)).toBe(true);
      expect(rateLimiter.check(identifier, 3, 60000)).toBe(true);
      expect(rateLimiter.check(identifier, 3, 60000)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user';
      
      // Use up the limit
      rateLimiter.check(identifier, 2, 60000);
      rateLimiter.check(identifier, 2, 60000);
      
      // Next request should be blocked
      expect(rateLimiter.check(identifier, 2, 60000)).toBe(false);
    });

    it('should reset after time window', () => {
      const identifier = 'test-user';
      const shortWindow = 100; // 100ms
      
      // Use up the limit
      rateLimiter.check(identifier, 1, shortWindow);
      expect(rateLimiter.check(identifier, 1, shortWindow)).toBe(false);
      
      // Wait for window to reset
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(rateLimiter.check(identifier, 1, shortWindow)).toBe(true);
          resolve(void 0);
        }, shortWindow + 10);
      });
    });

    it('should handle different identifiers separately', () => {
      rateLimiter.check('user1', 1, 60000);
      rateLimiter.check('user2', 1, 60000);
      
      // user1 should be blocked, user2 should be allowed
      expect(rateLimiter.check('user1', 1, 60000)).toBe(false);
      expect(rateLimiter.check('user2', 1, 60000)).toBe(false);
      expect(rateLimiter.check('user3', 1, 60000)).toBe(true);
    });
  });

  describe('requireAuth', () => {
    it('should return user for authenticated active user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isActive: true,
        role: 'user',
      };

      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);

      const result = await requireAuth();

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
    });

    it('should return 401 error for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await requireAuth();

      expect(result.user).toBeNull();
      expect(result.error?.status).toBe(401);
    });

    it('should return 403 error for inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isActive: false,
        role: 'user',
      };

      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);

      const result = await requireAuth();

      expect(result.user).toBeNull();
      expect(result.error?.status).toBe(403);
    });
  });

  describe('requireAdmin', () => {
    it('should return user for authenticated admin', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        isActive: true,
        role: 'admin',
      };

      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@example.com' },
      } as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockAdmin as any);

      const result = await requireAdmin();

      expect(result.user).toEqual(mockAdmin);
      expect(result.error).toBeUndefined();
    });

    it('should return 401 error for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await requireAdmin();

      expect(result.user).toBeNull();
      expect(result.error?.status).toBe(401);
    });

    it('should return 403 error for non-admin user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        role: 'user',
      };

      mockGetServerSession.mockResolvedValue({
        user: { email: 'user@example.com' },
      } as any);
      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);

      const result = await requireAdmin();

      expect(result.user).toBeNull();
      expect(result.error?.status).toBe(403);
    });
  });
});