import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import dynamicImport from "next/dynamic";

// Dynamically import the favorites component
const FavoriteOrganizations = dynamicImport(
  () => import('@/components/organizations/FavoriteOrganizations'),
  {
    loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>,
    ssr: false
  }
);

export const metadata: Metadata = {
  title: "Kitchen Pantry CRM - Dashboard",
  description: "Food Service CRM Dashboard for Sales Representatives",
};

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Welcome, {session.user.name}
          </p>
          <a href="/organizations" className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-600/20 min-h-[44px] min-w-[44px] touch-target nav-link-touch">
            Organizations
          </a>
          <a href="/organizations/new" className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20 min-h-[44px] min-w-[44px] touch-target nav-link-touch">
            New Organization
          </a>
          <a href="/settings" className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800/40 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 ring-1 ring-inset ring-gray-500/10 dark:ring-gray-700/30 min-h-[44px] min-w-[44px] touch-target nav-link-touch">
            Settings
          </a>
        </div>
      </div>
      
      {/* Favorite Organizations - Maria's Priority Access */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>}>
          <FavoriteOrganizations maxItems={4} />
        </Suspense>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Priority Level Stats Card */}
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Priority Accounts</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="priority-a p-3 rounded-lg">
              <span className="block text-2xl font-bold">0</span>
              <span>A Priority</span>
            </div>
            <div className="priority-b p-3 rounded-lg">
              <span className="block text-2xl font-bold">0</span>
              <span>B Priority</span>
            </div>
            <div className="priority-c p-3 rounded-lg">
              <span className="block text-2xl font-bold">0</span>
              <span>C Priority</span>
            </div>
            <div className="priority-d p-3 rounded-lg">
              <span className="block text-2xl font-bold">0</span>
              <span>D Priority</span>
            </div>
          </div>
        </div>
        
        {/* Segment Distribution Card */}
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Market Segments</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Fine Dining</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Fast Food</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Healthcare</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Catering</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Institutional</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>No recent activity.</p>
            <p className="text-sm">Start adding organizations and contacts to see your activity here!</p>
          </div>
        </div>
      </div>
    </div>
  );
}