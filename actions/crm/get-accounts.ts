import { prismadb } from "@/lib/prisma";

export const getAccounts = async () => {
  // TODO: Kitchen Pantry CRM - CRM Accounts functionality not implemented yet
  console.log('CRM Accounts functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Accounts functionality not available in current version.',
    accounts: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Accounts.findMany({
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          first_name: true,
          last_name: true,
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
