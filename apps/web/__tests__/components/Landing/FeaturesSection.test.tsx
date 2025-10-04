import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeaturesSection } from '@/components/Landing/FeaturesSection';

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />);
    const heading = screen.getByRole('heading', {
      name: /Everything You Need to Succeed/i,
      level: 2,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders all four feature cards', () => {
    render(<FeaturesSection />);

    // Check for all feature titles
    expect(
      screen.getByRole('heading', { name: /144 Free Concepts/i, level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Interactive Quizzes/i, level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Track Your Progress/i, level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Based on Ray A. Gapuz Review System/i,
        level: 3,
      })
    ).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText(/Access the first 4 chapters completely free/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Practice with instant feedback and detailed rationales/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Monitor your completion status/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Learn from a proven methodology trusted by thousands/i)
    ).toBeInTheDocument();
  });

  it('renders the intro text', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(
        /Start learning immediately with our comprehensive platform/i
      )
    ).toBeInTheDocument();
  });
});
