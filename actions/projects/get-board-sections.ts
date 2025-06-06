import { prismadb } from "@/lib/prisma";

/**
 * Gets board sections for a specific board
 * Updated as part of Task 3 (Critical Dependency Fixes) to use interaction types as proxy for sections
 * This is a temporary implementation until proper project management functionality is implemented
 */
export const getBoardSections = async (boardId: string) => {
  try {
    // Use interaction types as a proxy for board sections
    // Get all interaction types from settings
    const interactionTypes = await prismadb.setting.findMany({
      where: {
        category: "InteractionType",
        active: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    });

    // Create board sections based on interaction types
    const sections = interactionTypes.map((type, index) => ({
      id: type.id,
      title: type.label || type.key,
      board: boardId,
      order: index,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt
    }));

    // If no interaction types found, create default sections
    if (sections.length === 0) {
      return [
        {
          id: "section-todo",
          title: "To Do",
          board: boardId,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "section-inprogress",
          title: "In Progress",
          board: boardId,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "section-done",
          title: "Done",
          board: boardId,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }

    return sections;
  } catch (error) {
    console.error("Error fetching board sections:", error);
    return [];
  }
};
