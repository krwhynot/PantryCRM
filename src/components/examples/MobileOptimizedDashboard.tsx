'use client';

import { useState } from 'react';
import { useSwipeable } from '@/hooks/useSwipeable';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import PullToRefresh from '@/components/ui/PullToRefresh';
import SwipeableCard from '@/components/ui/SwipeableCard';
import { SyncStatus } from '@/components/NetworkStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Example implementation showing all mobile UX enhancements
export default function MobileOptimizedDashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const tabs = [
    { id: 'organizations', label: 'Organizations', icon: '🏢' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'interactions', label: 'Interactions', icon: '💬' },
    { id: 'opportunities', label: 'Opportunities', icon: '💰' }
  ];

  // Swipe navigation between tabs
  const swipeRef = useSwipeable({
    onSwipeLeft: () => {
      if (currentTab < tabs.length - 1) {
        setCurrentTab(currentTab + 1);
      }
    },
    onSwipeRight: () => {
      if (currentTab > 0) {
        setCurrentTab(currentTab - 1);
      }
    }
  }, {
    threshold: 50,
    velocity: 0.3
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLastSync(new Date());
    setIsRefreshing(false);
  };

  const handleDeleteOrganization = (id: string) => {
    console.log('Delete organization:', id);
    // Implement delete logic
  };

  const handleEditOrganization = (id: string) => {
    console.log('Edit organization:', id);
    // Implement edit logic
  };

  const handleCallOrganization = (id: string) => {
    console.log('Call organization:', id);
    // Implement call logic
  };

  const sampleOrganizations = [
    {
      id: '1',
      name: 'Gourmet Bistro',
      type: 'FINE_DINING',
      priority: 'A',
      revenue: 125000,
      contact: 'chef@gourmetbistro.com'
    },
    {
      id: '2',
      name: 'Quick Eats Chain',
      type: 'FAST_FOOD',
      priority: 'B',
      revenue: 89000,
      contact: 'manager@quickeats.com'
    },
    {
      id: '3',
      name: 'Family Restaurant',
      type: 'CASUAL_DINING',
      priority: 'A',
      revenue: 156000,
      contact: 'owner@familyrest.com'
    }
  ];

  return (
    <div className="mobile-dashboard min-h-screen bg-gray-50">
      {/* Header with sync status */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <SyncStatus 
            isSyncing={isRefreshing}
            lastSyncTime={lastSync}
            pendingCount={isOnline ? 0 : 3}
          />
        </div>
        
        {/* Connection indicator */}
        {isSlowConnection && (
          <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            ⚠️ Slow connection - Features may load slowly
          </div>
        )}
      </div>

      {/* Tab navigation with touch-friendly targets */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(index)}
              className={`flex-1 min-w-20 px-4 py-3 text-center touch-target transition-colors ${
                currentTab === index
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="text-lg mb-1">{tab.icon}</div>
              <div className="text-xs font-medium">{tab.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Swipeable tab content with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div ref={swipeRef} className="tab-content p-4">
          {currentTab === 0 && (
            <div className="organizations-tab">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
                <Button size="sm" className="touch-target">
                  + Add New
                </Button>
              </div>

              <div className="space-y-3">
                {sampleOrganizations.map((org) => (
                  <SwipeableCard
                    key={org.id}
                    leftActions={[
                      {
                        icon: '📞',
                        label: 'Call',
                        action: () => handleCallOrganization(org.id),
                        color: 'blue'
                      },
                      {
                        icon: '✏️',
                        label: 'Edit',
                        action: () => handleEditOrganization(org.id),
                        color: 'green'
                      }
                    ]}
                    rightActions={[
                      {
                        icon: '🗑️',
                        label: 'Delete',
                        action: () => handleDeleteOrganization(org.id),
                        color: 'red'
                      }
                    ]}
                    className="touch-card"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          org.priority === 'A' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {org.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{org.type.replace('_', ' ')}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-medium">
                          ${org.revenue.toLocaleString()}
                        </span>
                        <span className="text-gray-500">{org.contact}</span>
                      </div>
                    </CardContent>
                  </SwipeableCard>
                ))}
              </div>

              {/* Load more button with proper touch target */}
              <div className="mt-6 text-center">
                <Button variant="outline" className="touch-target w-full">
                  Load More Organizations
                </Button>
              </div>
            </div>
          )}

          {currentTab === 1 && (
            <div className="contacts-tab">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacts</h2>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-gray-600">Contact management interface would go here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Swipe left/right to navigate between tabs
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {currentTab === 2 && (
            <div className="interactions-tab">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interactions</h2>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-gray-600">Interaction tracking interface would go here</p>
                </CardContent>
              </Card>
            </div>
          )}

          {currentTab === 3 && (
            <div className="opportunities-tab">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Opportunities</h2>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <p className="text-gray-600">Sales opportunities interface would go here</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Tab indicator dots */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 rounded-full px-4 py-2">
        <div className="flex space-x-2">
          {tabs.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentTab === index ? 'bg-white' : 'bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating action button with proper touch target */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 touch-target flex items-center justify-center">
        <span className="text-2xl">+</span>
      </button>
    </div>
  );
}