import { prismadb } from "@/lib/prisma";

/**
 * Gets a specific task by ID
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interaction as proxy for tasks
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getTask = async (taskId: string) => {
  try {
    // Use interaction as a proxy for tasks
    const interaction = await prismadb.interaction.findUnique({
      where: {
        id: taskId
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
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!interaction) {
      return null;
    }

    // Transform interaction to task format
    return {
      id: interaction.id,
      title: `Interaction with ${interaction.organization?.name || 'Organization'}`,
      description: interaction.notes || "",
      status: interaction.isCompleted ? "done" : "pending",
      priority: "medium", // Default priority as interaction doesn't have priority field
      dueDate: interaction.followUpDate,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
      assigned_user: {
        id: interaction.userId,
        name: interaction.user?.name || "Unassigned"
      },
      // Empty documents array as document functionality will be implemented in Task 7
      documents: [],
      // Empty comments array as we'll fetch them separately if needed
      comments: []
    };
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
};
