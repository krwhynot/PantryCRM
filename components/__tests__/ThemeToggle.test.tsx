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

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('toggles theme when clicked', () => {
    render(<ThemeToggle />); // ThemeProvider is globally mocked or not strictly needed if useTheme is well-mocked
    
    const toggle = screen.getByRole('button');
    // Initial state: mockSetTheme has not been called yet
    // Depending on ThemeToggle's initial render logic, theme might be 'light' from mock
    // No direct DOM check needed if we trust useTheme mock and ThemeToggle's behavior
    
    fireEvent.click(toggle);
    // After click: should call setTheme to toggle to 'dark'
    // The actual theme value might cycle based on current theme, let's assume it tries to set 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    
    fireEvent.click(toggle);
    // After another click: should call setTheme again (the exact value depends on component logic)
    expect(mockSetTheme).toHaveBeenCalledTimes(2);
  });
});
