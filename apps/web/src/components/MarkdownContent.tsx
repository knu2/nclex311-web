import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { defaultSchema } from 'rehype-sanitize';
import { Typography, Box } from '@mui/material';

export interface MarkdownContentProps {
  content: string;
  variant?: 'body1' | 'body2';
}

/**
 * Renders markdown-formatted content with proper sanitization and MUI integration.
 *
 * Features:
 * - Safe markdown rendering with XSS protection via rehype-sanitize
 * - Seamless integration with MUI Typography components
 * - Support for bold, italic, lists, line breaks, and code blocks
 * - Memoized for performance optimization
 *
 * @param content - Markdown-formatted string to render
 * @param variant - MUI Typography variant ('body1' or 'body2')
 *
 * @example
 * <MarkdownContent
 *   content="**Bold text** with *italic* and lists"
 *   variant="body1"
 * />
 */
export const MarkdownContent = memo<MarkdownContentProps>(
  ({ content, variant = 'body1' }) => {
    // Convert literal \n escape sequences to actual newlines
    // This handles content stored with escaped newlines like "text\n\nmore text"
    const processedContent = content
      .replace(/\\n/g, '\n') // Convert \n to actual newline
      .replace(/\\t/g, '\t'); // Convert \t to actual tab

    // Configure sanitization to allow images from trusted sources
    const sanitizeConfig = {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        img: ['src', 'alt', 'title', 'width', 'height'],
      },
    };

    return (
      <ReactMarkdown
        rehypePlugins={[[rehypeSanitize, sanitizeConfig]]}
        components={{
          // Map markdown elements to MUI Typography
          p: ({ children }) => (
            <Typography variant={variant} paragraph>
              {children}
            </Typography>
          ),
          strong: ({ children }) => (
            <Typography component="span" fontWeight="bold">
              {children}
            </Typography>
          ),
          em: ({ children }) => (
            <Typography component="span" fontStyle="italic">
              {children}
            </Typography>
          ),
          ul: ({ children }) => (
            <Box component="ul" sx={{ mt: 1, mb: 1, pl: 2 }}>
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box component="ol" sx={{ mt: 1, mb: 1, pl: 2 }}>
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Typography component="li" variant={variant}>
              {children}
            </Typography>
          ),
          code: ({ children }) => (
            <Typography
              component="code"
              sx={{
                px: 0.5,
                py: 0.25,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875em',
              }}
            >
              {children}
            </Typography>
          ),
          img: ({ src, alt }) => (
            <Box
              component="img"
              src={src}
              alt={alt || ''}
              sx={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                my: 2,
                borderRadius: 1,
              }}
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  }
);

MarkdownContent.displayName = 'MarkdownContent';
