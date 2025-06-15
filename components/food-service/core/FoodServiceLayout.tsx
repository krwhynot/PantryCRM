/**
 * Food Service CRM Layout Component
 * 
 * iPad-optimized layout designed for food service sales representatives.
 * Features large touch targets, landscape-first design, and quick access
 * to common food service workflows.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Building2, MessageSquare, Target, BarChart3, Settings, Search, Plus } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from '@/lib/utils';
import type { User } from '@prisma/client';

interface FoodServiceLayoutProps {
  children: React.ReactNode;
  user?: User;
  className?: string;
}

// Food Service specific navigation structure
const FOOD_SERVICE_NAVIGATION = [
  {
    id: 'organizations',
    label: 'Accounts',
    icon: Building2,
    href: '/crm/organizations',
    description: 'Restaurant & foodservice accounts',
    color: 'bg-blue-500',
    priority: 'high' as const
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    href: '/crm/contacts',
    description: 'Decision makers & key contacts',
    color: 'bg-green-500',
    priority: 'high' as const
  },
  {
    id: 'interactions',
    label: 'Activity',
    icon: MessageSquare,
    href: '/crm/interactions',
    description: 'Calls, visits, and follow-ups',
    color: 'bg-orange-500',
    priority: 'high' as const
  },
  {
    id: 'opportunities',
    label: 'Pipeline',
    icon: Target,
    href: '/crm/opportunities',
    description: 'Sales opportunities & quotes',
    color: 'bg-purple-500',
    priority: 'high' as const
  },
  {
    id: 'analytics',
    label: 'Reports',
    icon: BarChart3,
    href: '/crm/analytics',
    description: 'Performance & territory analytics',
    color: 'bg-indigo-500',
    priority: 'medium' as const
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/crm/settings',
    description: 'Preferences & configuration',
    color: 'bg-gray-500',
    priority: 'low' as const
  }
];

// Quick action buttons for food service workflows
const QUICK_ACTIONS = [
  {
    id: 'new-interaction',
    label: 'Log Visit',
    icon: Plus,
    action: 'create-interaction',
    color: 'bg-green-600',
    shortcut: 'V'
  },
  {
    id: 'new-opportunity',
    label: 'New Quote',
    icon: Plus,
    action: 'create-opportunity', 
    color: 'bg-blue-600',
    shortcut: 'Q'
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    action: 'global-search',
    color: 'bg-purple-600',
    shortcut: 'S'
  }
];

export default function FoodServiceLayout({ children, user, className }: FoodServiceLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Detect device type and orientation
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      
      setIsMobile(isMobileDevice);
      
      // Auto-collapse sidebar on mobile or small tablets
      if (isMobileDevice) {
        setSidebarOpen(false);
      } else if (isLandscape && window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Handle navigation with touch feedback
  const handleNavigation = (href: string) => {
    // Add haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    router.push(href);
    
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-interaction':
        router.push('/crm/interactions/new');
        break;
      case 'create-opportunity':
        router.push('/crm/opportunities/new');
        break;
      case 'global-search':
        // Focus search input or open search modal
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        break;
    }
    setQuickActionOpen(false);
  };

  // Keyboard shortcuts for iPad users with external keyboards
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            handleQuickAction('create-interaction');
            break;
          case 'q':
            e.preventDefault();
            handleQuickAction('create-opportunity');
            break;
          case 'k':
            e.preventDefault();
            handleQuickAction('global-search');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <div className={cn('min-h-screen bg-gray-50 flex', className)}>
      {/* Sidebar Navigation */}
      <aside 
        className={cn(
          'bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'w-72' : 'w-16',
          isMobile && sidebarOpen && 'fixed inset-y-0 left-0 z-50',
          isMobile && !sidebarOpen && 'hidden'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Pantry CRM</h1>
                <p className="text-sm text-gray-500">Food Service</p>
              </div>
            )}
          </div>
          
          {/* Toggle button for larger screens */}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mt-3 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full flex items-center justify-center"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <div className="w-4 h-0.5 bg-gray-400 transition-transform" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1">
          {FOOD_SERVICE_NAVIGATION.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200',
                  'min-h-[44px]', // Ensure 44px minimum touch target
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
                  !sidebarOpen && 'justify-center'
                )}
                aria-label={sidebarOpen ? undefined : item.label}
                title={!sidebarOpen ? item.description : undefined}
              >
                <div className={cn('p-2 rounded-md', isActive ? 'bg-blue-100' : item.color)}>
                  <Icon className={cn('w-5 h-5', isActive ? 'text-blue-700' : 'text-white')} />
                </div>
                
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        {user && sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 mr-3"
              aria-label="Open sidebar"
            >
              <div className="w-5 h-5 flex flex-col justify-between">
                <div className="w-full h-0.5 bg-gray-600" />
                <div className="w-full h-0.5 bg-gray-600" />
                <div className="w-full h-0.5 bg-gray-600" />
              </div>
            </button>
          )}

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts, contacts, or opportunities..."
                data-search-input
                className={cn(
                  'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg',
                  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'min-h-[44px]', // Touch target
                  'text-sm'
                )}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.action)}
                  className={cn(
                    'p-3 rounded-lg text-white transition-all duration-200',
                    'min-h-[44px] min-w-[44px]', // Touch targets
                    'hover:opacity-90 active:scale-95',
                    action.color
                  )}
                  aria-label={action.label}
                  title={`${action.label} (⌘${action.shortcut})`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </header>

        {/* Content Area with Error Boundary */}
        <div className="flex-1 overflow-auto">
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 mb-4">
                  We're having trouble loading this page. Please try refreshing.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh Page
                </button>
              </div>
            }
            onError={(error) => {
              console.error('Layout error boundary triggered:', error);
            }}
          >
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

// Re-export with display name for debugging
FoodServiceLayout.displayName = 'FoodServiceLayout';