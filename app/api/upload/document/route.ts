import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { uploadBlob } from "@/lib/azure-storage";

/**
 * Handles document upload requests, storing files in Azure Storage
 * Replacement for uploadthing/docUploader functionality
 */
export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (64MB max)
    const MAX_SIZE = 64 * 1024 * 1024; // 64MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 64MB limit" }, { status: 400 });
    }    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Azure Storage
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "documents";
    const blobName = `${Date.now()}-${file.name}`;
    
    await uploadBlob(
      containerName,
      blobName,
      buffer,
      file.type || "application/octet-stream"
    );
    
    // Generate URL
    const url = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${containerName}/${blobName}`;
    
    // Save to database
    const document = await prismadb.documents.create({
      data: {
        v: 0,
        document_name: file.name,
        description: "new document",
        document_file_url: url,
        key: blobName,
        size: file.size,
        document_file_mimeType: file.type || "application/docs",
        createdBy: userId,
        assigned_user: userId,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        url,
        key: blobName,
        size: file.size
      }
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

