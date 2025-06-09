import { prismadb } from "@/lib/prisma";

/**
 * Gets all enabled system modules
 * Updated as part of Task 3 (Critical Dependency Fixes) to use hardcoded modules
 * since there is no direct equivalent in the current schema
 */
export const getModules = async () => {
  // Return hardcoded modules that are enabled in the Food Service CRM
  // This is a temporary solution until a proper module management system is implemented
  const data = [
    {
      id: "module-dashboard",
      name: "Dashboard",
      slug: "dashboard",
      icon: "layout-dashboard",
      position: 1,
      enabled: true,
      isCore: true
    },
    {
      id: "module-organizations",
      name: "Organizations",
      slug: "organizations",
      icon: "building",
      position: 2,
      enabled: true,
      isCore: true
    },
    {
      id: "module-contacts",
      name: "Contacts",
      slug: "contacts",
      icon: "users",
      position: 3,
      enabled: true,
      isCore: true
    },
    {
      id: "module-opportunities",
      name: "Opportunities",
      slug: "opportunities",
      icon: "target",
      position: 4,
      enabled: true,
      isCore: true
    },
    {
      id: "module-interactions",
      name: "Interactions",
      slug: "interactions",
      icon: "message-square",
      position: 5,
      enabled: true,
      isCore: true
    },
    {
      id: "module-documents",
      name: "Documents",
      slug: "documents",
      icon: "file",
      position: 6,
      enabled: true,
      isCore: true
    },
    {
      id: "module-settings",
      name: "Settings",
      slug: "settings",
      icon: "settings",
      position: 7,
      enabled: true,
      isCore: true
    }
  ];
  
  return data;
};
