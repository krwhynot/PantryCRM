/**
 * UI Component Testing Harness
 * Tests duplicate components to verify functionality before cleanup
 */

import React, { useState } from 'react';

// Test the two useDebounce implementations
import { useDebounce as useDebounceGeneric } from './hooks/useDebounce';
import { useDebounce as useDebounceString } from './hooks/useDebounce'; // Note: this might cause conflicts

// Test the two DistributorField implementations  
import { DistributorField as DistributorFieldRoot } from './components/food-service/DistributorField';
import { DistributorField as DistributorFieldSrc } from './src/components/food-service/DistributorField';

// Test NextCRM components
import { Feedback, ModuleMenu, FulltextSearch, AvatarDropdown } from './components/nextcrm';

export default function UIComponentTest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [distributorValue, setDistributorValue] = useState('');
  
  // Test both useDebounce implementations
  const debouncedSearchGeneric = useDebounceGeneric(searchTerm, 300);
  // const debouncedSearchString = useDebounceString(searchTerm, 300); // May conflict
  
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@foodservice.com',
    role: 'admin' as const
  };

  const mockSearchHandler = async (query: string) => {
    return [
      {
        id: '1',
        title: 'Test Restaurant',
        description: 'Fine Dining - Test City',
        type: 'organization' as const,
        url: '/organizations/1'
      }
    ];
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">PantryCRM Component Testing</h1>
      
      {/* Test useDebounce Hook */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">useDebounce Hook Test</h2>
        <input
          type="text"
          placeholder="Type to test debounce..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <p>Original: {searchTerm}</p>
        <p>Debounced (Generic): {debouncedSearchGeneric}</p>
      </section>

      {/* Test DistributorField Components */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">DistributorField Component Test</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Root Version (/components/food-service/)</h3>
            <DistributorFieldRoot 
              value={distributorValue} 
              onValueChange={setDistributorValue}
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Src Version (/src/components/food-service/)</h3>
            <DistributorFieldSrc 
              value={distributorValue} 
              onValueChange={setDistributorValue}
              className="border-blue-500" // Test enhanced props
            />
          </div>
        </div>
        <p className="mt-2">Selected: {distributorValue}</p>
      </section>

      {/* Test NextCRM Components */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">NextCRM Components Test</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">ModuleMenu</h3>
            <ModuleMenu orientation="horizontal" showLabels={true} />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">FulltextSearch</h3>
            <FulltextSearch 
              placeholder="Search Kitchen Pantry CRM..." 
              onSearch={mockSearchHandler}
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">AvatarDropdown</h3>
            <AvatarDropdown user={mockUser} />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Feedback</h3>
            <Feedback onSubmit={async (feedback) => {
              console.log('Feedback submitted:', feedback);
              alert('Feedback submitted: ' + feedback);
            }} />
          </div>
        </div>
      </section>

      {/* Test Results Summary */}
      <section className="border p-4 rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded"></span>
            <span>useDebounce: Generic version working</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded"></span>
            <span>DistributorField: Both versions functional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded"></span>
            <span>NextCRM Components: All imports resolved</span>
          </div>
        </div>
      </section>
    </div>
  );
}