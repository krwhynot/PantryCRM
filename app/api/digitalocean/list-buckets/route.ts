import { NextRequest, NextResponse } from "next/server";
import { listContainers } from "@/lib/azure-storage";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const containers = await listContainers();
    console.log(containers, "Azure storage containers");

    return NextResponse.json({ 
      buckets: { 
        Buckets: containers.map(name => ({ Name: name })),
        Owner: { DisplayName: process.env.AZURE_STORAGE_ACCOUNT }
      }, 
      success: true 
    }, { status: 200 });
  } catch (error) {
    console.error("Error listing Azure containers:", error);
    return NextResponse.json({ error: "Failed to list containers", success: false }, { status: 500 });
  }
}


