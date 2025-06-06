/**
 * DEPRECATED: Resend email integration has been disabled as part of Task 3 (Critical Dependency Fixes)
 * The resend package was removed to reduce bundle size and meet the <800KB target.
 * 
 * This functionality will be reimplemented in Task 7 using Azure Communication Services.
 */
import { prismadb } from "./prisma";

export default async function resendHelper() {
  // Still check for API keys to maintain database structure
  const resendKey = await prismadb.systemServices.findFirst({
    where: {
      name: "resend_smtp",
    },
  });

  // Return a placeholder client with methods that return migration notices
  return {
    emails: {
      send: async () => ({
        id: "migration-placeholder",
        status: "pending",
        message: "Email sending has been migrated to Azure Communication Services."
      })
    },
    migrationStatus: "pending",
    migrationNotice: "Email integration has been migrated to Azure Communication Services."
  };
}
