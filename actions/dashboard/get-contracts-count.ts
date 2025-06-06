import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all contracts in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 * Note: No direct Contract model exists in the schema, using Opportunity with specific status as proxy
 */
export const getContractsCount = async () => {
  // Count opportunities with "won" status as a proxy for contracts
  // This is a temporary solution until a proper Contract model is implemented in Task 7
  const data = await prismadb.opportunity.count({
    where: {
      status: "won",
      isActive: true
    }
  });
  return data;
};
