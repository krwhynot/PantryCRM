import { prismadb } from "@/lib/prisma";

export const getSaleStages = async () => {
  // TODO: Kitchen Pantry CRM - CRM Sales Stages functionality not implemented yet
  console.log('CRM Sales Stages functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Sales Stages functionality not available in current version.',
    saleStages: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Opportunities_Sales_Stages.findMany({
    orderBy: {
      probability: "asc",
    },
  });
  return data;
  */
};
