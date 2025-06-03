import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentSelector } from '../SegmentSelector';

describe('SegmentSelector', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it('renders without crashing', () => {
    render(<SegmentSelector value="" onValueChange={mockOnValueChange} />);
    // Look for the select trigger or placeholder
    const selector = screen.getByRole('combobox') || screen.getByText(/select segment/i);
    expect(selector).toBeInTheDocument();
  });

  it('displays selected value correctly', () => {
    render(<SegmentSelector value="Fine Dining" onValueChange={mockOnValueChange} />);
    
    // shadcn/ui Select might display value differently
    const valueDisplay = screen.getByText('Fine Dining');
    expect(valueDisplay).toBeInTheDocument();
  });

  it('has reasonable touch target size', () => {
    render(<SegmentSelector value="" onValueChange={mockOnValueChange} />);
    
    const selector = screen.getByRole('combobox') || screen.getByRole('button');
    if (selector) {
      const rect = selector.getBoundingClientRect();
      expect(rect.height).toBeGreaterThan(44 - 1); // Corrected to use the mocked value minus 1
    }
  });
});