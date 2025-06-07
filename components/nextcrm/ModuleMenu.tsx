'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Building2Icon,
  UsersIcon,
  SettingsIcon,
  HomeIcon,
  ClipboardCheckIcon,
  TrendingUpIcon,
  BarChart3Icon,
  CalendarIcon
} from 'lucide-react';

// Define module types with proper TypeScript interfaces
export interface ModuleItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
}

interface ModuleMenuProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  activeModule?: string;
  onModuleChange?: (moduleId: string) => void;
  modules?: ModuleItem[];
}

/**
 * ModuleMenu component for NextCRM navigation
 * Provides consistent navigation between CRM modules
 */
export function ModuleMenu({
  className,
  orientation = 'vertical',
  showLabels = true,
  activeModule,
  onModuleChange,
  modules
}: ModuleMenuProps) {
  const pathname = usePathname();
  
  // Default food service CRM modules if none provided
  const defaultModules: ModuleItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      description: 'CRM overview and key metrics'
    },
    {
      id: 'organizations',
      name: 'Organizations',
      href: '/organizations',
      icon: Building2Icon,
      description: 'Manage restaurant accounts'
    },
    {
      id: 'contacts',
      name: 'Contacts',
      href: '/contacts',
      icon: UsersIcon,
      description: 'Manage chef and buyer contacts'
    },
    {
      id: 'opportunities',
      name: 'Opportunities',
      href: '/opportunities',
      icon: TrendingUpIcon,
      description: 'Track sales opportunities'
    },
    {
      id: 'calendar',
      name: 'Calendar',
      href: '/calendar',
      icon: CalendarIcon,
      description: 'Schedule and manage appointments'
    },
    {
      id: 'reports',
      name: 'Reports',
      href: '/reports',
      icon: BarChart3Icon,
      description: 'Sales and performance reports'
    },
    {
      id: 'settings',
      name: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
      description: 'System configuration'
    }
  ];

  const menuModules = modules || defaultModules;
  
  // Determine active module from pathname if not explicitly provided
  const currentModule = activeModule || menuModules.find(m => 
    pathname === m.href || pathname.startsWith(`${m.href}/`)
  )?.id || menuModules[0].id;

  const handleModuleClick = (moduleId: string) => {
    if (onModuleChange) {
      onModuleChange(moduleId);
    }
  };

  return (
    <nav 
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-1',
        className
      )}
      aria-label="Main Navigation"
    >
      {menuModules.map((module) => (
        <Link
          key={module.id}
          href={module.disabled ? '#' : module.href}
          onClick={(e) => {
            if (module.disabled) {
              e.preventDefault();
              return;
            }
            handleModuleClick(module.id);
          }}
          className={cn(
            module.disabled && 'pointer-events-none opacity-50'
          )}
        >
          <Button
            variant={currentModule === module.id ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start h-12', // 44px touch target for accessibility
              orientation === 'horizontal' && 'px-3',
              !showLabels && 'aspect-square justify-center',
              currentModule === module.id && 'bg-accent'
            )}
            aria-current={currentModule === module.id ? 'page' : undefined}
          >
            <module.icon className={cn('h-5 w-5', showLabels && 'mr-2')} />
            {showLabels && module.name}
            {module.badge && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {module.badge}
              </span>
            )}
          </Button>
        </Link>
      ))}
    </nav>
  );
}

export default ModuleMenu;