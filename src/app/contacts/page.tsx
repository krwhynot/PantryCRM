import { Suspense } from 'react'
import { ContactList } from '@/components/contacts/ContactList'
import { ContactForm } from '@/components/contacts/ContactForm'

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Contact Management
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Add New Contact
            </h2>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded"></div>}>
              <ContactForm />
            </Suspense>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Contact List
            </h2>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded"></div>}>
              <ContactList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}