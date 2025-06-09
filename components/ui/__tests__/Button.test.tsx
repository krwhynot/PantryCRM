import { render, screen } from '@testing-library/react';
import { Button } from '../button'; // Adjust import path if necessary

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('maintains minimum 44px touch target height', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    
    // Force compute styles and check height
    const styles = window.getComputedStyle(button);
    const height = button.getBoundingClientRect().height;
    
    // Use actual rendered height instead of CSS height property
    expect(height).toBeGreaterThanOrEqual(44);
  });
});
