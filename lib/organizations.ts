'use server';

import { prisma } from '@/lib/prisma';

export interface Organization {
  id: string;
  name: string;
}

export async function getOrganizations(): Promise<Organization[]> {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 200,
    });

    return organizations;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return [];
  }
}