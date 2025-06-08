import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  position?: { label: string };
  isPrimary?: boolean;
}

interface ContactListProps {
  organizationId: string;
  onContactSelect?: (contact: Contact) => void;
  selectedContactId?: string;
}

const ContactList: React.FC<ContactListProps> = ({
  organizationId,
  onContactSelect,
  selectedContactId,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/contacts?organizationId=${organizationId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Contact[] = await response.json();
        setContacts(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      fetchContacts();
    }
  }, [organizationId]);

  if (isLoading) {
    return (
      <Card className="w-full h-96 flex flex-col">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-96 flex flex-col justify-center items-center text-red-500">
        <CardHeader>
          <CardTitle>Error Loading Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was an error fetching contacts: {error}</p>
          <p>Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="w-full h-96 flex flex-col justify-center items-center text-gray-500">
        <CardHeader>
          <CardTitle>No Contacts Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are no contacts for this organization yet.</p>
          <p>Add a new contact to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-96 flex flex-col">
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-full">
          {contacts.map((contact) => (
            <React.Fragment key={contact.id}>
              <div
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                  ${selectedContactId === contact.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                onClick={() => onContactSelect && onContactSelect(contact)}
                style={{ minHeight: '44px' }} // Enforce minimum touch target
              >
                <div className="flex-grow">
                  <div className="flex items-center text-lg font-semibold">
                    {contact.firstName} {contact.lastName}
                    {contact.isPrimary && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contact.title} {contact.position?.label && `(${contact.position.label})`}
                  </p>
                  {contact.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                  )}
                </div>
              </div>
              <Separator />
            </React.Fragment>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ContactList;
