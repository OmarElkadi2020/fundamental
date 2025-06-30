import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard header', () => {
  render(<App />);
  const header = screen.getByText(/Stock Analysis Workflow/i);
  expect(header).toBeInTheDocument();
});
