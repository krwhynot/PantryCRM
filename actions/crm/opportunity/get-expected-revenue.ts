import { prismadb } from "@/lib/prisma";

export const getExpectedRevenue = async () => {
  // TODO: Kitchen Pantry CRM - CRM Opportunity expected revenue functionality not implemented yet
  console.log('CRM Opportunity expected revenue functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Opportunity expected revenue functionality not available in current version.',
    totalAmount: 0
  };
  
  /* Original implementation commented out due to missing Prisma model
  const activeOpportunities = await prismadb.crm_Opportunities.findMany({
    where: {
      status: "ACTIVE",
    },
  });

  const totalAmount = activeOpportunities.reduce(
    (sum: number, opportunity: any) => sum + Number(opportunity.budget),
    0
  );

  return totalAmount;
  */
};
