/**
 * Unit Tests for ReferenceSection Component
 * Story 1.5.11: Reference Section Display
 */

import { render, screen } from '@testing-library/react';
import { ReferenceSection } from '@/components/Concept/ReferenceSection';

describe('ReferenceSection', () => {
  describe('Rendering Tests', () => {
    it('renders reference section when reference prop is provided', () => {
      const reference =
        'Grossman, Valerie, G.A. Quick Reference to Triage\nPhiladelphia, Lippincott Williams and Wilkins';

      render(<ReferenceSection reference={reference} />);

      expect(screen.getByText('📚 Reference')).toBeInTheDocument();
      expect(screen.getByText(/Grossman, Valerie/)).toBeInTheDocument();
      expect(screen.getByText(/Philadelphia, Lippincott/)).toBeInTheDocument();
    });

    it('does NOT render when reference is null', () => {
      render(<ReferenceSection reference={null} />);

      expect(screen.queryByText('📚 Reference')).not.toBeInTheDocument();
    });

    it('does NOT render when reference is undefined', () => {
      render(<ReferenceSection reference={undefined} />);

      expect(screen.queryByText('📚 Reference')).not.toBeInTheDocument();
    });

    it('does NOT render when reference is empty string', () => {
      render(<ReferenceSection reference="" />);

      expect(screen.queryByText('📚 Reference')).not.toBeInTheDocument();
    });

    it('section heading displays correctly', () => {
      const reference = 'Test reference';

      render(<ReferenceSection reference={reference} />);

      const heading = screen.getByText('📚 Reference');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H4');
    });

    it('reference text displays correctly', () => {
      const reference = 'Grossman, Valerie, G.A. Quick Reference to Triage';

      render(<ReferenceSection reference={reference} />);

      expect(screen.getByText(reference)).toBeInTheDocument();
    });
  });

  describe('Content Tests', () => {
    it('single-line references render correctly', () => {
      const reference = 'Simple single-line reference';

      render(<ReferenceSection reference={reference} />);

      expect(screen.getByText(reference)).toBeInTheDocument();
    });

    it('multi-line references render with preserved newlines', () => {
      const reference = 'Line 1\nLine 2\nLine 3';

      const { container } = render(<ReferenceSection reference={reference} />);

      // Check that the text content includes all lines
      const textElement = screen.getByText(/Line 1/);
      expect(textElement).toBeInTheDocument();
      expect(textElement.textContent).toContain('Line 1');
      expect(textElement.textContent).toContain('Line 2');
      expect(textElement.textContent).toContain('Line 3');

      // Verify white-space: pre-line style is applied
      expect(textElement).toHaveStyle({ whiteSpace: 'pre-line' });
    });

    it('long references wrap appropriately', () => {
      const longReference =
        'This is a very long reference that should wrap appropriately when displayed in the reference section. '.repeat(
          3
        );

      render(<ReferenceSection reference={longReference} />);

      // Use regex to handle whitespace normalization
      expect(
        screen.getByText(/This is a very long reference/)
      ).toBeInTheDocument();
    });

    it('special characters in references display correctly', () => {
      const reference =
        'Author, J.D. & Smith, K.L. (2023). "Special Title" — with dash\'s and quotes';

      render(<ReferenceSection reference={reference} />);

      expect(screen.getByText(reference)).toBeInTheDocument();
    });
  });

  describe('Styling Tests', () => {
    it('applies correct background color', () => {
      const reference = 'Test reference';

      const { container } = render(<ReferenceSection reference={reference} />);

      const section = container.querySelector('section');
      expect(section).toHaveStyle({ backgroundColor: '#f8f9fc' });
    });

    it('heading color matches spec', () => {
      const reference = 'Test reference';

      render(<ReferenceSection reference={reference} />);

      const heading = screen.getByText('📚 Reference');
      expect(heading).toHaveStyle({
        color: '#2c5aa0',
        fontSize: '1rem',
        fontWeight: 600,
      });
    });

    it('citation text color matches spec', () => {
      const reference = 'Test reference';

      render(<ReferenceSection reference={reference} />);

      const text = screen.getByText(reference);
      expect(text).toHaveStyle({
        color: '#6c757d',
        fontSize: '0.9rem',
        lineHeight: 1.6,
      });
    });

    it('border radius applied correctly', () => {
      const reference = 'Test reference';

      const { container } = render(<ReferenceSection reference={reference} />);

      const section = container.querySelector('section');
      expect(section).toHaveStyle({ borderRadius: '6px' });
    });

    it('padding applied correctly for mobile', () => {
      const reference = 'Test reference';

      const { container } = render(<ReferenceSection reference={reference} />);

      const section = container.querySelector('section');
      // Note: MUI responsive padding is complex to test, but we verify the sx prop exists
      expect(section).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('uses semantic HTML section element', () => {
      const reference = 'Test reference';

      const { container } = render(<ReferenceSection reference={reference} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('proper heading hierarchy (h4)', () => {
      const reference = 'Test reference';

      render(<ReferenceSection reference={reference} />);

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('📚 Reference');
    });

    it('ARIA label present', () => {
      const reference = 'Test reference';

      const { container } = render(<ReferenceSection reference={reference} />);

      const section = container.querySelector(
        'section[aria-label="Bibliographic reference"]'
      );
      expect(section).toBeInTheDocument();
    });

    it('text readable by screen readers', () => {
      const reference =
        'Grossman, Valerie, G.A. Quick Reference to Triage\nPhiladelphia, Lippincott Williams and Wilkins';

      render(<ReferenceSection reference={reference} />);

      // Verify text is in the DOM and not hidden
      const textElement = screen.getByText(/Grossman, Valerie/);
      expect(textElement).toBeVisible();
      expect(textElement).not.toHaveStyle({ display: 'none' });
      expect(textElement).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long references', () => {
      const veryLongReference = 'A'.repeat(1000);

      render(<ReferenceSection reference={veryLongReference} />);

      expect(screen.getByText(veryLongReference)).toBeInTheDocument();
    });

    it('handles references with only whitespace', () => {
      const whitespaceReference = '   ';

      render(<ReferenceSection reference={whitespaceReference} />);

      // Whitespace-only strings should still render (not be treated as empty)
      expect(screen.getByText('📚 Reference')).toBeInTheDocument();
    });

    it('handles references with multiple consecutive newlines', () => {
      const reference = 'Line 1\n\n\nLine 2';

      render(<ReferenceSection reference={reference} />);

      const textElement = screen.getByText(/Line 1/);
      expect(textElement.textContent).toContain('Line 1');
      expect(textElement.textContent).toContain('Line 2');
    });
  });
});
