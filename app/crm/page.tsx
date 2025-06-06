import { Dashboard } from '@/src/components/dashboard/Dashboard'

export default function CRMPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Kitchen Pantry CRM</h1>
      <Dashboard organizationCount={25} recentInteractions={12} />
      
      {/* Add your food service components for testing */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-bold mb-2">Organizations</h3>
          <p>Test organization management</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-bold mb-2">Contacts</h3>
          <p>Test contact tracking</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-bold mb-2">Interactions</h3>
          <p>Test interaction logging</p>
        </div>
      </div>
    </div>
  )
}