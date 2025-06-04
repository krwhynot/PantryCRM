'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TouchTargetTest() {
  const checkTouchTarget = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const isValid = rect.width >= 44 && rect.height >= 44;
    
    console.log(`Element: ${element.tagName}, Size: ${rect.width}x${rect.height}, Valid: ${isValid}`);
    return isValid;
  };

  const testAllElements = () => {
    const interactiveElements = document.querySelectorAll('button, input, select, [role="button"], a');
    let passed = 0;
    let total = interactiveElements.length;

    interactiveElements.forEach((element) => {
      if (checkTouchTarget(element as HTMLElement)) {
        passed++;
      }
    });

    alert(`Touch Target Test: ${passed}/${total} elements passed (${((passed/total)*100).toFixed(1)}%)`);
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>iPad Touch Target Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Test input (should be 48px height)" />
        <Button onClick={testAllElements} className="w-full">
          Run Touch Target Test
        </Button>
        <p className="text-sm text-gray-600">
          All interactive elements should be at least 44px x 44px for iPad optimization.
        </p>
      </CardContent>
    </Card>
  );
}
