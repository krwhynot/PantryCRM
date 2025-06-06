import { prismadb } from "@/lib/prisma";

export const getContactsByOpportunityId = async (opportunityId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Contacts functionality not implemented yet
  console.log('CRM Contacts functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Contacts functionality not available in current version.',
    opportunityId: opportunityId,
    contacts: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Contacts.findMany({
    where: {
      assigned_opportunities: {
        some: {
          id: opportunityId,
        },
      },
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
