// Mock implementation for recharts
const React = require('react');

const mockComponent = (displayName) => {
  const MockComponent = (props) => {
    return React.createElement('div', {
      'data-testid': displayName.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1),
      ...props
    }, props.children);
  };
  MockComponent.displayName = displayName;
  return MockComponent;
};

module.exports = {
  ResponsiveContainer: mockComponent('ResponsiveContainer'),
  BarChart: mockComponent('BarChart'),
  AreaChart: mockComponent('AreaChart'),
  LineChart: mockComponent('LineChart'),
  PieChart: mockComponent('PieChart'),
  Bar: mockComponent('Bar'),
  Area: mockComponent('Area'),
  Line: mockComponent('Line'),
  Pie: mockComponent('Pie'),
  XAxis: mockComponent('XAxis'),
  YAxis: mockComponent('YAxis'),
  CartesianGrid: mockComponent('CartesianGrid'),
  Tooltip: mockComponent('Tooltip'),
  Legend: mockComponent('Legend'),
  Cell: mockComponent('Cell')
};