'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  Building2Icon,
  SettingsIcon,
  UsersIcon,
  PanelRightIcon,
  LayoutDashboardIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2Icon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export function FoodServiceNavigation() {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col gap-2 py-2">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="w-full"
        >
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-12", // iPad-optimized touch target height
              pathname === item.href ? "bg-accent" : ""
            )}
          >
            <item.icon className="mr-2 h-5 w-5" />
            {item.name}
          </Button>
        </Link>
      ))}
    </div>
  );
}
