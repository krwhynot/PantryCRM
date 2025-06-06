import { prismadb } from "@/lib/prisma";

/**
 * Gets boards for a specific user
 * Updated as part of Task 3 (Critical Dependency Fixes) to use opportunity as proxy for boards
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getBoards = async (userId: string) => {
  try {
    if (!userId) {
      return null;
    }

    // Create a default board that's always available
    const defaultBoard = {
      id: "default",
      name: "Food Service CRM Tasks",
      description: "Task management board for Food Service CRM",
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      user: userId,
      assigned_user: {
        name: "System"
      }
    };

    // Use opportunities as a proxy for boards
    // Get opportunities assigned to this user
    const opportunities = await prismadb.opportunity.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 5 // Limit to 5 most recent opportunities
    });

    // Transform opportunities to boards
    const opportunityBoards = opportunities.map(opportunity => ({
      id: opportunity.id,
      name: `${opportunity.principal} Opportunity`,
      description: opportunity.notes || "Opportunity board",
      visibility: "private",
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      user: userId,
      assigned_user: {
        name: opportunity.user.name
      }
    }));

    // Combine default board with opportunity boards
    return [defaultBoard, ...opportunityBoards];
  } catch (error) {
    console.error("Error fetching boards:", error);
    
    // Return just the default board if there's an error
    return [{
      id: "default",
      name: "Food Service CRM Tasks",
      description: "Task management board for Food Service CRM",
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      user: userId,
      assigned_user: {
        name: "System"
      }
    }];
  }
};
