import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all leads in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 * Note: No direct Lead model exists in the schema, using Opportunity with specific stage as proxy
 */
export const getLeadsCount = async () => {
  // Count opportunities with "prospecting" or "qualification" stage as a proxy for leads
  // This is a temporary solution until a proper Lead model is implemented in Task 7
  const data = await prismadb.opportunity.count({
    where: {
      stage: {
        in: ["prospecting", "qualification"]
      },
      isActive: true
    }
  });
  return data;
};
