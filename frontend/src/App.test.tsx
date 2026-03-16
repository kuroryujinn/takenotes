import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages', () => function MockedHomePage() {
  return <h1>TakeNotes</h1>;
});

test('renders TakeNotes heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /takenotes/i });
  expect(heading).toBeInTheDocument();
});
