# NextCRM Components Integration Guide

## Overview

This guide explains how to integrate the NextCRM core components into the Kitchen Pantry CRM application. All components are built with:

- React 18.2.0 functional components with hooks (not React 19 RC)
- TypeScript strict mode with comprehensive type definitions and Zod validation
- 44px minimum touch targets for iPad Safari compatibility
- shadcn/ui components built on Radix UI primitives
- Error boundaries for component-level error isolation
- Light and dark mode support

## Available Components

| Component | Purpose | Key Features |
|-----------|---------|-------------|
| `ModuleMenu` | Navigation menu for CRM modules | Horizontal/vertical layout, icon support, keyboard navigation |
| `FulltextSearch` | Global search functionality | Debounced input, result grouping, keyboard shortcuts |
| `AvatarDropdown` | User profile and authentication | Theme toggle, notifications, sign-out functionality |
| `Feedback` | User feedback collection | Form validation, API integration |

## Installation

All components are available in the `components/nextcrm` directory and can be imported using:

```typescript
import { 
  ModuleMenu, 
  FulltextSearch, 
  AvatarDropdown, 
  Feedback 
} from '@/components/nextcrm';
```

## Component Usage

### ModuleMenu

The ModuleMenu component provides navigation between different CRM modules.

```typescript
import { ModuleMenu } from '@/components/nextcrm';

// Basic usage
<ModuleMenu />

// With custom orientation and label visibility
<ModuleMenu 
  orientation="vertical" 
  showLabels={true}
/>

// With custom modules (optional)
<ModuleMenu 
  modules={[
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'LayoutDashboard', 
      href: '/dashboard' 
    },
    // Add more modules...
  ]}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout orientation |
| `showLabels` | `boolean` | `true` | Whether to show text labels |
| `modules` | `Module[]` | Food service default modules | Custom module configuration |

### FulltextSearch

The FulltextSearch component provides global search functionality across all CRM entities.

```typescript
import { FulltextSearch } from '@/components/nextcrm';

// Basic usage
<FulltextSearch 
  placeholder="Search organizations, contacts..." 
/>

// With custom search handler
<FulltextSearch 
  placeholder="Search..." 
  onSearch={async (query) => {
    // Custom search implementation
    const results = await searchApi(query);
    return results;
  }}
  searchDelay={300}
  minChars={2}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `onSearch` | `(query: string) => Promise<SearchResult[]>` | Default search handler | Custom search function |
| `searchDelay` | `number` | `300` | Debounce delay in milliseconds |
| `minChars` | `number` | `2` | Minimum characters before search |

### AvatarDropdown

The AvatarDropdown component provides user profile and authentication functionality.

```typescript
import { AvatarDropdown } from '@/components/nextcrm';

// With user (logged in state)
<AvatarDropdown 
  user={{
    id: '1',
    name: 'Kyle Ramsy',
    email: 'kyle.ramsy@example.com',
    image: '/images/avatar.png', // Optional
    role: 'admin'
  }}
/>

// Without user (logged out state)
<AvatarDropdown />

// With custom handlers
<AvatarDropdown 
  user={currentUser}
  onSignOut={handleSignOut}
  onProfileClick={handleProfileClick}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `User \| null` | `null` | Current user information |
| `onSignOut` | `() => void` | Default handler | Custom sign out handler |
| `onProfileClick` | `() => void` | Default handler | Profile click handler |

### Feedback

The Feedback component collects user feedback and submits it to an API endpoint.

```typescript
import { Feedback } from '@/components/nextcrm';

// Basic usage
<Feedback />

