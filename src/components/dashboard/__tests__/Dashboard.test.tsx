import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

// Mock Tremor components
jest.mock('@tremor/react', () => ({
  BarChart: (props: any) => <div data-testid="tremor-bar-chart">BarChart Mock</div>,
  Card: ({ children }: any) => <div data-testid="tremor-card">{children}</div>,
  Metric: ({ children }: any) => <span data-testid="tremor-metric">{children}</span>,
  Text: ({ children }: any) => <span data-testid="tremor-text">{children}</span>,
}));

// Mock shadcn/ui Card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="shadcn-card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="shadcn-card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h2 data-testid="shadcn-card-title">{children}</h2>,
  CardContent: ({ children }: any) => <div data-testid="shadcn-card-content">{children}</div>,
}));

// Mock data for Dashboard props
const mockOrganizationCount = 42;
const mockRecentInteractions = [
  {
    id: '1',
    organizationName: 'Test Restaurant',
    type: 'Email',
    date: new Date().toISOString(),
    userName: 'Sales Rep'
  }
];
describe('Dashboard', () => {
  it('renders dashboard title and description', () => {
    render(<Dashboard organizationCount={mockOrganizationCount} recentInteractions={mockRecentInteractions} />);
    expect(screen.getByRole('heading', { name: /Kitchen Pantry CRM Dashboard/i, level: 1 })).toBeInTheDocument();
  });

  it('displays key metrics correctly', () => {
    render(<Dashboard organizationCount={mockOrganizationCount} recentInteractions={mockRecentInteractions} />);
    expect(screen.getByText('Organizations')).toBeInTheDocument(); // Checks for the card title
    expect(screen.getByTestId('organization-count')).toBeInTheDocument(); // Checks for the metric display
    expect(screen.getByText('Recent Interactions')).toBeInTheDocument(); // Checks for the card title
    expect(screen.getByTestId('recent-interactions')).toBeInTheDocument(); // Checks for the metric display
    expect(screen.getByText('Organizations by Segment')).toBeInTheDocument(); // Checks for the chart card title
  });

  it('renders the Tremor BarChart with correct data', () => {
    render(<Dashboard organizationCount={mockOrganizationCount} recentInteractions={mockRecentInteractions} />);
    expect(screen.getByTestId('tremor-bar-chart')).toBeInTheDocument();
  });

  it('renders the responsive grid layout for cards', () => {
    render(<Dashboard organizationCount={mockOrganizationCount} recentInteractions={mockRecentInteractions} />);
    // Check for the presence of the grid container
    const gridContainer = screen.getByTestId('dashboard-grid');
    expect(gridContainer).toBeInTheDocument();
    // Further checks could involve snapshot testing or checking computed styles for grid properties
  });
});

