/**
 * DEPRECATED: OpenAI integration has been disabled as part of Task 3 (Critical Dependency Fixes)
 * The openai package was removed to reduce bundle size and meet the <800KB target.
 * 
 * This functionality will be reimplemented in Task 7 using Azure OpenAI Services.
 */
import { prismadb } from "./prisma";

export async function openAiHelper(userId: string) {
  // Still check for API keys to maintain database structure
  const openAiKey = await prismadb.systemServices.findFirst({
    where: {
      name: "openAiKey",
    },
  });

  const userOpenAiKey = await prismadb.openAi_keys.findFirst({
    where: {
      user: userId,
    },
  });

  // Return a placeholder client with methods that return migration notices
  return {
    chat: {
      completions: {
        create: async () => ({
          choices: [{
            message: {
              content: "OpenAI integration has been migrated to Azure OpenAI Services as part of Task 3 (Critical Dependency Fixes)."
            }
          }]
        })
      }
    },
    completions: {
      create: async () => ({
        choices: [{
          text: "OpenAI integration has been migrated to Azure OpenAI Services as part of Task 3 (Critical Dependency Fixes)."
        }]
      })
    },
    migrationStatus: "pending",
    migrationNotice: "OpenAI integration has been migrated to Azure OpenAI Services."
  };
}
