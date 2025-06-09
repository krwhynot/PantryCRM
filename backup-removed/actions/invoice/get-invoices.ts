import { prismadb } from "@/lib/prisma";

/**
 * Gets all invoices
 * Updated as part of Task 3 (Critical Dependency Fixes) to use opportunity model as proxy
 * This is a temporary implementation until proper invoice functionality is implemented in Task 7
 */
export const getInvoices = async () => {
  try {
    // Use opportunities with status "won" as a proxy for invoices
    // In the future, invoices will be implemented with Azure Storage in Task 7
    const opportunities = await prismadb.opportunity.findMany({
      where: {
        status: "won",
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform opportunities data into invoice format
    const invoices = opportunities.map(opportunity => ({
      id: opportunity.id,
      invoiceNumber: `INV-${opportunity.id.substring(0, 8).toUpperCase()}`,
      status: Math.random() > 0.3 ? "paid" : "pending", // Randomize for demo purposes
      amount: opportunity.expectedRevenue || 0,
      dueDate: opportunity.expectedCloseDate || new Date(),
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      notes: opportunity.notes,
      user: opportunity.user,
      client: opportunity.organization.name,
    }));

    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
};
