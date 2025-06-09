/**
 * DEPRECATED: This file is maintained for reference only.
 * The uploadthing functionality has been replaced with Azure Storage-based upload APIs.
 * 
 * This change was made as part of Task 3 (Critical Dependency Fixes) to reduce bundle size.
 */

import { NextRequest, NextResponse } from "next/server";

// Redirect to appropriate Azure Storage-based upload endpoints
export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  return NextResponse.json({
    message: "Upload endpoints have been migrated to Azure Storage",
    endpoints: {
      image: "/api/upload/image",
      document: "/api/upload/document",
      profile: "/api/upload/profile"
    }
  });
}

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<Response> {
  // Extract the intended upload type from the request
  const searchParams = new URL(request.url).searchParams;
  const uploadType = searchParams.get("uploadType") || "document";
  
  // Redirect to the appropriate endpoint
  const redirectMap: Record<string, string> = {
    "image": "/api/upload/image",
    "profile": "/api/upload/profile",
    "document": "/api/upload/document"
  };
  
  const redirectUrl = redirectMap[uploadType] || "/api/upload/document";
  
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}


