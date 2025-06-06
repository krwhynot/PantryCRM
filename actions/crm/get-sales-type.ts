import { prismadb } from "@/lib/prisma";

export const getSalesType = async () => {
  // TODO: Kitchen Pantry CRM - CRM Sales Type functionality not implemented yet
  console.log('CRM Sales Type functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Sales Type functionality not available in current version.',
    salesTypes: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Opportunities_Type.findMany({});
  return data;
  */
};
