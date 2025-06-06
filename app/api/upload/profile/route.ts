import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { uploadBlob } from "@/lib/azure-storage";

/**
 * Handles profile photo upload requests, storing files in Azure Storage
 * Replacement for uploadthing/profilePhotoUploader functionality
 */
export async function POST(request: NextRequest) {
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }    // Validate file size (4MB max)
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 4MB limit" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Azure Storage
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "profiles";
    const blobName = `profile-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    
    await uploadBlob(
      containerName,
      blobName,
      buffer,
      file.type
    );
    
    // Generate URL
    const url = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${containerName}/${blobName}`;
    
    // Update user profile
    await prismadb.users.update({
      where: { id: userId },
      data: { profile_photo: url }
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
    console.error("Error uploading profile photo:", error);
    return NextResponse.json({ error: "Failed to upload profile photo" }, { status: 500 });
  }
}