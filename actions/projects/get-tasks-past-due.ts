import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import dayjs from "dayjs";
import { getServerSession } from "next-auth";

/**
 * Gets tasks that are past due or due within the next 7 days
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interactions as proxy for tasks
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getTasksPastDue = async () => {
  try {
    const session = await getServerSession(authOptions);
    const today = dayjs().startOf("day");
    const nextWeek = dayjs().add(7, "day").startOf("day");
    
    if (session) {
      // Use interactions as a proxy for tasks
      // Get past due interactions (follow-up date in the past and not completed)
      const pastDueInteractions = await prismadb.interaction.findMany({
        where: {
          AND: [
            { userId: session.user.id },
            { followUpDate: { lte: new Date() } },
            { isCompleted: false }
          ]
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
          followUpDate: 'asc'
        }
      });

      // Get interactions due in the next 7 days
      const upcomingInteractions = await prismadb.interaction.findMany({
        where: {
          AND: [
            { userId: session.user.id },
            { 
              followUpDate: {
                gt: today.toDate(),
                lt: nextWeek.toDate()
              } 
            },
            { isCompleted: false }
          ]
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
          followUpDate: 'asc'
        }
      });

      // Transform interactions to task format
      const transformInteractionToTask = (interaction: {
        id: string;
        notes?: string | null;
        followUpDate: Date | null;
        isCompleted: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        organization?: { name: string; id: string; } | null;
      }) => ({
        id: interaction.id,
        title: `Interaction with ${interaction.organization?.name || 'Organization'}`,
        description: interaction.notes || "",
        dueDateAt: interaction.followUpDate,
        taskStatus: interaction.isCompleted ? "COMPLETE" : "PENDING",
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        user: interaction.userId,
        comments: [] // Empty comments array as we'll fetch them separately if needed
      });

      const getTaskPastDue = pastDueInteractions.map(transformInteractionToTask);
      const getTaskPastDueInSevenDays = upcomingInteractions.map(transformInteractionToTask);

      return {
        getTaskPastDue,
        getTaskPastDueInSevenDays
      };
    }
    
    return {
      getTaskPastDue: [],
      getTaskPastDueInSevenDays: []
    };
  } catch (error) {
    console.error("Error fetching past due tasks:", error);
    return {
      getTaskPastDue: [],
      getTaskPastDueInSevenDays: []
    };
  }
};
