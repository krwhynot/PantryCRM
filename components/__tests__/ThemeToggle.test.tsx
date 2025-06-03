import { render, screen, fireEvent } from '@testing-library/react';
// ThemeProvider from next-themes is globally mocked in jest.setup.js
// We will mock useTheme locally to spy on setTheme
import { useTheme } from 'next-themes'; 
import { ThemeToggle } from '../ThemeToggle';

// Mock useTheme specifically for this test file to control setTheme
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  ...jest.requireActual('next-themes'), // Retain other exports
  useTheme: () => ({
    theme: 'light', // Initial theme state for the test
    setTheme: mockSetTheme,
    themes: ['light', 'dark'],
  }),
}));

describe('ThemeToggle Component', () => {
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
    
    // Simulate theme change for next click if needed by updating mock return value
    (useTheme as jest.Mock).mockReturnValueOnce({ theme: 'dark', setTheme: mockSetTheme, themes: ['light', 'dark'] });

    fireEvent.click(toggle);
    // After another click: should call setTheme to toggle to 'light'
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
