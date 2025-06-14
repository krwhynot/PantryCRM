import { prismadb } from "@/lib/prisma";

export const getOpportunity = async (opportunityId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Opportunities functionality not implemented yet
  console.log('CRM Opportunities functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Opportunities functionality not available in current version.',
    id: opportunityId
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Opportunities.findFirst({
    where: {
      id: opportunityId,
    },
    include: {
      assigned_account: {
        select: {
          name: true,
        },
      },
      assigned_sales_stage: {
        select: {
          name: true,
        },
      },
      assigned_type: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          office_phone: true,
          mobile_phone: true,
          email: true,
        },
      },
      assigned_to_user: {
        select: {
          name: true,
          email: true,
        },
      },
      documents: {
        select: {
          id: true,
          document_name: true,
        },
      },
    },
  });
  return data;
  */
};
