import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

describe('NextCRM Integration Tests', () => {
  it('Button component renders with correct class names', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button', { name: /test button/i });
    
    // Updated to match actual implementation with touch optimizations
    expect(button).toHaveClass(
      'inline-flex', 'items-center', 'justify-center', 'gap-2', 
      'whitespace-nowrap', 'rounded-md', 'text-sm', 'font-medium',
      'bg-primary', 'text-primary-foreground', 'hover:bg-primary/90',
      'h-12', 'px-4', 'py-2', 'button-touch', 'touch-target'
    );
  });

  it('Card component renders with correct class names', () => {
    render(<Card>Test Card</Card>);
    const card = screen.getByText('Test Card');
    expect(card).toHaveClass('rounded-lg border bg-card text-card-foreground shadow-sm');
  });

  it('Tailwind CSS classes are applied', () => {
    render(<div className="text-red-500 bg-blue-200">Styled Div</div>);
    const styledDiv = screen.getByText('Styled Div');
    // These checks are basic and rely on the presence of the class names.
    // A more robust check would involve checking computed styles, but that's beyond simple integration.
    expect(styledDiv).toHaveClass('text-red-500', 'bg-blue-200');
  });
});
