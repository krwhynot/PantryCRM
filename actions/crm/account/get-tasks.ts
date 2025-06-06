import { prismadb } from "@/lib/prisma";

export const getAccountsTasks = async (accountId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Tasks functionality not implemented yet
  console.log('CRM Tasks functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Tasks functionality not available in current version.',
    accountId: accountId,
    tasks: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Accounts_Tasks.findMany({
    where: {
      account: accountId,
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return data;
  */
};
