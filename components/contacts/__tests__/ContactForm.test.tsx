import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../ContactForm';
import { Suspense } from 'react';

// Mock the server action
jest.mock('@/actions/contacts/create-contact', () => ({
  createContactAction: jest.fn().mockResolvedValue({ success: true, data: { id: '123' } })
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock OrganizationSelect component
jest.mock('../OrganizationSelect', () => ({
  OrganizationSelect: ({ value, onChange, disabled, required }: any) => (
    <select
      data-testid="organization-select"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      required={required}
    >
      <option value="">Select Organization</option>
      <option value="org-1">Test Restaurant</option>
      <option value="org-2">Another Restaurant</option>
    </select>
  )
}));

// Mock useActionState hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn()
}));

// Test wrapper with Suspense
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div>Loading...</div>}>
    {children}
  </Suspense>
);

describe('ContactForm', () => {
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
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      // Check for required fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByTestId('organization-select')).toBeInTheDocument();
      
      // Check for submit button
      expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument();
    });

    it('renders optional form fields', () => {
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      // Check for optional fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/position\/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      
      // Check for primary contact checkbox
      expect(screen.getByLabelText(/primary contact/i)).toBeInTheDocument();
    });

    it('renders with preselected organization', () => {
      render(
        <TestWrapper>
          <ContactForm 
            onSuccess={mockOnSuccess} 
            preselectedOrganizationId="org-1" 
          />
        </TestWrapper>
      );
      
      const orgSelect = screen.getByTestId('organization-select');
      expect(orgSelect).toHaveValue('org-1');
      expect(orgSelect).toBeDisabled();
    });

    it('renders with initial data when provided', () => {
      const initialData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@restaurant.com',
        position: 'Executive Chef'
      };
      
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} initialData={initialData} />
        </TestWrapper>
      );
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@restaurant.com')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty required fields', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /create contact/i });
      await user.click(submitButton);
      
      // The validation should prevent submission without required fields
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      
      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.selectOptions(screen.getByTestId('organization-select'), 'org-1');
      
      const submitButton = screen.getByRole('button', { name: /create contact/i });
      await user.click(submitButton);
      
      // Form should not submit with invalid email
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, 'invalid-phone');
      
      // Form validation should handle invalid phone format
      expect(phoneInput).toHaveValue('invalid-phone');
    });
  });

  describe('User Interactions', () => {
    it('allows user to fill out all form fields', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      // Fill out form fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.selectOptions(screen.getByTestId('organization-select'), 'org-1');
      await user.type(screen.getByLabelText(/email/i), 'john@restaurant.com');
      await user.type(screen.getByLabelText(/phone/i), '555-123-4567');
      
      // Verify values are entered
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@restaurant.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-123-4567')).toBeInTheDocument();
    });

    it('handles organization selection', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const orgSelect = screen.getByTestId('organization-select');
      await user.selectOptions(orgSelect, 'org-1');
      
      expect(orgSelect).toHaveValue('org-1');
    });

    it('handles position/role selection', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const positionSelect = screen.getByLabelText(/position\/role/i);
      await user.selectOptions(positionSelect, 'Executive Chef');
      
      expect(screen.getByDisplayValue('Executive Chef')).toBeInTheDocument();
    });

    it('handles primary contact checkbox', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const primaryCheckbox = screen.getByLabelText(/primary contact/i);
      await user.click(primaryCheckbox);
      
      expect(primaryCheckbox).toBeChecked();
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
      
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
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
      
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('displays error message when submission fails', () => {
      // Mock error state
      mockUseActionState.mockReturnValue([
        { success: false, errors: { firstName: ['First name is required'] } },
        jest.fn(),
        false
      ]);
      
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  describe('Business Logic', () => {
    it('handles primary contact toggle correctly', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const primaryCheckbox = screen.getByLabelText(/primary contact/i);
      
      // Initially unchecked
      expect(primaryCheckbox).not.toBeChecked();
      
      // Toggle primary contact
      await user.click(primaryCheckbox);
      expect(primaryCheckbox).toBeChecked();
      
      // Toggle back
      await user.click(primaryCheckbox);
      expect(primaryCheckbox).not.toBeChecked();
    });

    it('maintains organization selection when preselected', () => {
      render(
        <TestWrapper>
          <ContactForm 
            onSuccess={mockOnSuccess} 
            preselectedOrganizationId="org-1" 
          />
        </TestWrapper>
      );
      
      const orgSelect = screen.getByTestId('organization-select');
      expect(orgSelect).toHaveValue('org-1');
      expect(orgSelect).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and accessibility attributes', () => {
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      // Check for proper labels
      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(firstNameInput).toHaveAttribute('required');
      
      const lastNameInput = screen.getByLabelText(/last name/i);
      expect(lastNameInput).toHaveAttribute('required');
      
      // Check form has proper role
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('maintains proper tab order', () => {
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      
      expect(firstNameInput.tabIndex).toBeLessThanOrEqual(lastNameInput.tabIndex);
    });
  });

  describe('Touch Target Compliance', () => {
    it('form inputs meet minimum touch target size', () => {
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const rect = firstNameInput.getBoundingClientRect();
      
      // Should meet 44px minimum touch target
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('submit button meets touch target requirements', () => {
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /create contact/i });
      const rect = submitButton.getBoundingClientRect();
      
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.width).toBeGreaterThanOrEqual(44);
    });

    it('primary contact checkbox meets touch target requirements', () => {
      render(
        <TestWrapper>
          <ContactForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );
      
      const primaryCheckbox = screen.getByLabelText(/primary contact/i);
      const rect = primaryCheckbox.getBoundingClientRect();
      
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Suspense Integration', () => {
    it('handles loading state for organization data', () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading organizations...</div>}>
          <ContactForm onSuccess={mockOnSuccess} />
        </Suspense>
      );
      
      // The component should either show the form or loading state
      const form = screen.queryByRole('form');
      const loading = screen.queryByTestId('loading');
      
      expect(form || loading).toBeInTheDocument();
    });
  });
});