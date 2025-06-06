import { prismadb } from "@/lib/prisma";

export const getContactsByAccountId = async (accountId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Contacts functionality not implemented yet
  console.log('CRM Contacts functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Contacts functionality not available in current version.',
    accountId: accountId,
    contacts: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Contacts.findMany({
    where: {
      accountsIDs: accountId,
    },
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      crate_by_user: {
        select: {
          name: true,
        },
      },
      assigned_accounts: true,
    },
  });
  return data;
  */
};
