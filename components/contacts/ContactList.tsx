'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, User, Mail, Phone, Star, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Interface for Contact data structure
 */
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  position?: { label: string };
  organization: { id: string; name: string };
  _count: { interactions: number };
  updatedAt: string;
}

/**
 * Props for ContactList component
 */
interface ContactListProps {
  organizationId?: string; // Filter by organization if provided
  showOrganization?: boolean; // Show organization name in cards
}

/**
 * ContactList component displays a grid of contact cards with search functionality
 * 
 * @param organizationId - Optional ID to filter contacts by organization
 * @param showOrganization - Whether to show organization name in contact cards (default: true)
 */
export function ContactList({ organizationId, showOrganization = true }: ContactListProps): JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  /**
   * Fetch contacts from API with optional search term
   * 
   * @param search - Optional search term to filter contacts
   */
  const fetchContacts = async (search?: string): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (organizationId) params.append('organizationId', organizationId);
      
      const response = await fetch(`/api/contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(debouncedSearch);
  }, [debouncedSearch, organizationId]);

  /**
   * Get initials from first and last name
   * 
   * @param firstName - Contact's first name
   * @param lastName - Contact's last name
   * @returns Two-letter initials string
   */
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>
        <Button className="min-h-[44px] min-w-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(contact.firstName, contact.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      {contact.isPrimary && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {contact.position && (
                      <p className="text-sm text-gray-600 truncate">{contact.position.label}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Organization (if showing) */}
                  {showOrganization && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{contact.organization.name}</span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats and Status */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{contact._count.interactions} interactions</span>
                    </div>
                    <span className="text-xs">
                      {new Date(contact.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Primary Contact Badge */}
                  {contact.isPrimary && (
                    <Badge variant="secondary" className="text-xs">
                      Primary Contact
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && contacts.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No contacts found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first contact'}
          </p>
          <Button className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      )}
    </div>
  );
}
