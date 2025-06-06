import { prismadb } from "@/lib/prisma";

export const getLead = async (leadId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Leads functionality not implemented yet
  console.log('CRM Leads functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Leads functionality not available in current version.',
    id: leadId
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Leads.findFirst({
    where: {
      id: leadId,
    },
    include: {
      assigned_to_user: {
        select: {
          id: true,
          name: true,
        },
      },
      assigned_accounts: true,
      assigned_documents: true,
    },
  });
  return data;
  */
};
