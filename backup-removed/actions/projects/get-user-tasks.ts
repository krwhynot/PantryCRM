import { prismadb } from "@/lib/prisma";

/**
 * Gets tasks for a specific user
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interactions as proxy for tasks
 * This is a temporary implementation until proper project management functionality is implemented
 * @param userId - The ID of the user to get tasks for
 */
export const getUserTasks = async (userId: string) => {
  try {
    if (!userId) {
      return [];
    }
    
    // Use interactions as a proxy for tasks
    const interactions = await prismadb.interaction.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Transform interactions to task format
    const tasks = interactions.map((interaction) => ({
      id: interaction.id,
      title: `Interaction with ${interaction.organization?.name || 'Organization'}`,
      description: interaction.notes || "",
      status: interaction.isCompleted ? "done" : "pending",
      priority: "medium", // Default priority
      dueDate: interaction.followUpDate,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
      user: interaction.userId,
      assigned_user: {
        id: interaction.userId,
        name: interaction.user?.name || "Unassigned"
      }
    }));

    return tasks;
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return [];
  }
};
