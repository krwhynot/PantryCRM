import { prismadb } from "@/lib/prisma";

/**
 * Gets a board by ID with its sections and tasks
 * Updated as part of Task 3 (Critical Dependency Fixes) to use opportunity stages as proxy for boards
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getBoard = async (id: string) => {
  try {
    // Use opportunity as a proxy for board
    let board = null;
    
    if (id === "default") {
      // Create a default board if no specific ID is provided
      board = {
        id: "default",
        name: "Food Service CRM Tasks",
        description: "Task management board for Food Service CRM",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          name: "System"
        }
      };
    } else {
      // Try to find an opportunity to use as a board
      const opportunity = await prismadb.opportunity.findUnique({
        where: {
          id: id
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });
      
      if (opportunity) {
        // Use principal as the name since Opportunity doesn't have a name field
        board = {
          id: opportunity.id,
          name: `${opportunity.principal} Opportunity`,
          description: opportunity.notes || "Task management board",
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt,
          user: opportunity.user
        };
      } else {
        // Fallback to default board if opportunity not found
        board = {
          id: id,
          name: "Food Service CRM Tasks",
          description: "Task management board for Food Service CRM",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            name: "System"
          }
        };
      }
    }

    // Get board sections using the existing function (which we've already fixed)
    // This will use interaction types as sections
    const getBoardSections = (await import("./get-board-sections")).getBoardSections;
    const sections = await getBoardSections(id);
    
    // For each section, get interactions as tasks
    const sectionsWithTasks = await Promise.all(sections.map(async (section) => {
      // Get interactions of this type as tasks
      const interactions = await prismadb.interaction.findMany({
        where: {
          typeId: section.id,
          isCompleted: false
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          interactionDate: "desc"
        }
      });
      
      // Transform interactions to tasks
      const tasks = interactions.map((interaction, index) => ({
        id: interaction.id,
        title: `${interaction.organization?.name || 'Organization'} - ${interaction.notes?.substring(0, 30) || 'Task'}...`,
        description: interaction.notes || "",
        position: index,
        section: section.id,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        user: interaction.user,
        dueDate: interaction.followUpDate
      }));
      
      return {
        ...section,
        tasks
      };
    }));

    const data = {
      board,
      sections: sectionsWithTasks
    };
    
    return data;
  } catch (error) {
    console.error("Error fetching board:", error);
    // Return empty board structure
    return {
      board: {
        id: id || "default",
        name: "Food Service CRM Tasks",
        description: "Task management board for Food Service CRM",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          name: "System"
        }
      },
      sections: []
    };
  }
};
