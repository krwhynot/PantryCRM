"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { LoadingComponent } from '@/components/LoadingComponent';

// Dynamically import heavy components
const Dashboard = dynamic(
  () => import('@/src/components/dashboard/Dashboard').then(mod => ({ default: mod.Dashboard })),
  {
    loading: () => <LoadingComponent />,
    ssr: false,
  }
);

const QuickInteractionEntry = dynamic(
  () => import('@/components/interactions/QuickInteractionEntry'),
  {
    loading: () => <div className="h-32 animate-pulse bg-gray-200 rounded"></div>,
    ssr: false,
  }
);

export default function CRMPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Kitchen Pantry CRM</h1>
      
      {/* Primary Feature: Quick Interaction Entry */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-32 animate-pulse bg-gray-200 rounded"></div>}>
          <QuickInteractionEntry onSuccess={() => {
            // Refresh dashboard metrics or show success notification
            window.location.reload(); // Simple approach for now
          }} />
        </Suspense>
      </div>
      
      <Suspense fallback={<LoadingComponent />}>
        <Dashboard 
          organizationCount={3} 
          recentInteractions={[
          {
            id: "1",
            organizationName: "Bistro Nouveau",
            type: "Call",
            date: "2025-06-08",
            userName: "Kyle Ramsy"
          },
          {
            id: "2",
            organizationName: "Healthy Eats Cafe",
            type: "In Person",
            date: "2025-06-07",
            userName: "Kyle Ramsy"
          },
          {
            id: "3",
            organizationName: "City Hospital Cafeteria",
            type: "Demo",
            date: "2025-06-05",
            userName: "Kyle Ramsy"
          }
        ]} 
        />
      </Suspense>
      
      {/* Navigation Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/organizations" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <h3 className="font-bold mb-2">Organizations</h3>
          <p>Manage restaurant accounts and priorities</p>
        </a>
        
        <a href="/contacts" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <h3 className="font-bold mb-2">Contacts</h3>
          <p>Track decision makers and relationships</p>
        </a>
        
        <a href="/reports" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <h3 className="font-bold mb-2">Reports</h3>
          <p>View sales pipeline and activity</p>
        </a>
      </div>
    </div>
  )
}