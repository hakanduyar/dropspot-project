import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Navbar from '../Navbar';
import { describe, it, expect } from 'vitest';

describe('Navbar Component', () => {
  it('renders DropSpot logo', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/DropSpot/i)).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });
});