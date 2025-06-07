import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const OrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  priorityId: z.string().optional(),
  segmentId: z.string().optional(),
  distributorId: z.string().optional(),
  accountManagerId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  switch (req.method) {
    case 'GET':
      try {
        const { search, priorityId, segmentId, limit = 50 } = req.query;
        const where: any = {};
        
        if (search) {
          where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { city: { contains: search as string, mode: 'insensitive' } },
          ];
        }
        if (priorityId) where.priorityId = priorityId;
        if (segmentId) where.segmentId = segmentId;

        const organizations = await prisma.organization.findMany({
          where,
          include: {
            priority: true,
            segment: true,
            distributor: true,
            accountManager: true,
            _count: { select: { contacts: true, interactions: true } },
          },
          take: Number(limit),
          orderBy: { updatedAt: 'desc' },
        });

        res.status(200).json(organizations);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        res.status(500).json({ error: 'Failed to fetch organizations' });
      }
      break;

    case 'POST':
      try {
        const validatedData = OrganizationSchema.parse(req.body);
        
        const existing = await prisma.organization.findFirst({
          where: { name: { equals: validatedData.name, mode: 'insensitive' } },
        });
        
        if (existing) {
          return res.status(409).json({ error: 'Organization name already exists' });
        }

        const { address, zipCode, ...restOfValidatedData } = validatedData;
        const organizationData: any = {
          ...restOfValidatedData,
        };
        if (address) organizationData.addressLine1 = address;
        if (zipCode) organizationData.postalCode = zipCode;

        const organization = await prisma.organization.create({
          data: organizationData,
          include: {
            priority: true,
            segment: true,
            distributor: true,
            accountManager: true,
          },
        });

        res.status(201).json(organization);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error('Failed to create organization:', error);
        res.status(500).json({ error: 'Failed to create organization' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}