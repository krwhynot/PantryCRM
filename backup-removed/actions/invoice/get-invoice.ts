import { prismadb } from "@/lib/prisma";

/**
 * Gets an invoice by ID
 * Updated as part of Task 3 (Critical Dependency Fixes) to use opportunity model as proxy
 * This is a temporary implementation until proper invoice functionality is implemented in Task 7
 */
export const getInvoice = async (invoiceId: string) => {
  try {
    // Use opportunity as a proxy for invoice
    // In the future, invoices will be implemented with Azure Storage in Task 7
    const opportunity = await prismadb.opportunity.findUnique({
      where: {
        id: invoiceId,
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
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
      },
    });

    if (!opportunity) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    // Transform opportunity data into invoice format
    const invoice = {
      id: opportunity.id,
      invoiceNumber: `INV-${opportunity.id.substring(0, 8).toUpperCase()}`,
      status: opportunity.status === "won" ? "paid" : "pending",
      amount: opportunity.expectedRevenue || 0,
      dueDate: opportunity.expectedCloseDate || new Date(),
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      notes: opportunity.notes,
      user: opportunity.user,
      client: opportunity.organization,
    };

    return invoice;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    throw new Error(`Invoice with ID ${invoiceId} not found`);
  }
};
