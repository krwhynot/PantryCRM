'use client';

import { Feedback, ModuleMenu, FulltextSearch, AvatarDropdown } from './index';

/**
 * Test component to verify that all NextCRM components can be imported correctly
 */
export default function TestImports() {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">NextCRM Components Test</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">ModuleMenu</h2>
        <ModuleMenu />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">FulltextSearch</h2>
        <FulltextSearch placeholder="Search Kitchen Pantry CRM..." />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">AvatarDropdown</h2>
        <AvatarDropdown 
          user={{
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin'
          }}
        />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Feedback</h2>
        <Feedback />
      </div>
    </div>
  );
}