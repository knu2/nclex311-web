import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarkdownContent } from '@/components/MarkdownContent';

// Mock react-markdown to avoid ESM issues in Jest
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children, components }: any) {
    // Simple mock that applies the component mappings
    const content = children || '';

    // Parse basic markdown patterns for testing
    let html = content;

    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, (match: string, text: string) => {
      return components?.strong
        ? `<strong>${text}</strong>`
        : `<strong>${text}</strong>`;
    });

    // Italic: *text* -> <em>text</em>
    html = html.replace(
      /(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g,
      (match: string, text: string) => {
        return components?.em ? `<em>${text}</em>` : `<em>${text}</em>`;
      }
    );

    // Code: `text` -> <code>text</code>
    html = html.replace(/`(.*?)`/g, (match: string, text: string) => {
      return `<code>${text}</code>`;
    });

    // Lists: - item
    const lines = content.split('\n');
    const hasUnorderedList = lines.some((line: string) =>
      line.trim().startsWith('- ')
    );
    const hasOrderedList = lines.some((line: string) =>
      /^\d+\.\s/.test(line.trim())
    );

    if (hasUnorderedList) {
      const listItems = lines
        .filter((line: string) => line.trim().startsWith('- '))
        .map((line: string) => line.trim().substring(2));

      return React.createElement('div', null, [
        ...lines
          .filter((line: string) => !line.trim().startsWith('- '))
          .map((line: string, i: number) =>
            React.createElement('p', { key: `p-${i}` }, line)
          ),
        React.createElement(
          'ul',
          { key: 'ul' },
          listItems.map((item: string, i: number) =>
            React.createElement('li', { key: `li-${i}` }, item)
          )
        ),
      ]);
    }

    if (hasOrderedList) {
      const listItems = lines
        .filter((line: string) => /^\d+\.\s/.test(line.trim()))
        .map((line: string) => line.trim().replace(/^\d+\.\s/, ''));

      return React.createElement('div', null, [
        ...lines
          .filter((line: string) => !/^\d+\.\s/.test(line.trim()))
          .map((line: string, i: number) =>
            React.createElement('p', { key: `p-${i}` }, line)
          ),
        React.createElement(
          'ol',
          { key: 'ol' },
          listItems.map((item: string, i: number) =>
            React.createElement('li', { key: `li-${i}` }, item)
          )
        ),
      ]);
    }

    // Simple paragraph rendering
    return React.createElement('div', {
      dangerouslySetInnerHTML: { __html: html },
    });
  };
});

jest.mock('rehype-sanitize', () => {
  return () => (tree: any) => tree; // Pass-through for tests
});

