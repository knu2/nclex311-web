import React from 'react';
import { render, screen } from '@testing-library/react';
import { CTASection } from '@/components/Landing/CTASection';

describe('CTASection', () => {
  it('renders the CTA heading', () => {
    render(<CTASection />);
    const heading = screen.getByRole('heading', {
      name: /Ready to Get Started\?/i,
      level: 2,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the CTA description text', () => {
    render(<CTASection />);
    expect(
      screen.getByText(
        /Join thousands of nursing students who are preparing for NCLEX success/i
      )
    ).toBeInTheDocument();
  });

  it('renders the Create Free Account button', () => {
    render(<CTASection />);
    const ctaButton = screen.getByRole('link', {
      name: /Create Free Account/i,
    });
    expect(ctaButton).toBeInTheDocument();
  });

  it('CTA button links to signup page', () => {
    render(<CTASection />);
    const ctaButton = screen.getByRole('link', {
      name: /Create Free Account/i,
    });
    expect(ctaButton).toHaveAttribute('href', '/signup');
  });

  it('mentions no credit card required', () => {
    render(<CTASection />);
    expect(screen.getByText(/no credit card required/i)).toBeInTheDocument();
  });
});
