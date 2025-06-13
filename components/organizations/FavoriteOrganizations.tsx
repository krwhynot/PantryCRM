'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Plus, ArrowRight } from 'lucide-react';
import { EnhancedOrganizationCard } from './EnhancedOrganizationCard';
import { cn } from '@/lib/utils';

interface FavoriteOrganization {
  id: string;
  name: string;
  priority: { key: 'A' | 'B' | 'C' | 'D'; color?: string };
  segment: { key: string; label?: string };
  distributor: { key: string; label?: string };
  accountManager: { name: string };
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  contactCount?: number;
  lastContactDays?: number;
  nextFollowUp?: string;
  estimatedRevenue?: number;
  isFavorite: true;
}

interface FavoriteOrganizationsProps {
  className?: string;
  maxItems?: number;
  showAddButton?: boolean;
  onViewAll?: () => void;
}

export const FavoriteOrganizations: React.FC<FavoriteOrganizationsProps> = ({
  className,
  maxItems = 6,
  showAddButton = true,
  onViewAll
}) => {
  const [favorites, setFavorites] = useState<FavoriteOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorite organizations
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/organizations/favorites');
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.organizations || []);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleToggleFavorite = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/favorite`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove from favorites list since it was unfavorited
        setFavorites(prev => prev.filter(org => org.id !== organizationId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleQuickCall = (phone: string) => {
    // Use tel: protocol to initiate call on mobile devices
    window.open(`tel:${phone}`, '_self');
  };

  const handleQuickEmail = (email: string) => {
    // Use mailto: protocol to open default email client
    window.open(`mailto:${email}`, '_self');
  };

  const handleOrganizationClick = (organizationId: string) => {
    // Navigate to organization details
    window.location.href = `/organizations/${organizationId}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Your Priority Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Your Priority Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-500 mb-4">
              Star organizations to add them to your priority list for quick access.
            </p>
            {showAddButton && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/organizations'}
                className="touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                Browse Organizations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedFavorites = favorites.slice(0, maxItems);
  const hasMore = favorites.length > maxItems;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Your Priority Accounts
            <span className="text-sm font-normal text-gray-500">
              ({favorites.length})
            </span>
          </CardTitle>
          
          {(hasMore || onViewAll) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll || (() => window.location.href = '/organizations?favorites=true')}
              className="text-sm touch-target"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {displayedFavorites.map((organization) => (
            <EnhancedOrganizationCard
              key={organization.id}
              organization={organization}
              onToggleFavorite={handleToggleFavorite}
              onQuickCall={handleQuickCall}
              onQuickEmail={handleQuickEmail}
              onClick={() => handleOrganizationClick(organization.id)}
              className="hover:shadow-sm"
            />
          ))}
        </div>

        {/* Quick Actions Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasMore && `+${favorites.length - maxItems} more favorites`}
          </div>
          
          <div className="flex gap-2">
            {showAddButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/organizations'}
                className="touch-target"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add More
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteOrganizations;