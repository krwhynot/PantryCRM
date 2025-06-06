/**
 * DEPRECATED: UploadThing integration has been disabled as part of Task 3 (Critical Dependency Fixes)
 * The uploadthing/server package was removed to reduce bundle size and meet the <800KB target.
 * 
 * This functionality has been replaced with Azure Storage-based upload APIs:
 * - /api/upload/image - For image uploads
 * - /api/upload/document - For document uploads
 * - /api/upload/profile - For profile photo uploads
 */

export const utapi = {
  deleteFiles: async () => ({
    success: true,
    message: "File deletion now uses Azure Storage. See /api/upload/* endpoints."
  }),
  getFileUrls: async () => ({
    data: [],
    message: "File management now uses Azure Storage. See /api/upload/* endpoints."
  }),
  migrationStatus: "completed",
  migrationNotice: "File uploads now use Azure Storage."
};
