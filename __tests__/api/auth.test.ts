/**
 * @jest-environment node
 */

import { prismadb } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock the auth module to avoid environment variable issues during import
jest.mock('@/lib/auth', () => {
  // Set up environment variables for the mock
  process.env.GOOGLE_ID = 'test-google-id';
  process.env.GOOGLE_SECRET = 'test-google-secret';
  process.env.GITHUB_ID = 'test-github-id';
  process.env.GITHUB_SECRET = 'test-github-secret';
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  // Now require the actual implementation
  const actual = jest.requireActual('@/lib/auth');
  return actual;
});

// Import after mocking
import { authOptions } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prismadb: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('@/lib/new-user-notify', () => ({
  newUserNotify: jest.fn(),
}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

// Access the mocked functions directly
const mockPrisma = prismadb as any;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider', () => {
    const credentialsProvider = authOptions.providers.find(
      (provider) => provider.id === 'credentials'
    );

    it('should authenticate valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
        name: 'Test User',
        isActive: true,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const authorize = (credentialsProvider as any).options.authorize;
      const result = await authorize(credentials);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', '$2a$12$hashedpassword');
    });

    it('should reject invalid email', async () => {
      const credentials = {
        email: '',
        password: 'password123',
      };

      const authorize = (credentialsProvider as any).options.authorize;
      
      await expect(authorize(credentials)).rejects.toThrow('Email or password is missing');
    });

    it('should reject invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      const authorize = (credentialsProvider as any).options.authorize;
      
      await expect(authorize(credentials)).rejects.toThrow('Email or password is missing');
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const authorize = (credentialsProvider as any).options.authorize;
      
      await expect(authorize(credentials)).rejects.toThrow('Invalid username or password');
    });

    it('should reject user without password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: null,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const authorize = (credentialsProvider as any).options.authorize;
      
      await expect(authorize(credentials)).rejects.toThrow('Invalid username or password');
    });

    it('should reject incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const authorize = (credentialsProvider as any).options.authorize;
      
      await expect(authorize(credentials)).rejects.toThrow('Invalid username or password');
    });

    it('should handle whitespace in password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const credentials = {
        email: 'test@example.com',
        password: '  password123  ', // With whitespace
      };

      const authorize = (credentialsProvider as any).options.authorize;
      const result = await authorize(credentials);

      expect(result).toEqual(mockUser);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', '$2a$12$hashedpassword');
    });
  });

  describe('Session Callback', () => {
    it('should create new user for OAuth login', async () => {
      const mockToken = {
        email: 'oauth@example.com',
        name: 'OAuth User',
        picture: 'https://example.com/avatar.jpg',
      };

      const mockSession = {
        user: {},
      };

      const mockNewUser = {
        id: 'user-new',
        email: 'oauth@example.com',
        name: 'OAuth User',
        image: 'https://example.com/avatar.jpg',
        isActive: true,
        role: 'user',
        lastLoginAt: expect.any(Date),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null); // User doesn't exist
      mockPrisma.user.create.mockResolvedValue(mockNewUser as any);
      mockPrisma.user.update.mockResolvedValue({} as any);

      const sessionCallback = authOptions.callbacks!.session!;
      const result = await sessionCallback({ token: mockToken, session: mockSession } as any);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauth@example.com',
          name: 'OAuth User',
          image: 'https://example.com/avatar.jpg',
          isActive: true,
          role: 'user',
          lastLoginAt: expect.any(Date),
        },
      });

      expect(result).not.toBeNull();
      if (result && 'user' in result && result.user && 'id' in result.user) {
        expect(result.user.id).toBe('user-new');
        expect(result.user.email).toBe('oauth@example.com');
      } else {
        fail('Expected session with user');
      }
    });

    it('should update existing user login time', async () => {
      const mockToken = {
        email: 'existing@example.com',
      };

      const mockSession = {
        user: {},
      };

      const mockExistingUser = {
        id: 'user-existing',
        email: 'existing@example.com',
        name: 'Existing User',
        image: null,
        isActive: true,
        role: 'admin',
        lastLoginAt: new Date('2025-06-10'),
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockExistingUser as any);
      mockPrisma.user.update.mockResolvedValue({} as any);

      const sessionCallback = authOptions.callbacks!.session!;
      const result = await sessionCallback({ token: mockToken, session: mockSession } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-existing' },
        data: { lastLoginAt: expect.any(Date) },
      });

      expect(result).not.toBeNull();
      if (result && 'user' in result && result.user && 'id' in result.user) {
        expect(result.user.id).toBe('user-existing');
        expect(result.user.role).toBe('admin');
      } else {
        fail('Expected session with user');
      }
    });

    it('should handle user creation errors gracefully', async () => {
      const mockToken = {
        email: 'error@example.com',
        name: 'Error User',
      };

      const mockSession = {
        user: {},
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      const sessionCallback = authOptions.callbacks!.session!;
      const result = await sessionCallback({ token: mockToken, session: mockSession } as any);

      expect(result).toBeNull();
    });
  });

  describe('Security Configuration', () => {
    it('should use database strategy', () => {
      expect(authOptions.session?.strategy).toBe('database');
    });

    it('should have proper JWT secret', () => {
      expect(authOptions.secret).toBeDefined();
    });

    it('should include Google provider', () => {
      const googleProvider = authOptions.providers.find(
        (provider) => provider.id === 'google'
      );
      expect(googleProvider).toBeDefined();
    });

    it('should include GitHub provider', () => {
      const githubProvider = authOptions.providers.find(
        (provider) => provider.id === 'github'
      );
      expect(githubProvider).toBeDefined();
    });

    it('should include credentials provider', () => {
      const credentialsProvider = authOptions.providers.find(
        (provider) => provider.id === 'credentials'
      );
      expect(credentialsProvider).toBeDefined();
    });
  });
});