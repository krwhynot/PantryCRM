"use server";
import { prismadb } from "@/lib/prisma";

export async function setInactiveOpportunity(id: string) {
  // TODO: Kitchen Pantry CRM - CRM Opportunity inactivation functionality not implemented yet
  console.log('CRM Opportunity inactivation functionality disabled for Kitchen Pantry CRM');
  
  if (!id) {
    console.log("Opportunity id is required");
    return { error: "Opportunity id is required" };
  }
  
  return {
    error: 'CRM Opportunity inactivation functionality not available in current version.',
    id: id
  };
  
  /* Original implementation commented out due to missing Prisma model
  console.log(id, "id");

  if (!id) {
    console.log("Opportunity id is required");
  }
  try {
    const result = await prismadb.crm_Opportunities.update({
      where: {
        id,
      },
      data: {
        status: "INACTIVE",
      },
    });

    console.log(result, "result");

    console.log("Opportunity has been set to inactive");
  } catch (error) {
    console.error(error);
  }
  */
}
