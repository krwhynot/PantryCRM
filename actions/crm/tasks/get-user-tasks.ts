import { prismadb } from "@/lib/prisma";

export const getUserCRMTasks = async (userId: string) => {
  // TODO: Kitchen Pantry CRM - CRM User Tasks functionality not implemented yet
  console.log('CRM User Tasks functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM User Tasks functionality not available in current version.',
    userId: userId,
    tasks: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Accounts_Tasks.findMany({
    where: {
      user: userId,
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
  */
};
