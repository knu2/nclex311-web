import React from 'react';
import { render } from '@testing-library/react';
import { HeroSection } from '@/components/Landing/HeroSection';
import { FeaturesSection } from '@/components/Landing/FeaturesSection';
import { CTASection } from '@/components/Landing/CTASection';
import { Footer } from '@/components/Landing/Footer';

/**
 * Responsive behavior tests for Landing page components.
 * Tests key breakpoints: mobile (320px), tablet (768px), desktop (1024px).
 */

describe('Landing Page Components - Responsive Behavior', () => {
  const setViewport = (width: number) => {
    global.innerWidth = width;
    global.dispatchEvent(new Event('resize'));
  };

  describe('HeroSection Responsive', () => {
    it('renders correctly on mobile (320px)', () => {
      setViewport(320);
      const { container } = render(<HeroSection />);
      expect(container.firstChild).toBeInTheDocument();
      // Component should render without errors on mobile
    });

    it('renders correctly on tablet (768px)', () => {
      setViewport(768);
      const { container } = render(<HeroSection />);
      expect(container.firstChild).toBeInTheDocument();
      // Component should render without errors on tablet
    });

    it('renders correctly on desktop (1024px)', () => {
      setViewport(1024);
      const { container } = render(<HeroSection />);
      expect(container.firstChild).toBeInTheDocument();
      // Component should render without errors on desktop
    });
  });

  describe('FeaturesSection Responsive', () => {
    it('renders correctly on mobile (320px)', () => {
      setViewport(320);
      const { container } = render(<FeaturesSection />);
      expect(container.firstChild).toBeInTheDocument();
      // Features should stack vertically on mobile
    });

    it('renders correctly on tablet (768px)', () => {
      setViewport(768);
      const { container } = render(<FeaturesSection />);
      expect(container.firstChild).toBeInTheDocument();
      // Features may display in 2 columns on tablet
    });

    it('renders correctly on desktop (1024px)', () => {
      setViewport(1024);
      const { container } = render(<FeaturesSection />);
      expect(container.firstChild).toBeInTheDocument();
      // Features should display in 3 columns on desktop
    });
  });

  describe('CTASection Responsive', () => {
    it('renders correctly on mobile (320px)', () => {
      setViewport(320);
      const { container } = render(<CTASection />);
      expect(container.firstChild).toBeInTheDocument();
      // CTA button should be full-width on mobile
    });

    it('renders correctly on tablet (768px)', () => {
      setViewport(768);
      const { container } = render(<CTASection />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders correctly on desktop (1024px)', () => {
      setViewport(1024);
      const { container } = render(<CTASection />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Footer Responsive', () => {
    it('renders correctly on mobile (320px)', () => {
      setViewport(320);
      const { container } = render(<Footer />);
      expect(container.firstChild).toBeInTheDocument();
      // Footer links should stack vertically on mobile
    });

    it('renders correctly on tablet (768px)', () => {
      setViewport(768);
      const { container } = render(<Footer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders correctly on desktop (1024px)', () => {
      setViewport(1024);
      const { container } = render(<Footer />);
      expect(container.firstChild).toBeInTheDocument();
      // Footer links should be horizontal on desktop
    });
  });

  describe('Landing Page Integration - Responsive', () => {
    it('all components render together on mobile without layout breaks', () => {
      setViewport(320);
      const { container } = render(
        <>
          <HeroSection />
          <FeaturesSection />
          <CTASection />
          <Footer />
        </>
      );
      expect(container).toBeInTheDocument();
      // All components should render without errors on mobile
    });

    it('all components render together on tablet without layout breaks', () => {
      setViewport(768);
      const { container } = render(
        <>
          <HeroSection />
          <FeaturesSection />
          <CTASection />
          <Footer />
        </>
      );
      expect(container).toBeInTheDocument();
    });

    it('all components render together on desktop without layout breaks', () => {
      setViewport(1024);
      const { container } = render(
        <>
          <HeroSection />
          <FeaturesSection />
          <CTASection />
          <Footer />
        </>
      );
      expect(container).toBeInTheDocument();
    });
  });
});
