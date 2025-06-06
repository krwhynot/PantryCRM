import { prismadb } from "@/lib/prisma";

export const getCrMTask = async (taskId: string) => {
  // TODO: Kitchen Pantry CRM - CRM Tasks functionality not implemented yet
  console.log('CRM Tasks functionality disabled for Kitchen Pantry CRM');
  
  return {
    error: 'CRM Tasks functionality not available in current version.',
    id: taskId
  };
  
  /* Original implementation commented out due to missing Prisma model
  const data = await prismadb.crm_Accounts_Tasks.findFirst({
    where: {
      id: taskId,
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
      documents: {
        select: {
          id: true,
          document_name: true,
          document_file_url: true,
        },
      },
      comments: {
        select: {
          id: true,
          comment: true,
          createdAt: true,
          assigned_user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
  return data;
  */
};
