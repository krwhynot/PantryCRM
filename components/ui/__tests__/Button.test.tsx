import { render, screen } from '@testing-library/react';
import { Button } from '../button'; // Adjust import path if necessary

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('maintains minimum 44px touch target height', () => {
    const { container } = render(<Button>iPad Touch Target</Button>);
    const button = container.firstChild as HTMLElement;
    const styles = window.getComputedStyle(button);
    const height = parseFloat(styles.height);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});
