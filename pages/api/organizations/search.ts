import { NextApiRequest, NextApiResponse } from 'next';
import { prismadb } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, priority, segment, distributor } = req.query;
    
    const where: any = {};
    
    // Text search across name and account manager
    if (q && typeof q === 'string') {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { accountManager: { contains: q, mode: 'insensitive' } }
      ];
    }
    
    // Filter by priority
    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }
    
    // Filter by segment
    if (segment && typeof segment === 'string') {
      where.segment = segment;
    }
    
    // Filter by distributor
    if (distributor && typeof distributor === 'string') {
      where.distributor = distributor;
    }

    const organizations = await prismadb.organization.findMany({
      where,
      orderBy: [
        { priority: { sortOrder: 'asc' } }, // Order by the sortOrder field of the related Setting model
        { name: 'asc' }
      ],
      take: 50 // Limit results for performance
    });

    res.status(200).json({
      organizations,
      count: organizations.length,
      query: q || '',
      filters: { priority, segment, distributor }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}
