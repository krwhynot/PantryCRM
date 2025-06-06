import { prismadb } from "@/lib/prisma";

export const getAccount = async (accountId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Accounts functionality not implemented yet
  console.log('CRM Accounts functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Accounts functionality not available in current version.',
    id: accountId
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Accounts.findFirst({
    where: {
      id: accountId,
    },
    include: {
      contacts: true,
      opportunities: true,
      assigned_documents: true,
      invoices: true,
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
  });
  return data;
  */
};
