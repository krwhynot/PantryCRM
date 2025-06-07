import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prismadb } from '@/lib/prisma';
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

        const organizations = await prismadb.organization.findMany({
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
        
        const existing = await prismadb.organization.findFirst({
          where: { 
            name: { 
              equals: validatedData.name,
              mode: 'insensitive' as any // Type assertion to bypass TypeScript error
            } 
          },
        });
        
        if (existing) {
          return res.status(409).json({ error: 'Organization name already exists' });
        }

        const { name, priorityId: priorityKey, segmentId: segmentKey, distributorId: distributorKey, accountManagerId, address, zipCode, notes, phone, website, ...otherFields } = validatedData;

        const organizationInput: any = {
          name,
          notes,
          phone,
          website,
          ...otherFields, // any other direct fields from schema
        };

        if (address) organizationInput.addressLine1 = address;
        if (zipCode) organizationInput.postalCode = zipCode;
        if (accountManagerId) organizationInput.accountManagerId = accountManagerId; // Assuming this is already a CUID if provided

        if (priorityKey) {
          const setting = await prismadb.setting.findUnique({ where: { category_key: { category: 'Priority', key: priorityKey } } });
          if (setting) organizationInput.priorityId = setting.id;
          else return res.status(400).json({ error: `Invalid priority key: ${priorityKey}` });
        }

        if (segmentKey) {
          const setting = await prismadb.setting.findUnique({ where: { category_key: { category: 'Segment', key: segmentKey } } });
          if (setting) organizationInput.segmentId = setting.id;
          else return res.status(400).json({ error: `Invalid segment key: ${segmentKey}` });
        }

        if (distributorKey) {
          const setting = await prismadb.setting.findUnique({ where: { category_key: { category: 'Distributor', key: distributorKey } } });
          if (setting) organizationInput.distributorId = setting.id;
          else return res.status(400).json({ error: `Invalid distributor key: ${distributorKey}` });
        }

        const organization = await prismadb.organization.create({
          data: organizationInput,
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