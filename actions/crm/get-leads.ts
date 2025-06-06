import { prismadb } from "@/lib/prisma";

export const getLeads = async () => {
  // TODO: Kitchen Pantry CRM - CRM Leads functionality not implemented yet
  console.log('CRM Leads functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Leads functionality not available in current version.',
    leads: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Leads.findMany({
    include: {
      assigned_to_user: {
        select: {
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
