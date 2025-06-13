'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  TrendingUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { PriorityBadge } from '@/components/food-service/PriorityBadge';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  priority: { key: 'A' | 'B' | 'C' | 'D'; color?: string };
  segment: { key: string; label?: string };
  distributor: { key: string; label?: string };
  accountManager: { name: string };
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  contactCount?: number;
  lastContactDate?: string;
  lastContactDays?: number;
  nextFollowUp?: string;
  estimatedRevenue?: number;
  isFavorite?: boolean;
  recentInteractions?: Array<{
    type: string;
    date: string;
    notes?: string;
  }>;
}

interface EnhancedOrganizationCardProps {
  organization: Organization;
  onToggleFavorite?: (id: string) => void;
  onQuickCall?: (phone: string) => void;
  onQuickEmail?: (email: string) => void;
  onClick?: () => void;
  className?: string;
  showActions?: boolean;
}

export const EnhancedOrganizationCard: React.FC<EnhancedOrganizationCardProps> = ({
  organization,
  onToggleFavorite,
  onQuickCall,
  onQuickEmail,
  onClick,
  className,
  showActions = true
}) => {
  const {
    id,
    name,
    priority,
    segment,
    distributor,
    accountManager,
    phone,
    email,
    address,
    city,
    state,
    contactCount,
    lastContactDays,
    nextFollowUp,
    estimatedRevenue,
    isFavorite,
    recentInteractions
  } = organization;

  const getStatusVariant = (days?: number) => {
    if (!days) return 'secondary';
    if (days <= 7) return 'default';
    if (days <= 30) return 'secondary';
    if (days <= 90) return 'outline';
    return 'destructive';
  };

  const formatLastContactDays = (days?: number) => {
    if (!days) return 'Never';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return null;
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue.toLocaleString()}`;
  };

  const isOverdue = nextFollowUp && new Date(nextFollowUp) < new Date();
  const isDueToday = nextFollowUp && 
    new Date(nextFollowUp).toDateString() === new Date().toDateString();

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-200 cursor-pointer touch-friendly",
        onClick && "hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold truncate flex-1 min-w-0">
                  {name}
                </h3>
                <PriorityBadge priority={priority.key} />
                {isFavorite && (
                  <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              
              {/* Location */}
              {(city || state) && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{[city, state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Last Contact Badge */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant={getStatusVariant(lastContactDays)} className="text-xs">
              {formatLastContactDays(lastContactDays)}
            </Badge>
            {estimatedRevenue && (
              <span className="text-xs text-gray-500 font-medium">
                {formatRevenue(estimatedRevenue)}
              </span>
            )}
          </div>
        </div>

        {/* Organization Details Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-500">Segment:</span>
            <div className="font-medium truncate">
              {segment.label || segment.key}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Distributor:</span>
            <div className="font-medium truncate">
              {distributor.label || distributor.key}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Account Mgr:</span>
            <div className="font-medium truncate">{accountManager.name}</div>
          </div>
          <div>
            <span className="text-gray-500">Contacts:</span>
            <div className="font-medium">
              {contactCount || 0} contact{contactCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Follow-up Alert */}
        {nextFollowUp && (
          <Alert 
            className={cn(
              "mb-3",
              isOverdue 
                ? "border-red-200 bg-red-50" 
                : isDueToday 
                ? "border-orange-200 bg-orange-50"
                : "border-blue-200 bg-blue-50"
            )}
          >
            <AlertCircle className={cn(
              "h-4 w-4",
              isOverdue ? "text-red-600" : isDueToday ? "text-orange-600" : "text-blue-600"
            )} />
            <AlertDescription className="text-sm">
              <span className="font-medium">
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : 'Follow-up: '}
              </span>
              {new Date(nextFollowUp).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Interactions Preview */}
        {recentInteractions && recentInteractions.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Recent Activity:</div>
            <div className="space-y-1">
              {recentInteractions.slice(0, 2).map((interaction, idx) => (
                <div key={idx} className="text-xs bg-gray-50 rounded px-2 py-1">
                  <span className="font-medium">{interaction.type}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(interaction.date).toLocaleDateString()}
                  </span>
                  {interaction.notes && (
                    <div className="text-gray-600 truncate mt-1">
                      {interaction.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 touch-target"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickCall?.(phone);
                  }}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
              {email && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 touch-target"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickEmail?.(email);
                  }}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 touch-target"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(id);
                  }}
                >
                  <Star 
                    className={cn(
                      "h-4 w-4",
                      isFavorite 
                        ? "text-yellow-500 fill-yellow-500" 
                        : "text-gray-400"
                    )} 
                  />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 touch-target"
                onClick={(e) => {
                  e.stopPropagation();
                  // Open organization details
                  window.open(`/organizations/${id}`, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedOrganizationCard;