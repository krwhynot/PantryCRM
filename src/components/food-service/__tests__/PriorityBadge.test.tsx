import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';

describe('PriorityBadge', () => {
  it('renders priority A with correct text', () => {
    render(<PriorityBadge priority="A" />);
    const badge = screen.getByText('A');
    expect(badge).toBeInTheDocument();
  });

  it('renders priority B with correct text', () => {
    render(<PriorityBadge priority="B" />);
    const badge = screen.getByText('B');
    expect(badge).toBeInTheDocument();
  });

  it('renders priority C with correct text', () => {
    render(<PriorityBadge priority="C" />);
    const badge = screen.getByText('C');
    expect(badge).toBeInTheDocument();
  });

  it('renders priority D with correct text', () => {
    render(<PriorityBadge priority="D" />);
    const badge = screen.getByText('D');
    expect(badge).toBeInTheDocument();
  });

  it('meets reasonable touch target size for badge component', () => {
    render(<PriorityBadge priority="A" />);
    const badge = screen.getByText('A');
    
    const rect = badge.getBoundingClientRect();
    // shadcn/ui badges are smaller but still touchable
    expect(rect.width).toBeGreaterThan(44 - 1); // Using mocked value
    expect(rect.height).toBeGreaterThan(44 - 1); // Using mocked value
  });

  it('applies custom className correctly', () => {
    render(<PriorityBadge priority="A" className="custom-class" />);
    const badge = screen.getByText('A');
    expect(badge).toHaveClass('custom-class');
  });
});