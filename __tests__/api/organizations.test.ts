/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/organizations/route';
import { prismadb } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prismadb: {
    organization: {
      findMany: jest.fn(),
      create: jest.fn(),
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

describe('/api/organizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', isActive: true },
    } as any);
  });

  describe('GET', () => {
    it('should return organizations for authenticated user', async () => {
      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Test Restaurant',
          email: 'test@restaurant.com',
          phone: '555-0123',
          priority: 'A',
          segment: 'FINE_DINING',
          estimatedRevenue: 100000,
          createdAt: new Date(),
        },
      ];

      mockPrisma.organization.findMany.mockResolvedValue(mockOrganizations as any);

      const request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organizations).toEqual(mockOrganizations);
      expect(data.count).toBe(1);
      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        orderBy: [{ priority: 'asc' }, { name: 'asc' }],
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          priority: true,
          segment: true,
          estimatedRevenue: true,
          lastContactDate: true,
          nextFollowUpDate: true,
          createdAt: true,
        },
      });
    });

    it('should filter organizations by search query', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/organizations?q=restaurant');
      const response = await GET(request);

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: 'restaurant', mode: 'insensitive' } },
            { email: { contains: 'restaurant', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ priority: 'asc' }, { name: 'asc' }],
        take: 50,
        select: expect.any(Object),
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.organization.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should sanitize search input to prevent XSS', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/organizations?q=<script>alert("xss")</script>');
      const response = await GET(request);

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: 'scriptalert("xss")/script', mode: 'insensitive' } },
            { email: { contains: 'scriptalert("xss")/script', mode: 'insensitive' } },
          ],
        },
        orderBy: expect.any(Array),
        take: 50,
        select: expect.any(Object),
      });
    });
  });

  describe('POST', () => {
    it('should create organization for authenticated user', async () => {
      const mockCreatedOrg = {
        id: 'org-1',
        name: 'New Restaurant',
        email: 'new@restaurant.com',
        phone: '555-0123',
        address: '123 Main St',
        priority: 'C',
        segment: 'GENERAL',
        type: 'PROSPECT',
        status: 'ACTIVE',
      };

      mockPrisma.organization.create.mockResolvedValue(mockCreatedOrg as any);

      const requestBody = {
        name: 'New Restaurant',
        email: 'new@restaurant.com',
        phone: '555-0123',
        addressLine1: '123 Main St',
      };

      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedOrg);
      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'New Restaurant',
          phone: '555-0123',
          email: 'new@restaurant.com',
          address: '123 Main St',
          priority: 'C',
          segment: 'GENERAL',
          type: 'PROSPECT',
          status: 'ACTIVE',
        },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle database constraint violations', async () => {
      const { Prisma } = require('@prisma/client');
      const constraintError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '5.0.0' }
      );

      mockPrisma.organization.create.mockRejectedValue(constraintError);

      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Duplicate Restaurant',
          email: 'existing@restaurant.com',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('Record already exists');
    });
  });
});