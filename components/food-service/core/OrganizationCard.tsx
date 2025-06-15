/**
 * Food Service Organization Card Component
 * 
 * Optimized card component for displaying restaurant and foodservice
 * organizations with industry-specific information and touch-friendly design.
 */

'use client';

import React, { memo } from 'react';
import { MapPin, Phone, Mail, Calendar, DollarSign, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OrganizationSummary, OrganizationPriority, OrganizationSegment } from '@/types/crm';

interface OrganizationCardProps {
  organization: OrganizationSummary;
  onClick?: (organization: OrganizationSummary) => void;
  onQuickCall?: (organization: OrganizationSummary) => void;
  onQuickVisit?: (organization: OrganizationSummary) => void;
  showQuickActions?: boolean;
  compact?: boolean;
  className?: string;
}

// Food service segment icons and colors
const SEGMENT_CONFIG = {
  FINE_DINING: { icon: '🍷', color: 'bg-purple-100 text-purple-800', label: 'Fine Dining' },
  FAST_FOOD: { icon: '🍔', color: 'bg-red-100 text-red-800', label: 'Fast Food' },
  CASUAL_DINING: { icon: '🍽️', color: 'bg-blue-100 text-blue-800', label: 'Casual Dining' },
  CATERING: { icon: '🎪', color: 'bg-green-100 text-green-800', label: 'Catering' },
  INSTITUTIONAL: { icon: '🏫', color: 'bg-gray-100 text-gray-800', label: 'Institutional' },
  HEALTHCARE: { icon: '🏥', color: 'bg-teal-100 text-teal-800', label: 'Healthcare' },
  EDUCATION: { icon: '🎓', color: 'bg-indigo-100 text-indigo-800', label: 'Education' },
  CORPORATE: { icon: '🏢', color: 'bg-orange-100 text-orange-800', label: 'Corporate' }
} as const;

// Priority colors matching food service importance
const PRIORITY_CONFIG = {
  A: { color: 'bg-green-500', label: 'Priority A', description: 'Key Account' },
  B: { color: 'bg-yellow-500', label: 'Priority B', description: 'Important' },
  C: { color: 'bg-orange-500', label: 'Priority C', description: 'Standard' },
  D: { color: 'bg-red-500', label: 'Priority D', description: 'Low Priority' }
} as const;

// Status indicators
const STATUS_CONFIG = {
  ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
  INACTIVE: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
  LEAD: { color: 'bg-blue-100 text-blue-800', label: 'Lead' }
} as const;

const OrganizationCard = memo(function OrganizationCard({
  organization,
  onClick,
  onQuickCall,
  onQuickVisit,
  showQuickActions = true,
  compact = false,
  className
}: OrganizationCardProps) {
  const segmentConfig = SEGMENT_CONFIG[organization.segment as OrganizationSegment] || SEGMENT_CONFIG.CASUAL_DINING;
  const priorityConfig = PRIORITY_CONFIG[organization.priority as OrganizationPriority] || PRIORITY_CONFIG.C;
  const statusConfig = STATUS_CONFIG[organization.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE;

  const handleCardClick = () => {
    // Add haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(organization);
  };

  const handleQuickAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    action();
  };

  const formatRevenue = (revenue: number | null) => {
    if (!revenue) return 'Not specified';
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue.toLocaleString()}`;
  };

  const formatLastContact = (date: Date | null) => {
    if (!date) return 'Never contacted';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:border-gray-300 active:shadow-lg cursor-pointer',
        'p-4 space-y-3',
        compact ? 'min-h-[120px]' : 'min-h-[160px]',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`View ${organization.name} details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Priority Indicator */}
          <div className="flex-shrink-0 mt-1">
            <div 
              className={cn('w-3 h-3 rounded-full', priorityConfig.color)}
              title={`${priorityConfig.label} - ${priorityConfig.description}`}
            />
          </div>

          {/* Organization Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {organization.name}
            </h3>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className={cn('text-xs', segmentConfig.color)}>
                <span className="mr-1">{segmentConfig.icon}</span>
                {segmentConfig.label}
              </Badge>
              
              <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Revenue Display */}
        {organization.estimatedRevenue && (
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-medium text-gray-900">
              {formatRevenue(organization.estimatedRevenue)}
            </div>
            <div className="text-xs text-gray-500">Est. Revenue</div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {organization.primaryContactName && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{organization.primaryContactName}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatLastContact(organization.lastContactDate)}</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleQuickAction(e, () => onQuickCall?.(organization))}
              className="min-h-[36px] px-3 text-xs"
              aria-label={`Call ${organization.name}`}
            >
              <Phone className="w-3 h-3 mr-1" />
              Call
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleQuickAction(e, () => onQuickVisit?.(organization))}
              className="min-h-[36px] px-3 text-xs"
              aria-label={`Schedule visit to ${organization.name}`}
            >
              <MapPin className="w-3 h-3 mr-1" />
              Visit
            </Button>
          </div>

          {/* Favorite Star */}
          <button
            onClick={(e) => handleQuickAction(e, () => {
              // Toggle favorite functionality
              console.log('Toggle favorite:', organization.id);
            })}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={`Add ${organization.name} to favorites`}
          >
            <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
          </button>
        </div>
      )}

      {/* Mobile-specific touch feedback */}
      <div className="sr-only">
        Priority: {priorityConfig.label}, 
        Segment: {segmentConfig.label}, 
        Status: {statusConfig.label}
        {organization.estimatedRevenue && `, Revenue: ${formatRevenue(organization.estimatedRevenue)}`}
      </div>
    </div>
  );
});

export default OrganizationCard;