'use client';

import { useState } from 'react';
import { Feedback, ModuleMenu, FulltextSearch, AvatarDropdown } from '@/components/nextcrm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Test page for NextCRM components
 * This page demonstrates all the NextCRM components working together
 */
export default function ComponentsTestPage() {
  const [activeTab, setActiveTab] = useState('module-menu');
  
  // Mock user for AvatarDropdown
  const mockUser = {
    id: '1',
    name: 'Kyle Ramsy',
    email: 'kyle.ramsy@foodservice.com',
    image: null,
    role: 'admin'
  };

  // Mock search results for FulltextSearch
  const handleSearch = async (query: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        title: 'Kaufholds Restaurant',
        description: 'Fine Dining - Chicago',
        type: 'organization',
        url: '/organizations/1'
      },
      {
        id: '2',
        title: 'Frites Street Bistro',
        description: 'Casual Dining - New York',
        type: 'organization',
        url: '/organizations/2'
      },
      {
        id: '3',
        title: 'Chef John Smith',
        description: 'Executive Chef at Better Balance',
        type: 'contact',
        url: '/contacts/3'
      }
    ];
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Feedback submitted successfully');
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">NextCRM Components Test</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates the NextCRM components that have been implemented for the Kitchen Pantry CRM system.
        All components are optimized for iPad compatibility with 44px touch targets.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
              <CardDescription>Food Service CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleMenu orientation="vertical" showLabels={true} />
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kitchen Pantry CRM</CardTitle>
                <CardDescription>Food Service Sales Management</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <FulltextSearch 
                  placeholder="Search organizations, contacts..." 
                  onSearch={handleSearch}
                  searchDelay={300}
                  minChars={2}
                />
                <AvatarDropdown user={mockUser} />
              </div>
            </CardHeader>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="module-menu">ModuleMenu</TabsTrigger>
              <TabsTrigger value="fulltext-search">FulltextSearch</TabsTrigger>
              <TabsTrigger value="avatar-dropdown">AvatarDropdown</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="module-menu" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ModuleMenu Component</CardTitle>
                  <CardDescription>Navigation menu for CRM modules with 44px touch targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Vertical Orientation</h3>
                    <ModuleMenu orientation="vertical" showLabels={true} />
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Horizontal Orientation</h3>
                    <ModuleMenu orientation="horizontal" showLabels={true} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Icon Only</h3>
                    <ModuleMenu orientation="horizontal" showLabels={false} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fulltext-search" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>FulltextSearch Component</CardTitle>
                  <CardDescription>Global search functionality across all CRM entities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <FulltextSearch 
                      placeholder="Search organizations, contacts..." 
                      onSearch={handleSearch}
                      searchDelay={300}
                      minChars={2}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Try searching for "Kaufholds", "Frites", or "Chef"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="avatar-dropdown" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AvatarDropdown Component</CardTitle>
                  <CardDescription>User menu and authentication controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center">
                      <h3 className="text-lg font-medium mb-2">Logged In User</h3>
                      <AvatarDropdown user={mockUser} />
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <h3 className="text-lg font-medium mb-2">No User (Sign In Button)</h3>
                      <AvatarDropdown />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Component</CardTitle>
                  <CardDescription>User feedback collection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <Feedback onSubmit={handleFeedbackSubmit} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="mt-8 p-4 border rounded-md bg-muted/50">
        <h2 className="text-xl font-semibold mb-2">Implementation Notes</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>All components follow shadcn/ui design patterns</li>
          <li>Touch targets are 44px minimum for iPad optimization</li>
          <li>Components use React 18.2.0 hooks and patterns</li>
          <li>TypeScript strict mode is enabled for type safety</li>
          <li>All components support both light and dark modes</li>
        </ul>
        
        <div className="mt-4 flex gap-4">
          <Button onClick={() => toast.success('Components are working correctly!')}>
            Test Toast Notifications
          </Button>
        </div>
      </div>
    </div>
  );
}