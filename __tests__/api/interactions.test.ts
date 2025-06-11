/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/interactions/route';
import { prismadb } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prismadb: {
    organization: {
      findUnique: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
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

describe('/api/interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: { 
        id: 'user-1', 
        email: 'test@example.com', 
        isActive: true 
      },
    } as any);
  });

  describe('POST /api/interactions', () => {
    it('should create interaction for authenticated user', async () => {
      const mockOrganization = { id: 'org-1', name: 'Test Restaurant' };
      const mockContact = { id: 'contact-1', firstName: 'John', lastName: 'Doe' };
      const mockCreatedInteraction = {
        id: 'interaction-1',
        organizationId: 'org-1',
        contactId: 'contact-1',
        userId: 'user-1',
        interactionDate: new Date('2025-06-11'),
        typeId: 'email',
        notes: 'Follow-up email sent',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization as any);
      mockPrisma.contact.findUnique.mockResolvedValue(mockContact as any);
      mockPrisma.interaction.create.mockResolvedValue(mockCreatedInteraction as any);

      const requestBody = {
        organizationId: 'org-1',
        contactId: 'contact-1',
        interactionDate: '2025-06-11T10:00:00Z',
        typeId: 'email',
        notes: 'Follow-up email sent',
        isCompleted: false,
      };

      const request = new NextRequest('http://localhost:3000/api/interactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('interaction-1');
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
      expect(mockPrisma.interaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          contactId: 'contact-1',
          userId: 'user-1',
          typeId: 'email',
          notes: 'Follow-up email sent',
          isCompleted: false,
        }),
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/interactions', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-1',
          typeId: 'email',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/interactions', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Organization ID is required');
    });

    it('should return 404 when organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/interactions', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'nonexistent-org',
          interactionDate: '2025-06-11T10:00:00Z',
          typeId: 'email',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Organization with ID nonexistent-org not found');
    });

    it('should return 404 when contact not found', async () => {
      const mockOrganization = { id: 'org-1', name: 'Test Restaurant' };
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization as any);
      mockPrisma.contact.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/interactions', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-1',
          contactId: 'nonexistent-contact',
          interactionDate: '2025-06-11T10:00:00Z',
          typeId: 'email',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Contact with ID nonexistent-contact not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.organization.findUnique.mockRejectedValue(new Error('Database connection error'));

      const request = new NextRequest('http://localhost:3000/api/interactions', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-1',
          interactionDate: '2025-06-11T10:00:00Z',
          typeId: 'email',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create interaction');
    });
  });

  describe('GET /api/interactions', () => {
    it('should return interactions for authenticated user', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          organizationId: 'org-1',
          contactId: 'contact-1',
          userId: 'user-1',
          interactionDate: new Date('2025-06-11'),
          typeId: 'email',
          notes: 'Initial contact',
          Contact: { firstName: 'John', lastName: 'Doe' },
        },
      ];

      mockPrisma.interaction.findMany.mockResolvedValue(mockInteractions as any);

      const request = new NextRequest('http://localhost:3000/api/interactions?organizationId=org-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockInteractions);
      expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { Contact: true },
        orderBy: { interactionDate: 'desc' },
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/interactions?organizationId=org-1');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should require organizationId parameter (non-test mode)', async () => {
      const request = new NextRequest('http://localhost:3000/api/interactions');
      const response = await GET(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Organization ID is required');
    });

    it('should return test data when test mode is enabled', async () => {
      const request = new NextRequest('http://localhost:3000/api/interactions?test=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // Test data has 2 interactions
      expect(data[0].id).toBe('test-interaction-1');
    });

    it('should filter interactions by contactId and typeId', async () => {
      mockPrisma.interaction.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/interactions?organizationId=org-1&contactId=contact-1&typeId=email'
      );
      const response = await GET(request);

      expect(mockPrisma.interaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          contactId: 'contact-1',
          typeId: 'email',
        },
        include: { Contact: true },
        orderBy: { interactionDate: 'desc' },
      });
    });
  });
});