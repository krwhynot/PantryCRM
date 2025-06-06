import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all organizations (accounts) in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 */
export const getAccountsCount = async () => {
  const data = await prismadb.organization.count();
  return data;
};
