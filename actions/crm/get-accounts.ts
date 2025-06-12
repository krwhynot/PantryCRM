import { prismadb } from "@/lib/prisma";

// TypeScript interface for CRM Account response
interface CRMAccount {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GetAccountsResponse {
  success: boolean;
  accounts: CRMAccount[];
  error?: string;
}

/**
 * Get CRM accounts from organizations table (Kitchen Pantry CRM implementation)
 * Uses the existing Organization model as account entities
 */
export const getAccounts = async (): Promise<GetAccountsResponse> => {
  try {
    // Map organization data to CRM account format for Kitchen Pantry CRM
    const organizations = await prismadb.organization.findMany({
      select: {
        id: true,
        name: true,
        notes: true, // Use notes as description
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform organization data to CRM account format
    const accounts: CRMAccount[] = organizations.map(org => ({
      id: org.id,
      name: org.name,
      description: org.notes || undefined,
      organizationId: org.id, // Self-reference for compatibility
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }));

    return {
      success: true,
      accounts,
    };
  } catch (error) {
    console.error('Error fetching CRM accounts:', error);
    return {
      success: false,
      accounts: [],
      error: 'Failed to fetch CRM accounts. Please try again later.',
    };
  }
};
