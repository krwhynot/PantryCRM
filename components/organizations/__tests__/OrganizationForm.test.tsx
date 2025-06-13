import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationForm } from '../OrganizationForm';

// Mock the server action
jest.mock('@/actions/organizations/create-organization', () => ({
  createOrganizationAction: jest.fn().mockResolvedValue({ success: true, data: { id: '123' } })
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock useActionState hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn()
}));

describe('OrganizationForm', () => {
  const mockOnSuccess = jest.fn();
  const mockUseActionState = require('react').useActionState;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock return for useActionState
    mockUseActionState.mockReturnValue([
      null, // initial state
      jest.fn(), // formAction
      false  // isPending
    ]);
  });

  describe('Form Rendering', () => {
    it('renders all required form fields', () => {
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      // Check for required fields
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/market segment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/distributor/i)).toBeInTheDocument();
      
      // Check for submit button
      expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument();
    });

    it('renders optional form fields', () => {
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      // Check for optional fields
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual revenue/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    });

    it('renders with initial data when provided', () => {
      const initialData = {
        name: 'Test Restaurant',
        type: 'Customer',
        priority: 'A',
        email: 'test@restaurant.com'
      };
      
      render(<OrganizationForm onSuccess={mockOnSuccess} initialData={initialData} />);
      
      expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@restaurant.com')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty organization name', async () => {
      const user = userEvent.setup();
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /create organization/i });
      await user.click(submitButton);
      
      // The validation should prevent submission without required fields
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      
      // Form should not submit with invalid email
      const submitButton = screen.getByRole('button', { name: /create organization/i });
      await user.click(submitButton);
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('validates website URL format', async () => {
      const user = userEvent.setup();
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const websiteInput = screen.getByLabelText(/website/i);
      await user.type(websiteInput, 'not-a-url');
      
      // Form should not submit with invalid URL
      const submitButton = screen.getByRole('button', { name: /create organization/i });
      await user.click(submitButton);
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('allows user to fill out all form fields', async () => {
      const user = userEvent.setup();
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      // Fill out form fields
      await user.type(screen.getByLabelText(/organization name/i), 'Test Restaurant');
      await user.selectOptions(screen.getByLabelText(/organization type/i), 'Customer');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'A');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/email/i), 'test@restaurant.com');
      
      // Verify values are entered
      expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@restaurant.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-123-4567')).toBeInTheDocument();
    });

    it('handles select dropdown changes', async () => {
      const user = userEvent.setup();
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'B');
      
      expect(screen.getByDisplayValue('B')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', () => {
      // Mock pending state
      mockUseActionState.mockReturnValue([
        null,
        jest.fn(),
        true  // isPending = true
      ]);
      
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onSuccess callback when form submits successfully', async () => {
      // Mock successful submission
      mockUseActionState.mockReturnValue([
        { success: true, data: { id: '123' } },
        jest.fn(),
        false
      ]);
      
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('displays error message when submission fails', () => {
      // Mock error state
      mockUseActionState.mockReturnValue([
        { success: false, errors: { name: ['Organization name is required'] } },
        jest.fn(),
        false
      ]);
      
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText(/organization name is required/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and accessibility attributes', () => {
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      // Check for proper labels
      const nameInput = screen.getByLabelText(/organization name/i);
      expect(nameInput).toHaveAttribute('required');
      
      // Check form has proper role
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('maintains proper tab order', () => {
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const nameInput = screen.getByLabelText(/organization name/i);
      const typeSelect = screen.getByLabelText(/organization type/i);
      
      expect(nameInput.tabIndex).toBeLessThanOrEqual(typeSelect.tabIndex);
    });
  });

  describe('Touch Target Compliance', () => {
    it('form inputs meet minimum touch target size', () => {
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const nameInput = screen.getByLabelText(/organization name/i);
      const computedStyle = window.getComputedStyle(nameInput);
      const rect = nameInput.getBoundingClientRect();
      
      // Should meet 44px minimum touch target
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('submit button meets touch target requirements', () => {
      render(<OrganizationForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /create organization/i });
      const rect = submitButton.getBoundingClientRect();
      
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.width).toBeGreaterThanOrEqual(44);
    });
  });
});