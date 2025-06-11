import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, SimpleErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We apologize for the inconvenience/)).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary showError={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details:')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should hide error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary showError={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details:')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should allow retrying after error', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // After retry, the error boundary should reset
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reload page when reload button is clicked', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('should generate unique error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorIdElement = screen.getByText(/Error ID:/);
    expect(errorIdElement).toBeInTheDocument();
    expect(errorIdElement.textContent).toMatch(/Error ID: \w+/);
  });

  it('should log error details to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});

describe('SimpleErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <SimpleErrorBoundary>
        <div>Test content</div>
      </SimpleErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render simple error message when child throws', () => {
    render(
      <SimpleErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SimpleErrorBoundary>
    );

    expect(screen.getByText("This section couldn't load properly")).toBeInTheDocument();
  });

  it('should render custom error message', () => {
    render(
      <SimpleErrorBoundary message="Custom error occurred">
        <ThrowError shouldThrow={true} />
      </SimpleErrorBoundary>
    );

    expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  const TestComponent = ({ text }: { text: string }) => <div>{text}</div>;

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent text="Test content" />);

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const ThrowingComponent = withErrorBoundary(ThrowError);

    render(<ThrowingComponent shouldThrow={true} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = <div>HOC custom error</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, customFallback);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('HOC custom error')).toBeInTheDocument();
  });

  it('should preserve component display name', () => {
    const NamedComponent = ({ text }: { text: string }) => <div>{text}</div>;
    NamedComponent.displayName = 'NamedComponent';

    const WrappedComponent = withErrorBoundary(NamedComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(NamedComponent)');
  });

  it('should handle components without display name', () => {
    const AnonymousComponent = ({ text }: { text: string }) => <div>{text}</div>;

    const WrappedComponent = withErrorBoundary(AnonymousComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(AnonymousComponent)');
  });
});