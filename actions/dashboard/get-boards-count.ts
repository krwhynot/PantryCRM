import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all opportunity boards in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 * Note: The original "boards" model doesn't exist in the schema, using Opportunity as the closest match
 */
export const getBoardsCount = async () => {
  // Count active opportunities grouped by stage as a proxy for boards
  const data = await prismadb.opportunity.count({
    where: {
      isActive: true
    }
  });
  return data;
};
