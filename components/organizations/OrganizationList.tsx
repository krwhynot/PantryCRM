'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Building2, Users, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce'; // Corrected path

interface Organization {
  id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  priority?: { id: string; label: string; color?: string }; // Updated priority type
  segment?: { id: string; label: string };
  distributor?: { id: string; label: string };
  _count: { contacts: number; interactions: number };
  updatedAt: string;
}

export function OrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchOrganizations = async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/organizations?${params.toString()}`); // Ensure params are stringified
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      } else {
        // Handle non-OK responses, e.g., show a toast or log error
        console.error('Failed to fetch organizations, status:', response.status);
        setOrganizations([]); // Clear organizations on error or set to a default state
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]); // Clear organizations on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(debouncedSearch);
  }, [debouncedSearch]);

  const getPriorityBadgeDetails = (priorityId?: string) => {
    // This mapping should ideally come from a shared config or API
    // Or, the API should return the label and color directly if `priority` is an object
    switch (priorityId) {
      case 'priority-a': return { label: 'A', color: 'bg-red-500 text-white' };
      case 'priority-b': return { label: 'B', color: 'bg-orange-500 text-white' };
      case 'priority-c': return { label: 'C', color: 'bg-yellow-500 text-black' }; // Ensure contrast
      case 'priority-d': return { label: 'D', color: 'bg-gray-500 text-white' };
      default: return { label: 'N/A', color: 'bg-gray-300 text-black' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 min-h-[44px] w-full"
          />
        </div>
        <Button className="min-h-[44px] min-w-[44px] w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Add Organization</span>
        </Button>
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => {
            const priorityDetails = getPriorityBadgeDetails(org.priority?.id);
            return (
              <Card key={org.id} className="hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate" title={org.name}>{org.name}</h3>
                      {(org.city || org.state) && (
                        <p className="text-sm text-gray-500 truncate">
                          {org.city}{org.city && org.state && ', '}{org.state}
                        </p>
                      )}
                    </div>
                    {org.priority && (
                      <Badge variant="outline" className={`${priorityDetails.color} border-none px-2.5 py-0.5 text-xs font-medium rounded-full`}>
                        {priorityDetails.label}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Segment and Distributor */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {org.segment?.label && (
                        <Badge variant="secondary" className="font-normal">{org.segment.label}</Badge>
                      )}
                      {org.distributor?.label && (
                        <Badge variant="outline" className="font-normal">{org.distributor.label}</Badge>
                      )}
                    </div>

                    {/* Phone */}
                    {org.phone && (
                      <p className="text-sm text-gray-600 truncate">{org.phone}</p>
                    )}
                  </div>

                  {/* Stats and Last Updated */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" title={`${org._count.contacts} contacts`}>
                        <Users className="h-3.5 w-3.5" />
                        <span>{org._count.contacts}</span>
                      </div>
                      <div className="flex items-center gap-1" title={`${org._count.interactions} interactions`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{org._count.interactions}</span>
                      </div>
                    </div>
                    <span title={`Last updated: ${new Date(org.updatedAt).toLocaleString()}`}>
                      {new Date(org.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && organizations.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No organizations found</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            {searchTerm ? 'Try adjusting your search terms or clear the search.' : 'Get started by adding your first organization. Click the button below!'}
          </p>
          <Button className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Add New Organization
          </Button>
        </div>
      )}
    </div>
  );
}