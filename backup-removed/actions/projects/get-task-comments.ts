import { prismadb } from "@/lib/prisma";

/**
 * Gets comments for a specific task
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interaction notes as proxy for task comments
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getTaskComments = async (taskId: string) => {
  try {
    // Check if taskId is an interaction ID
    const interaction = await prismadb.interaction.findUnique({
      where: {
        id: taskId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    if (interaction) {
      // If the task is an interaction, create a comment from its notes
      return [{
        id: `comment-${interaction.id}`,
        content: interaction.notes || "No additional notes",
        task: taskId,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        assigned_user: {
          name: interaction.user.name,
          avatar: interaction.user.image
        }
      }];
    }

    // If not found or not an interaction, return empty array
    return [];
  } catch (error) {
    console.error("Error fetching task comments:", error);
    return [];
  }
};
