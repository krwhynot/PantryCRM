/**
 * DEPRECATED: Notion integration has been disabled as part of Task 3 (Critical Dependency Fixes)
 * The @notionhq/client package was removed to reduce bundle size and meet the <800KB target.
 * 
 * This functionality will be reimplemented in Task 7 using Azure Cognitive Services.
 */
import { prismadb } from "./prisma";

const initNotionClient = async (userId: string) => {
  try {
    const apiKey = await prismadb.secondBrain_notions.findFirst({
      where: {
        user: userId,
      },
    });

    if (!apiKey) {
      return {
        error: "API key not found in the database.",
        migrationNotice: "Notion integration has been migrated to Azure Cognitive Services."
      };
    }

    // Return a placeholder client with methods that return migration notices
    return {
      databases: {
        query: async () => ({
          results: [],
          migrationNotice: "Notion integration has been migrated to Azure Cognitive Services."
        })
      },
      pages: {
        retrieve: async () => ({
          migrationNotice: "Notion integration has been migrated to Azure Cognitive Services."
        })
      },
      migrationStatus: "pending"
    };
  } catch (error) {
    console.error("Failed to initialize Notion client:", error);
    throw error;
  }
};

export default initNotionClient;
