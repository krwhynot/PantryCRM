import { NextRequest, NextResponse } from "next/server";
import { listBlobs } from "@/lib/azure-storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, props: { params: Promise<{ bucketId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const { bucketId } = params;

  if (!bucketId) {
    return NextResponse.json("No containerId provided", { status: 400 });
  }

  try {
    const blobs = await listBlobs(bucketId);
    console.log("Success - Azure container listing", blobs);

    // Format response to match existing application expectations
    const formattedResponse = {
      Contents: blobs.map(blob => ({
        Key: blob.name,
        Size: blob.contentLength,
        LastModified: blob.lastModified,
        ContentType: blob.contentType
      })),
      Name: bucketId
    };

    return NextResponse.json({ files: formattedResponse, success: true }, { status: 200 });
  } catch (error) {
    console.error("Error listing Azure blobs:", error);
    return NextResponse.json({ error: "Failed to list blobs", success: false }, { status: 500 });
  }
}
