import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard header', () => {
  render(<App />);
  const headingElement = screen.getByText(/Stock Analysis Workflow/i);
  expect(headingElement).toBeInTheDocument();
});
