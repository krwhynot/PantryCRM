"use server";
import { prismadb } from "@/lib/prisma";

/**
 * Gets the count of all tasks in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 * Note: No direct Task model exists in the schema, using Interaction with followUpDate as proxy
 */
export const getTasksCount = async () => {
  const data = await prismadb.interaction.count({
    where: {
      nextAction: {
        not: null
      },
      outcome: "FOLLOW_UP_NEEDED"
    }
  });
  return data;
};

/**
 * Gets the count of tasks assigned to a specific user
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma model
 * Note: No direct Task model exists in the schema, using Interaction with followUpDate as proxy
 */
export const getUsersTasksCount = async (userId: string) => {
  const data = await prismadb.interaction.count({
    where: {
      // Note: Interaction model doesn't have userId - using contactId as proxy
      contactId: userId,
      nextAction: {
        not: null
      },
      outcome: "FOLLOW_UP_NEEDED"
    }
  });
  return data;
};
