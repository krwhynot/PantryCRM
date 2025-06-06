import { prismadb } from "@/lib/prisma";

export const getAllCrmData = async () => {
  // TODO: Kitchen Pantry CRM - CRM Data retrieval functionality not fully implemented yet
  console.log('CRM Data retrieval functionality disabled for Kitchen Pantry CRM');

  const users = await prismadb.user.findMany({
    where: {
      // Assuming 'isActive' is the correct field based on schema
      isActive: true, 
    },
  });
  
  // Returning only users for now, other models are missing or causing errors
  const data = {
    users,
    accounts: [],
    opportunities: [],
    leads: [],
    contacts: [],
    contracts: [],
    saleTypes: [],
    saleStages: [],
    campaigns: [],
    industries: [],
  };

  return data;
  
  /* Original implementation commented out due to missing Prisma models
  const users = await prismadb.users.findMany({
    where: {
      userStatus: "ACTIVE",
    },
  });
  const accounts = await prismadb.crm_Accounts.findMany({});
  const opportunities = await prismadb.crm_Opportunities.findMany({});
  const leads = await prismadb.crm_Leads.findMany({});
  const contacts = await prismadb.crm_Contacts.findMany({});
  const contracts = await prismadb.crm_Contracts.findMany({});
  const saleTypes = await prismadb.crm_Opportunities_Type.findMany({});
  const saleStages = await prismadb.crm_Opportunities_Sales_Stages.findMany({});
  const campaigns = await prismadb.crm_campaigns.findMany({});
  const industries = await prismadb.crm_Industry_Type.findMany({});

  const data = {
    users,
    accounts,
    opportunities,
    leads,
    contacts,
    contracts,
    saleTypes,
    saleStages,
    campaigns,
    industries,
  };

  return data;
  */
};
