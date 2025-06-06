import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all contacts in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 */
export const getContactCount = async () => {
  const data = await prismadb.contact.count();
  return data;
};
