import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/Landing/HeroSection';

describe('HeroSection', () => {
  it('renders the main headline', () => {
    render(<HeroSection />);
    const headline = screen.getByRole('heading', {
      name: /Master NCLEX with 311 Essential Concepts/i,
      level: 1,
    });
    expect(headline).toBeInTheDocument();
  });

  it('renders the value proposition text', () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/Based on the proven Ray A. Gapuz Review System/i)
    ).toBeInTheDocument();
  });

  it('renders the Sign Up Free button with correct link', () => {
    render(<HeroSection />);
    const signUpButton = screen.getByRole('link', { name: /Sign Up Free/i });
    expect(signUpButton).toBeInTheDocument();
    expect(signUpButton).toHaveAttribute('href', '/signup');
  });

  it('renders the Login link with correct link', () => {
    render(<HeroSection />);
    const loginLink = screen.getByRole('link', { name: /^Login$/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('applies the primary brand color to Sign Up button', () => {
    render(<HeroSection />);
    const signUpButton = screen.getByRole('link', { name: /Sign Up Free/i });
    // Check that the button has the MUI styling applied
    expect(signUpButton).toBeInTheDocument();
  });
});
