import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * API route to delete an organization (account)
 * Updated as part of Task 3 (Critical Dependency Fixes) to use organization model instead of crm_Accounts
 */
export async function DELETE(req: Request, props: { params: Promise<{ accountId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Use organization model instead of crm_Accounts
    await prismadb.organization.delete({
      where: {
        id: params.accountId,
      },
    });

    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    return new NextResponse("Error deleting organization", { status: 500 });
  }
}
