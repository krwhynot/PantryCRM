import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

// Mock useTheme specifically for this test file to control setTheme
const mockSetTheme = jest.fn();

// Mock next-themes module
jest.mock('next-themes', () => ({
  __esModule: true,
  useTheme: () => ({
    theme: 'light', // Initial theme state for the test
    setTheme: mockSetTheme,
    themes: ['light', 'dark'],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock shadcn/ui dropdown components to make them simple for testing
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => 
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>,
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders toggle button with correct accessibility', () => {
    render(<ThemeToggle />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('displays theme options and calls setTheme', () => {
    render(<ThemeToggle />);
    
    // Check that theme options are rendered (with our simplified mock)
    const darkOption = screen.getByText('Dark');
    const lightOption = screen.getByText('Light');
    const systemOption = screen.getByText('System');
    
    expect(darkOption).toBeInTheDocument();
    expect(lightOption).toBeInTheDocument();
    expect(systemOption).toBeInTheDocument();
    
    // Test clicking each option
    fireEvent.click(darkOption);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    
    fireEvent.click(lightOption);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
    
    fireEvent.click(systemOption);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