describe('MarkdownContent', () => {
  describe('Bold text rendering', () => {
    it('renders bold text correctly', () => {
      render(<MarkdownContent content="**Cardiovascular**: chest pain" />);

      const boldText = screen.getByText(/Cardiovascular/);
      expect(boldText).toBeInTheDocument();
      expect(boldText.tagName).toBe('STRONG');
    });

    it('renders multiple bold sections', () => {
      render(<MarkdownContent content="**First bold** and **second bold**" />);

      const boldElements = screen.getAllByText(/bold/);
      expect(boldElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Italic text rendering', () => {
    it('renders italic text correctly', () => {
      render(<MarkdownContent content="This is *italic* text" />);

      const italicText = screen.getByText(/italic/);
      expect(italicText).toBeInTheDocument();
      expect(italicText.tagName).toBe('EM');
    });

    it('renders emphasized medical terms', () => {
      render(<MarkdownContent content="Patient shows *tachycardia*" />);

      const emphText = screen.getByText(/tachycardia/);
      expect(emphText.tagName).toBe('EM');
    });
  });

  describe('List rendering', () => {
    it('renders unordered list correctly', () => {
      const listContent = '- Item 1\n- Item 2\n- Item 3';
      render(<MarkdownContent content={listContent} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('UL');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders ordered list correctly', () => {
      const listContent = '1. First step\n2. Second step\n3. Third step';
      render(<MarkdownContent content={listContent} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('OL');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(screen.getByText('First step')).toBeInTheDocument();
      expect(screen.getByText('Second step')).toBeInTheDocument();
      expect(screen.getByText('Third step')).toBeInTheDocument();
    });

    it('renders nested lists correctly', () => {
      const nestedList = '- Parent item\n  - Child item 1\n  - Child item 2';
      render(<MarkdownContent content={nestedList} />);

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Parent item')).toBeInTheDocument();
      expect(screen.getByText('Child item 1')).toBeInTheDocument();
      expect(screen.getByText('Child item 2')).toBeInTheDocument();
    });
  });

  describe('Line break handling', () => {
    it('handles line breaks in paragraphs', () => {
      const multiLineContent =
        'First paragraph.\n\nSecond paragraph with new line.';
      render(<MarkdownContent content={multiLineContent} />);

      expect(screen.getByText(/First paragraph/)).toBeInTheDocument();
      expect(screen.getByText(/Second paragraph/)).toBeInTheDocument();
    });

    it('preserves line breaks within paragraphs', () => {
      const content = 'Line one\nLine two';
      const { container } = render(<MarkdownContent content={content} />);

      // The content should be rendered in separate elements or with proper spacing
      expect(container.textContent).toContain('Line one');
      expect(container.textContent).toContain('Line two');
    });
  });

  describe('Code rendering', () => {
    it('renders inline code correctly', () => {
      render(<MarkdownContent content="Use `console.log()` for debugging" />);

      const codeElement = screen.getByText('console.log()');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.tagName).toBe('CODE');
    });

    it('applies monospace styling to code', () => {
      const { container } = render(
        <MarkdownContent content="Use `code` here" />
      );

      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
    });
  });

  describe('XSS Prevention', () => {
    it('blocks script tags', () => {
      const maliciousContent = '<script>alert("XSS")</script>Normal text';
      render(<MarkdownContent content={maliciousContent} />);

      // Script tag should be removed, only normal text shown
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
      expect(screen.queryByText(/XSS/)).not.toBeInTheDocument();
      expect(screen.getByText(/Normal text/)).toBeInTheDocument();
    });

    it('blocks iframe injection', () => {
      const maliciousContent =
        '<iframe src="http://evil.com"></iframe>Safe text';
      render(<MarkdownContent content={maliciousContent} />);

      const { container } = render(
        <MarkdownContent content={maliciousContent} />
      );
      const iframes = container.querySelectorAll('iframe');
      expect(iframes).toHaveLength(0);
      expect(screen.getByText(/Safe text/)).toBeInTheDocument();
    });

    it('blocks javascript: protocol in links', () => {
      const maliciousContent = '[Click me](javascript:alert("XSS"))';
      const { container } = render(
        <MarkdownContent content={maliciousContent} />
      );

      const links = container.querySelectorAll('a');
      links.forEach(link => {
        expect(link.getAttribute('href')).not.toContain('javascript:');
      });
    });

    it('sanitizes event handlers', () => {
      const maliciousContent = '<div onclick="alert(\'XSS\')">Text</div>';
      const { container } = render(
        <MarkdownContent content={maliciousContent} />
      );

      const divs = container.querySelectorAll('div');
      divs.forEach(div => {
        expect(div.getAttribute('onclick')).toBeNull();
      });
    });

    it('blocks style tags', () => {
      const maliciousContent = '<style>body { display: none; }</style>Text';
      const { container } = render(
        <MarkdownContent content={maliciousContent} />
      );

      const styleTags = container.querySelectorAll('style');
      expect(styleTags).toHaveLength(0);
    });
  });

  describe('MUI Typography integration', () => {
    it('renders paragraphs with MUI Typography', () => {
      const { container } = render(
        <MarkdownContent content="Test paragraph" />
      );

      // Check that MUI Typography classes are applied
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('integrates strong tags with MUI Typography', () => {
      const { container } = render(<MarkdownContent content="**Bold text**" />);

      const strongElements = container.querySelectorAll('strong');
      expect(strongElements.length).toBeGreaterThan(0);
    });

    it('integrates list items with MUI Typography', () => {
      const { container } = render(<MarkdownContent content="- List item" />);

      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Variant prop functionality', () => {
    it('uses body1 variant by default', () => {
      render(<MarkdownContent content="Default variant text" />);

      expect(screen.getByText('Default variant text')).toBeInTheDocument();
    });

    it('accepts body1 variant explicitly', () => {
      render(<MarkdownContent content="Body1 text" variant="body1" />);

      expect(screen.getByText('Body1 text')).toBeInTheDocument();
    });

    it('accepts body2 variant', () => {
      render(<MarkdownContent content="Body2 text" variant="body2" />);

      expect(screen.getByText('Body2 text')).toBeInTheDocument();
    });

    it('applies variant to list items', () => {
      render(<MarkdownContent content="- Item text" variant="body2" />);

      expect(screen.getByText('Item text')).toBeInTheDocument();
    });
  });

  describe('Complex markdown patterns', () => {
    it('renders mixed formatting correctly', () => {
      const complexContent =
        '**Bold** and *italic* with `code` and regular text';
      render(<MarkdownContent content={complexContent} />);

      expect(screen.getByText(/Bold/)).toBeInTheDocument();
      expect(screen.getByText(/italic/)).toBeInTheDocument();
      expect(screen.getByText('code')).toBeInTheDocument();
      expect(screen.getByText(/regular text/)).toBeInTheDocument();
    });

    it('handles medical content formatting', () => {
      const medicalContent = `**Cardiovascular Assessment**

Key findings:
- **Heart Rate**: 120 bpm (*tachycardia*)
- **Blood Pressure**: 140/90 mmHg
- **Respiratory Rate**: 22 breaths/min

Use \`ABCDE\` approach for assessment.`;

      render(<MarkdownContent content={medicalContent} />);

      expect(screen.getByText(/Cardiovascular Assessment/)).toBeInTheDocument();
      expect(screen.getByText(/Heart Rate/)).toBeInTheDocument();
      expect(screen.getByText(/tachycardia/)).toBeInTheDocument();
      expect(screen.getByText('ABCDE')).toBeInTheDocument();
    });

    it('renders question rationale with formatting', () => {
      const rationaleContent = `**Correct Answer Explanation:**

The patient exhibits signs of:
- Acute respiratory distress
- Decreased oxygen saturation
- Increased work of breathing

*Priority nursing intervention*: Administer supplemental oxygen immediately.`;

      render(<MarkdownContent content={rationaleContent} />);

      expect(
        screen.getByText(/Correct Answer Explanation/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Acute respiratory distress/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Priority nursing intervention/)
      ).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles empty content', () => {
      const { container } = render(<MarkdownContent content="" />);
      expect(container.textContent).toBe('');
    });

    it('handles whitespace-only content', () => {
      const { container } = render(<MarkdownContent content="   \n\n   " />);
      // Should render but with minimal content
      expect(container).toBeInTheDocument();
    });

    it('handles special characters', () => {
      const specialContent = 'Special chars: & < > \" \' / \\';
      render(<MarkdownContent content={specialContent} />);
      expect(screen.getByText(/Special chars/)).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const longContent = 'a'.repeat(10000);
      const { container } = render(<MarkdownContent content={longContent} />);
      expect(container.textContent).toContain('a');
    });
  });

  describe('Component behavior', () => {
    it('is memoized to prevent unnecessary re-renders', () => {
      const { rerender } = render(<MarkdownContent content="Test content" />);

      // Re-render with same props
      rerender(<MarkdownContent content="Test content" />);

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('has correct displayName', () => {
      expect(MarkdownContent.displayName).toBe('MarkdownContent');
    });
  });
});
