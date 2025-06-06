import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

/**
 * Gets all tasks for the current user
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interactions as proxy for tasks
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getTasks = async () => {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) return null;

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
      assigned_user: {
        id: interaction.userId,
        name: interaction.user?.name || "Unassigned"
      }
    }));

    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

/**
 * Gets tasks by month for chart visualization
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interactions as proxy for tasks
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getTasksByMonth = async () => {
  try {
    // Use interactions as a proxy for tasks
    const interactions = await prismadb.interaction.findMany({
      select: {
        createdAt: true
      }
    });

    if (!interactions || interactions.length === 0) {
      return [];
    }

    // Group interactions by month
    const tasksByMonth = interactions.reduce((acc: Record<string, number>, interaction) => {
      const month = new Date(interaction.createdAt).toLocaleString("default", {
        month: "long"
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Format data for chart
    const chartData = Object.keys(tasksByMonth).map((month) => {
      return {
        name: month,
        Number: tasksByMonth[month]
      };
    });

    return chartData;
  } catch (error) {
    console.error("Error fetching tasks by month:", error);
    return [];
  }
};
