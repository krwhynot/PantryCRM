import { prismadb } from "@/lib/prisma";

export const getIndustries = async () => {
  // TODO: Kitchen Pantry CRM - CRM Industries functionality not implemented yet
  console.log('CRM Industries functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Industries functionality not available in current version.',
    industries: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Industry_Type.findMany({});
  return data;
  */
};
