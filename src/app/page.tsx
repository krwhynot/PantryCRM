import Link from 'next/link'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Kitchen Pantry CRM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/organizations"
            className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <h3 className="font-medium text-blue-900">Organizations</h3>
            <p className="text-sm text-blue-700">Manage restaurants and food service businesses</p>
          </Link>
          <Link
            href="/contacts"
            className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <h3 className="font-medium text-green-900">Contacts</h3>
            <p className="text-sm text-green-700">Manage contacts and relationships</p>
          </Link>
          <Link
            href="/dashboard"
            className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <h3 className="font-medium text-purple-900">Dashboard</h3>
            <p className="text-sm text-purple-700">View analytics and reports</p>
          </Link>
        </div>
      </div>
      
      <Dashboard />
    </div>
  )
}