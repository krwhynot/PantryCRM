import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const ContactSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  positionKey: z.string().optional(), // Will lookup Setting CUID
  organizationId: z.string().cuid(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  switch (req.method) {
    case 'GET':
      try {
        const { organizationId, search, limit = 50 } = req.query;
        const where: any = {};
        
        if (organizationId) where.organizationId = organizationId;
        if (search) {
          where.OR = [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ];
        }

        const contacts = await prisma.contact.findMany({
          where,
          include: {
            organization: { select: { id: true, name: true } },
            position: true,
            _count: { select: { interactions: true } },
          },
          take: Number(limit),
          orderBy: [
            { isPrimary: 'desc' }, // Primary contacts first
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        });

        res.status(200).json(contacts);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
      }
      break;

    case 'POST':
      try {
        const validatedData = ContactSchema.parse(req.body);
        const { positionKey, ...contactData } = validatedData;

        // Build contact input object
        const contactInput: any = {
          ...contactData,
          email: contactData.email || null, // Handle empty string
        };

        // Look up Position Setting CUID if positionKey provided
        if (positionKey) {
          const positionSetting = await prisma.setting.findUnique({
            where: { category_key: { category: 'Position', key: positionKey } },
          });
          
          if (!positionSetting) {
            return res.status(400).json({ error: `Invalid position key: ${positionKey}` });
          }
          
          contactInput.positionId = positionSetting.id;
        }

        // Check for duplicate email within organization (if email provided)
        if (contactInput.email) {
          const existingContact = await prisma.contact.findFirst({
            where: {
              organizationId: contactInput.organizationId,
              email: { equals: contactInput.email, mode: 'insensitive' },
            },
          });
          
          if (existingContact) {
            return res.status(409).json({ 
              error: 'Email already exists for a contact in this organization' 
            });
          }
        }

        // Handle primary contact logic
        if (contactInput.isPrimary) {
          // Remove primary status from other contacts in this organization
          await prisma.contact.updateMany({
            where: { 
              organizationId: contactInput.organizationId,
              isPrimary: true,
            },
            data: { isPrimary: false },
          });
        }

        const contact = await prisma.contact.create({
          data: contactInput,
          include: {
            organization: { select: { id: true, name: true } },
            position: true,
          },
        });

        res.status(201).json(contact);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error('Failed to create contact:', error);
        res.status(500).json({ error: 'Failed to create contact' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
