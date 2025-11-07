import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DropCard from '../DropCard';
import { describe, it, expect } from 'vitest';

const mockDrop = {
  id: 1,
  title: 'Test Drop',
  description: 'Test Description',
  total_stock: 100,
  available_stock: 50,
  waitlist_count: 10,
  claim_window_start: new Date().toISOString(),
  claim_window_end: new Date(Date.now() + 86400000).toISOString(),
};

describe('DropCard Component', () => {
  it('renders drop title', () => {
    render(
      <BrowserRouter>
        <DropCard drop={mockDrop} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Drop')).toBeInTheDocument();
  });

  it('displays stock information', () => {
    render(
      <BrowserRouter>
        <DropCard drop={mockDrop} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/50/i)).toBeInTheDocument();
  });
});