import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all active users in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 */
export const getActiveUsersCount = async () => {
  const data = await prismadb.user.count({
    where: {
      isActive: true,
    },
  });
  return data;
};
