import { prismadb } from "@/lib/prisma";

/**
 * Gets all active users as employees
 * Updated as part of Task 3 (Critical Dependency Fixes) to use User model as proxy for employees
 */
export const getEmployees = async () => {
  const data = await prismadb.user.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true
    }
  });
  return data;
};
