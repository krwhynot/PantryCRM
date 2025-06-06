import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Users, MessageSquare, TrendingUp, BarChart, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

/**
 * Main sidebar navigation component for Kitchen Pantry CRM
 * Optimized for iPad use by sales representatives
 */
const SideBar = async ({ build }: { build: number }) => {
  const session = await getServerSession(authOptions);
  if (!session) return null;

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

  return (
    <div className="flex h-full flex-col overflow-hidden border-r">
      <div className="flex h-20 items-center justify-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-6 w-6" />
          <span className="">Food Service CRM</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/" === "/" && "bg-muted text-primary"
            )}
            href="/"
          >
            <LayoutDashboard className="h-4 w-4" />
            {dict.sidebar.dashboard}
          </Link>
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/organizations" === "/organizations" && "bg-muted text-primary"
            )}
            href="/organizations"
          >
            <Building2 className="h-4 w-4" />
            {dict.sidebar.organizations}
          </Link>
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/contacts" === "/contacts" && "bg-muted text-primary"
            )}
            href="/contacts"
          >
            <Users className="h-4 w-4" />
            {dict.sidebar.contacts}
          </Link>
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/interactions" === "/interactions" && "bg-muted text-primary"
            )}
            href="/interactions"
          >
            <MessageSquare className="h-4 w-4" />
            {dict.sidebar.interactions}
          </Link>
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/pipeline" === "/pipeline" && "bg-muted text-primary"
            )}
            href="/pipeline"
          >
            <TrendingUp className="h-4 w-4" />
            {dict.sidebar.opportunities}
          </Link>
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/reports" === "/reports" && "bg-muted text-primary"
            )}
            href="/reports"
          >
            <BarChart className="h-4 w-4" />
            {dict.sidebar.reports}
          </Link>
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              "/settings" === "/settings" && "bg-muted text-primary"
            )}
            href="/settings"
          >
            <Settings className="h-4 w-4" />
            {dict.sidebar.settings}
          </Link>
        </nav>
      </div>
      <div className="mt-auto p-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          {dict.sidebar.logout}
        </button>
      </div>
      <div className="border-t p-4 text-xs text-muted-foreground">
        Build: {build}
      </div>
    </div>
  );
};

export default SideBar;