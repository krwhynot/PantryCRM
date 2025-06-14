"use server";

import { prismadb } from "@/lib/prisma";

export const getOpportunitiesFull = async () => {
  // TODO: Kitchen Pantry CRM - CRM Opportunities functionality not implemented yet
  console.log('CRM Opportunities functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Opportunities functionality not available in current version.',
    opportunities: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Opportunities.findMany({
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
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_on: "desc",
    },
  });

  return data;
  */
};
