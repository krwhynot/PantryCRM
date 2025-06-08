import { Dashboard } from '@/src/components/dashboard/Dashboard'
import QuickInteractionEntry from '@/components/interactions/QuickInteractionEntry'

export default function CRMPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Kitchen Pantry CRM</h1>
      
      {/* Primary Feature: Quick Interaction Entry */}
      <div className="mb-8">
        <QuickInteractionEntry onSuccess={() => {
          // Refresh dashboard metrics or show success notification
          window.location.reload(); // Simple approach for now
        }} />
      </div>
      
      <Dashboard organizationCount={25} recentInteractions={12} />
      
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