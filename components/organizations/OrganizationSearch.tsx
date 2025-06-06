'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { PriorityBadge } from '@/components/food-service/PriorityBadge';
import { useDebounce } from 'use-debounce';

interface Organization {
  id: string;
  name: string;
  priority: { key: 'A' | 'B' | 'C' | 'D'; color?: string };
  segment: { key: string };
  distributor: { key: string };
  accountManager: { name: string };
  phone?: string;
  email?: string;
}

interface SearchFilters {
  priority?: string;
  segment?: string;
  distributor?: string;
}

export function OrganizationSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce search query to avoid too many API calls
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  // Perform search when query or filters change
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.append('q', debouncedQuery);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.segment) params.append('segment', filters.segment);
        if (filters.distributor) params.append('distributor', filters.distributor);

        const response = await fetch(`/api/organizations?${params}`);
        const data = await response.json();
        
        if (response.ok) {
          setOrganizations(data.organizations);
        } else {
          console.error('Search failed:', data.error);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, filters]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search organizations or account managers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select 
                value={filters.priority || ''} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value || undefined }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="A">A - High Priority</SelectItem>
                  <SelectItem value="B">B - Medium Priority</SelectItem>
                  <SelectItem value="C">C - Low Priority</SelectItem>
                  <SelectItem value="D">D - Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.segment || ''} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, segment: value || undefined }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Segments</SelectItem>
                  <SelectItem value="Fine Dining">Fine Dining</SelectItem>
                  <SelectItem value="Fast Food">Fast Food</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Catering">Catering</SelectItem>
                  <SelectItem value="Institutional">Institutional</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.distributor || ''} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, distributor: value || undefined }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Distributors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Distributors</SelectItem>
                  <SelectItem value="Sysco">Sysco</SelectItem>
                  <SelectItem value="USF">USF</SelectItem>
                  <SelectItem value="PFG">PFG</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="h-12">
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{org.name}</h3>
                        <PriorityBadge priority={org.priority.key} />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Segment:</strong> {org.segment.key}</p>
                        <p><strong>Distributor:</strong> {org.distributor.key}</p>
                        <p><strong>Account Manager:</strong> {org.accountManager.name}</p>
                        {org.phone && <p><strong>Phone:</strong> {org.phone}</p>}
                        {org.email && <p><strong>Email:</strong> {org.email}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {organizations.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No organizations found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
