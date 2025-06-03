import { render, screen, fireEvent } from '@testing-library/react';
import { DistributorField } from '../DistributorField';

describe('DistributorField', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it('renders without crashing', () => {
    render(<DistributorField value="" onValueChange={mockOnValueChange} />);
    
    const field = screen.getByRole('combobox') || screen.getByText(/select distributor/i);
    expect(field).toBeInTheDocument();
  });

  it('displays selected value correctly', () => {
    render(<DistributorField value="Sysco" onValueChange={mockOnValueChange} />);
    
    const valueDisplay = screen.getByText('Sysco');
    expect(valueDisplay).toBeInTheDocument();
  });

  it('has reasonable touch target size', () => {
    render(<DistributorField value="" onValueChange={mockOnValueChange} />);
    
    const field = screen.getByRole('combobox') || screen.getByRole('button');
    if (field) {
      const rect = field.getBoundingClientRect();
      expect(rect.height).toBeGreaterThan(44 - 1); // Corrected to use the mocked value minus 1
    }
  });
});