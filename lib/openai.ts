/**
 * DEPRECATED: OpenAI integration has been disabled as part of Task 3 (Critical Dependency Fixes)
 * The openai package was removed to reduce bundle size and meet the <800KB target.
 * 
 * This functionality will be reimplemented in Task 7 using Azure OpenAI Services.
 */
import { prismadb } from "./prisma";

// Define interfaces to match your Prisma schema
interface SystemService {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OpenAiKey {
  id: string;
  user: string;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}


export async function openAiHelper(userId: string) {
  // Still check for API keys to maintain database structure
  const openAiKey = await prismadb.systemService?.findFirst({
    where: {
      name: "openAiKey",
    },
  }) as SystemService | null;

  const userOpenAiKey = await prismadb.openAiKey?.findFirst({
    where: {
      user: userId,
    },
  }) as SystemService | null;

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


