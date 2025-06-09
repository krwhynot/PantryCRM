import { prismadb } from "@/lib/prisma";

/**
 * Gets account settings for invoicing
 * Updated as part of Task 3 (Critical Dependency Fixes) to use Setting model as proxy
 * This is a temporary implementation until proper account settings are implemented
 */
export async function getAccountSettings() {
  // Get organization settings from the Setting model
  const settings = await prismadb.setting.findMany({
    where: {
      category: "OrganizationSettings",
      active: true
    }
  });

  // Create a placeholder account settings object
  const accountSettings = {
    id: "default-account",
    companyName: "Food Service CRM",
    companyEmail: "contact@foodservicecrm.com",
    companyPhone: "+1 (555) 123-4567",
    companyAddress: "123 Main Street, Suite 100",
    companyCity: "Chicago",
    companyState: "IL",
    companyZip: "60601",
    companyCountry: "USA",
    companyLogo: "/logo.png",
    taxRate: 8.5,
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    fiscalYearStart: "01/01",
    updatedAt: new Date()
  };

  // If we have actual settings, override the defaults
  if (settings && settings.length > 0) {
    settings.forEach(setting => {
      if (setting.key && setting.metadata) {
        try {
          const value = JSON.parse(setting.metadata);
          // @ts-ignore - Dynamic property assignment
          accountSettings[setting.key] = value;
        } catch (e) {
          console.error(`Error parsing metadata for setting ${setting.key}:`, e);
        }
      }
    });
  }

  return accountSettings;
}
