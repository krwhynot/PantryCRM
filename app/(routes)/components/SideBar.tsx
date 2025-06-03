import { getModules } from "@/actions/get-modules";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dynamic from "next/dynamic";

// Import ModuleMenu dynamically to handle any potential next-intl dependencies
const ModuleMenu = dynamic(() => import("./ModuleMenu"));

/**
 * Main sidebar navigation component for Kitchen Pantry CRM
 * Optimized for iPad use by sales representatives
 */
const SideBar = async ({ build }: { build: number }) => {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const modules = await getModules();
  if (!modules) return null;

  // Create a simplified English dictionary directly
  const dict = {
    sidebar: {
      dashboard: "Dashboard",
      documents: "Documents",
      settings: "Settings",
      crm: "CRM",
      organizations: "Organizations",
      contacts: "Contacts",
      opportunities: "Opportunities",
      interactions: "Interactions",
      logout: "Logout",
      administration: "Administration",
      emails: "Emails",
      settings_description: "System settings",
      crm_description: "Customer Relationship Management",
      reports: "Reports",
      reports_description: "Business analytics and reports",
    }
  };

  return <ModuleMenu modules={modules} dict={dict} build={build} />;
};

export default SideBar;