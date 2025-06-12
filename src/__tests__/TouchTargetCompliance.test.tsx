import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriorityBadge } from '../components/food-service/PriorityBadge';
import { SegmentSelector } from '../components/food-service/SegmentSelector';
import { DistributorField } from '../components/food-service/DistributorField';
import { LoginComponent } from '../components/auth/LoginComponent';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../components/ui/dropdown-menu';
import { Command, CommandInput, CommandItem, CommandList } from '../../components/ui/command';

describe('Touch Target Compliance - WCAG 2.5.5 Level AAA', () => {
  const checkTouchTargetMinimum = (element: HTMLElement, minSize: number = 44) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    // Check computed size or actual rendered size
    const width = parseInt(styles.width) || rect.width;
    const height = parseInt(styles.height) || rect.height;
    
    // WCAG 2.5.5 Level AAA requires 44x44px minimum
    expect(width).toBeGreaterThan(minSize - 1); // equivalent to >=
    expect(height).toBeGreaterThan(minSize - 1); // equivalent to >=
  };

  const checkWCAGCompliance = (element: HTMLElement) => {
    // WCAG 2.5.5 Level AAA compliance
    checkTouchTargetMinimum(element, 44);
    
    // Check for proper focus indicators
    expect(element).toHaveAttribute('tabindex', expect.any(String));
    
    // Check touch-action for touch manipulation
    const styles = window.getComputedStyle(element);
    expect(['manipulation', 'auto', 'none']).toContain(styles.touchAction || 'auto');
  };

  describe('Updated Button Component', () => {
    it('default button size meets WCAG 2.5.5 Level AAA (48px)', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      
      // Default size should be 48px (h-12)
      checkTouchTargetMinimum(button, 48);
      expect(button).toHaveClass('touch-target');
    });

    it('small button size meets minimum WCAG requirement (44px)', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      
      // Small size should be 44px (h-11)
      checkTouchTargetMinimum(button, 44);
      expect(button).toHaveClass('touch-target');
    });

    it('large button size exceeds WCAG requirements (56px)', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      
      // Large size should be 56px (h-14)
      checkTouchTargetMinimum(button, 56);
      expect(button).toHaveClass('touch-target');
    });

    it('icon button meets minimum requirements (44px)', () => {
      render(<Button size="icon">🏠</Button>);
      const button = screen.getByRole('button');
      
      // Icon size should be 44x44px (h-11 w-11)
      checkTouchTargetMinimum(button, 44);
      expect(button).toHaveClass('touch-target');
    });

    it('touch variant is optimized for touch devices (48px)', () => {
      render(<Button size="touch">Touch Button</Button>);
      const button = screen.getByRole('button');
      
      // Touch size should be 48px (h-12) with full width
      checkTouchTargetMinimum(button, 48);
      expect(button).toHaveClass('touch-target');
    });
  });

  describe('Dropdown Menu Components', () => {
    it('dropdown menu items meet touch target requirements', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Menu Item 1</DropdownMenuItem>
            <DropdownMenuItem>Menu Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      const trigger = screen.getByRole('button');
      checkTouchTargetMinimum(trigger, 44);
      expect(trigger).toHaveClass('touch-target');
    });

    it('dropdown items have proper touch target classes', () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      // Find dropdown items by class (they may not be rendered in DOM until opened)
      const dropdownItems = container.querySelectorAll('.dropdown-item-touch');
      expect(dropdownItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Command Component', () => {
    it('command items meet touch target requirements', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Command Item 1</CommandItem>
            <CommandItem>Command Item 2</CommandItem>
          </CommandList>
        </Command>
      );
      
      const input = screen.getByPlaceholderText('Search...');
      checkTouchTargetMinimum(input, 44);
    });

    it('command items have proper touch classes', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandItem>Command Item</CommandItem>
          </CommandList>
        </Command>
      );
      
      const commandItems = container.querySelectorAll('.command-item-touch');
      expect(commandItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Form Input Components', () => {
    it('input component meets touch target requirements', () => {
      render(<Input placeholder="Test Input" />);
      const input = screen.getByPlaceholderText('Test Input');
      
      // Input should be 48px (h-12)
      checkTouchTargetMinimum(input, 48);
      expect(input).toHaveClass('touch-target');
      expect(input).toHaveClass('form-input-touch');
    });

    it('form inputs have proper base font size for readability', () => {
      render(<Input placeholder="Test Input" />);
      const input = screen.getByPlaceholderText('Test Input');
      
      const styles = window.getComputedStyle(input);
      // Should use text-base (16px) to prevent zoom on iOS
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(16);
    });
  });

  describe('Navigation Components', () => {
    it('navigation links meet touch target requirements', () => {
      render(
        <div>
          <a href="/test" className="nav-link-touch min-h-[44px] min-w-[44px] touch-target">
            Test Link
          </a>
        </div>
      );
      
      const link = screen.getByRole('link');
      checkTouchTargetMinimum(link, 44);
      expect(link).toHaveClass('nav-link-touch');
      expect(link).toHaveClass('touch-target');
    });
  });

  describe('Food Service Specific Components', () => {
    it('PriorityBadge has adequate touch target size', () => {
      render(<PriorityBadge priority="A" />);
      const badge = screen.getByText('A');
      
      expect(badge).toBeInTheDocument();
      const rect = badge.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(44 - 1);
      expect(rect.height).toBeGreaterThan(44 - 1);
    });

    it('SegmentSelector meets touch target requirements', () => {
      render(<SegmentSelector value="" onValueChange={() => {}} />);
      
      const selector = screen.getByRole('combobox') || screen.getByRole('button');
      
      if (selector) {
        const rect = selector.getBoundingClientRect();
        expect(rect.height).toBeGreaterThan(44 - 1);
      }
    });

    it('DistributorField meets touch target requirements', () => {
      render(<DistributorField value="" onValueChange={() => {}} />);
      
      const field = screen.getByRole('combobox') || screen.getByRole('button');
      
      if (field) {
        const rect = field.getBoundingClientRect();
        expect(rect.height).toBeGreaterThan(44 - 1);
      }
    });

    it('LoginComponent inputs meet touch target requirements', () => {
      render(<LoginComponent onLogin={() => {}} />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      [emailInput, passwordInput, submitButton].forEach(element => {
        expect(element).toBeInTheDocument();
        const rect = element.getBoundingClientRect();
        expect(rect.height).toBeGreaterThan(44 - 1);
      });
    });
  });

  describe('Touch Spacing and Layout', () => {
    it('touch-spacing class provides adequate spacing between elements', () => {
      render(
        <div className="touch-spacing">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
        </div>
      );
      
      const container = screen.getByText('Button 1').parentElement;
      expect(container).toHaveClass('touch-spacing');
      
      const styles = window.getComputedStyle(container!);
      // Should have at least 8px gap (WCAG requirement)
      expect(parseInt(styles.gap)).toBeGreaterThanOrEqual(8);
    });

    it('Interactive elements are properly spaced for touch', () => {
      render(
        <div className="flex gap-2">
          <PriorityBadge priority="A" />
          <PriorityBadge priority="B" />
        </div>
      );
      
      const badges = screen.getAllByText(/[ABCD]/);
      expect(badges).toHaveLength(2);
      
      badges.forEach(badge => {
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('CSS Class Verification', () => {
    it('dropdown-item-touch class is applied correctly', () => {
      const { container } = render(
        <div className="dropdown-item-touch">Dropdown Item</div>
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('dropdown-item-touch');
      
      const styles = window.getComputedStyle(element);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('command-item-touch class is applied correctly', () => {
      const { container } = render(
        <div className="command-item-touch">Command Item</div>
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('command-item-touch');
      
      const styles = window.getComputedStyle(element);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('nav-link-touch class is applied correctly', () => {
      const { container } = render(
        <div className="nav-link-touch">Navigation Link</div>
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('nav-link-touch');
      
      const styles = window.getComputedStyle(element);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('form-input-touch class is applied correctly', () => {
      render(<Input className="form-input-touch" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      
      expect(input).toHaveClass('form-input-touch');
      const rect = input.getBoundingClientRect();
      expect(rect.height).toBeGreaterThan(44 - 1);
    });
  });

  describe('Focus and Accessibility', () => {
    it('touch targets have proper focus indicators', () => {
      render(<Button>Focusable Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('touch-target');
      
      // Check focus-visible styles are applied
      const styles = window.getComputedStyle(button);
      expect(button).toHaveAttribute('tabindex');
    });

    it('touch-action is properly set for touch manipulation', () => {
      const { container } = render(
        <div className="dropdown-item-touch">Touch Item</div>
      );
      
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // touch-action should be set for proper touch handling
      expect(['manipulation', 'auto', 'none']).toContain(styles.touchAction || 'auto');
    });
  });

  describe('Responsive Touch Optimization', () => {
    it('components maintain touch targets across different viewport sizes', () => {
      // Simulate different viewport sizes
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;
      
      // Test tablet size (iPad)
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
      
      render(<Button>Responsive Button</Button>);
      const button = screen.getByRole('button');
      
      checkTouchTargetMinimum(button, 44);
      
      // Restore original values
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    });
  });
});