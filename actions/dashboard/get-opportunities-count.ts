import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all opportunities in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 */
export const getOpportunitiesCount = async () => {
  const data = await prismadb.opportunity.count({
    where: {
      isActive: true
    }
  });
  return data;
};
