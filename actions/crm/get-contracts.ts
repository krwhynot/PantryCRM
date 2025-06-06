"use server";

import { prismadb } from "@/lib/prisma";

export const getContractsWithIncludes = async () => {
  // TODO: Kitchen Pantry CRM - CRM Contracts functionality not implemented yet
  console.log('CRM Contracts functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Contracts functionality not available in current version.',
    contracts: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Contracts.findMany({
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      assigned_account: {
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

export const getContractsByAccountId = async (accountId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Contracts functionality not implemented yet
  console.log('CRM Contracts functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Contracts functionality not available in current version.',
    accountId: accountId,
    contracts: []
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Contracts.findMany({
    where: {
      account: accountId,
    },
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      assigned_account: {
        select: {
          name: true,
        },
      },
    },
  });
  return data;
  */
};
