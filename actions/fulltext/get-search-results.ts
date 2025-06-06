import { prismadb } from "@/lib/prisma";

/**
 * Performs a full-text search across multiple entities in the CRM
 * Updated as part of Task 3 (Critical Dependency Fixes) to use correct Prisma models
 * 
 * @param search The search term to look for
 * @returns Search results across multiple entities
 */
export const getSearch = async (search: string) => {
  //TODO: This action is now offtopic, because it is not used in the frontend.

  // Search in Opportunities
  const resultsCrmOpportunities = await prismadb.opportunity.findMany({
    where: {
      OR: [
        { notes: { contains: search } },
        { reason: { contains: search } },
      ],
      isActive: true
    },
  });

  // Search in Organizations (formerly Accounts)
  const resultsCrmAccounts = await prismadb.organization.findMany({
    where: {
      OR: [
        { description: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ],
      isActive: true
    },
  });

  // Search in Contacts
  const resultsCrmContacts = await prismadb.contact.findMany({
    where: {
      OR: [
        { lastName: { contains: search } },
        { firstName: { contains: search } },
        { email: { contains: search } },
      ],
      isActive: true
    },
  });

  // Search in Users
  const resultsUser = await prismadb.user.findMany({
    where: {
      OR: [
        { email: { contains: search } },
        { name: { contains: search } },
      ],
      isActive: true
    },
  });

  // Search in Tasks (using Interactions with followUpDate as proxy)
  const resultsTasks = await prismadb.interaction.findMany({
    where: {
      OR: [
        { notes: { contains: search } },
      ],
      followUpDate: {
        not: null
      },
      isCompleted: false
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  // Search in Projects (using Opportunities as proxy)
  const reslutsProjects = await prismadb.opportunity.findMany({
    where: {
      OR: [
        { notes: { contains: search } },
        { reason: { contains: search } },
      ],
      isActive: true
    },
  });

  const data = {
    message: "Fulltext search response",
    results: {
      opportunities: resultsCrmOpportunities,
      accounts: resultsCrmAccounts,
      contacts: resultsCrmContacts,
      users: resultsUser,
      tasks: resultsTasks,
      projects: reslutsProjects,
    },
  };

  return data;
};
