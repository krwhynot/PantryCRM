"use server";

import { prismadb } from "@/lib/prisma";

const updateModel = async (model: any) => {
  // TODO: Kitchen Pantry CRM - GPT model functionality not implemented yet
  console.log('GPT model functionality disabled for Kitchen Pantry CRM');
  return {
    error: 'GPT model functionality not available in current version.'
  };
  
  // Original implementation commented out due to missing Prisma model
  /*
  await prismadb.gpt_models.updateMany({
    data: {
      status: "INACTIVE",
    },
  });

  const setCronGPT = await prismadb.gpt_models.update({
    where: {
      id: model,
    },
    data: {
      status: "ACTIVE",
    },
  });
  console.log("change GPT model to:", setCronGPT);
  */
};

export default updateModel;
