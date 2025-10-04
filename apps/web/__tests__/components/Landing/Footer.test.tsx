import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/Landing/Footer';

describe('Footer', () => {
  it('renders the copyright year and NCLEX 311 branding', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} NCLEX 311`, 'i'))
    ).toBeInTheDocument();
  });

  it('renders all rights reserved text', () => {
    render(<Footer />);
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it('renders the Login link', () => {
    render(<Footer />);
    const loginLink = screen.getByRole('link', { name: /^Login$/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('renders the Sign Up link', () => {
    render(<Footer />);
    const signupLink = screen.getByRole('link', { name: /Sign Up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('renders the NCLEX 311 branding title', () => {
    render(<Footer />);
    const brandingTitle = screen.getByRole('heading', { name: /NCLEX 311/i });
    expect(brandingTitle).toBeInTheDocument();
  });

  it('renders the Ray A. Gapuz Review System tagline', () => {
    render(<Footer />);
    expect(
      screen.getByText(/Based on the Ray A. Gapuz Review System/i)
    ).toBeInTheDocument();
  });
});