// With custom submit handler
<Feedback 
  onSubmit={async (feedback) => {
    // Custom submission logic
    await submitFeedbackToApi(feedback);
  }}
  placeholder="Tell us what you think..."
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSubmit` | `(feedback: string) => Promise<void>` | Default handler | Custom submission handler |
| `placeholder` | `string` | `'Share your feedback...'` | Textarea placeholder |
| `minLength` | `number` | `10` | Minimum feedback length |
| `maxLength` | `number` | `1000` | Maximum feedback length |

## Integration Examples

### Layout Integration

Here's how to integrate all components into your main layout:

```typescript
// app/layout.tsx
import { ModuleMenu, FulltextSearch, AvatarDropdown } from '@/components/nextcrm';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar with ModuleMenu */}
      <div className="w-64 border-r bg-background p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Kitchen Pantry CRM</h1>
        </div>
        <ModuleMenu orientation="vertical" showLabels={true} />
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        {/* Header with search and user menu */}
        <header className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Food Service Sales</h2>
            <div className="flex items-center gap-4">
              <FulltextSearch placeholder="Search organizations, contacts..." />
              <AvatarDropdown user={currentUser} />
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
        
        {/* Footer with feedback */}
        <footer className="border-t bg-muted/30 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Kitchen Pantry CRM
            </p>
            <Feedback />
          </div>
        </footer>
      </div>
    </div>
  );
}
```

### Mobile Responsive Design

All components are designed to be responsive with iPad optimization:

```typescript
// Responsive layout example
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Sidebar - full width on mobile, 1/4 width on desktop */}
  <div className="lg:col-span-1">
    <ModuleMenu 
      orientation={isDesktop ? "vertical" : "horizontal"} 
      showLabels={isDesktop}
    />
  </div>
  
  {/* Main content - full width on mobile, 3/4 width on desktop */}
  <div className="lg:col-span-3">
    {/* Search and user dropdown in header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-2">
        <FulltextSearch placeholder="Search..." />
        <AvatarDropdown user={currentUser} />
      </div>
    </div>
    
    {/* Page content */}
    <div className="mt-6">
      {children}
    </div>
  </div>
</div>
```

## Performance Considerations

- **Code Splitting**: Components can be dynamically imported for better performance
- **Bundle Size**: All components are optimized for minimal bundle size
- **Server Components**: Compatible with Next.js App Router and Server Components
- **Caching**: Implement proper caching for search results

## Accessibility Features

All components are built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation support
- Minimum 44px touch targets
- Color contrast compliance
- Screen reader compatibility

## Customization

### Theme Customization

Components use the shadcn/ui theming system and can be customized via Tailwind:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0070f3',
          // Add more shades...
        },
        // Add more color customizations...
      },
    },
  },
};
```

### Component Customization

For deeper customization, you can extend the components:

```typescript
// components/custom/CustomModuleMenu.tsx
import { ModuleMenu } from '@/components/nextcrm';
import { foodServiceModules } from '@/config/navigation';

export function CustomModuleMenu() {
  return (
    <ModuleMenu 
      modules={foodServiceModules}
      orientation="vertical"
      showLabels={true}
      // Add custom props or styling
      className="bg-primary/10 rounded-lg p-2"
    />
  );
}
```

## Testing

All components include comprehensive test coverage:

```typescript
// Example test for ModuleMenu
import { render, screen } from '@testing-library/react';
import { ModuleMenu } from '@/components/nextcrm';

describe('ModuleMenu', () => {
  it('renders all navigation items', () => {
    render(<ModuleMenu />);
    
    // Check that default modules are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    // Add more assertions...
  });
  
  // Add more tests...
});
```

## Troubleshooting

### Common Issues

1. **Component styling conflicts**
   - Solution: Ensure shadcn/ui is properly configured

2. **Search functionality not working**
   - Solution: Check API endpoints and implement proper error handling

3. **ModuleMenu links not working**
   - Solution: Verify Next.js route configuration and href values

4. **AvatarDropdown authentication issues**
   - Solution: Check NextAuth.js configuration and session handling

## Conclusion

By following this integration guide, you can successfully incorporate the NextCRM components into the Kitchen Pantry CRM project, ensuring a consistent user experience with optimal performance on both desktop and iPad devices.